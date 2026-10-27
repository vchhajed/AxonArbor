import type { Metadata, Viewport } from "next";
import { Gelasio, Inter, Montserrat } from "next/font/google";
import { siteUrl } from "@/content/site";
import { getContent } from "@/lib/content";
import "./globals.css";

// Only the faces used above the fold on every page are preloaded.
const gelasio = Gelasio({
  variable: "--font-gelasio",
  subsets: ["latin"],
  display: "swap",
});

const gelasioItalic = Gelasio({
  variable: "--font-gelasio-italic",
  subsets: ["latin"],
  style: "italic",
  display: "swap",
  preload: false,
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
  display: "swap",
  preload: false,
});

export async function generateMetadata(): Promise<Metadata> {
  const site = await getContent("site");
  const title = `${site.name} | ${site.tagline}`;
  return {
    metadataBase: new URL(siteUrl),
    title: { default: title, template: `%s | ${site.name}` },
    description: site.description,
    applicationName: site.name,
    openGraph: {
      type: "website",
      locale: "en_GB",
      siteName: site.name,
      url: "/",
      title,
      description: site.description,
    },
    twitter: { card: "summary_large_image", title, description: site.description },
    alternates: { canonical: "/" },
  };
}

export const viewport: Viewport = {
  themeColor: "#000000",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      data-scroll-behavior="smooth"
      lang="en-GB"
      className={`${gelasio.variable} ${gelasioItalic.variable} ${inter.variable} ${montserrat.variable} antialiased`}
    >
      <body className="flex min-h-dvh flex-col">{children}</body>
    </html>
  );
}
