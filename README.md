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

The local image files are in `public/images/placeholders/`. Paths are centralized in `src/lib/site.ts` under `media`; localized alt text is alongside the English and Arabic content. The reusable `ImageArea` component in `src/components/Shared.tsx` uses Next.js Image and stable aspect ratios. Replace the paths with verified IBDAA photography, then update the alt text to describe the real images.

- `zirconia-placeholder.svg`, `zircomax-placeholder.svg`, `emax-placeholder.svg`, `veneers-placeholder.svg`, `pfm-placeholder.svg`: restoration case photographs.
- `lab-placeholder.svg`: a real laboratory/workspace photograph for the about page. The homepage hero uses the supplied image optimized as `public/images/ibdaa-hero-precision-implant-blue-glove.webp`.
- `cadcam-placeholder.svg`: the CAD/CAM workflow or relevant lab equipment.
- `founder-placeholder.svg`: a real portrait of DT Yasser Zaineh.

The supplied `assets/logo/brand guide.png` and `branding guide.png` are identical. `public/logo-ball.png` and `src/app/icon.png` use the matching standalone symbol; the old full-wordmark and `assets/logo/OLD/` files remain untouched and are not used on the site.
