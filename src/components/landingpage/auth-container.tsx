"use client";

import { useState } from "react";
import { SignInForm } from "@/app/signin/sign-in-form";
import { SignUpForm } from "@/app/signup/sign-up-form";
import { AnimatePresence, motion } from "framer-motion";

export function AuthContainer() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");

  return (
    <div className="w-full max-w-md">
      <AnimatePresence mode="wait">
        {mode === "signin" ? (
          <motion.div
            key="signin"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            <SignInForm onToggleMode={() => setMode("signup")} isEmbedded />
          </motion.div>
        ) : (
          <motion.div
            key="signup"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            <SignUpForm onToggleMode={() => setMode("signin")} isEmbedded />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
