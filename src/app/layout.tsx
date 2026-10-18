import type { Metadata } from "next";
import "@fontsource/cormorant-garamond/400.css";
import "@fontsource/manrope/400.css";
import "@fontsource/manrope/600.css";
import "@fontsource/manrope/800.css";
import "./globals.css";
import "./brand-refresh.css";
export const metadata: Metadata = {
  title: "Elmora Paints | Beautiful Homes, Happier Lives",
  description:
    "Explore a considered world of colour, decorative finishes and spaces with Elmora Paints.",
};
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en-IN">
      <body>{children}</body>
    </html>
  );
}
