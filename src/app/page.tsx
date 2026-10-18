import { RoomVisualiser } from "@/components/room-visualiser";
import { PageMotion } from "@/components/page-motion";
import { WalkthroughHero } from "@/components/walkthrough-hero";
import Image from "next/image";
import { Header } from "@/components/header";
import { Arrow, SectionTitle, Wordmark } from "@/components/ui";
import { Gallery } from "@/components/gallery";
import { ContactForm } from "@/components/contact-form";
import { collections, navigation } from "@/lib/content";
export default function Home() {
  return (
    <>
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      <Header />
      <PageMotion />
      <main id="main">
        <WalkthroughHero />
        <div className="palette-ribbon" aria-hidden="true">
          <span />
          <span />
          <span />
          <span />
          <span />
        </div>
        <section className="intro section-shell">
          <p>
            More than a colour.
            <br />
            <span>A way to feel at home.</span>
          </p>
          <div>
            Some spaces calm us. Others bring us together.
            <br className="desktop-break" /> Explore colours and textures that
            make room for
            <br className="desktop-break" /> the way you want to live.
            <a className="text-link" href="#story">
              Meet Elmora <Arrow diagonal />
            </a>
          </div>
        </section>
        <section id="collections" className="collections-section section-shell">
          <SectionTitle title="Find your natural palette.">
            <p>
              Earth, light and all the shades between.
              <br />A starting point for your next space.
            </p>
          </SectionTitle>
          <div className="collections-grid">
            {collections.map((collection) => (
              <a
                className="collection"
                href="#contact"
                key={collection.name}
                aria-label={`Enquire about ${collection.name}`}
              >
                <div className="swatch-board">
                  <Image
                    src={collection.image}
                    alt={collection.imageAlt}
                    fill
                    sizes="(max-width: 760px) 100vw, (max-width: 1100px) 50vw, 33vw"
                    className="swatch-photo"
                  />
                  <span className="swatch-caption">Elmora.</span>
                  <span
                    className="swatch-mini"
                    style={{ background: collection.colours[0] }}
                  />
                </div>
                <div className="collection-title">
                  <h3>{collection.name}</h3>
                  <Arrow diagonal />
                </div>
                <p>{collection.description}</p>
                <span className="collection-finish">{collection.finish}</span>
                <div
                  className="collection-shades"
                  aria-label={`${collection.name} shades`}
                >
                  {collection.shades.map((shade) => (
                    <span className="collection-shade" key={shade.name}>
                      <i
                        style={{ background: shade.colour }}
                        aria-hidden="true"
                      />
                      <span>
                        <strong>{shade.name}</strong>
                        <small>{shade.colour}</small>
                      </span>
                    </span>
                  ))}
                </div>
              </a>
            ))}
          </div>
          <p className="fine-print">
            Concept shade names and screen colours are illustrative. Match with
            an approved physical shade card before painting.
          </p>
        </section>
        <RoomVisualiser />
        <Gallery />
        <section id="story" className="story-section">
          <div className="story-image">
            <Image
              src="/images/painter.webp"
              alt="Painter applying a decorative finish in the supplied Elmora image"
              fill
              sizes="(max-width: 800px) 100vw, 50vw"
            />
          </div>
          <div className="story-copy">
            <h2>
              Every wall.
              <br />A little more you.
            </h2>
            <p>
              A favourite corner. A room full of conversation. The quiet comfort
              of coming home.
            </p>
            <p>
              Our vision for Elmora is simple: colour should feel personal. A
              considered palette, a beautiful finish and a space that feels like
              it belongs to you.
            </p>
            <a className="text-link" href="#contact">
              Let’s imagine your space <Arrow diagonal />
            </a>
            <p className="story-note">
              Draft brand story — awaiting the official Elmora story.
            </p>
          </div>
        </section>
        <section id="contact" className="contact-section section-shell">
          <div className="contact-copy">
            <h2>
              Your next chapter
              <br />
              starts with colour.
            </h2>
            <p>
              Have a space in mind?
              <br />
              Let’s give it a little character.
            </p>
            <div className="contact-details">
              <span>Contact details coming soon</span>
              <p>
                Official email, phone and studio address
                <br />
                to be provided by Elmora.
              </p>
            </div>
          </div>
          <ContactForm />
        </section>
      </main>
      <footer className="site-footer">
        <div className="footer-top">
          <div>
            <Wordmark />
            <p>Colour, with a sense of belonging.</p>
          </div>
          <nav aria-label="Footer navigation">
            {navigation.map((item) => (
              <a key={item.href} href={item.href}>
                {item.label}
              </a>
            ))}
          </nav>
          <a className="back-top" href="#home">
            Back to top{" "}
            <span>
              <Arrow diagonal />
            </span>
          </a>
        </div>
        <div className="footer-bottom">
          <p>© {new Date().getFullYear()} Elmora Paints</p>
          <p>Website foundation · Content pending brand approval</p>
        </div>
      </footer>
    </>
  );
}
