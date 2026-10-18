# Elmora reference design

The user-supplied architectural reference is the visual authority, replacing the earlier sage editorial direction. The existing sections and interactions remain intact.

## Visual system
- Navy #071126 text, warm white #fffdf8 surfaces, sunflower yellow #ffb51b calls to action, orange #f26530 and teal #078e9b hero emphasis.
- Self-hosted Manrope, weight 800 for headings and the Elmora wordmark; rounded primary buttons and a three-petal vector emblem.
- Bright architectural hero, left-aligned headline, four bottom feature items and responsive mobile composition. Existing collection palettes retain their illustrative colours.
- Desktop hero poster fades into the existing six-scene GSAP walkthrough as scrolling starts, and returns on reverse scrolling. Reduced-motion, mobile, slow-network and failure fallbacks retain the poster.
- Colour studio, draggable comparison, keyboard controls, gallery filters, enquiry preview and section navigation remain functional.

## Asset provenance
public/images/hero-colour.webp is a 1536 × 1024, 199,534-byte WebP derived with the built-in image-generation tool from the user-provided Elmora screenshot. Website text and buttons were removed from the image and rebuilt as accessible HTML. Generated master: exec-92f68b7e-5e74-4c3b-b6c1-1b7d3b730949.png. Existing room photos and the walkthrough film remain derived from the original user-supplied assets.

## Content limits
Collection names and shade names are illustrative. Brand story and contact details remain labelled placeholders. Enquiry form is preview-only and sends nothing. Unverified health, environmental and durability claims from the reference were not added.

## Verification — 18 October 2026
Production build and TypeScript passed. Browser suite: 27 passed, with 7 desktop-only cases skipped on mobile. Tested all 12 room/shade combinations, comparison dragging and keyboard controls, equal gallery image sizing, navigation, form validation, all six walkthrough scenes with reverse scroll, failure recovery and viewport widths 320–1440px. These are local test results, not field performance guarantees.

## Native video scrub revision
The desktop walkthrough uses one 40-second, 1600 × 900 H.264 film assembled from the six supplied clips. A keyframe every three frames gives the browser frequent seek points. Scroll progress seeks the native video directly over seven viewports with a short 0.18-second catch-up, removing the network queue, JavaScript bitmap decoding and per-frame canvas painting that previously made the animation hesitate. The higher-resolution encode retains fine wall, furniture and foliage detail that was visibly softened by the former 1280 × 720 asset. The original hero copy, navigation and static mobile, reduced-motion, slow-network and Save-Data fallbacks remain intact.

The final five-second local sample recorded 110 playhead updates and 112 frames actually presented, equivalent to about 22.4 presented frames per second from the 24 fps source, with a p95 browser frame interval of 16.7ms and zero long tasks. The player queues the latest target until the current frame reaches the screen, including during rapid reversals. A tested Full HD version fell to about 17 presented frames per second, while the former 720p version softened visible detail; 1600 × 900 is the measured balance for this layout. The desktop video is approximately 89 MiB and is never requested by fallback modes.

Collection cards now use three original concept photographs for the sage, terracotta and ivory palettes. Each is a 1200 × 750 WebP between approximately 55 and 90 KB, without embedded wording or logos. “Elmora.” is capitalised and rendered as editable HTML. The concept shade disclaimer remains visible, and inspiration photographs use one consistent 16:10 crop and equal grid columns.
