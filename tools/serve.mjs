#!/usr/bin/env node
/**
 * Local preview of the site, as close to Vercel as possible without an account:
 *   node tools/serve.mjs [port]      (default 3000)
 * - serves public/ with the headers from vercel.json (including the strict CSP)
 * - runs the real api/ function; email is NOT sent (printed to the console instead).
 * Video files are served with byte ranges, as on Vercel (Safari needs them to play video).
 */
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { setTestTransport } from "../lib/email.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const PUB = path.join(ROOT, "public");
const PORT = Number(process.argv[2] || process.env.PORT || 3000);
const vercel = JSON.parse(fs.readFileSync(path.join(ROOT, "vercel.json"), "utf8"));

// Local stand-in for email
process.env.SMTP_USER ||= "preview@localhost";
process.env.SMTP_PASS ||= "preview";
setTestTransport({ sendMail: async m => console.log(`\n[preview] lead email (not sent):\n  to: ${m.to}\n  subject: ${m.subject}\n${m.text.replace(/^/gm, "  ")}`) });

const TYPES = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8", ".json": "application/json", ".svg": "image/svg+xml", ".webp": "image/webp", ".jpg": "image/jpeg",
  ".png": "image/png", ".mp4": "video/mp4", ".webm": "video/webm", ".woff2": "font/woff2", ".txt": "text/plain; charset=utf-8", ".xml": "application/xml", ".ico": "image/x-icon" };

const toRegex = src => new RegExp("^" + src.replace(/\(\.\*\)/g, ".*") + "$");
const headersFor = urlPath => {
  const out = {};
  for (const rule of vercel.headers || []) if (toRegex(rule.source).test(urlPath)) for (const h of rule.headers) out[h.key] = h.value;
  return out;
};

const routes = [
  [/^\/api\/leads$/, "api/leads.js"]
];

async function runFunction(file, req, res) {
  const mod = await import(pathToFileURL(path.join(ROOT, file)).href);
  const handler = mod[req.method];
  if (!handler) { res.writeHead(405, { "Content-Type": "application/json" }); return res.end('{"error":{"code":"method_not_allowed"}}'); }
  const chunks = [];
  for await (const c of req) chunks.push(c);
  const request = new Request(`http://localhost:${PORT}${req.url}`, {
    method: req.method,
    headers: req.headers,
    body: ["GET", "HEAD"].includes(req.method) ? undefined : Buffer.concat(chunks)
  });
  const response = await handler(request);
  res.writeHead(response.status, Object.fromEntries(response.headers));
  res.end(Buffer.from(await response.arrayBuffer()));
}

function serveStatic(urlPath, req, res) {
  let file = path.normalize(path.join(PUB, decodeURIComponent(urlPath)));
  if (!file.startsWith(PUB)) { res.writeHead(403); return res.end(); }
  if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, "index.html");
  let status = 200;
  if (!fs.existsSync(file)) { file = path.join(PUB, "404.html"); status = 404; }
  const body = fs.readFileSync(file);
  const headers = { "Content-Type": TYPES[path.extname(file)] || "application/octet-stream", "Accept-Ranges": "bytes", ...headersFor(urlPath) };
  // Byte ranges (video seeking; Safari requires them)
  const m = status === 200 && /^bytes=(\d*)-(\d*)$/.exec(req.headers.range || "");
  if (m) {
    const start = m[1] === "" ? Math.max(0, body.length - Number(m[2])) : Number(m[1]);
    const end = m[1] !== "" && m[2] !== "" ? Math.min(Number(m[2]), body.length - 1) : body.length - 1;
    if (start > end || start >= body.length) { res.writeHead(416, { "Content-Range": `bytes */${body.length}` }); return res.end(); }
    res.writeHead(206, { ...headers, "Content-Range": `bytes ${start}-${end}/${body.length}`, "Content-Length": end - start + 1 });
    return res.end(body.subarray(start, end + 1));
  }
  res.writeHead(status, { ...headers, "Content-Length": body.length });
  res.end(body);
}

http.createServer(async (req, res) => {
  const urlPath = new URL(req.url, "http://x").pathname;
  try {
    const route = routes.find(([re]) => re.test(urlPath));
    if (route) return await runFunction(route[1], req, res);
    serveStatic(urlPath, req, res);
  } catch (err) {
    console.error(err);
    res.writeHead(500); res.end("Server error");
  }
}).listen(PORT, () => console.log(`KOVO preview: http://localhost:${PORT}`));
