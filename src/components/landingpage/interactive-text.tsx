"use client";

import React, { useRef, useState, useEffect } from "react";
import {
  motion,
  useSpring,
  useMotionValue,
  useTransform,
  AnimatePresence,
} from "framer-motion";
import { cn } from "@/lib/utils";
import { useTheme } from "next-themes";

interface InteractiveTextProps {
  text: string;
  className?: string;
}

export function InteractiveText({ text, className }: InteractiveTextProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { theme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch by waiting for mount
  useEffect(() => {
    setMounted(true);
  }, []);

  // Mouse position relative to the container
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  // Spring configuration for smooth motion
  const springConfig = { damping: 20, stiffness: 150, mass: 0.5 };
  const springX = useSpring(mouseX, springConfig);
  const springY = useSpring(mouseY, springConfig);

  // Parallax effects for different layers
  // Layer 1 (Main text) - moves slightly
  const textX = useTransform(springX, (v) => v * 0.05);
  const textY = useTransform(springY, (v) => v * 0.05);

  // Layer 2 (Inner shadow/glow effect) - moves more
  const glowX = useTransform(springX, (v) => v * 0.1);
  const glowY = useTransform(springY, (v) => v * 0.1);

  // Layer 3 (Secondary shadow)
  const secondaryX = useTransform(springX, (v) => v * -0.02);
  const secondaryY = useTransform(springY, (v) => v * -0.02);

  // Layer 4 (Reflection)
  const reflectionX = useTransform(springX, (v) => v * 0.03);
  const reflectionY = useTransform(springY, (v) => v * 0.03 + 20);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - (rect.left + rect.width / 2);
    const y = e.clientY - (rect.top + rect.height / 2);
    mouseX.set(x);
    mouseY.set(y);
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

  if (!mounted) {
    return (
      <div
        className={cn(
          "relative cursor-default py-10 px-20 select-none",
          className,
        )}
      >
        <h1 className="text-5xl sm:text-8xl font-black tracking-tighter font-[family-name:var(--font-doto)] text-foreground opacity-0">
          {text}
        </h1>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={cn(
        "relative cursor-default py-10 px-20 select-none group",
        className,
      )}
    >
      {/* Background Glow/Shadow Layer (Parallax) */}
      <motion.div
        aria-hidden="true"
        style={{
          x: glowX,
          y: glowY,
          opacity: 0,
        }}
        className="absolute inset-0 flex items-center justify-center filter blur-xl text-primary/30 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
      >
        <span className="text-5xl sm:text-8xl font-black tracking-tighter font-[family-name:var(--font-doto)]">
          {text}
        </span>
      </motion.div>

      {/* Secondary Shadow Layer (Parallax) */}
      <motion.div
        aria-hidden="true"
        style={{
          x: secondaryX,
          y: secondaryY,
        }}
        className="absolute inset-0 flex items-center justify-center text-foreground/5 pointer-events-none"
      >
        <span className="text-5xl sm:text-8xl font-black tracking-tighter font-[family-name:var(--font-doto)]">
          {text}
        </span>
      </motion.div>

      {/* Main Text Layer (Magnetic/Interactive) */}
      <motion.h1
        style={{
          x: textX,
          y: textY,
        }}
        className="relative text-5xl sm:text-8xl font-black tracking-tighter font-[family-name:var(--font-doto)] text-foreground z-10"
      >
        {text.split("").map((char, i) => (
          <motion.span
            key={`${i}-${resolvedTheme}`} // Force re-render on theme change to update colors correctly if needed
            whileHover={{
              scale: 1.2,
              color: "var(--primary)",
              y: -5,
              rotate: (Math.random() - 0.5) * 10,
            }}
            transition={{ type: "spring", stiffness: 400, damping: 10 }}
            className="inline-block"
          >
            {char === " " ? "\u00A0" : char}
          </motion.span>
        ))}
      </motion.h1>

      {/* Bottom Reflection Effect */}
      <motion.div
        aria-hidden="true"
        style={{
          x: reflectionX,
          y: reflectionY,
          opacity: 0.1,
          rotateX: 180,
          scaleY: 0.5,
          filter: "blur(2px)",
        }}
        className="absolute inset-0 flex items-center justify-center text-foreground/20 pointer-events-none"
      >
        <span className="text-5xl sm:text-8xl font-black tracking-tighter font-[family-name:var(--font-doto)]">
          {text}
        </span>
      </motion.div>
    </div>
  );
}
