import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import { Listing, ScraperResult } from "./types";
import { log } from "./utils/logger";
import { withRetry } from "./utils/retry";

// Register stealth plugin before launching browser
puppeteer.use(StealthPlugin());

/** Delay between page load and extraction (rate limiting) */
const POST_LOAD_DELAY_MS = 3000;

/** Browser launch arguments for headless scraping */
const BROWSER_ARGS = [
  "--no-sandbox",
  "--disable-setuid-sandbox",
  "--disable-dev-shm-usage", // GitHub Actions compatibility
];

/** User agent string to mimic real browser */
const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36";

/** Target URL for Yad2 rental listings */
const YAD2_RENT_URL = "https://www.yad2.co.il/realestate/rent";

/**
 * Raw listing data extracted from the DOM via page.evaluate().
 * Uses serializable types only (no DOM references).
 */
interface RawListing {
  id: string;
  address: string;
  city: string;
  price: number;
  rooms: number;
  size_sqm: number;
  photos: string[];
  source_url: string;
}

/**
 * Extract listing data from the current page DOM.
 * Runs inside the browser context via page.evaluate().
 *
 * Selectors are based on Yad2's known HTML structure (2024 research).
 * May need updates if Yad2 changes their markup.
 */
function extractListingsFromDOM(): RawListing[] {
  const items = Array.from(document.querySelectorAll(".feeditem"));
  return items.map((item) => {
    const id = item.getAttribute("data-id") || "";
    const linkEl = item.querySelector("a[href]");
    const href = linkEl?.getAttribute("href") || "";
    const source_url = href
      ? `https://www.yad2.co.il${href.startsWith("/") ? "" : "/"}${href}`
      : `https://www.yad2.co.il/realestate/item/${id}`;

    return {
      id,
      address:
        item.querySelector(".address")?.textContent?.trim() || "",
      city:
        item.querySelector(".city")?.textContent?.trim() || "",
      price: parseInt(
        item.querySelector(".price")?.textContent?.replace(/\D/g, "") || "0",
        10
      ),
      rooms: parseFloat(
        item.querySelector(".rooms")?.textContent || "0"
      ),
      size_sqm: parseInt(
        item.querySelector(".size")?.textContent?.replace(/\D/g, "") || "0",
        10
      ),
      photos: Array.from(item.querySelectorAll("img"))
        .map((img) => img.src)
        .filter((src) => src && !src.includes("data:")),
      source_url,
    };
  });
}

/**
 * Scrape rental listings from Yad2.
 *
 * Launches a headless Chrome browser with stealth plugin to evade
 * anti-scraping detection, navigates to the Yad2 rental page,
 * and extracts listing data from the HTML.
 *
 * @returns ScraperResult with array of listings and metadata
 * @throws Error if navigation or extraction fails after retries
 */
export async function scrapeYad2(): Promise<ScraperResult> {
  log("info", "Starting Yad2 scraper");

  const browser = await puppeteer.launch({
    headless: true,
    args: BROWSER_ARGS,
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });
    await page.setUserAgent(USER_AGENT);

    // Navigate with retry and 30s timeout
    await withRetry(
      () =>
        page.goto(YAD2_RENT_URL, {
          waitUntil: "networkidle2",
          timeout: 30000,
        }),
      3,
      2000
    );

    // Rate limiting delay after page load
    await new Promise((resolve) => setTimeout(resolve, POST_LOAD_DELAY_MS));

    // Extract listings from DOM
    const rawListings = await page.evaluate(extractListingsFromDOM);

    if (rawListings.length === 0) {
      log("warn", "No listings found - selectors may be outdated", {
        url: YAD2_RENT_URL,
        selector: ".feeditem",
      });
    }

    // Filter out items missing required fields and map to Listing type
    const listings: Listing[] = rawListings
      .filter((item: RawListing) => item.id && item.address && item.city)
      .map((item: RawListing) => ({
        id: item.id,
        address: item.address,
        city: item.city,
        price: item.price || 0,
        rooms: item.rooms || 0,
        size_sqm: item.size_sqm || undefined,
        photos: item.photos,
        source_url: item.source_url,
        source_platform: "yad2" as const,
        source_id: item.id,
      }));

    log("info", `Scraped ${listings.length} listings from Yad2`, {
      total_found: rawListings.length,
      after_filter: listings.length,
      filtered_out: rawListings.length - listings.length,
    });

    return {
      listings,
      scrapedAt: new Date().toISOString(),
      count: listings.length,
    };
  } catch (error) {
    log("error", "Yad2 scraper failed", {
      error: error instanceof Error ? error.message : String(error),
      url: YAD2_RENT_URL,
    });
    throw error;
  } finally {
    await browser.close();
    log("info", "Browser closed");
  }
}

// Test harness: run directly with `npx tsx src/scrapers/yad2.ts`
if (require.main === module) {
  scrapeYad2()
    .then((result) => {
      console.log(JSON.stringify(result, null, 2));
    })
    .catch((error) => {
      console.error("Scraper failed:", error);
      process.exit(1);
    });
}
