import * as React from "react";
import Image from "next/image";

/**
 * The Komunikasi mark.
 *
 * Two transparent PNGs exist, one per theme: a near-black mark for light
 * surfaces and a near-white one for dark surfaces. They are swapped with a
 * `dark:` variant rather than by reading the theme in JS, because next-themes
 * puts the theme on <html> and branching on it during render either flashes the
 * wrong logo or causes a hydration mismatch.
 *
 * The source files are ~200-400 KB, so next/image is doing real work here — at a
 * 32px render size it serves a couple of KB instead. `sizes` is set because
 * without it the loader assumes the image fills the viewport and fetches a
 * needlessly large variant.
 */
const SRC = {
  /** Near-black mark: for light surfaces. */
  light: "/icons/logo-mark-black.png",
  /** Near-white mark: for dark surfaces. */
  dark: "/icons/logo-mark-white.png",
} as const;

/** Intrinsic size of the source PNG, so layout is reserved before it loads. */
const INTRINSIC = { width: 878, height: 1024 };

export type BrandLogoProps = Omit<
  React.ComponentProps<typeof Image>,
  "src" | "alt" | "width" | "height" | "sizes"
> & {
  /** Leave empty when the mark sits next to the wordmark, to avoid a repeat. */
  alt?: string;
  /** Rendered height in pixels; the width follows the mark's aspect ratio. */
  size?: number;
};

export function BrandLogo({
  alt = "",
  size = 32,
  className,
  ...rest
}: BrandLogoProps) {
  const width = Math.round((size * INTRINSIC.width) / INTRINSIC.height);

  return (
    <span
      className={`relative inline-block shrink-0 align-middle leading-none ${className ?? ""}`}
      style={{ width, height: size }}
    >
      <Image
        {...INTRINSIC}
        {...rest}
        alt={alt}
        src={SRC.light}
        sizes={`${width}px`}
        className="absolute inset-0 h-full w-full object-contain dark:hidden"
      />
      <Image
        {...INTRINSIC}
        {...rest}
        alt=""
        aria-hidden
        src={SRC.dark}
        sizes={`${width}px`}
        className="absolute inset-0 hidden h-full w-full object-contain dark:block"
      />
    </span>
  );
}

export default BrandLogo;
