import got from "got";
import { JSDOM } from "jsdom";
import { validateUrl, blockPrivateIps } from "../utils/security.js";
import { FastifyPluginAsync } from "fastify";

export interface PreviewData {
  title: string;
  image: string | null;
  price: string | null;
  currency: string | null;
  siteName: string;
  sourceUrl: string;
}


export async function fetchPreview(url: string, rawHtml?: string): Promise<PreviewData> {
  if (!validateUrl(url)) {
    throw new Error("Invalid URL");
  }

  await blockPrivateIps(url);

  let html: string = rawHtml || '';
  
  if (!rawHtml) {
    // Simple retry mechanism with exponential backoff
    let lastError: any;
    let success = false;
    
    for (let attempt = 1; attempt <= 3 && !success; attempt++) {
      try {
        console.log(`🔍 Attempt ${attempt} for URL: ${url}`);
        
        if (attempt > 1) {
          // Add delay between retries
          const delay = Math.min(1000 * Math.pow(2, attempt - 2), 5000);
          console.log(`⏳ Waiting ${delay}ms before retry...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
        
        // Try with realistic browser headers first
        const response = await got(url, {
          timeout: { request: 10000 + (attempt * 2000) }, // Increase timeout with each attempt
          followRedirect: true,
          headers: { 
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.9",
            "Accept-Encoding": "gzip, deflate, br",
            "DNT": "1",
            "Connection": "keep-alive",
            "Upgrade-Insecure-Requests": "1",
            "Sec-Fetch-Dest": "document",
            "Sec-Fetch-Mode": "navigate",
            "Sec-Fetch-Site": "none",
            "Cache-Control": "max-age=0"
          }
        });
        
        html = response.body;
        
        // Check content type
        const contentType = response.headers['content-type'] || '';
        if (!contentType.includes('text/html') && !contentType.includes('application/xhtml+xml')) {
          throw new Error(`Invalid content type: ${contentType}. Expected HTML content.`);
        }
        
        console.log(`✅ Successfully fetched ${url} on attempt ${attempt}`);
        success = true;
        
      } catch (err: any) {
        lastError = err;
        console.warn(`❌ Attempt ${attempt} failed for ${url}: ${err.message}`);
        
        if (attempt === 3) {
          // Last attempt failed, try fallback approach
          try {
            console.log(`🔄 Trying fallback approach for ${url}`);
            const response = await got(url, {
              timeout: { request: 15000 },
              followRedirect: true,
              headers: { 
                "User-Agent": "Mozilla/5.0 (compatible; CentscapePreviewBot/1.0; +https://centscape.com)",
                "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"
              }
            });
            
            html = response.body;
            
            // Check content type
            const contentType = response.headers['content-type'] || '';
            if (!contentType.includes('text/html') && !contentType.includes('application/xhtml+xml')) {
              throw new Error(`Invalid content type: ${contentType}. Expected HTML content.`);
            }
            
            console.log(`✅ Fallback approach succeeded for ${url}`);
            success = true;
            
          } catch (fallbackErr: any) {
            // Both approaches failed, provide detailed error information
            if (fallbackErr.code === 'ENOTFOUND') {
              throw new Error('Domain not found. Please check the URL.');
            } else if (fallbackErr.code === 'ECONNREFUSED') {
              throw new Error('Connection refused. The server may be down or blocking requests.');
            } else if (fallbackErr.code === 'ETIMEDOUT') {
              throw new Error('Request timed out. The server may be slow or blocking requests.');
            } else if (fallbackErr.response?.statusCode === 403) {
              throw new Error('Access forbidden. This site may be blocking automated requests.');
            } else if (fallbackErr.response?.statusCode === 429) {
              throw new Error('Too many requests. Please try again later.');
            } else if (fallbackErr.response?.statusCode >= 500) {
              throw new Error('Server error. The target site may be experiencing issues.');
            } else if (fallbackErr.message.includes('Network request failed')) {
              throw new Error('Network request failed. This site may be blocking automated access or experiencing connectivity issues.');
            } else {
              throw new Error(`Failed to fetch URL after all attempts: ${fallbackErr.message}`);
            }
          }
        }
      }
    }
    
    // Ensure html is assigned
    if (!success) {
      throw new Error('Failed to fetch URL after all attempts');
    }
  }

  const dom = new JSDOM(html);
  const doc = dom.window.document;

  // Extract Open Graph data (highest priority)
  const ogTitle = doc.querySelector("meta[property='og:title']")?.getAttribute("content");
  const ogImage = doc.querySelector("meta[property='og:image']")?.getAttribute("content");
  const ogSite = doc.querySelector("meta[property='og:site_name']")?.getAttribute("content");

  // Extract Twitter Card data (second priority)
  const twitterTitle = doc.querySelector("meta[name='twitter:title']")?.getAttribute("content");
  const twitterImage = doc.querySelector("meta[name='twitter:image']")?.getAttribute("content");

  // Extract oEmbed data (third priority)
  let oembedTitle: string | null = null;
  let oembedImage: string | null = null;
  
  // Check for oEmbed link
  const oembedLink = doc.querySelector("link[type='application/json+oembed']")?.getAttribute("href") ||
                    doc.querySelector("link[type='text/xml+oembed']")?.getAttribute("href");
  
  if (oembedLink) {
    try {
      const oembedUrl = new URL(oembedLink, url).href;
      const oembedResponse = await got(oembedUrl, {
        timeout: { request: 3000 },
        headers: { "Accept": "application/json" }
      });
      const oembedData = JSON.parse(oembedResponse.body);
      oembedTitle = oembedData.title || null;
      oembedImage = oembedData.thumbnail_url || oembedData.image || null;
    } catch (err: any) {
      // Silently fail oEmbed extraction, fall back to other methods
      console.warn(`oEmbed extraction failed for ${url}: ${err.message}`);
    }
  }

  // Fallback to standard HTML elements (lowest priority)
  const title = ogTitle || twitterTitle || oembedTitle || doc.title || "Untitled";
  const image = ogImage || twitterImage || oembedImage || doc.querySelector("img")?.src || null;
  const siteName = ogSite || new URL(url).hostname.replace("www.", "");
  
  // Extract price information
  let price: string | null = null;
  let currency: string | null = null;
  
  // Check for Open Graph price
  const ogPrice = doc.querySelector("meta[property='og:price:amount']")?.getAttribute("content");
  const ogCurrency = doc.querySelector("meta[property='og:price:currency']")?.getAttribute("content");
  
  if (ogPrice) {
    price = ogPrice;
    currency = ogCurrency || "USD";
  } else {
    // Fallback to regex pattern matching
    const priceMatch = html.match(/(\$|₹|€|£)\s?(\d+[.,]?\d*)/);
    if (priceMatch) {
      currency = priceMatch[1];
      price = priceMatch[2];
    }
  }

  return {
    title,
    image,
    price,
    currency,
    siteName,
    sourceUrl: url
  };
}

const previewRoute: FastifyPluginAsync = async (fastify) => {
  fastify.post('/', async (request, reply) => {
    const { url, raw_html } = request.body as { url: string; raw_html?: string };
    
    if (!url) {
      return reply.status(400).send({ error: 'URL parameter is required' });
    }

    try {
      console.log(`🔍 Fetching preview for: ${url}`);
      const preview = await fetchPreview(url, raw_html);
      console.log(`✅ Preview fetched successfully for: ${url}`);
      return preview;
    } catch (error: any) {
      console.error(`❌ Preview fetch failed: [${error.message}]`);
      return reply.status(400).send({ error: error.message });
    }
  });
};

export default previewRoute;