"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { ArrowDown, Github, Linkedin, Mail } from "lucide-react";
import { features } from "../config/features";

export function Hero() {
  const handleSmoothScroll = (
    e: React.MouseEvent<HTMLAnchorElement>,
    href: string,
  ) => {
    e.preventDefault();

    const element = document.querySelector(href);
    if (element) {
      const offset = 80; // Account for fixed navigation height
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth",
      });
    }
  };

  return (
    <section className="min-h-screen flex items-center justify-center px-4 relative">
      <div className="max-w-6xl mx-auto">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
          >
            <motion.h1
              className="text-5xl md:text-6xl mb-6"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              Hi, I&apos;m <span className="text-red-500">Thieu Le</span>
            </motion.h1>

            <motion.p
              className="text-xl md:text-2xl text-muted-foreground mb-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              Software Engineer & Full Stack Developer
            </motion.p>

            <motion.p
              className="text-lg text-muted-foreground mb-10"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.6 }}
            >
              I am a software engineer that loves learning new technologies and
              building new projects to solve real-world problems.
            </motion.p>

            <motion.div
              className="flex gap-4 mb-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.8 }}
            >
              <motion.a
                href={features.showProjects ? "#projects" : "#resume"}
                className="px-8 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors cursor-pointer"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={(e) =>
                  handleSmoothScroll(
                    e,
                    features.showProjects ? "#projects" : "#resume",
                  )
                }
              >
                {features.showProjects ? "View My Work" : "View Resume"}
              </motion.a>
              <motion.a
                href="#contact"
                className="px-8 py-3 border-2 border-red-500 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-colors cursor-pointer"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={(e) => handleSmoothScroll(e, "#contact")}
              >
                Contact Me
              </motion.a>
            </motion.div>

            <motion.div
              className="flex gap-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 1 }}
            >
              <motion.a
                href="https://github.com/thieu-le"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-red-500 transition-colors"
                whileHover={{ scale: 1.2, rotate: 5 }}
              >
                <Github size={28} />
              </motion.a>
              <motion.a
                href="https://linkedin.com/thieu-le"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-red-500 transition-colors"
                whileHover={{ scale: 1.2, rotate: 5 }}
              >
                <Linkedin size={28} />
              </motion.a>
              <motion.a
                href="mailto:thieu.le0330@gmail.com"
                className="text-muted-foreground hover:text-red-500 transition-colors"
                whileHover={{ scale: 1.2, rotate: 5 }}
              >
                <Mail size={28} />
              </motion.a>
            </motion.div>
          </motion.div>

          <motion.div
            className="flex justify-center"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
          >
            <motion.div
              className="relative"
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.3 }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-red-500 to-orange-500 rounded-full blur-2xl opacity-20"></div>
              <Image
                src="/headshot.jpeg"
                alt="Profile"
                width={384}
                height={384}
                className="relative w-80 h-80 md:w-96 md:h-96 rounded-full object-cover border-4 border-red-500/30 shadow-2xl"
                priority
              />
            </motion.div>
          </motion.div>
        </div>
      </div>

      <motion.a
        href="#about"
        className="absolute bottom-8 left-1/2 transform -translate-x-1/2 cursor-pointer"
        onClick={(e) => {
          e.preventDefault();
          const element = document.querySelector("#about");
          if (element) {
            const offset = 80;
            const elementPosition = element.getBoundingClientRect().top;
            const offsetPosition =
              elementPosition + window.pageYOffset - offset;
            window.scrollTo({
              top: offsetPosition,
              behavior: "smooth",
            });
          }
        }}
      >
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <ArrowDown className="text-red-500" size={32} />
        </motion.div>
      </motion.a>
    </section>
  );
}
