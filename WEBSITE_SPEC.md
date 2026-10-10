# IBDAA Dental Lab Website Specification

## 1. Project Overview

Build a modern, premium, bilingual website for **IBDAA Dental Lab**.

IBDAA Dental Lab is a dental laboratory founded in **2016** by **DT Yasser Zaineh**, a Damascus University graduate with **30+ years of experience**.

The laboratory serves dentists in:
- Cairo
- Assiut
- Port Said via shipping

The website is aimed **only at dentists and dental professionals**, not patients.

## 2. Primary Goals

1. Attract dentists looking for a reliable dental laboratory.
2. Present IBDAA as professional, modern, trustworthy, and quality-focused.
3. Rank well on Google for relevant local and service-based searches.
4. Improve visibility in AI-powered search and answer engines.
5. Make it very easy for dentists to send a case or contact the lab.
6. Build a website that can be expanded later with more products, case photos, and content.

## 3. Core Positioning

IBDAA's main differentiator is:

**High quality for the price.**

Do not turn this into exaggerated marketing claims such as "the best dental lab in Egypt" or "unmatched quality."

Use restrained, professional wording such as:
- Premium-quality dental restorations at competitive value
- Reliable quality without unnecessary cost
- Precision, aesthetics, and value for dental professionals

## 4. Target Audience

Primary audience:
- Dentists
- Prosthodontists
- Dental clinics
- Dental centers

Do not write content directed at patients.

## 5. Languages

The website must support:
- English
- Arabic

Default language: **English**

Arabic should have proper RTL support.

Recommended route structure:
- `/` = English
- `/ar/` = Arabic

Each page should have an equivalent Arabic route.

Use a visible language switcher such as:
- EN
- عربي

Do not implement the bilingual site by simply swapping text with client-side JavaScript on the same URL.

## 6. Pages

### Main navigation

- Home
- About
- Dental Restorations
- Contact

Recommended English routes:
- `/`
- `/about`
- `/restorations`
- `/contact`

Recommended Arabic routes:
- `/ar`
- `/ar/about`
- `/ar/restorations`
- `/ar/contact`

Avoid calling the page simply "Product" or "Products" if a more professional term such as **Dental Restorations** fits the design.

## 7. Homepage Structure

Recommended homepage order:

### Hero
Clearly communicate:
- IBDAA Dental Lab
- Dental laboratory serving dentists
- Nasr City, Cairo
- Quality-focused dental restorations
- CAD/CAM capabilities

Primary CTA:
**Send a Case**

Secondary CTA:
**Explore Restorations**

Potential hero copy direction:

**Precision Dental Restorations for Dentists**

Reliable CAD/CAM dental restorations combining precision, aesthetics, and excellent value.

Do not treat this sample copy as mandatory. Improve it if needed while keeping the claims factual.

### Trust / Key Facts
Potential facts:
- Founded in 2016
- 30+ years of founder experience
- CAD/CAM workflow
- Serving Cairo and Assiut
- Shipping available to Port Said

### Restorations Preview
Cards or sections for:
- Zirconia
- Zircomax
- E.max
- Veneers
- PFM

Each should link to the main Dental Restorations page and be easy to split into dedicated pages later.

### Why IBDAA
Focus on:
- Quality for the price
- Experience
- Precision
- Modern digital workflow
- Reliable communication with dentists

Do not invent warranties, turnaround times, certifications, material brands, machinery brands, or guarantees.

### Founder / About Preview
Introduce:
**DT Yasser Zaineh**
- Founder of IBDAA Dental Lab
- Damascus University graduate
- 30+ years of experience
- IBDAA founded in 2016

### Service Area
Mention:
- Cairo
- Assiut
- Shipping to Port Said

### Final CTA
Strong "Send a Case" section with WhatsApp/contact options.

## 8. About Page

Include:
- IBDAA Dental Lab was founded in 2016
- Founder: DT Yasser Zaineh
- Graduate of Damascus University
- 30+ years of experience
- Professional focus on quality, precision, and value
- Serves dentists rather than patients
- Service coverage in Cairo and Assiut, with shipping to Port Said

Tone:
Professional, credible, concise, and not overly promotional.

## 9. Dental Restorations

The website currently needs these restoration categories:

### Zirconia
Temporary description for initial implementation:
A modern all-ceramic restorative option designed for strength, precision, and natural aesthetics. Suitable for a variety of crown and bridge applications.

### Zircomax
Temporary description for initial implementation:
A high-strength zirconia-based restorative solution intended to balance durability, fit, and aesthetics for demanding restorative cases.

IMPORTANT:
This description is provisional. Do not invent specific material composition, brand claims, translucency levels, indications, or technical specifications until confirmed by IBDAA.

### E.max
Temporary description for initial implementation:
A highly aesthetic ceramic option commonly selected for restorations where natural appearance and optical properties are a priority, including selected crowns, veneers, inlays, and onlays.

IMPORTANT:
Keep wording general and avoid claiming a specific manufacturer or workflow unless later confirmed.

### Veneers
Temporary description for initial implementation:
Thin aesthetic restorations designed to reproduce natural tooth form and appearance with attention to contour, shade, and surface detail.

### PFM
Temporary description for initial implementation:
Porcelain-fused-to-metal restorations combining a metal substructure with aesthetic ceramic layering.

### CAD/CAM
IBDAA uses CAD/CAM in its workflow.

Mention digital precision and consistency, but do not invent scanner, milling machine, software, or material brands.

## 10. Contact Information

### Phone / WhatsApp numbers
- +20 103 027 7027
- +20 114 222 0100

TODO:
Confirm which number should be used as the primary WhatsApp destination for the "Send a Case" CTA.

### Email
damas.ibdaa@gmail.com

### Facebook
https://www.facebook.com/share/1FA8zajrSG/

### Google Maps
https://maps.app.goo.gl/DWQkvrduiSt8XwKBA

### Main CTA
**Send a Case**

The CTA should preferably open WhatsApp with a useful prefilled message once the primary WhatsApp number is confirmed.

Suggested message:
"Hello IBDAA Dental Lab, I would like to send a dental case."

Arabic equivalent:
"مرحباً مختبر إبداع للأسنان، أود إرسال حالة."

## 11. Branding

Use the supplied logo files from the project folder as the source of truth.

Brand direction:
- Modern
- Premium
- Clean
- Professional
- Medical / technical
- Not cold or generic

### Brand colors

- Navy: `#0F2D4A`
- Teal: `#0097A7`
- Yellow accent: `#FFB400`
- Light gray: `#F4F6F8`

Preferred visual usage:
- White / light gray backgrounds
- Navy as main dark brand color
- Teal as secondary brand color
- Yellow used sparingly for accents, highlights, or small CTA details

Do not overuse gradients.

Use ample whitespace, strong typography, refined cards, subtle motion, and clean visual hierarchy.

### Logo note

Some supplied branding concepts contain the wording:
"MEDICAL & DENTAL SUPPLY L.L.C"

The website business name must be presented as:
**IBDAA Dental Lab**

Do not imply that the website is primarily for a dental supply distributor.

Do not alter the source logo files unless explicitly requested. Where appropriate, use "IBDAA Dental Lab" as adjacent text in the header, hero, metadata, and footer.

## 12. Photos

Real lab and restoration photography will be added later.

For now:
- Create elegant placeholders where photography is needed.
- Do not populate the site with random generic stock dental imagery.
- Make it easy to replace placeholders with real case/lab photos later.
- Avoid AI-generated teeth or fake clinical before/after imagery.

Potential future image categories:
- Finished restorations
- Crown/bridge cases
- Veneers
- Lab technicians
- CAD/CAM workflow
- Equipment
- Laboratory interior
- Packaging / shipping

## 13. Design Requirements

The website should feel:
- Premium
- Clean
- Trustworthy
- Modern
- Precise
- Technical
- Easy to scan

Avoid:
- Generic medical-template appearance
- Excessive animations
- Huge blocks of text
- Overly rounded playful design
- Stock-photo-heavy layouts
- Fake testimonials
- Fake review counts
- Fake certifications
- Fake client logos
- Fake statistics

Responsive design is required for:
- Mobile
- Tablet
- Desktop

## 14. Technical Direction

Preferred stack:
- Next.js
- TypeScript
- Modern CSS solution such as Tailwind CSS
- Deployable to Vercel

Use the current stable Next.js architecture unless there is a strong reason not to.

Prioritize:
- Static/server-rendered content
- Fast loading
- Excellent Core Web Vitals
- Minimal client-side JavaScript
- Accessible markup
- Semantic HTML
- Maintainable components

## 15. SEO Requirements

SEO is a major project goal.

Implement:
- Unique page titles
- Unique meta descriptions
- Canonical URLs
- Open Graph metadata
- Twitter/social metadata
- XML sitemap
- robots.txt
- Semantic heading structure
- Descriptive image alt text
- Internal linking
- Proper `lang` attributes
- `hreflang` between English and Arabic pages
- Clean URLs

Target concepts naturally, without keyword stuffing:
- dental lab in Nasr City
- dental lab Cairo
- dental laboratory Cairo
- zirconia dental lab Cairo
- E.max dental lab Cairo
- CAD/CAM dental lab Cairo
- dental restorations Cairo

Arabic content should target equivalent natural Arabic searches.

Do not create spammy SEO text or hidden keywords.

## 16. Structured Data / AI Search Visibility

Implement appropriate Schema.org structured data.

Consider:
- Organization / LocalBusiness where appropriate
- WebSite
- WebPage
- BreadcrumbList
- Person for DT Yasser Zaineh
- ContactPoint
- Service where appropriate

Use only verified facts from this specification.

Do not invent:
- AggregateRating
- Review
- Award
- Certification
- PriceRange unless later confirmed
- Opening hours unless later confirmed
- Exact street address unless later confirmed

Write content with clear factual entities and relationships so search engines and AI systems can understand:
- IBDAA Dental Lab is a dental laboratory
- It is located in Nasr City, Cairo
- It serves dentists
- It was founded in 2016
- It was founded by DT Yasser Zaineh
- He has 30+ years of experience
- He graduated from Damascus University
- The lab offers dental restorations including Zirconia, Zircomax, E.max, Veneers, and PFM
- It uses CAD/CAM
- It serves Cairo and Assiut and ships to Port Said

## 17. Accessibility

Implement:
- Keyboard navigation
- Visible focus states
- Good contrast
- Semantic landmarks
- Proper labels
- Accessible navigation
- Accessible language switcher
- RTL support for Arabic
- Reduced-motion support where relevant

## 18. Performance

Optimize for:
- Fast initial load
- Responsive images
- Minimal layout shift
- Lazy loading below-the-fold imagery
- Font optimization
- Limited third-party scripts
- Lightweight animations

## 19. Future Expansion

The architecture should make it easy to add:
- Individual restoration/service pages
- Case gallery
- Testimonials once genuine reviews are supplied
- Blog / educational content
- More service areas
- Online case submission
- File upload for scans
- Dentist portal
- Additional staff members
- Google reviews integration
- More social channels

Do not implement these advanced features unless requested now.

## 20. Content Integrity Rules

Codex must not invent business facts.

If information is missing:
- Use a clear placeholder
- Add a TODO comment
- Or omit the claim

Never fabricate:
- Prices
- Reviews
- Customers
- Certifications
- Equipment brands
- Material brands
- Turnaround times
- Guarantees
- Awards
- Partner clinics
- Number of cases completed
- Opening hours
- Exact address

The site should look finished even while preserving factual integrity.
