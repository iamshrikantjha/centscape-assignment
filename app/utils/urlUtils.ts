/**
 * URL utility functions for the Centscape Wishlist app
 */

export class UrlUtils {
  /**
   * Validates if a string is a valid HTTP/HTTPS URL
   */
  static isValidUrl(url: string): boolean {
    try {
      const parsed = new URL(url);
      return ['http:', 'https:'].includes(parsed.protocol);
    } catch {
      return false;
    }
  }

  /**
   * Cleans and formats a URL string
   * Adds https:// if no protocol is present
   */
  static cleanUrl(url: string): string {
    const trimmed = url.trim();
    
    if (!trimmed) return '';
    
    try {
      // If it's already a valid URL, return as is
      const parsed = new URL(trimmed);
      return parsed.href;
    } catch {
      // Try adding https if no protocol
      if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
        try {
          const withHttps = `https://${trimmed}`;
          new URL(withHttps); // Validate
          return withHttps;
        } catch {
          return trimmed; // Return original if still invalid
        }
      }
      return trimmed;
    }
  }

  /**
   * Extracts domain name from URL for display
   */
  static getDomainName(url: string): string {
    try {
      const parsed = new URL(url);
      return parsed.hostname.replace(/^www\./, '');
    } catch {
      return url;
    }
  }

  /**
   * Normalizes URL for deduplication
   * - Removes UTM parameters
   * - Lowercases hostname
   * - Removes fragments
   */
  static normalizeUrl(url: string): string {
    try {
      const parsed = new URL(url);
      
      // Remove tracking parameters
      const paramsToRemove = [
        'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content',
        'gclid', 'fbclid', 'msclkid', 'ref', 'tag', '_ga', 'mc_cid', 'mc_eid'
      ];
      
      paramsToRemove.forEach(param => {
        parsed.searchParams.delete(param);
      });
      
      // Remove fragment
      parsed.hash = '';
      
      // Lowercase hostname
      parsed.hostname = parsed.hostname.toLowerCase();
      
      // Remove trailing slash if no path
      if (parsed.pathname === '/') {
        parsed.pathname = '';
      }
      
      return parsed.toString();
    } catch {
      return url.toLowerCase();
    }
  }

  /**
   * Checks if URL is likely an e-commerce product page
   */
  static isProductUrl(url: string): boolean {
    const productIndicators = [
      '/product/',
      '/p/',
      '/item/',
      '/dp/', // Amazon
      '/gp/product/', // Amazon
      'amazon.com',
      'shopify',
      'etsy.com',
      'ebay.com',
      'walmart.com',
      'target.com'
    ];

    const lowerUrl = url.toLowerCase();
    return productIndicators.some(indicator => lowerUrl.includes(indicator));
  }

  /**
   * Generates a user-friendly URL display string
   */
  static getDisplayUrl(url: string, maxLength: number = 50): string {
    try {
      const parsed = new URL(url);
      const domain = parsed.hostname.replace(/^www\./, '');
      const path = parsed.pathname;
      
      if (path === '/' || path === '') {
        return domain;
      }
      
      const fullDisplay = `${domain}${path}`;
      
      if (fullDisplay.length <= maxLength) {
        return fullDisplay;
      }
      
      // Truncate path if too long
      const availableLength = maxLength - domain.length - 3; // 3 for "..."
      const truncatedPath = path.length > availableLength 
        ? `...${path.slice(-(availableLength - 3))}`
        : path;
        
      return `${domain}${truncatedPath}`;
    } catch {
      return url.length > maxLength ? `${url.slice(0, maxLength)}...` : url;
    }
  }
}