export interface PreviewData {
  title: string;
  image?: string;
  price?: string;
  currency?: string;
  siteName: string;
  sourceUrl: string;
}

export class PreviewService {
  private static readonly SERVER_URL = __DEV__ 
    ? 'http://localhost:3000' 
    : 'https://your-production-server.com';

  static async fetchPreview(url: string): Promise<PreviewData> {
    try {
      console.log('🔍 Fetching preview for:', url);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s client timeout

      const response = await fetch(`${this.SERVER_URL}/preview`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ url }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}`;
        
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch {
          // If response isn't JSON, use status text
          errorMessage = response.statusText || errorMessage;
        }

        // Provide user-friendly error messages
        if (response.status === 429) {
          throw new Error('Too many requests. Please wait a moment and try again.');
        } else if (response.status === 400) {
          throw new Error(errorMessage);
        } else if (response.status >= 500) {
          throw new Error('Server error. Please try again later.');
        }
        
        throw new Error(errorMessage);
      }

      const previewData = await response.json();
      console.log('✅ Preview fetched successfully:', previewData.title);
      return previewData;
      
    } catch (error) {
      console.error('❌ Preview fetch failed:', error);
      
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new Error('Request timed out. Please check your internet connection and try again.');
        }
        
        if (error.message.includes('Network request failed') || 
            error.message.includes('fetch')) {
          throw new Error('Network error: Please check your internet connection and server status.');
        }
        
        throw error;
      }
      
      throw new Error('Unknown error occurred while fetching preview');
    }
  }

  // Helper method to validate URLs on client side
  static isValidUrl(url: string): boolean {
    try {
      const parsed = new URL(url);
      return ['http:', 'https:'].includes(parsed.protocol);
    } catch {
      return false;
    }
  }

  // Helper method to clean URLs before sending to server
  static cleanUrl(url: string): string {
    try {
      const parsed = new URL(url);
      return parsed.href;
    } catch {
      // Try adding https if no protocol
      if (!url.startsWith('http')) {
        return `https://${url}`;
      }
      return url;
    }
  }
}