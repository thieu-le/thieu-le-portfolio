"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { Code2, Rocket, Users } from "lucide-react";

export function About() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  const features = [
    {
      icon: <Code2 size={32} />,
      title: "Clean Code",
      description: "Writing maintainable, scalable code following best practices"
    },
    {
      icon: <Rocket size={32} />,
      title: "Fast Delivery",
      description: "Efficient development process with timely project completion"
    },
    {
      icon: <Users size={32} />,
      title: "Collaboration",
      description: "Strong team player with excellent communication skills"
    }
  ];

  return (
    <section id="about" className="py-20 px-4 bg-secondary/50" ref={ref}>
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-4xl md:text-5xl text-center mb-4">
            About <span className="text-red-500">Me</span>
          </h2>
          <div className="w-20 h-1 bg-red-500 mx-auto mb-12"></div>

          <motion.p
            className="text-lg text-muted-foreground max-w-3xl mx-auto text-center mb-16"
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 1 } : {}}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            I'm a passionate software engineer with expertise in building modern web applications.
            With a strong foundation in both frontend and backend technologies, I love turning ideas
            into reality through elegant code and intuitive user experiences.
          </motion.p>

          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                className="bg-card p-8 rounded-xl shadow-lg hover:shadow-xl transition-shadow border border-border"
                initial={{ opacity: 0, y: 50 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6, delay: 0.2 + index * 0.1 }}
                whileHover={{ y: -10 }}
              >
                <div className="text-red-500 mb-4">{feature.icon}</div>
                <h3 className="text-xl mb-3">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
