import dns from "dns/promises";
import net from "net";
import { URL } from "url";

export function validateUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return ["http:", "https:"].includes(parsed.protocol);
  } catch {
    return false;
  }
}

export async function blockPrivateIps(url: string): Promise<void> {
  const hostname = new URL(url).hostname;
  
  try {
    const addresses = await dns.lookup(hostname, { all: true });

    for (const addr of addresses) {
      const ip = addr.address;
      if (net.isIPv4(ip)) {
        // Check for private IPv4 ranges
        if (ip.startsWith('10.') || 
            ip.startsWith('172.16.') || 
            ip.startsWith('192.168.') ||
            ip.startsWith('127.')) {
          throw new Error("Blocked private/loopback IP (SSRF guard)");
        }
      } else if (net.isIPv6(ip)) {
        // Check for private IPv6 ranges
        if (ip.startsWith('fc') || 
            ip.startsWith('fd') || 
            ip === '::1') {
          throw new Error("Blocked private/loopback IP (SSRF guard)");
        }
      }
    }
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("DNS lookup failed");
  }
}