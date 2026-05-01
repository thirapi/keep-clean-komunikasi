"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";

export const AnimatedUsername = ({ username }: { username: string }) => {
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

  const [displayedText, setDisplayedText] = useState(username); // ✅ SSR safe

  useEffect(() => {
    let iteration = 0;

    const interval = setInterval(() => {
      setDisplayedText(
        username
          .split("")
          .map((char, index) => {
            if (index < iteration) return username[index];
            return characters[Math.floor(Math.random() * characters.length)];
          })
          .join(""),
      );

      if (iteration >= username.length) {
        clearInterval(interval);
      }

      iteration += 1 / 3;
    }, 50);

    return () => clearInterval(interval);
  }, [username]);

  return (
    <motion.span
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="
        font-bold 
        bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 
        bg-[length:200%_200%] 
        animate-gradient-x 
        bg-clip-text text-transparent
        "
    >
      @{displayedText}
    </motion.span>
  );
};
