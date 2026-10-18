"use client";
import { useEffect } from "react";

/** Local, reversible effects; the existing hero owns its own ScrollTrigger lifecycle. */
export function PageMotion() {
  useEffect(() => {
    let disposed = false;
    let revert = () => {};
    void Promise.all([import("gsap"), import("gsap/ScrollTrigger")])
      .then(([{ gsap }, { ScrollTrigger }]) => {
        if (disposed) return;
        gsap.registerPlugin(ScrollTrigger);
        const media = gsap.matchMedia();
        media.add("(prefers-reduced-motion: no-preference)", () => {
          const targets = document.querySelectorAll(
            ".section-heading, .intro > p, .story-copy, .contact-copy",
          );
          const observer = new IntersectionObserver(
            (entries) => {
              for (const entry of entries)
                if (entry.isIntersecting) {
                  // Start from an already visible state: failed JS never hides content.
                  gsap.fromTo(
                    entry.target,
                    { opacity: 0.6, clipPath: "inset(0 0 8% 0)" },
                    {
                      opacity: 1,
                      clipPath: "inset(0 0 0% 0)",
                      duration: 0.65,
                      ease: "power2.out",
                      clearProps: "opacity,clipPath",
                    },
                  );
                  observer.unobserve(entry.target);
                }
            },
            { threshold: 0.12 },
          );
          targets.forEach((target) => observer.observe(target));
          return () => {
            observer.disconnect();
            gsap.killTweensOf(targets);
            gsap.set(targets, { clearProps: "opacity,clipPath" });
          };
        });
        media.add(
          "(min-width: 900px) and (pointer: fine) and (prefers-reduced-motion: no-preference)",
          () => {
            const image = document.querySelector(".story-image img");
            if (!image) return;
            gsap.fromTo(
              image,
              { yPercent: -3, scale: 1.08 },
              {
                yPercent: 3,
                scale: 1.08,
                ease: "none",
                scrollTrigger: {
                  id: "elmora-story-parallax",
                  trigger: ".story-section",
                  start: "top bottom",
                  end: "bottom top",
                  scrub: 0.6,
                },
              },
            );
          },
        );
        revert = () => media.revert();
      })
      .catch(() => {});
    return () => {
      disposed = true;
      revert();
    };
  }, []);
  return null;
}
