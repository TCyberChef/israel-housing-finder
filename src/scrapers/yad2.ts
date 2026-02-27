import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import { Listing, ScraperResult } from "./types";
import { log } from "./utils/logger";
import { withRetry } from "./utils/retry";

// Register stealth plugin before launching browser
puppeteer.use(StealthPlugin());

/** Delay between page load and extraction (rate limiting) */
const POST_LOAD_DELAY_MS = 3000;

/** Number of pages to scrape (Yad2 shows ~20 listings per page) */
const MAX_PAGES = 3;

/** Browser launch arguments for headless scraping */
const BROWSER_ARGS = [
  "--no-sandbox",
  "--disable-setuid-sandbox",
  "--disable-dev-shm-usage", // GitHub Actions compatibility
];

/** Full user agent string to mimic Chrome on Windows */
const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

/** Target URL for Yad2 rental listings */
const YAD2_RENT_URL = "https://www.yad2.co.il/realestate/rent";

/**
 * Raw listing data extracted from the page.
 * Uses serializable types only (no DOM references) so it can be
 * returned from page.evaluate() across the Node.js/browser boundary.
 */
interface RawListing {
  id: string;
  address: string;
  city: string;
  price: number;
  rooms: number;
  size_sqm: number | undefined;
  photos: string[];
  source_url: string;
}

/**
 * Extract listing data from the current page DOM.
 * Runs inside the browser context via page.evaluate().
 *
 * Strategy 1 (primary): Extract from __NEXT_DATA__ JSON.
 * Yad2 is a Next.js app that server-side renders listing data into a
 * <script id="__NEXT_DATA__"> tag. This JSON is more stable than HTML
 * class names and provides clean structured data.
 *
 * Data path: props.pageProps.dehydratedState.queries[i].state.data.data.feed.feed_items
 * Each feed item has: id, title_1 (address), city, row_4 (rooms/floor/sqm), price, images
 *
 * Strategy 2 (fallback): CSS selectors with multiple alternatives per field.
 * Used if __NEXT_DATA__ is absent or returns no listings.
 */
function extractListingsFromPage(): RawListing[] {
  // === Strategy 1: __NEXT_DATA__ JSON (Next.js server-side embedded data) ===
  try {
    const nextDataEl = document.getElementById("__NEXT_DATA__");
    if (nextDataEl && nextDataEl.textContent) {
      const nextData = JSON.parse(nextDataEl.textContent);
      const queries =
        nextData?.props?.pageProps?.dehydratedState?.queries ?? [];

      for (const query of queries) {
        const feedItems =
          query?.state?.data?.data?.feed?.feed_items;

        if (!Array.isArray(feedItems) || feedItems.length === 0) continue;

        const results = feedItems
          .filter(
            // Filter out broker advertisements ("תיווך" = brokerage)
            (item) => item && item.id && item.highlight_text !== "תיווך"
          )
          .map((item) => {
            const row4 = Array.isArray(item.row_4) ? item.row_4 : [];
            const priceStr = String(item.price ?? "0");
            const price = parseInt(priceStr.replace(/\D/g, ""), 10) || 0;
            const id = String(item.id ?? item.link_token ?? "");

            // Extract photos from the images array (field name varies)
            let photos: string[] = [];
            const imagesField = item.images ?? item.image_urls ?? item.img;
            if (Array.isArray(imagesField)) {
              photos = imagesField
                .map((img) => {
                  if (typeof img === "string") return img;
                  if (img && typeof img === "object") {
                    return String(
                      img.src ?? img.url ?? img.thumbnail ?? img.big ?? ""
                    );
                  }
                  return "";
                })
                .filter((src) => src && !src.includes("data:"));
            }

            const roomsVal = row4[0]?.value;
            const sizeVal = row4[2]?.value;
            const sizeNum =
              parseInt(String(sizeVal ?? "0").replace(/\D/g, ""), 10) ||
              undefined;

            return {
              id,
              address: String(item.title_1 ?? "").trim(),
              city: String(item.city ?? "").trim(),
              price,
              rooms: parseFloat(String(roomsVal ?? "0")) || 0,
              size_sqm: sizeNum,
              photos,
              source_url: "https://www.yad2.co.il/item/" + id,
            };
          });

        if (results.length > 0) {
          return results;
        }
      }
    }
  } catch (e) {
    // Fall through to CSS selector strategy
  }

  // === Strategy 2: CSS selectors (fallback) ===
  // Yad2 has used .feeditem since ~2020; try class-substring matches as backup.
  const containerSelectors = [
    ".feeditem",
    '[class*="feed_item"]',
    '[class*="feeditem"]',
    "[data-id]",
  ];

  let items: Element[] = [];
  for (const sel of containerSelectors) {
    const found = Array.from(document.querySelectorAll(sel));
    if (found.length > 0) {
      items = found;
      break;
    }
  }

  /** Try multiple selectors, return first non-empty text found */
  function getText(el: Element, selectors: string[]): string {
    for (const s of selectors) {
      const found = el.querySelector(s);
      const text = found?.textContent?.trim();
      if (text) return text;
    }
    return "";
  }

  return items.map((item) => {
    const id =
      item.getAttribute("data-id") ??
      item.getAttribute("data-nagish-id") ??
      "";
    const linkEl = item.querySelector("a[href]");
    const href = linkEl?.getAttribute("href") ?? "";
    const source_url = href
      ? "https://www.yad2.co.il" + (href.startsWith("/") ? "" : "/") + href
      : id
      ? "https://www.yad2.co.il/item/" + id
      : "";

    const address = getText(item, [
      ".address",
      '[class*="address"]',
      '[data-nagish="listing-address"]',
      ".title-1",
      '[class*="title1"]',
    ]);
    const city = getText(item, [
      ".city",
      '[class*="city"]',
      '[class*="location"]',
      '[class*="settlement"]',
    ]);
    const priceText = getText(item, [
      ".price",
      '[class*="price"]',
      '[class*="Price"]',
    ]);
    const roomsText = getText(item, [
      ".rooms",
      '[class*="rooms"]',
      '[class*="Rooms"]',
    ]);
    const sizeText = getText(item, [
      ".size",
      '[class*="size"]',
      '[class*="sqm"]',
      '[class*="area"]',
    ]);

    const photos = Array.from(item.querySelectorAll("img"))
      .map((img) => (img as HTMLImageElement).src)
      .filter((src) => src && !src.includes("data:"));

    return {
      id,
      address,
      city,
      price: parseInt(priceText.replace(/\D/g, ""), 10) || 0,
      rooms: parseFloat(roomsText) || 0,
      size_sqm:
        parseInt(sizeText.replace(/\D/g, ""), 10) || undefined,
      photos,
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
 * Scrapes up to MAX_PAGES pages for broader coverage.
 *
 * @returns ScraperResult with array of listings and metadata
 * @throws Error if navigation or extraction fails after retries
 */
export async function scrapeYad2(): Promise<ScraperResult> {
  log("info", "Starting Yad2 scraper", { max_pages: MAX_PAGES });

  const browser = await puppeteer.launch({
    headless: true,
    args: BROWSER_ARGS,
  });

  const allRawListings: RawListing[] = [];

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });
    await page.setUserAgent(USER_AGENT);

    for (let pageNum = 1; pageNum <= MAX_PAGES; pageNum++) {
      const url =
        pageNum === 1
          ? YAD2_RENT_URL
          : `${YAD2_RENT_URL}?page=${pageNum}`;

      log("info", `Navigating to page ${pageNum}`, { url });

      // Navigate with retry and 30s timeout
      await withRetry(
        () =>
          page.goto(url, {
            waitUntil: "networkidle2",
            timeout: 30000,
          }),
        3,
        2000
      );

      // Wait for __NEXT_DATA__ (Next.js SSR data) or listing elements
      await Promise.race([
        page.waitForSelector("#__NEXT_DATA__", { timeout: 5000 }),
        page.waitForSelector(".feeditem", { timeout: 5000 }),
        page.waitForSelector("[data-id]", { timeout: 5000 }),
      ]).catch(() => {
        // None of the selectors appeared within 5s — continue anyway
        log("warn", "Content selectors not found within 5s, proceeding", {
          page: pageNum,
        });
      });

      // Rate-limiting delay after page load
      await new Promise((resolve) => setTimeout(resolve, POST_LOAD_DELAY_MS));

      // Extract listings from the page
      const rawListings = await page.evaluate(extractListingsFromPage);

      if (rawListings.length === 0) {
        log("warn", "No listings found on page — stopping pagination", {
          page: pageNum,
          url,
          hint: "Selectors or __NEXT_DATA__ path may need updating",
        });
        break;
      }

      log("info", `Found ${rawListings.length} listings on page ${pageNum}`, {
        page: pageNum,
      });
      allRawListings.push(...rawListings);
    }

    if (allRawListings.length === 0) {
      log("warn", "No listings found across all pages", {
        url: YAD2_RENT_URL,
        pages_tried: MAX_PAGES,
      });
    }

    // Filter out items missing required fields and map to Listing type
    const listings: Listing[] = allRawListings
      .filter((item: RawListing) => item.id && item.address && item.city && item.price > 0)
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
      total_found: allRawListings.length,
      after_filter: listings.length,
      filtered_out: allRawListings.length - listings.length,
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
    try {
      await browser.close();
    } catch (closeErr) {
      log("warn", "Failed to close browser", {
        error: closeErr instanceof Error ? closeErr.message : String(closeErr),
      });
    }
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
