# KOVO website – notes for Claude Code

KOVO is a **kitchens-only** business (custom kitchens) in Katzrin / Golan Heights. Owner: Or Biton (אור ביטון).
The site is Hebrew, RTL. The owner writes in Hebrew, is not a programmer – answer in simple Hebrew, do technical steps yourself,
and when he must click something, give one step at a time.

## Structure
- `public/` – the website (vanilla ES modules, no build step). Entry `index.html` + `main.js`, styles `styles/main.css`.
- `api/` – Vercel Functions: `leads.js` (contact form → email via SMTP), `designs/` (saved designs in Vercel Blob).
- `lib/` – validation, sanitizing, email, design store used by `api/`. `shared/` – constants + kitchen catalog (browser and server).
- `public/config/site.config.js` – links and hosting mode. `<meta name="kovo-hosting" content="vercel">`; on *.netlify.app it falls back to Netlify Forms.
- Netlify leftovers (`netlify/`, `netlify.toml`, `public/_headers`, `public/_redirects`) stay until the old Netlify site is retired; ignored by Vercel.

## Commands
- `npm test` – function tests (node:test). Must pass before any push.
- `npm run preview` – local site + API on http://localhost:3000 (email printed, designs in memory).

## Workflow (agreed with the owner)
1. Work on a branch, never directly on `main`.
2. Test: `npm test`, local preview on desktop and mobile (375px), no console errors, no horizontal scroll.
3. Push the branch only with the owner's OK → Vercel Preview URL → show it to the owner.
4. Merge to `main` (= live site) only after the owner explicitly approves.

## Fixed facts – do not change without the owner asking
- WhatsApp: https://wa.me/972555035890 · Phone (calls): 054-977-8853 · Instagram: https://www.instagram.com/kovo.kitchen/ · Leads email: Kovo.kitchen@gmail.com
- Hero headline, "הסיפור שלנו" and the three testimonials are the owner's exact text – keep verbatim.
- Logo: burgundy K mark `#630209` (sprite `#i-kovo` in index.html); the word KOVO is burgundy.
- Gallery photos are stock inspiration images, labeled as such until real KOVO photos arrive.
- Don't change the overall design, colours, typography or menu unless asked. Keep accessibility and the strict CSP (no inline scripts/styles).
- Secrets only in Vercel Environment Variables, never in the repo.
