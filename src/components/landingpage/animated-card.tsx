"use client";

import type React from "react";

import { forwardRef } from "react";
import { Card } from "@/components/ui/card";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface AnimatedCardProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
  children: React.ReactNode;
}

const MotionCard = motion(Card);

export const AnimatedCard = forwardRef<HTMLDivElement, AnimatedCardProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <motion.div
        ref={ref}
        whileHover={{
          y: -5,
          boxShadow: "0 10px 30px -15px rgba(0, 0, 0, 0.2)",
        }}
        transition={{ duration: 0.2 }}
      >
        <Card className={cn(className)} {...props}>
          {children}
        </Card>
      </motion.div>
    );
  }
);

AnimatedCard.displayName = "AnimatedCard";
