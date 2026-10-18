# Elmora Paints
Next.js App Router + TypeScript + Tailwind CSS landing page.

## Run locally
```sh
npm install
npm run dev
```
Open http://localhost:3100.

## Verify
```sh
npm run build
npm run typecheck
npm test
```
Playwright requires Chromium (`npx playwright install chromium`). Set `PLAYWRIGHT_BASE_URL` when the preview is running on a different port.

## Content and components
- `src/lib/content.ts`: navigation, illustrative paint collections, concept shades and supplied room assets.
- `public/images/collection-*.webp`: compressed original concept photography for the sage, terracotta and ivory collections. The images contain no embedded branding; the visible “Elmora.” caption remains editable HTML.
- `src/components/`: reusable header, gallery, contact form and shared UI.
- `src/app/globals.css`: palette tokens and responsive styling, with Tailwind CSS available throughout.
- `public/images/`: copies of supplied assets; originals remain at project root.

## Before launch
Replace illustrative collection names with an approved catalogue. Confirm brand story, logo, contact information and required legal copy. Connect the form to a server-side delivery endpoint with validation and abuse protection. The current form validates a preview only; it neither sends nor stores personal information. Supplied videos now power the optional desktop hero walkthrough; the rest of the foundation is unchanged.


## Architectural walkthrough
- `src/components/walkthrough-hero.tsx`: progressively enhanced hero with dynamically imported GSAP/ScrollTrigger, reversible scroll-to-video seeking, skip control and complete lifecycle cleanup. The player queues the latest target until the current frame is presented, avoiding decoder work being cancelled during continuous scrolling.
- `public/walkthrough/elmora-journey-sharp.mp4`: a 1600 × 900, 24 fps H.264 film assembled from the six supplied clips. A seek point every three frames keeps forward and reverse scrolling responsive while preserving substantially more source detail than the previous 720p encode.
- Static fallback: viewport below 768px, coarse pointer, reduced motion, Save-Data, effective 2G/3G, failed video loading or an initial deep link to a later section. These modes neither pin the hero nor request the video. Runtime preference and breakpoint changes release the pin and media resources.
- Native scrolling and existing section links remain intact. A stable home anchor lives outside the pin. The keyboard-accessible Skip walkthrough control releases the pin and focuses Collections. Animation is decorative; the original hero copy and imagery remain available without JavaScript.

### Regenerate the walkthrough
Run `npm run assets:walkthrough`. The script joins the supplied root MP4 files with FFmpeg and emits a silent, web-ready film plus its manifest. On Apple Silicon, an optional local FFmpeg package is included. Elsewhere install FFmpeg and put it on PATH, or set `FFMPEG_PATH` to its executable. Source clips remain unmodified.

### Verification
`PLAYWRIGHT_BASE_URL=http://127.0.0.1:3101 npm test -- --workers=1` runs against a separate production server started with `npx next start --hostname 127.0.0.1 --port 3101` after `npm run build`.

The walkthrough tests cover all six visual states, reverse scrolling, pin release, keyboard skip, existing anchors, viewport changes, failed loading, and mobile and Save-Data download avoidance. Performance checks sample the actual video playhead during a five-second forward and reverse scroll. Local headless Chromium results are a laboratory check, not a real-device or field-performance guarantee.

Implementation reference: [GSAP ScrollTrigger documentation](https://gsap.com/docs/v3/Plugins/ScrollTrigger/).


## Interactive colour studio
- `src/components/room-visualiser.tsx` provides two supplied room photographs, six illustrative swatches, pointer/touch dragging, a native keyboard-accessible range control, before/colour shortcuts, reset, image-load recovery and a contact link.
- `src/lib/paint-rendering.ts` changes paint reflectance only within the wall matte. The source photograph supplies light, shadows and texture. Unmasked pixels remain unchanged. This is a visual approximation, not a calibrated paint recommendation or official shade catalogue.
- `scripts/build-visualiser.mjs` derives wall mattes from the supplied photograph geometry and colour/difference information. The living room uses `Unpainted living room.png` as its original; the bedroom uses `Bedroom.png`. Regenerate with `npm run assets:visualiser`.
- The first room image and mask total approximately 280 KiB. The other room is loaded on selection. Colour changes repaint a fixed 1280 × 720 canvas once; divider movement changes a CSS clipping boundary without recolouring or re-fetching pixels. Room changes cancel stale image work.
- On mobile, the swatches sit immediately above the photograph. The comparison surface permits vertical page scrolling and captures horizontal dragging. The native range supports arrow keys, Home and End. Selection is conveyed by a checkmark, text and pressed state, not colour alone.
- `src/components/page-motion.tsx` adds once-only section reveals and a bounded story-image parallax on fine-pointer desktop layouts. CSS hover details apply only to hover-capable devices. Reduced motion removes the supplementary animation while preserving all visualiser controls. The existing walkthrough keeps its own lifecycle and fallbacks.
- Visualiser tests exercise all 12 room/colour combinations, unchanged foreground pixels, illumination preservation, touch and pointer dragging, keyboard endpoints, shortcuts, reset, failure/retry, rapid room changes, contact navigation and layouts from 320 to 1440 pixels.
