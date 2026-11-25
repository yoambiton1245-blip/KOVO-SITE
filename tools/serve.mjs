#!/usr/bin/env node
/**
 * Local preview of the site, as close to Vercel as possible without an account:
 *   node tools/serve.mjs [port]      (default 3000)
 * - serves public/ with the headers from vercel.json (including the strict CSP)
 * - runs the real api/ functions; email is NOT sent (printed to the console instead)
 *   and saved designs are kept in memory.
 */
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { setTestTransport } from "../lib/email.js";
import { setTestStore } from "../lib/designStore.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const PUB = path.join(ROOT, "public");
const PORT = Number(process.argv[2] || process.env.PORT || 3000);
const vercel = JSON.parse(fs.readFileSync(path.join(ROOT, "vercel.json"), "utf8"));

// Local stand-ins for email and Blob storage
process.env.SMTP_USER ||= "preview@localhost";
process.env.SMTP_PASS ||= "preview";
setTestTransport({ sendMail: async m => console.log(`\n[preview] lead email (not sent):\n  to: ${m.to}\n  subject: ${m.subject}\n${m.text.replace(/^/gm, "  ")}`) });
setTestStore(new Map());

const TYPES = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8", ".json": "application/json", ".svg": "image/svg+xml", ".webp": "image/webp", ".jpg": "image/jpeg",
  ".png": "image/png", ".mp4": "video/mp4", ".txt": "text/plain; charset=utf-8", ".xml": "application/xml", ".ico": "image/x-icon" };

const toRegex = src => new RegExp("^" + src.replace(/\(\.\*\)/g, ".*") + "$");
const headersFor = urlPath => {
  const out = {};
  for (const rule of vercel.headers || []) if (toRegex(rule.source).test(urlPath)) for (const h of rule.headers) out[h.key] = h.value;
  return out;
};

const routes = [
  [/^\/api\/leads$/, "api/leads.js"],
  [/^\/api\/designs$/, "api/designs/index.js"],
  [/^\/api\/designs\/[^/]+$/, "api/designs/[id].js"]
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

function serveStatic(urlPath, res) {
  let file = path.normalize(path.join(PUB, decodeURIComponent(urlPath)));
  if (!file.startsWith(PUB)) { res.writeHead(403); return res.end(); }
  if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, "index.html");
  let status = 200;
  if (!fs.existsSync(file) || /[\\/]_(headers|redirects)$/.test(file)) { file = path.join(PUB, "404.html"); status = 404; }
  const body = fs.readFileSync(file);
  res.writeHead(status, { "Content-Type": TYPES[path.extname(file)] || "application/octet-stream", ...headersFor(urlPath) });
  res.end(body);
}

http.createServer(async (req, res) => {
  const urlPath = new URL(req.url, "http://x").pathname;
  try {
    const route = routes.find(([re]) => re.test(urlPath));
    if (route) return await runFunction(route[1], req, res);
    serveStatic(urlPath, res);
  } catch (err) {
    console.error(err);
    res.writeHead(500); res.end("Server error");
  }
}).listen(PORT, () => console.log(`KOVO preview: http://localhost:${PORT}`));
