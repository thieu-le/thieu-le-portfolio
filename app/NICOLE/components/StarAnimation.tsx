"use client";

import { motion } from "framer-motion";
import { Star } from "lucide-react";

interface StarAnimationProps {
  onComplete: () => void;
}

export function StarAnimation({ onComplete }: StarAnimationProps) {
  const stars = Array.from({ length: 12 }, (_, i) => i);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
      <div className="relative">
        {stars.map((star) => {
          const angle = (star * 360) / stars.length;
          const radius = 150;
          const x = Math.cos((angle * Math.PI) / 180) * radius;
          const y = Math.sin((angle * Math.PI) / 180) * radius;

          return (
            <motion.div
              key={star}
              className="absolute"
              initial={{ x: 0, y: 0, opacity: 0, scale: 0 }}
              animate={{
                x,
                y,
                opacity: [0, 1, 1, 0],
                scale: [0, 1.2, 1, 0],
                rotate: [0, 180, 360],
              }}
              transition={{
                duration: 2,
                delay: star * 0.1,
                ease: "easeOut",
              }}
              onAnimationComplete={() => {
                if (star === stars.length - 1) {
                  setTimeout(onComplete, 500);
                }
              }}
            >
              <Star
                className="text-yellow-400 fill-yellow-400"
                size={32}
              />
            </motion.div>
          );
        })}
        <motion.div
          className="text-center"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <motion.div
            className="text-4xl font-light text-[#388E3C]"
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 0.6, repeat: 2 }}
          >
            Good job!
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
