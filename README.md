# IBDAA Dental Lab website

Bilingual, primarily static Next.js App Router website for IBDAA Dental Lab. English is the default route and Arabic pages have their own RTL document layout.

## Local development

Requires Node.js compatible with the installed Next.js version.

```bash
npm install
npm run dev
```

Open `http://localhost:3000`. For production checks, run `npm run typecheck`, `npm run lint`, and `npm run build`.

## Deployment

Import this repository into Vercel as a Next.js project. Set `NEXT_PUBLIC_SITE_URL` to the verified public origin, including `https://` and without a trailing slash, once the domain is known. This value is used in canonical URLs, Open Graph, sitemap, robots, and structured data. Vercel's `VERCEL_PROJECT_PRODUCTION_URL` is used when no explicit public origin is configured. Local development uses `http://localhost:3000`.

## Business information to confirm

- `src/lib/site.ts`: Confirm `primaryWhatsAppNumber`. The first supplied phone number is used provisionally for “Send a Case”; both supplied numbers remain listed as phone contacts.
- Confirm the final public domain and set `NEXT_PUBLIC_SITE_URL` before public launch.
- Confirm the Arabic spelling of DT Yasser Zaineh's surname before publication.

## Replacing visual placeholders

The founder/about placeholder uses `PhotoPlaceholder` in `src/components/Shared.tsx`. Replace its use in `src/components/Pages.tsx` with a real optimized lab or founder image and descriptive alt text. The restoration cards and rows use CSS artwork as deliberate placeholders; replace those with verified restoration or CAD/CAM photographs when available. Source logo assets remain intact under `assets/logo/`; `public/logo-ball.png` is a copy used by the website.
