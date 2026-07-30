"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";

export default function CustomCursor() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);
  const [isPointerDevice, setIsPointerDevice] = useState(false);

  useEffect(() => {
    // Only enable custom cursor if the device has a fine pointer (mouse)
    const mediaQuery = window.matchMedia("(pointer: fine)");
    setIsPointerDevice(mediaQuery.matches);

    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({
        x: e.clientX,
        y: e.clientY
      });
    };

    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.tagName.toLowerCase() === 'button' ||
        target.tagName.toLowerCase() === 'a' ||
        target.closest('button') ||
        target.closest('a') ||
        target.classList.contains('rating-button') ||
        window.getComputedStyle(target).cursor === 'pointer'
      ) {
        setIsHovering(true);
      } else {
        setIsHovering(false);
      }
    };

    if (mediaQuery.matches) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseover", handleMouseOver);
    }

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseover", handleMouseOver);
    };
  }, []);

  if (!isPointerDevice) return null;

  return (
    <>
      <style>{`
        * {
          cursor: none !important;
        }
      `}</style>
      <motion.div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: 32,
          height: 32,
          borderRadius: "50%",
          border: "2px solid var(--accent-primary)",
          pointerEvents: "none",
          zIndex: 9999,
          mixBlendMode: "screen",
          boxShadow: "0 0 10px var(--accent-primary), inset 0 0 10px var(--accent-primary)"
        }}
        animate={{
          x: mousePosition.x - 16,
          y: mousePosition.y - 16,
          scale: isHovering ? 1.5 : 1,
          backgroundColor: isHovering ? "rgba(168, 85, 247, 0.2)" : "transparent",
        }}
        transition={{
          type: "spring",
          stiffness: 1500,
          damping: 40,
          mass: 0.1
        }}
      />
      <motion.div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: 8,
          height: 8,
          borderRadius: "50%",
          backgroundColor: "#fff",
          pointerEvents: "none",
          zIndex: 10000,
          boxShadow: "0 0 10px #fff"
        }}
        animate={{
          x: mousePosition.x - 4,
          y: mousePosition.y - 4,
        }}
        transition={{
          type: "tween",
          ease: "backOut",
          duration: 0.05
        }}
      />
    </>
  );
}
