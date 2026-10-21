"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { Arrow } from "./ui";
import { SCENES } from "@/lib/walkthrough";

type Connection = EventTarget & { saveData?: boolean; effectiveType?: string };

export function WalkthroughHero() {
  const root = useRef<HTMLElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const bar = useRef<HTMLSpanElement>(null);
  const sceneLabel = useRef<HTMLSpanElement>(null);
  const [status, setStatus] = useState<"static" | "loading" | "active">(
    "static",
  );
  const [disabled, setDisabled] = useState(false);
  const release = useRef<() => void>(() => {});

  useEffect(() => {
    if (disabled) return;
    const media = window.matchMedia(
      "(min-width: 768px) and (prefers-reduced-motion: no-preference)",
    );
    const connection = (navigator as Navigator & { connection?: Connection })
      .connection;
    let cancel = () => {};
    let disposed = false;

    const configure = () => {
      cancel();
      if (disposed) return;
      const element = root.current;
      const surface = video.current;
      if (!element || !surface) return;
      const constrained =
        connection?.saveData ||
        ["slow-2g", "2g", "3g"].includes(connection?.effectiveType ?? "");
      const outsideHero = element.getBoundingClientRect().bottom < 0;
      const deepLink =
        window.location.hash &&
        !["#home", "#main"].includes(window.location.hash);
      const alignDeepLink = () => {
        const target = document.getElementById(window.location.hash.slice(1));
        if (!target) return;
        requestAnimationFrame(() => {
          const headerHeight =
            Number.parseFloat(
              getComputedStyle(document.documentElement).scrollPaddingTop,
            ) ||
            document.querySelector("header")?.getBoundingClientRect().height ||
            0;
          const top =
            target.getBoundingClientRect().top + window.scrollY - headerHeight;
          window.scrollTo({ top: Math.max(0, top), behavior: "instant" });
        });
      };
      if (!media.matches || constrained || outsideHero || deepLink) {
        setStatus("static");
        if (deepLink) alignDeepLink();
        return;
      }

      let cancelled = false;
      let cleanup = () => {};
      cancel = () => {
        cancelled = true;
        cleanup();
        surface.style.opacity = "0";
        surface.pause();
        surface.removeAttribute("src");
        surface.load();
        element.removeAttribute("data-video-time");
        element.removeAttribute("data-scene");
        element.removeAttribute("data-progress");
        setStatus("static");
      };
      release.current = cancel;
      setStatus("loading");

      void (async () => {
        const [{ gsap }, { ScrollTrigger }] = await Promise.all([
          import("gsap"),
          import("gsap/ScrollTrigger"),
        ]);
        if (cancelled) return;
        surface.src = "/walkthrough/elmora-journey-sharp.mp4?v=sharp-4";
        surface.load();
        if (surface.readyState < HTMLMediaElement.HAVE_METADATA)
          await new Promise<void>((resolve, reject) => {
            surface.addEventListener("loadedmetadata", () => resolve(), {
              once: true,
            });
            surface.addEventListener("error", () => reject(surface.error), {
              once: true,
            });
          });
        if (cancelled) return;
        // Do not insert a pin behind someone who already followed a section link.
        if (
          element.getBoundingClientRect().bottom < 0 ||
          (window.location.hash &&
            !["#home", "#main"].includes(window.location.hash))
        ) {
          cancel();
          return;
        }
        gsap.registerPlugin(ScrollTrigger);
        const playhead = { progress: 0 };
        let currentScene = -1;
        let desiredTime = 0;
        let frameRequest = 0;
        const presentLatestFrame = () => {
          if (cancelled || document.hidden || frameRequest) return;
          if (Math.abs(surface.currentTime - desiredTime) <= 1 / 48) return;
          frameRequest = surface.requestVideoFrameCallback(() => {
            frameRequest = 0;
            presentLatestFrame();
          });
          surface.currentTime = desiredTime;
        };
        const update = () => {
          if (cancelled || document.hidden) return;
          const progress = playhead.progress;
          const target = Math.min(
            Math.max(0, surface.duration - 1 / 24),
            progress * surface.duration,
          );
          desiredTime = target;
          presentLatestFrame();
          surface.style.opacity = progress === 0 ? "0" : "1";
          const scene = Math.min(5, Math.floor(target / 6));
          if (scene !== currentScene) {
            currentScene = scene;
            if (sceneLabel.current)
              sceneLabel.current.textContent = SCENES[scene];
            element.dataset.scene = String(scene);
          }
          if (bar.current) bar.current.style.transform = `scaleX(${progress})`;
          element.dataset.progress = progress.toFixed(4);
          element.dataset.videoTime = target.toFixed(3);
        };
        const tween = gsap.to(playhead, {
          progress: 1,
          ease: "none",
          onUpdate: update,
          scrollTrigger: {
            id: "elmora-walkthrough",
            trigger: element,
            pin: true,
            start: () =>
              `top top+=${document.querySelector("header")?.getBoundingClientRect().height ?? 94}`,
            end: () => `+=${Math.max(5600, window.innerHeight * 7)}`,
            scrub: 0.18,
            invalidateOnRefresh: true,
            anticipatePin: 1,
            onRefresh: update,
          },
        });
        const trigger = tween.scrollTrigger!;
        const visibility = () => {
          if (!document.hidden) update();
        };
        document.addEventListener("visibilitychange", visibility);
        cleanup = () => {
          document.removeEventListener("visibilitychange", visibility);
          if (frameRequest) surface.cancelVideoFrameCallback(frameRequest);
          trigger.kill(true);
          tween.kill();
        };
        setStatus("active");
        update();
        ScrollTrigger.refresh();
      })().catch(() => {
        if (!cancelled) cancel();
      });
    };
    configure();
    media.addEventListener("change", configure);
    connection?.addEventListener("change", configure);
    window.addEventListener("hashchange", configure);
    return () => {
      disposed = true;
      cancel();
      media.removeEventListener("change", configure);
      connection?.removeEventListener("change", configure);
      window.removeEventListener("hashchange", configure);
      release.current = () => {};
    };
  }, [disabled]);

  const skip = () => {
    release.current();
    setDisabled(true);
    requestAnimationFrame(() => {
      const target = document.getElementById("collections");
      if (!target) return;
      target.setAttribute("tabindex", "-1");
      target.focus({ preventScroll: true });
      target.scrollIntoView({ behavior: "instant", block: "start" });
    });
  };

  return (
    <>
      <span id="home" className="home-anchor" aria-hidden="true" />
      <section
        id="walkthrough"
        ref={root}
        className="hero walkthrough-hero"
        data-walkthrough={status}
        aria-label="Elmora architectural walkthrough"
      >
        <Image
          src="/images/hero-colour.webp"
          alt="A sunlit home with a teal feature wall, orange arch and a painter bringing colour to life"
          fill
          preload
          sizes="100vw"
          className="hero-image"
        />
        <video
          ref={video}
          className="walkthrough-video"
          muted
          playsInline
          preload="auto"
          aria-hidden="true"
        />
        <div className="hero-shade" />
        <div className="hero-content">
          <p className="hero-eyebrow">Colours for a brighter tomorrow</p>
          <h1>
            Beautiful
            <br />
            Homes
            <br />
            <span className="hero-happier">Happier</span>{" "}
            <span className="hero-lives">Lives</span>
          </h1>
          <p className="hero-description">
            Premium decorative paints for modern Indian homes.
            <br className="desktop-break" /> Vibrant colours and spaces that
            feel truly yours.
          </p>
          <a className="button button-light" href="#visualiser">
            Explore Our Colours <Arrow />
          </a>
        </div>
        {status !== "static" && (
          <div className="walkthrough-controls">
            <span>
              {status === "loading"
                ? "Preparing your walkthrough…"
                : "Scroll to explore · Scroll back to revisit"}
            </span>
            <button type="button" onClick={skip}>
              Skip walkthrough <Arrow />
            </button>
          </div>
        )}
        <div className="hero-benefits" aria-label="Explore Elmora">
          {[
            [
              "M5 4h14v8c0 5-7 9-7 9s-7-4-7-9V4Zm3 8 3 3 5-6",
              "Decorative finishes",
              "A beautiful beginning",
            ],
            [
              "M12 2S4 11 4 16a8 8 0 0 0 16 0C20 11 12 2 12 2Z",
              "Beautiful colours",
              "For every mood",
            ],
            [
              "M20 3C7 2 2 9 5 17s15 4 15-14ZM5 20 16 9",
              "Inspired by you",
              "Spaces that feel like home",
            ],
            [
              "m2 11 10-9 10 9M5 9v13h5v-8h4v8h5V9",
              "For Indian homes",
              "Styles for every space",
            ],
          ].map(([path, title, detail]) => (
            <div className="hero-benefit" key={title}>
              <span className="benefit-icon">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.4"
                  aria-hidden="true"
                >
                  <path d={path} />
                </svg>
              </span>
              <span>
                <strong>{title}</strong>
                <small>{detail}</small>
              </span>
            </div>
          ))}
        </div>
        <div className="hero-foot">
          <span className="walkthrough-caption">
            {status === "active" ? (
              <>
                <span ref={sceneLabel}>Exterior</span>
                <span className="walkthrough-route" aria-hidden="true">
                  A home, in colour
                </span>
              </>
            ) : (
              "A world of colour. A home of your own."
            )}
          </span>
          <a href="#inspiration">
            Scroll to explore{" "}
            <svg
              width="16"
              height="21"
              viewBox="0 0 16 21"
              fill="none"
              aria-hidden="true"
            >
              <path d="M8 1v18m-6-6 6 6 6-6" stroke="currentColor" />
            </svg>
          </a>
        </div>
        <div className="walkthrough-progress" aria-hidden="true">
          <span ref={bar} />
        </div>
        <p className="sr-only">
          An optional scroll-controlled journey through the exterior, living
          room, painter at work, dining room, bedroom and final reveal. Use the
          section links or Skip walkthrough to continue directly to the page.
        </p>
      </section>
    </>
  );
}
