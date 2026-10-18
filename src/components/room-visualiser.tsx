"use client";

import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent,
} from "react";
import Image from "next/image";
import {
  paintColours,
  recolourWall,
  visualiserRooms,
  type RoomId,
} from "@/lib/paint-rendering";
import { Arrow, SectionTitle } from "./ui";

type Pixels = { source: ImageData; mask: ImageData; room: RoomId };
function loadImage(src: string, signal: AbortSignal) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new window.Image();
    const abort = () => {
      image.src = "";
      reject(new DOMException("Aborted", "AbortError"));
    };
    signal.addEventListener("abort", abort, { once: true });
    image.onload = () => {
      signal.removeEventListener("abort", abort);
      resolve(image);
    };
    image.onerror = () => {
      signal.removeEventListener("abort", abort);
      reject(new Error("Image unavailable"));
    };
    image.src = src;
  });
}
export function RoomVisualiser() {
  const [room, setRoom] = useState<RoomId>("living");
  const [colour, setColour] = useState(0);
  const [position, setPosition] = useState(50);
  const [near, setNear] = useState(false);
  const [status, setStatus] = useState<"loading" | "ready" | "error">(
    "loading",
  );
  const [retry, setRetry] = useState(0);
  const section = useRef<HTMLElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const pixels = useRef<Pixels | null>(null);
  const dragging = useRef<number | null>(null);
  const paint = paintColours[colour];
  const previewReady = status === "ready" && pixels.current?.room === room;
  const roomLabel = visualiserRooms.find((item) => item.id === room)!.label;

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setNear(true);
          observer.disconnect();
        }
      },
      { rootMargin: "400px" },
    );
    if (section.current) observer.observe(section.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!near) return;
    const abort = new AbortController();
    setStatus("loading");
    pixels.current = null;
    void Promise.all([
      loadImage(`/visualiser/${room}.webp`, abort.signal),
      loadImage(`/visualiser/${room}-mask.png`, abort.signal),
    ])
      .then(([image, mask]) => {
        if (abort.signal.aborted) return;
        const buffer = document.createElement("canvas");
        buffer.width = 1280;
        buffer.height = 720;
        const context = buffer.getContext("2d", { willReadFrequently: true });
        if (!context) throw new Error("Canvas unavailable");
        context.drawImage(image, 0, 0, 1280, 720);
        const source = context.getImageData(0, 0, 1280, 720);
        context.clearRect(0, 0, 1280, 720);
        context.drawImage(mask, 0, 0, 1280, 720);
        pixels.current = {
          source,
          mask: context.getImageData(0, 0, 1280, 720),
          room,
        };
        setStatus("ready");
      })
      .catch(() => {
        if (!abort.signal.aborted) setStatus("error");
      });
    return () => abort.abort();
  }, [room, near, retry]);

  useEffect(() => {
    if (status !== "ready" || !pixels.current || pixels.current.room !== room)
      return;
    const context = canvas.current?.getContext("2d");
    if (!context) return;
    const result = recolourWall(
      pixels.current.source.data,
      pixels.current.mask.data,
      paint.hex,
      room,
    );
    context.putImageData(new ImageData(result, 1280, 720), 0, 0);
  }, [room, paint.hex, status]);

  function move(event: PointerEvent<HTMLDivElement>) {
    const bounds = event.currentTarget.getBoundingClientRect();
    setPosition(
      Math.round(
        Math.max(
          0,
          Math.min(100, ((event.clientX - bounds.left) / bounds.width) * 100),
        ),
      ),
    );
  }
  function reset() {
    setColour(0);
    setPosition(50);
  }

  return (
    <section
      ref={section}
      id="visualiser"
      className="section-shell visualiser-section"
    >
      <SectionTitle title="A new colour. Your kind of room.">
        <p>
          Try a shade. Move the divider.
          <br />
          See what a little colour can change.
        </p>
      </SectionTitle>
      <div className="colour-studio">
        <div className="studio-preview">
          <div className="studio-toolbar">
            <div
              className="room-options"
              role="group"
              aria-label="Choose a visualiser room"
            >
              {visualiserRooms.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  aria-pressed={room === item.id}
                  onClick={() => {
                    setRoom(item.id);
                    setPosition(50);
                  }}
                >
                  {item.label}
                </button>
              ))}
            </div>
            <button type="button" className="reset-view" onClick={reset}>
              Reset view
            </button>
          </div>
          <div
            className="comparison-stage"
            data-room={room}
            data-colour={paint.hex}
            data-ready={previewReady}
            style={{ "--comparison": `${position}%` } as CSSProperties}
            onPointerDown={(event) => {
              if (
                !previewReady ||
                (event.pointerType === "mouse" && event.button !== 0)
              )
                return;
              dragging.current = event.pointerId;
              event.currentTarget.setPointerCapture(event.pointerId);
              move(event);
            }}
            onPointerMove={(event) => {
              if (dragging.current === event.pointerId) move(event);
            }}
            onPointerUp={(event) => {
              if (dragging.current === event.pointerId) {
                dragging.current = null;
                event.currentTarget.releasePointerCapture(event.pointerId);
              }
            }}
            onPointerCancel={() => {
              dragging.current = null;
            }}
          >
            <Image
              key={room}
              src={`/visualiser/${room}.webp`}
              alt={`${roomLabel} before recolouring the feature wall`}
              fill
              sizes="(max-width: 800px) 100vw, 75vw"
              unoptimized
              className="comparison-original"
            />
            <canvas
              ref={canvas}
              width={1280}
              height={720}
              className="comparison-painted"
              role="img"
              aria-label={`${roomLabel} with ${paint.name} on the feature wall`}
              style={{ visibility: previewReady ? "visible" : "hidden" }}
            />
            {previewReady && (
              <>
                {position > 4 && (
                  <span className="comparison-label before-label">Before</span>
                )}
                {position < 96 && (
                  <span className="comparison-label after-label">
                    {paint.name}
                  </span>
                )}
                <div className="comparison-divider" aria-hidden="true">
                  <span>
                    <svg viewBox="0 0 28 20" width="28" height="20" fill="none">
                      <path
                        d="m9 5-5 5 5 5m10-10 5 5-5 5M14 3v14"
                        stroke="currentColor"
                        strokeWidth="1.5"
                      />
                    </svg>
                  </span>
                </div>
              </>
            )}
            {status === "loading" && (
              <span className="studio-loading">Preparing your room…</span>
            )}
            {status === "error" && (
              <div className="studio-error" role="alert">
                <p>The colour preview could not load. Please try again.</p>
                <button
                  type="button"
                  onClick={() => setRetry((value) => value + 1)}
                >
                  Retry preview
                </button>
              </div>
            )}
          </div>
          <div className="comparison-tools">
            <button
              type="button"
              disabled={!previewReady}
              onClick={() => setPosition(100)}
            >
              View before
            </button>
            <label className="comparison-range">
              <span className="sr-only">Before and after comparison</span>
              <input
                type="range"
                min="0"
                max="100"
                value={position}
                disabled={!previewReady}
                aria-valuetext={`${position}% original wall, ${100 - position}% ${paint.name}`}
                onChange={(event) => setPosition(Number(event.target.value))}
              />
            </label>
            <button
              type="button"
              disabled={!previewReady}
              onClick={() => setPosition(0)}
            >
              View colour
            </button>
          </div>
          <p className="comparison-help">
            Drag across the room, or use the slider. Arrow keys work too.
          </p>
        </div>
        <aside className="studio-palette" aria-label="Paint colour choices">
          <h3>Make yourself at home.</h3>
          <p>Choose your colour inspiration.</p>
          <div
            className="paint-swatches"
            role="group"
            aria-label="Choose a wall colour"
          >
            {paintColours.map((item, index) => (
              <button
                type="button"
                className="paint-swatch"
                key={item.hex}
                aria-pressed={colour === index}
                onClick={() => {
                  setColour(index);
                  if (position >= 95) setPosition(50);
                }}
              >
                <span className="swatch-chip" style={{ background: item.hex }}>
                  {colour === index && (
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      aria-hidden="true"
                    >
                      <path
                        d="m5 12 4 4L19 6"
                        stroke={index === 5 ? "#fffaf0" : "#30392e"}
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                </span>
                <span>{item.name}</span>
              </button>
            ))}
          </div>
          <div className="selected-paint" aria-live="polite" aria-atomic="true">
            <h4>{paint.name}</h4>
            <p>{paint.note}</p>
            <span>{roomLabel} · Feature wall</span>
          </div>
          <a className="text-link" href="#contact">
            Let’s talk colour <Arrow diagonal />
          </a>
        </aside>
      </div>
      <p className="fine-print">
        Illustrative colours and names, not official Elmora shades. Lighting and
        screens affect appearance; confirm your choice with a physical sample.
        Only the feature wall is recoloured.
      </p>
      <noscript>
        <p>
          Colour selection requires JavaScript. You can still explore the
          supplied room images and collections.
        </p>
      </noscript>
    </section>
  );
}
