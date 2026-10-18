"use client";
import { useEffect, useState } from "react";
import { Arrow } from "./ui";
export function ContactForm() {
  const [message, setMessage] = useState("");
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);
  return (
    <form
      className="contact-form"
      method="post"
      onSubmit={(event) => {
        event.preventDefault();
        setMessage(
          "Your enquiry preview is ready. Nothing has been sent: Elmora’s contact service is not connected yet.",
        );
      }}
      onChange={() => setMessage("")}
    >
      <div className="form-row">
        <label>
          Your name
          <input
            name="name"
            autoComplete="name"
            placeholder="Full name"
            required
            maxLength={100}
          />
        </label>
        <label>
          Email address
          <input
            name="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            required
            maxLength={200}
          />
        </label>
      </div>
      <div className="form-row">
        <label>
          City
          <input
            name="city"
            autoComplete="address-level2"
            placeholder="Your city"
            required
            maxLength={100}
          />
        </label>
        <label>
          Your space
          <select name="space" defaultValue="">
            <option value="" disabled>
              Select a space (optional)
            </option>
            <option>Living room</option>
            <option>Dining room</option>
            <option>Bedroom</option>
            <option>Exterior</option>
            <option>Something else</option>
          </select>
        </label>
      </div>
      <label>
        What are you imagining?
        <textarea
          name="message"
          placeholder="Tell us about your space, favourite colours or plans…"
          rows={3}
          required
          maxLength={2000}
        />
      </label>
      <div className="form-bottom">
        <p>
          Preview form only.
          <br />
          No enquiry is sent or stored.
        </p>
        <button className="button button-dark" type="submit" disabled={!ready}>
          Preview enquiry <Arrow />
        </button>
      </div>
      <noscript>Enable JavaScript to preview an enquiry.</noscript>
      <p role="status" className="form-status">
        {message}
      </p>
    </form>
  );
}
