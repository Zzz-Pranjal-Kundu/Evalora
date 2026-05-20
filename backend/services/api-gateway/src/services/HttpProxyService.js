import { logger } from "../utils/logger.js";

const TIMEOUT_MS = 15000;

function buildUrl(baseUrl, path, query) {
  const base = baseUrl.replace(/\/$/, "");
  const p = path.startsWith("/") ? path : `/${path}`;
  const url = new URL(base + p);
  if (query && typeof query === "object") {
    Object.entries(query).forEach(([k, v]) => {
      if (Array.isArray(v)) v.forEach((item) => url.searchParams.append(k, String(item)));
      else if (v !== undefined && v !== null) url.searchParams.set(k, String(v));
    });
  }
  return url;
}

export class HttpProxyService {
  static async forward({ baseUrl, path, method, headers = {}, body, query }) {
    const url = buildUrl(baseUrl, path, query);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    try {
      const opts = {
        method,
        headers: { ...headers },
        signal: controller.signal,
      };
      if (body !== undefined && body !== null && !["GET", "HEAD"].includes(method)) {
        opts.headers["content-type"] = opts.headers["content-type"] || "application/json";
        opts.body = typeof body === "string" ? body : JSON.stringify(body);
      }
      const resp = await fetch(url, opts);
      const text = await resp.text();
      let json;
      try {
        json = text ? JSON.parse(text) : null;
      } catch {
        json = { message: text };
      }
      return { status: resp.status, body: json };
    } catch (e) {
      logger.warn("Upstream error", { url: url.toString(), message: e.message });
      const err = new Error("Upstream service unavailable");
      err.statusCode = 503;
      throw err;
    } finally {
      clearTimeout(timer);
    }
  }
}
