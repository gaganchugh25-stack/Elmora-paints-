"use client";
import Image from "next/image";
import { useState } from "react";
import { rooms } from "@/lib/content";
import { Arrow, SectionTitle } from "./ui";
export function Gallery() {
  const [filter, setFilter] = useState("All spaces");
  const visible =
    filter === "All spaces"
      ? rooms
      : rooms.filter((room) => room.room === filter);
  return (
    <section id="inspiration" className="section-shell gallery-section">
      <SectionTitle title="See colour come home.">
        <p>
          A different mood in every room.
          <br />
          Find a little inspiration for yours.
        </p>
      </SectionTitle>
      <div
        className="gallery-filters"
        role="group"
        aria-label="Filter inspiration by room"
      >
        {["All spaces", ...rooms.map((room) => room.room)].map((label) => (
          <button
            key={label}
            aria-pressed={filter === label}
            onClick={() => setFilter(label)}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="gallery-grid" aria-live="polite">
        {visible.map((room) => (
          <a className="room-card" href={`#contact`} key={room.room}>
            <div className="room-image">
              <Image
                src={room.image}
                alt={room.alt}
                fill
                sizes="(max-width: 700px) 100vw, 50vw"
              />
              <span className="room-tag">
                <i style={{ background: room.colour }} />
                {room.room}
              </span>
            </div>
            <div className="room-caption">
              <h3>{room.name}</h3>
              <Arrow diagonal />
            </div>
          </a>
        ))}
      </div>
      <p className="fine-print">
        Supplied inspiration imagery. Colours shown on screen are indicative.
      </p>
    </section>
  );
}
