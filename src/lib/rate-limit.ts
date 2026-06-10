// In-memory rate limiting utility for Auth endpoints
import { NextRequest } from "next/server";

interface RateLimitInfo {
  count: number;
  resetTime: number;
}

const rateLimitMap = new Map<string, RateLimitInfo>();

export function rateLimit(request: NextRequest, limit: number, windowMs: number): boolean {
  // Get IP from headers (works for Vercel/Render/Cloudflare)
  const forwardedFor = request.headers.get("x-forwarded-for");
  const realIp = request.headers.get("x-real-ip");
  
  let ip = "127.0.0.1"; // Fallback for local
  if (forwardedFor) {
    ip = forwardedFor.split(",")[0].trim();
  } else if (realIp) {
    ip = realIp;
  }

  const now = Date.now();
  const record = rateLimitMap.get(ip);

  // If no record exists or window expired, create fresh record
  if (!record || record.resetTime < now) {
    rateLimitMap.set(ip, {
      count: 1,
      resetTime: now + windowMs
    });
    return true; // Request allowed
  }

  // Increment count
  record.count += 1;
  rateLimitMap.set(ip, record);

  // If exceeded limit, reject
  if (record.count > limit) {
    return false; // Request blocked
  }

  return true; // Request allowed
}

// Optional cleanup interval to prevent memory leaks in long-running processes
setInterval(() => {
  const now = Date.now();
  for (const [ip, record] of rateLimitMap.entries()) {
    if (record.resetTime < now) {
      rateLimitMap.delete(ip);
    }
  }
}, 60000); // Clean up every 1 minute
