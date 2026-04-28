"use client";

import React, { useEffect, useRef } from "react";
import { useTheme } from "next-themes";

export const GravityBackground = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: 0, y: 0 });
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let time = 0;
    const isDark = resolvedTheme === "dark";

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    window.addEventListener("resize", resize);
    resize();

    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current = {
        x: e.clientX,
        y: e.clientY,
      };
    };

    window.addEventListener("mousemove", handleMouseMove);

    // Configuration for the "Google Antigravity" style ring particles
    const config = {
      innerRadius: 150,
      thickness: 180,
      numParticles: 120,
      numRows: 40,
      particleSize: 1.2,
      w1Freq: 4,
      w1Speed: 0.002,
      w2Freq: 7,
      w2Speed: 0.001,
      amplitude: 15,
      primaryColor: isDark ? "rgba(59, 130, 246, 0.4)" : "rgba(37, 99, 235, 0.3)",
      secondaryColor: isDark ? "rgba(139, 92, 246, 0.2)" : "rgba(124, 58, 237, 0.15)",
    };

    const drawLine = (x1: number, y1: number, x2: number, y2: number, alpha: number) => {
       ctx.beginPath();
       ctx.strokeStyle = `rgba(59, 130, 246, ${alpha * 0.1})`;
       ctx.moveTo(x1, y1);
       ctx.lineTo(x2, y2);
       ctx.stroke();
    };

    const render = () => {
      time += 0.01;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Background Gradient
      const bgGradient = ctx.createRadialGradient(
        canvas.width / 2, canvas.height / 2, 0,
        canvas.width / 2, canvas.height / 2, canvas.width
      );
      
      if (isDark) {
        bgGradient.addColorStop(0, "#030712"); // gray-950
        bgGradient.addColorStop(1, "#000000");
      } else {
        bgGradient.addColorStop(0, "#ffffff");
        bgGradient.addColorStop(1, "#f8fafc"); // slate-50
      }
      
      ctx.fillStyle = bgGradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Grid effect
      ctx.beginPath();
      ctx.strokeStyle = isDark ? "rgba(255, 255, 255, 0.03)" : "rgba(0, 0, 0, 0.03)";
      ctx.lineWidth = 1;
      const gridSize = 100;
      for (let x = 0; x < canvas.width; x += gridSize) {
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
      }
      for (let y = 0; y < canvas.height; y += gridSize) {
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
      }
      ctx.stroke();

      const cx = canvas.width / 2;
      const cy = canvas.height / 2;

      // Mouse influence
      const targetX = cx + (mouseRef.current.x - cx) * 0.05;
      const targetY = cy + (mouseRef.current.y - cy) * 0.05;

      for (let r = 0; r < config.numRows; r++) {
        const rowProgress = r / config.numRows;
        const currentBaseRadius = config.innerRadius + rowProgress * config.thickness;
        
        ctx.fillStyle = r % 2 === 0 ? config.primaryColor : config.secondaryColor;

        for (let i = 0; i < config.numParticles; i++) {
          const angle = (i / config.numParticles) * Math.PI * 2;

          // Wave Physics (simplified from Bramus's Houdini script)
          const w1 = Math.sin(angle * config.w1Freq + time * 1.5);
          const w2 = Math.sin(angle * config.w2Freq - time * 0.8);
          const rowOffset = Math.sin(r * 0.5 + time);
          const waveHeight = w1 + w2 + rowOffset;

          const distortion = waveHeight * config.amplitude;
          const finalRadius = currentBaseRadius + distortion;

          const x = targetX + Math.cos(angle) * finalRadius;
          const y = targetY + Math.sin(angle) * finalRadius;

          // Opacity based on wave height (depth effect)
          const alpha = Math.max(0.1, (waveHeight + 3) / 6);
          
          ctx.globalAlpha = alpha * (1 - rowProgress * 0.5);
          ctx.beginPath();
          ctx.arc(x, y, config.particleSize * alpha, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      ctx.globalAlpha = 1;
      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", handleMouseMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, [resolvedTheme]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 -z-50 pointer-events-none"
    />
  );
};
