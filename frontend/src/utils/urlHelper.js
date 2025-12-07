/**
 * URL Helper Utility
 * Generates proper URLs for sharing based on the current environment:
 * - localhost -> converts to LAN IP for cross-device sharing
 * - IP addresses (e.g., 192.168.0.66/simplepos.react/)
 * - Domain names (domain.name.com) with app deployed in a subfolder like /tools/simplepos
 */

import { getAppBasePath } from '../config/api';

// Cache for the detected LAN IP
let cachedLanIP = null;

/**
 * Determines if the current hostname is a domain name (not localhost or IP)
 * @param {string} hostname - The hostname to check
 * @returns {boolean} - True if it's a domain name
 */
export function isDomainName(hostname) {
  // Check if it's localhost
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return false;
  }
  
  // Check if it's an IP address (IPv4)
  const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
  if (ipv4Regex.test(hostname)) {
    return false;
  }
  
  // Check if it's an IPv6 address
  if (hostname.includes(':') || hostname.startsWith('[')) {
    return false;
  }
  
  // It's a domain name
  return true;
}

/**
 * Checks if the hostname is localhost
 * @param {string} hostname - The hostname to check
 * @returns {boolean} - True if it's localhost
 */
export function isLocalhost(hostname) {
  return hostname === 'localhost' || hostname === '127.0.0.1';
}

/**
 * Detects the machine's LAN IP address using WebRTC
 * This is used to generate shareable URLs that work across devices on the same network
 * @returns {Promise<string|null>} - The LAN IP or null if detection fails
 */
export async function detectLanIP() {
  // Return cached IP if available
  if (cachedLanIP) {
    return cachedLanIP;
  }

  // Check if RTCPeerConnection is available
  if (typeof RTCPeerConnection === 'undefined') {
    console.warn('RTCPeerConnection not available, cannot detect LAN IP');
    return null;
  }

  return new Promise((resolve) => {
    let resolved = false;
    let pc = null;
    
    const cleanup = () => {
      if (pc) {
        try {
          pc.close();
        } catch (e) {
          // Ignore close errors
        }
        pc = null;
      }
    };
    
    const resolveOnce = (value) => {
      if (!resolved) {
        resolved = true;
        cleanup();
        resolve(value);
      }
    };
    
    try {
      // Use WebRTC to detect local IP
      pc = new RTCPeerConnection({ iceServers: [] });
      pc.createDataChannel('');
      
      pc.onicecandidate = (event) => {
        if (!event || !event.candidate) {
          // No more candidates
          resolveOnce(cachedLanIP);
          return;
        }
        
        const candidate = event.candidate.candidate;
        if (!candidate) {
          return;
        }
        
        // Extract IP from candidate string
        const ipMatch = candidate.match(/(\d{1,3}\.){3}\d{1,3}/);
        if (ipMatch) {
          const ip = ipMatch[0];
          // Filter out localhost and link-local addresses
          if (!ip.startsWith('127.') && !ip.startsWith('169.254.')) {
            cachedLanIP = ip;
            // Found a valid IP, resolve immediately
            resolveOnce(cachedLanIP);
          }
        }
      };
      
      pc.onicegatheringstatechange = () => {
        if (pc && pc.iceGatheringState === 'complete') {
          resolveOnce(cachedLanIP);
        }
      };
      
      pc.createOffer()
        .then((offer) => {
          if (pc) {
            return pc.setLocalDescription(offer);
          }
        })
        .catch((err) => {
          console.warn('WebRTC offer failed:', err);
          resolveOnce(null);
        });
      
      // Timeout after 500ms (faster timeout)
      setTimeout(() => {
        resolveOnce(cachedLanIP);
      }, 500);
    } catch (error) {
      console.warn('Failed to detect LAN IP:', error);
      resolveOnce(null);
    }
  });
}

/**
 * Sets the cached LAN IP manually (useful when fetched from server)
 * @param {string} ip - The LAN IP address
 */
export function setLanIP(ip) {
  cachedLanIP = ip;
}

/**
 * Gets the cached LAN IP
 * @returns {string|null} - The cached LAN IP or null
 */
export function getLanIP() {
  return cachedLanIP;
}

/**
 * Gets the base path for the application
 * - For localhost/IP: /simplepos.react
 * - For domain names: empty (assumes app is at root)
 * @param {string} hostname - Optional hostname override
 * @returns {string} - The base path
 */
export function getBasePath(hostname = null) {
  // Use the same base path detection as the API config so URLs
  // always include the correct deployment folder (e.g. /tools/simplepos).
  if (typeof window === 'undefined') {
    return '';
  }
  return getAppBasePath();
}

/**
 * Generates a full URL for sharing
 * Automatically uses LAN IP instead of localhost for cross-device sharing
 * @param {Object} options - URL generation options
 * @param {string} options.path - The path after the base (e.g., '/store/label/order.html')
 * @param {string} options.hostname - Optional hostname override (for LAN IP)
 * @returns {string} - The full URL
 */
export function generateShareUrl({ path, hostname = null }) {
  const protocol = window.location.protocol;
  let host = hostname || window.location.hostname;
  const currentPort = window.location.port;
  
  // If we're on localhost and have a cached LAN IP, use it for sharing
  // This ensures QR codes work across devices on the same network
  if (isLocalhost(host) && cachedLanIP) {
    host = cachedLanIP;
  }
  
  // Determine if we need to include the port
  const isDefaultPort = currentPort === '' || currentPort === '80' || currentPort === '443';
  const portSegment = isDefaultPort ? '' : `:${currentPort}`;
  
  // Get the base path based on hostname type
  const basePath = getBasePath(host);
  
  // Ensure path starts with /
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  
  return `${protocol}//${host}${portSegment}${basePath}${normalizedPath}`;
}

/**
 * Generates the terminal/order URL for sharing
 * @param {Object} options - Options for URL generation
 * @param {string} options.storeGuid - The store GUID
 * @param {string} options.label - The store label
 * @param {string} options.hostname - Optional hostname override
 * @returns {string} - The full terminal URL
 */
export function generateTerminalUrl({ storeGuid, label, hostname = null }) {
  const path = `/${storeGuid}/${encodeURIComponent(label)}/order.html`;
  return generateShareUrl({ path, hostname });
}

/**
 * Generates the order tracking URL for kiosk orders
 * @param {Object} options - Options for URL generation
 * @param {string} options.label - The store label
 * @param {string} options.orderNumber - The order number
 * @param {string} options.hostname - Optional hostname override
 * @returns {string} - The full order tracking URL
 */
export function generateOrderTrackingUrl({ label, orderNumber, hostname = null }) {
  const path = `/${label}/${orderNumber}`;
  return generateShareUrl({ path, hostname });
}

export default {
  isDomainName,
  isLocalhost,
  detectLanIP,
  setLanIP,
  getLanIP,
  getBasePath,
  generateShareUrl,
  generateTerminalUrl,
  generateOrderTrackingUrl
};
