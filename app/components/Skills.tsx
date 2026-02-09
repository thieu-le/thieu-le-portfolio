"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";

export function Skills() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  const skillCategories = [
    {
      title: "Frontend",
      skills: ["React", "React Native", "TypeScript", "JavaScript", "Expo", "HTML/CSS", "Tailwind CSS"]
    },
    {
      title: "Backend",
      skills: ["PHP", "Python", "Django", "MySQL", "SQL", "Supabase", "REST API"]
    },
    {
      title: "Languages & Tools",
      skills: ["C++", "C#", "Git", "Jest", "Selenium", "Unreal Engine", "Unity", "MATLAB"]
    }
  ];

  return (
    <section id="skills" className="py-20 px-4" ref={ref}>
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-4xl md:text-5xl text-center mb-4">
            My <span className="text-red-500">Skills</span>
          </h2>
          <div className="w-20 h-1 bg-red-500 mx-auto mb-12"></div>

          <div className="grid md:grid-cols-2 gap-8">
            {skillCategories.map((category, categoryIndex) => (
              <motion.div
                key={categoryIndex}
                className="bg-card p-8 rounded-xl border border-border"
                initial={{ opacity: 0, y: 50 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6, delay: categoryIndex * 0.1 }}
                whileHover={{ y: -5 }}
              >
                <h3 className="text-2xl mb-6 text-red-500">{category.title}</h3>
                <div className="flex flex-wrap gap-3">
                  {category.skills.map((skill, skillIndex) => (
                    <motion.span
                      key={skillIndex}
                      className="px-4 py-2 bg-red-500/10 text-foreground rounded-lg border border-red-500/30 hover:bg-red-500/20 transition-colors"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={isInView ? { opacity: 1, scale: 1 } : {}}
                      transition={{ duration: 0.3, delay: categoryIndex * 0.1 + skillIndex * 0.05 }}
                      whileHover={{ scale: 1.05 }}
                    >
                      {skill}
                    </motion.span>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
