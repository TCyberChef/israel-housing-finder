import { Listing, ScraperResult } from "./types";
import { log } from "./utils/logger";
import { withRetry } from "./utils/retry";

/** Number of pages to scrape */
const MAX_PAGES = 3;

/** Delay between page requests (rate limiting) */
const REQUEST_DELAY_MS = 2000;

/** Yad2 API gateway for rental feed search */
const YAD2_API_URL = "https://gw.yad2.co.il/feed-search-legacy/realestate/rent";

/** Yad2 SSR page URL */
const YAD2_PAGE_URL = "https://www.yad2.co.il/realestate/rent";

/** Browser-like headers to reduce bot detection */
const BROWSER_HEADERS: Record<string, string> = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
  Accept:
    "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
  "Accept-Language": "he-IL,he;q=0.9,en-US;q=0.8,en;q=0.7",
  "Cache-Control": "no-cache",
  Pragma: "no-cache",
};

/** JSON API headers */
const API_HEADERS: Record<string, string> = {
  ...BROWSER_HEADERS,
  Accept: "application/json, text/plain, */*",
  Origin: "https://www.yad2.co.il",
  Referer: "https://www.yad2.co.il/",
};

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
 * Parse feed items from Yad2 JSON data.
 * Handles both API response and __NEXT_DATA__ structures
 * by recursively searching for the feed_items array.
 */
function parseFeedItems(data: Record<string, unknown>): RawListing[] {
  const feedItems = findFeedItems(data);
  if (!feedItems || feedItems.length === 0) return [];

  return feedItems
    .filter(
      (item: Record<string, unknown>) =>
        item && item.id && item.highlight_text !== "תיווך"
    )
    .map((item: Record<string, unknown>) => {
      const row4 = Array.isArray(item.row_4) ? item.row_4 : [];
      const priceStr = String(item.price ?? "0");
      const price = parseInt(priceStr.replace(/\D/g, ""), 10) || 0;
      const id = String(item.id ?? item.link_token ?? "");

      let photos: string[] = [];
      const imagesField = (item.images ?? item.image_urls ?? item.img) as
        | unknown[]
        | undefined;
      if (Array.isArray(imagesField)) {
        photos = imagesField
          .map((img) => {
            if (typeof img === "string") return img;
            if (img && typeof img === "object") {
              const imgObj = img as Record<string, unknown>;
              return String(
                imgObj.src ?? imgObj.url ?? imgObj.thumbnail ?? imgObj.big ?? ""
              );
            }
            return "";
          })
          .filter((src) => src && !src.includes("data:"));
      }

      const roomsVal = (row4[0] as Record<string, unknown>)?.value;
      const sizeVal = (row4[2] as Record<string, unknown>)?.value;
      const sizeNum =
        parseInt(String(sizeVal ?? "0").replace(/\D/g, ""), 10) || undefined;

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
}

/**
 * Recursively search for feed_items array in nested JSON.
 */
function findFeedItems(
  obj: unknown,
  depth = 0
): Record<string, unknown>[] | null {
  if (depth > 10 || !obj || typeof obj !== "object") return null;

  const record = obj as Record<string, unknown>;

  if (Array.isArray(record.feed_items) && record.feed_items.length > 0) {
    return record.feed_items as Record<string, unknown>[];
  }

  for (const value of Object.values(record)) {
    if (Array.isArray(value)) {
      for (const item of value) {
        const result = findFeedItems(item, depth + 1);
        if (result) return result;
      }
    } else if (value && typeof value === "object") {
      const result = findFeedItems(value, depth + 1);
      if (result) return result;
    }
  }

  return null;
}

/**
 * Extract __NEXT_DATA__ JSON from an HTML page string.
 */
function extractNextData(html: string): Record<string, unknown> | null {
  const match = html.match(
    /<script\s+id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/
  );
  if (!match?.[1]) return null;
  try {
    return JSON.parse(match[1]);
  } catch {
    return null;
  }
}

/**
 * Check if a response was blocked by bot protection.
 */
function isBotBlocked(text: string, url: string): boolean {
  const blocked =
    text.includes("ShieldSquare") ||
    text.includes("perfdrive.com") ||
    text.includes("captcha") ||
    text.includes("challenge-platform");
  if (blocked) {
    log("warn", "Bot protection detected", { url });
  }
  return blocked;
}

/**
 * Parse listings from an HTTP response (HTML or JSON).
 */
function parseResponse(text: string, contentType: string): RawListing[] {
  // Try JSON first
  if (contentType.includes("application/json")) {
    try {
      return parseFeedItems(JSON.parse(text));
    } catch {
      // fall through
    }
  }

  // Try extracting __NEXT_DATA__ from HTML
  const nextData = extractNextData(text);
  if (nextData) {
    return parseFeedItems(nextData);
  }

  return [];
}

/**
 * Strategy 1 (preferred): Fetch via ScraperAPI proxy.
 * Bypasses bot protection using residential proxies and browser rendering.
 * Requires SCRAPER_API_KEY env var (free tier: 5000 credits/month at scraperapi.com).
 */
async function fetchViaProxy(page: number): Promise<RawListing[]> {
  const apiKey = process.env.SCRAPER_API_KEY;
  if (!apiKey) return [];

  const targetUrl =
    page === 1 ? YAD2_PAGE_URL : `${YAD2_PAGE_URL}?page=${page}`;

  const proxyUrl = `https://api.scraperapi.com?api_key=${apiKey}&url=${encodeURIComponent(targetUrl)}&render=true&country_code=il`;

  log("info", "Fetching via ScraperAPI proxy", { page, targetUrl });

  const response = await fetch(proxyUrl, { signal: AbortSignal.timeout(60000) });

  if (!response.ok) {
    log("warn", "ScraperAPI returned error", {
      status: response.status,
      page,
    });
    return [];
  }

  const text = await response.text();
  const contentType = response.headers.get("content-type") ?? "";

  if (isBotBlocked(text, targetUrl)) return [];

  return parseResponse(text, contentType);
}

/**
 * Strategy 2: Direct fetch from the Yad2 API gateway.
 */
async function fetchFromApi(page: number): Promise<RawListing[]> {
  const url = page === 1 ? YAD2_API_URL : `${YAD2_API_URL}?page=${page}`;
  log("info", "Trying API gateway (direct)", { url, page });

  const response = await fetch(url, {
    headers: API_HEADERS,
    redirect: "manual",
  });

  if (response.status === 302 || response.status === 301) {
    log("warn", "API returned redirect (bot protection)", {
      status: response.status,
    });
    return [];
  }

  if (!response.ok) {
    log("warn", "API returned error", { status: response.status });
    return [];
  }

  const text = await response.text();
  const contentType = response.headers.get("content-type") ?? "";

  if (isBotBlocked(text, url)) return [];

  return parseResponse(text, contentType);
}

/**
 * Strategy 3: Direct fetch of the SSR HTML page.
 */
async function fetchFromPage(page: number): Promise<RawListing[]> {
  const url =
    page === 1 ? YAD2_PAGE_URL : `${YAD2_PAGE_URL}?page=${page}`;
  log("info", "Trying SSR page (direct)", { url, page });

  const response = await fetch(url, {
    headers: BROWSER_HEADERS,
    redirect: "manual",
  });

  if (response.status === 302 || response.status === 301) {
    log("warn", "Page returned redirect (bot protection)", {
      status: response.status,
    });
    return [];
  }

  if (!response.ok) {
    log("warn", "Page returned error", { status: response.status });
    return [];
  }

  const text = await response.text();
  const contentType = response.headers.get("content-type") ?? "";

  if (isBotBlocked(text, url)) return [];

  return parseResponse(text, contentType);
}

/**
 * Try all strategies for a given page number.
 * Order: proxy (if configured) -> API gateway -> SSR page
 */
async function fetchPage(pageNum: number): Promise<RawListing[]> {
  // Strategy 1: ScraperAPI proxy (if configured)
  if (process.env.SCRAPER_API_KEY) {
    try {
      const listings = await withRetry(() => fetchViaProxy(pageNum), 2, 2000);
      if (listings.length > 0) return listings;
    } catch (err) {
      log("warn", "Proxy fetch failed", {
        page: pageNum,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  // Strategy 2: Direct API gateway
  try {
    const listings = await withRetry(() => fetchFromApi(pageNum), 2, 1000);
    if (listings.length > 0) return listings;
  } catch (err) {
    log("warn", "API gateway fetch failed", {
      page: pageNum,
      error: err instanceof Error ? err.message : String(err),
    });
  }

  // Strategy 3: Direct SSR page
  try {
    const listings = await withRetry(() => fetchFromPage(pageNum), 2, 1000);
    if (listings.length > 0) return listings;
  } catch (err) {
    log("warn", "SSR page fetch failed", {
      page: pageNum,
      error: err instanceof Error ? err.message : String(err),
    });
  }

  return [];
}

/**
 * Scrape rental listings from Yad2 using HTTP requests.
 *
 * Tries multiple strategies in order:
 * 1. ScraperAPI proxy (if SCRAPER_API_KEY is set) — bypasses bot protection
 * 2. Direct API gateway (gw.yad2.co.il)
 * 3. Direct SSR page (www.yad2.co.il)
 *
 * No browser/Chrome required. Handles bot protection gracefully.
 */
export async function scrapeYad2(): Promise<ScraperResult> {
  const hasProxy = !!process.env.SCRAPER_API_KEY;
  log("info", "Starting Yad2 scraper (HTTP mode)", {
    max_pages: MAX_PAGES,
    proxy_configured: hasProxy,
  });

  if (!hasProxy) {
    log("warn", "SCRAPER_API_KEY not set — direct requests may be blocked by Yad2 bot protection. " +
      "Get a free API key at https://www.scraperapi.com (5000 credits/month free).");
  }

  const allRawListings: RawListing[] = [];

  for (let pageNum = 1; pageNum <= MAX_PAGES; pageNum++) {
    const rawListings = await fetchPage(pageNum);

    if (rawListings.length === 0) {
      log("warn", "No listings found on page — stopping pagination", {
        page: pageNum,
        hint: hasProxy
          ? "Proxy may be rate-limited or Yad2 structure changed"
          : "Set SCRAPER_API_KEY to bypass bot protection",
      });
      break;
    }

    log("info", `Found ${rawListings.length} listings on page ${pageNum}`);
    allRawListings.push(...rawListings);

    if (pageNum < MAX_PAGES) {
      await new Promise((resolve) => setTimeout(resolve, REQUEST_DELAY_MS));
    }
  }

  if (allRawListings.length === 0) {
    log("warn", "No listings fetched from Yad2 this run", {
      pages_tried: MAX_PAGES,
      reason: hasProxy
        ? "Proxy issue or site changes. Will retry next run."
        : "Bot protection active. Add SCRAPER_API_KEY secret to fix.",
    });
  }

  const listings: Listing[] = allRawListings
    .filter(
      (item) => item.id && item.address && item.city && item.price > 0
    )
    .map((item) => ({
      id: item.id,
      address: item.address,
      city: item.city,
      price: item.price,
      rooms: item.rooms,
      size_sqm: item.size_sqm,
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
