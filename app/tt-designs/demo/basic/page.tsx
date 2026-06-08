"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Menu,
  X,
  Phone,
  MapPin,
  Clock,
  Mail,
  Scissors,
  Star,
  ChevronRight,
  ArrowLeft,
} from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

export default function BasicDemoPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [formData, setFormData] = useState({ name: "", email: "", phone: "", message: "" });

  return (
    <div className="min-h-screen bg-white text-gray-900" style={{ fontFamily: "'Geist', sans-serif" }}>
      {/* Demo Banner */}
      <div className="bg-[#0f2645] text-white text-center py-2 px-4 text-sm">
        <span className="text-white/60">This is a demo of the</span>{" "}
        <span className="font-semibold">Basic Plan ($999)</span>{" "}
        <span className="text-white/60">—</span>{" "}
        <Link href="/tt-designs" className="text-[#c9a84c] hover:underline inline-flex items-center gap-1">
          <ArrowLeft className="w-3 h-3" /> Back to T&T Designs
        </Link>
      </div>

      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-[#1a1a1a] text-white">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Scissors className="w-6 h-6 text-amber-400" />
            <span className="text-xl font-bold tracking-tight">Fresh Fade</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm">
            <a href="#home" className="text-white/80 hover:text-white transition-colors">Home</a>
            <a href="#services" className="text-white/80 hover:text-white transition-colors">Services</a>
            <a href="#about" className="text-white/80 hover:text-white transition-colors">About</a>
            <a href="#gallery" className="text-white/80 hover:text-white transition-colors">Gallery</a>
            <a href="#contact" className="text-white/80 hover:text-white transition-colors">Contact</a>
          </div>
          <button
            className="md:hidden text-white"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
        {mobileMenuOpen && (
          <div className="md:hidden bg-[#1a1a1a] border-t border-white/10 px-6 py-4 space-y-3">
            {["Home", "Services", "About", "Gallery", "Contact"].map((item) => (
              <a
                key={item}
                href={`#${item.toLowerCase()}`}
                className="block text-white/80 hover:text-white transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                {item}
              </a>
            ))}
          </div>
        )}
      </nav>

      {/* Hero */}
      <section id="home" className="relative bg-[#2c2c2c] text-white py-24 md:py-36">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 to-transparent" />
        </div>
        <div className="max-w-6xl mx-auto px-6 relative z-10">
          <motion.div initial="hidden" animate="visible" variants={fadeUp} className="max-w-xl">
            <h1 className="text-4xl md:text-5xl font-bold mb-4 leading-tight">
              Fresh Cuts.
              <br />
              <span className="text-amber-400">Clean Fades.</span>
            </h1>
            <p className="text-white/70 text-lg mb-8">
              Your neighborhood barbershop for precision cuts, hot towel shaves, and classic grooming. Walk-ins welcome.
            </p>
            <div className="flex flex-wrap gap-4">
              <a
                href="#contact"
                className="bg-amber-400 text-black px-6 py-3 rounded-lg font-semibold hover:bg-amber-300 transition-colors"
              >
                Book Now
              </a>
              <a
                href="#services"
                className="border border-white/30 px-6 py-3 rounded-lg font-medium hover:bg-white/10 transition-colors"
              >
                Our Services
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Info Bar */}
      <section className="bg-[#1a1a1a] text-white">
        <div className="max-w-6xl mx-auto px-6 py-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { icon: MapPin, text: "123 Main Street, Anytown, USA" },
            { icon: Clock, text: "Mon-Sat: 9AM - 7PM | Sun: Closed" },
            { icon: Phone, text: "(555) 123-4567" },
          ].map((item) => (
            <div key={item.text} className="flex items-center gap-3 justify-center md:justify-start">
              <item.icon className="w-5 h-5 text-amber-400 flex-shrink-0" />
              <span className="text-white/80 text-sm">{item.text}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Services */}
      <section id="services" className="py-20">
        <div className="max-w-6xl mx-auto px-6">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-3">Our Services</h2>
            <p className="text-gray-500 max-w-md mx-auto">Quality grooming services at honest prices.</p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {[
              { name: "Classic Haircut", price: "$25", desc: "Precision cut with hot towel finish" },
              { name: "Skin Fade", price: "$30", desc: "Clean fade with sharp line-up" },
              { name: "Beard Trim", price: "$15", desc: "Shape and trim with oil treatment" },
              { name: "Hot Towel Shave", price: "$20", desc: "Traditional straight razor shave" },
              { name: "Kids Cut (12 & under)", price: "$18", desc: "Gentle cuts for the little ones" },
              { name: "Cut + Beard Combo", price: "$40", desc: "Haircut and full beard grooming" },
            ].map((service) => (
              <motion.div
                key={service.name}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                className="bg-gray-50 rounded-xl p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold">{service.name}</h3>
                  <span className="font-bold text-amber-600">{service.price}</span>
                </div>
                <p className="text-gray-500 text-sm">{service.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* About */}
      <section id="about" className="py-20 bg-gray-50">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-12 items-center max-w-4xl mx-auto">
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}>
              <div className="bg-[#2c2c2c] rounded-xl aspect-square flex items-center justify-center">
                <div className="text-center text-white/40">
                  <Scissors className="w-16 h-16 mx-auto mb-3 text-amber-400/40" />
                  <p className="text-sm">Shop Photo</p>
                </div>
              </div>
            </motion.div>
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}>
              <h2 className="text-3xl font-bold mb-4">About Fresh Fade</h2>
              <p className="text-gray-600 mb-4 leading-relaxed">
                Fresh Fade Barbershop has been serving the community for over 10 years. Our team of skilled barbers is
                dedicated to providing top-notch grooming services in a welcoming, relaxed environment.
              </p>
              <p className="text-gray-600 mb-6 leading-relaxed">
                Whether you need a quick trim or a full grooming experience, we&apos;ve got you covered. Walk-ins are always
                welcome, or give us a call to schedule your appointment.
              </p>
              <div className="flex items-center gap-1 text-amber-400">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-amber-400" />
                ))}
                <span className="text-gray-500 text-sm ml-2">4.9/5 on Google (120+ reviews)</span>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Gallery */}
      <section id="gallery" className="py-20">
        <div className="max-w-6xl mx-auto px-6">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-3">Our Work</h2>
            <p className="text-gray-500">A few examples of our cuts and styles.</p>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-w-4xl mx-auto">
            {[...Array(6)].map((_, i) => (
              <motion.div
                key={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                className="bg-gray-100 rounded-lg aspect-square flex items-center justify-center"
              >
                <div className="text-center text-gray-300">
                  <Scissors className="w-8 h-8 mx-auto mb-1" />
                  <p className="text-xs">Photo {i + 1}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact */}
      <section id="contact" className="py-20 bg-gray-50">
        <div className="max-w-6xl mx-auto px-6">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-3">Get In Touch</h2>
            <p className="text-gray-500">Walk-ins welcome, or reach out to book your appointment.</p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Contact Form */}
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}>
              <form
                className="space-y-4"
                onSubmit={(e) => {
                  e.preventDefault();
                  alert("This is a demo — form submission is disabled.");
                }}
              >
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-amber-400 focus:ring-1 focus:ring-amber-400 outline-none transition-colors bg-white"
                    placeholder="Your name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-amber-400 focus:ring-1 focus:ring-amber-400 outline-none transition-colors bg-white"
                    placeholder="your@email.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-amber-400 focus:ring-1 focus:ring-amber-400 outline-none transition-colors bg-white"
                    placeholder="(555) 000-0000"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                  <textarea
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    rows={4}
                    className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-amber-400 focus:ring-1 focus:ring-amber-400 outline-none transition-colors bg-white resize-none"
                    placeholder="How can we help?"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full bg-[#1a1a1a] text-white py-3 rounded-lg font-semibold hover:bg-[#2a2a2a] transition-colors"
                >
                  Send Message
                </button>
              </form>
            </motion.div>

            {/* Map Placeholder */}
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}>
              <div className="bg-gray-200 rounded-xl h-64 md:h-full min-h-[280px] flex items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-gray-200 to-gray-300" />
                <div className="relative text-center text-gray-400">
                  <MapPin className="w-10 h-10 mx-auto mb-2" />
                  <p className="font-medium text-sm">Google Maps</p>
                  <p className="text-xs">123 Main Street, Anytown, USA</p>
                </div>
              </div>
              <div className="mt-4 space-y-3">
                <div className="flex items-center gap-3">
                  <Phone className="w-4 h-4 text-amber-600" />
                  <span className="text-sm text-gray-600">(555) 123-4567</span>
                </div>
                <div className="flex items-center gap-3">
                  <Mail className="w-4 h-4 text-amber-600" />
                  <span className="text-sm text-gray-600">info@freshfadebarbershop.com</span>
                </div>
                <div className="flex items-center gap-3">
                  <Clock className="w-4 h-4 text-amber-600" />
                  <span className="text-sm text-gray-600">Mon-Sat: 9AM - 7PM</span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#1a1a1a] text-white py-8">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Scissors className="w-5 h-5 text-amber-400" />
              <span className="font-bold">Fresh Fade Barbershop</span>
            </div>
            <div className="flex items-center gap-6 text-sm text-white/50">
              <a href="#home" className="hover:text-white transition-colors">Home</a>
              <a href="#services" className="hover:text-white transition-colors">Services</a>
              <a href="#about" className="hover:text-white transition-colors">About</a>
              <a href="#contact" className="hover:text-white transition-colors">Contact</a>
            </div>
            <p className="text-white/30 text-sm">&copy; 2026 Fresh Fade Barbershop</p>
          </div>
        </div>
      </footer>

      {/* Demo Footer */}
      <div className="bg-[#0f2645] text-center py-4 px-4">
        <p className="text-white/60 text-sm">
          This is a <span className="text-white font-medium">Basic Plan</span> demo by T&T Designs —{" "}
          <Link href="/tt-designs/demo/premium" className="text-[#c9a84c] hover:underline inline-flex items-center gap-1">
            See Premium Demo <ChevronRight className="w-3 h-3" />
          </Link>
        </p>
      </div>
    </div>
  );
}
