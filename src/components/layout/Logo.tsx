import Image from "next/image";
import Link from "next/link";
import type { ImageAsset } from "@/content/types";

type LogoProps = {
  logo: ImageAsset;
  name: string;
  /** "light" for white backgrounds, "dark" for black. */
  tone?: "light" | "dark";
  className?: string;
};

/**
 * The brand mark, shown whole at its own proportions (no cropping or
 * stretching). `size` is the height; the width follows the file.
 */
export function LogoMark({ logo, size = 40 }: { logo: ImageAsset; size?: number }) {
  if (!logo.src) return null;
  const w = logo.width || 604;
  const h = logo.height || 576;
  return (
    <Image
      src={logo.src}
      alt=""
      width={w}
      height={h}
      sizes={`${Math.round((size * w) / h) * 2}px`}
      loading="eager"
      className="block shrink-0 object-contain"
      style={{ height: size, width: "auto" }}
    />
  );
}

export function Logo({ logo, name, tone = "light", className = "" }: LogoProps) {
  return (
    <Link
      href="/"
      className={`group inline-flex items-center gap-2.5 ${className}`}
      aria-label={`${name} home`}
    >
      <LogoMark logo={logo} />
      <span
        className={`font-serif text-xl leading-none font-semibold tracking-tight ${
          tone === "dark" ? "text-paper" : "text-ink"
        }`}
      >
        {name}
      </span>
    </Link>
  );
}
