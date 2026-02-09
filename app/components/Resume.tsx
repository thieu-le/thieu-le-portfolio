"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { Download, FileText } from "lucide-react";

export function Resume() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  const handleDownload = () => {
    const link = document.createElement("a");
    link.href = "/resume.pdf";
    link.download = "Thieu_Le_Resume.pdf";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <section id="resume" className="py-20 px-4 bg-secondary/50" ref={ref}>
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-4xl md:text-5xl text-center mb-4">
            My <span className="text-red-500">Resume</span>
          </h2>
          <div className="w-20 h-1 bg-red-500 mx-auto mb-12"></div>

          <motion.div
            className="flex flex-col items-center gap-8"
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            {/* PDF Viewer */}
            <motion.div
              className="w-full max-w-4xl bg-card rounded-xl shadow-2xl border border-border overflow-hidden"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={isInView ? { opacity: 1, scale: 1 } : {}}
              transition={{ duration: 0.6, delay: 0.3 }}
              whileHover={{ scale: 1.02 }}
            >
              <iframe
                src="/resume.pdf"
                className="w-full h-[800px] md:h-[900px]"
                title="Resume PDF Viewer"
              />
            </motion.div>

            {/* Download Button */}
            <motion.button
              onClick={handleDownload}
              className="px-8 py-4 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors flex items-center gap-3 text-lg font-medium"
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.4 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Download size={24} />
              Download Resume
            </motion.button>

            {/* Alternative View Option */}
            <motion.div
              className="text-center"
              initial={{ opacity: 0 }}
              animate={isInView ? { opacity: 1 } : {}}
              transition={{ duration: 0.6, delay: 0.5 }}
            >
              <p className="text-muted-foreground mb-2">
                Having trouble viewing?{" "}
                <a
                  href="/resume.pdf"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-red-500 hover:text-red-400 transition-colors inline-flex items-center gap-1"
                >
                  <FileText size={16} />
                  Open in new tab
                </a>
              </p>
            </motion.div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
