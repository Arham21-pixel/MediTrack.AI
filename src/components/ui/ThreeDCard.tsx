import React, { useRef } from "react";
import { motion, useMotionValue, useTransform } from "framer-motion";

interface ThreeDCardProps {
  children: React.ReactNode;
  className?: string;
}

export const ThreeDCard: React.FC<ThreeDCardProps> = ({ children, className }) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0.5);
  const y = useMotionValue(0.5);
  const rotateX = useTransform(y, [0, 1], [10, -10]);
  const rotateY = useTransform(x, [0, 1], [-10, 10]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = cardRef.current?.getBoundingClientRect();
    if (!rect) return;
    const px = (e.clientX - rect.left) / rect.width;
    const py = (e.clientY - rect.top) / rect.height;
    x.set(px);
    y.set(py);
  };

  const handleMouseLeave = () => {
    x.set(0.5);
    y.set(0.5);
  };

  return (
    <motion.div
      ref={cardRef}
      className={className}
      style={{
        perspective: 1000,
        willChange: "transform",
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <motion.div
        style={{
          rotateX,
          rotateY,
          transition: "transform 0.2s",
        }}
      >
        {children}
      </motion.div>
    </motion.div>
  );
};
