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
  ArrowRight,
  Instagram,
  Calendar,
  Users,
  Award,
  TrendingUp,
  Eye,
  ShoppingBag,
  BarChart3,
  Quote,
} from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

const stagger = {
  visible: { transition: { staggerChildren: 0.08 } },
};

export default function PremiumDemoPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [formData, setFormData] = useState({ name: "", email: "", phone: "", service: "", message: "" });
  const [activeTab, setActiveTab] = useState<"overview" | "visitors" | "products">("overview");

  return (
    <div className="min-h-screen bg-[#faf8f5] text-gray-900" style={{ fontFamily: "'Geist', sans-serif" }}>
      {/* Demo Banner */}
      <div className="bg-[#0f2645] text-white text-center py-2 px-4 text-sm">
        <span className="text-white/60">This is a demo of the</span>{" "}
        <span className="font-semibold text-[#c9a84c]">Premium Plan ($2,499)</span>{" "}
        <span className="text-white/60">—</span>{" "}
        <Link href="/tt-designs" className="text-[#c9a84c] hover:underline inline-flex items-center gap-1">
          <ArrowLeft className="w-3 h-3" /> Back to T&T Designs
        </Link>
      </div>

      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-sm">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#1a1a1a] flex items-center justify-center">
              <Scissors className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <span className="text-lg font-bold tracking-tight block leading-tight">Fresh Fade</span>
              <span className="text-[10px] uppercase tracking-[0.2em] text-gray-400">Barbershop & Grooming</span>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm">
            <a href="#home" className="text-gray-600 hover:text-gray-900 transition-colors">Home</a>
            <a href="#services" className="text-gray-600 hover:text-gray-900 transition-colors">Services</a>
            <a href="#team" className="text-gray-600 hover:text-gray-900 transition-colors">Our Team</a>
            <a href="#gallery" className="text-gray-600 hover:text-gray-900 transition-colors">Gallery</a>
            <a href="#blog" className="text-gray-600 hover:text-gray-900 transition-colors">Blog</a>
            <a href="#contact" className="text-gray-600 hover:text-gray-900 transition-colors">Contact</a>
            <a
              href="#contact"
              className="bg-[#1a1a1a] text-white px-5 py-2.5 rounded-full font-medium hover:bg-[#333] transition-colors inline-flex items-center gap-2"
            >
              <Calendar className="w-4 h-4" /> Book Now
            </a>
          </div>
          <button
            className="md:hidden text-gray-900"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-t border-gray-100 px-6 py-4 space-y-3">
            {["Home", "Services", "Our Team", "Gallery", "Blog", "Contact"].map((item) => (
              <a
                key={item}
                href={`#${item.toLowerCase().replace(" ", "")}`}
                className="block text-gray-600 hover:text-gray-900 transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                {item}
              </a>
            ))}
          </div>
        )}
      </nav>

      {/* Hero - Full width with overlay */}
      <section id="home" className="relative overflow-hidden">
        <div className="relative bg-gradient-to-br from-[#1a1a1a] via-[#2a2a2a] to-[#1a1a1a] text-white py-28 md:py-40">
          <div className="absolute inset-0">
            <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-amber-400/5 to-transparent" />
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-amber-400/10 rounded-full blur-[120px]" />
          </div>
          <div className="max-w-6xl mx-auto px-6 relative z-10">
            <motion.div
              initial="hidden"
              animate="visible"
              variants={stagger}
              className="max-w-2xl"
            >
              <motion.div
                variants={fadeUp}
                className="inline-flex items-center gap-2 bg-white/10 rounded-full px-4 py-1.5 text-sm mb-6 border border-white/10"
              >
                <Award className="w-4 h-4 text-amber-400" />
                <span className="text-white/70">Voted #1 Barbershop in Anytown — 3 Years Running</span>
              </motion.div>
              <motion.h1 variants={fadeUp} className="text-5xl md:text-7xl font-bold leading-[1.1] mb-6">
                Where Style
                <br />
                Meets <span className="text-amber-400">Precision</span>
              </motion.h1>
              <motion.p variants={fadeUp} className="text-lg text-white/60 mb-8 max-w-lg">
                Premium grooming experience with master barbers. Classic cuts, modern styles, and VIP treatment every visit.
              </motion.p>
              <motion.div variants={fadeUp} className="flex flex-wrap gap-4">
                <a
                  href="#contact"
                  className="bg-amber-400 text-black px-8 py-3.5 rounded-full font-semibold hover:bg-amber-300 transition-colors inline-flex items-center gap-2"
                >
                  <Calendar className="w-4 h-4" /> Book Appointment
                </a>
                <a
                  href="#services"
                  className="bg-white/10 backdrop-blur-sm text-white px-8 py-3.5 rounded-full font-medium hover:bg-white/20 transition-colors border border-white/10"
                >
                  View Services
                </a>
              </motion.div>
            </motion.div>

            {/* Stats */}
            <motion.div
              initial="hidden"
              animate="visible"
              variants={stagger}
              className="grid grid-cols-3 gap-8 max-w-md mt-16 pt-8 border-t border-white/10"
            >
              {[
                { value: "10+", label: "Years Experience" },
                { value: "5K+", label: "Happy Clients" },
                { value: "4.9", label: "Google Rating" },
              ].map((stat) => (
                <motion.div key={stat.label} variants={fadeUp}>
                  <p className="text-2xl md:text-3xl font-bold text-amber-400">{stat.value}</p>
                  <p className="text-white/40 text-xs uppercase tracking-wider">{stat.label}</p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* Services - Premium Layout */}
      <section id="services" className="py-20 md:py-28">
        <div className="max-w-6xl mx-auto px-6">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="text-center mb-16">
            <motion.p variants={fadeUp} className="text-amber-600 font-semibold text-sm uppercase tracking-widest mb-3">
              Services
            </motion.p>
            <motion.h2 variants={fadeUp} className="text-3xl md:text-4xl font-bold mb-4">
              Premium Grooming Services
            </motion.h2>
            <motion.p variants={fadeUp} className="text-gray-500 max-w-md mx-auto">
              Every service includes a hot towel finish, complimentary beverage, and our signature attention to detail.
            </motion.p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {[
              { name: "Classic Haircut", price: "$25", desc: "Precision cut with consultation, hot towel, and styling", popular: false },
              { name: "Signature Fade", price: "$35", desc: "Custom skin/taper fade with razor line-up", popular: true },
              { name: "Beard Sculpting", price: "$20", desc: "Full beard shaping, trim, and oil treatment", popular: false },
              { name: "Royal Shave", price: "$30", desc: "Traditional straight razor shave with warm lather", popular: false },
              { name: "The Full Experience", price: "$55", desc: "Haircut + beard + hot towel shave + facial", popular: true },
              { name: "Kids Cut (12 & under)", price: "$18", desc: "Patient, fun cuts for the little ones", popular: false },
            ].map((service) => (
              <motion.div
                key={service.name}
                variants={fadeUp}
                className={`relative bg-white rounded-2xl p-6 border hover:shadow-lg transition-all duration-300 ${
                  service.popular ? "border-amber-200 shadow-md" : "border-gray-100"
                }`}
              >
                {service.popular && (
                  <span className="absolute -top-2.5 right-4 bg-amber-400 text-black text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                    Popular
                  </span>
                )}
                <div className="flex justify-between items-start mb-3">
                  <h3 className="font-semibold text-lg">{service.name}</h3>
                  <span className="font-bold text-xl text-amber-600">{service.price}</span>
                </div>
                <p className="text-gray-500 text-sm leading-relaxed">{service.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Team Section (Premium Feature) */}
      <section id="team" className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="text-center mb-16">
            <motion.p variants={fadeUp} className="text-amber-600 font-semibold text-sm uppercase tracking-widest mb-3">
              Our Team
            </motion.p>
            <motion.h2 variants={fadeUp} className="text-3xl md:text-4xl font-bold mb-4">
              Meet the Barbers
            </motion.h2>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
            className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto"
          >
            {[
              { name: "Marcus Johnson", role: "Master Barber & Owner", years: "15 years", specialty: "Fades & Designs" },
              { name: "David Kim", role: "Senior Barber", years: "8 years", specialty: "Classic Cuts" },
              { name: "Andre Williams", role: "Barber & Stylist", years: "5 years", specialty: "Modern Styles" },
            ].map((barber) => (
              <motion.div key={barber.name} variants={fadeUp} className="text-center group">
                <div className="bg-gray-100 rounded-2xl aspect-[3/4] mb-4 flex items-center justify-center group-hover:shadow-lg transition-shadow duration-300 overflow-hidden relative">
                  <div className="text-gray-300">
                    <Users className="w-12 h-12 mx-auto mb-2" />
                    <p className="text-xs">Photo</p>
                  </div>
                </div>
                <h3 className="font-semibold text-lg">{barber.name}</h3>
                <p className="text-amber-600 text-sm font-medium">{barber.role}</p>
                <p className="text-gray-400 text-xs mt-1">{barber.years} · {barber.specialty}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Gallery - Premium Grid */}
      <section id="gallery" className="py-20">
        <div className="max-w-6xl mx-auto px-6">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="text-center mb-16">
            <motion.p variants={fadeUp} className="text-amber-600 font-semibold text-sm uppercase tracking-widest mb-3">
              Gallery
            </motion.p>
            <motion.h2 variants={fadeUp} className="text-3xl md:text-4xl font-bold mb-4">
              Our Latest Work
            </motion.h2>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
            className="grid grid-cols-2 md:grid-cols-4 gap-3"
          >
            {[...Array(8)].map((_, i) => (
              <motion.div
                key={i}
                variants={fadeUp}
                className={`relative bg-gray-100 rounded-xl overflow-hidden group cursor-pointer ${
                  i === 0 || i === 5 ? "md:col-span-2 md:row-span-2" : ""
                }`}
              >
                <div className={`${i === 0 || i === 5 ? "aspect-square" : "aspect-square"} flex items-center justify-center`}>
                  <div className="text-gray-300">
                    <Scissors className="w-8 h-8 mx-auto mb-1" />
                    <p className="text-xs">Photo {i + 1}</p>
                  </div>
                </div>
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-300 flex items-center justify-center">
                  <Instagram className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Testimonials (Premium Feature) */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="text-center mb-16">
            <motion.p variants={fadeUp} className="text-amber-600 font-semibold text-sm uppercase tracking-widest mb-3">
              Reviews
            </motion.p>
            <motion.h2 variants={fadeUp} className="text-3xl md:text-4xl font-bold mb-4">
              What Our Clients Say
            </motion.h2>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
            className="grid md:grid-cols-3 gap-6"
          >
            {[
              { name: "James R.", text: "Best barbershop in town. Marcus always knows exactly what I want. Been coming here for 5 years.", rating: 5 },
              { name: "Tyler M.", text: "The Full Experience package is worth every penny. Hot towel shave is incredible. Highly recommend.", rating: 5 },
              { name: "Chris P.", text: "Clean shop, skilled barbers, and always on time. My go-to spot for a fresh fade every two weeks.", rating: 5 },
            ].map((review) => (
              <motion.div
                key={review.name}
                variants={fadeUp}
                className="bg-[#faf8f5] rounded-2xl p-6 border border-gray-100"
              >
                <Quote className="w-8 h-8 text-amber-200 mb-4" />
                <p className="text-gray-600 mb-4 leading-relaxed">{review.text}</p>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-sm">{review.name}</p>
                    <div className="flex gap-0.5 mt-1">
                      {[...Array(review.rating)].map((_, i) => (
                        <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      ))}
                    </div>
                  </div>
                  <span className="text-xs text-gray-400">Google Review</span>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Blog Section (Premium Feature) */}
      <section id="blog" className="py-20">
        <div className="max-w-6xl mx-auto px-6">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
            <div>
              <motion.p variants={fadeUp} className="text-amber-600 font-semibold text-sm uppercase tracking-widest mb-3">
                Blog
              </motion.p>
              <motion.h2 variants={fadeUp} className="text-3xl md:text-4xl font-bold">
                Tips & Updates
              </motion.h2>
            </div>
            <motion.a variants={fadeUp} href="#" className="text-sm text-amber-600 hover:text-amber-700 font-medium inline-flex items-center gap-1">
              View All Posts <ArrowRight className="w-4 h-4" />
            </motion.a>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
            className="grid md:grid-cols-3 gap-6"
          >
            {[
              {
                title: "5 Tips to Maintain Your Fade Between Visits",
                excerpt: "Keep your cut looking fresh longer with these simple maintenance tips from our barbers.",
                date: "May 28, 2026",
                category: "Grooming Tips",
              },
              {
                title: "Summer Hair Trends for 2026",
                excerpt: "From textured crops to modern mullets — here are the styles our clients are asking for this season.",
                date: "May 15, 2026",
                category: "Trends",
              },
              {
                title: "Why a Good Barber Matters for Your Confidence",
                excerpt: "A great haircut does more than change your look — it changes how you carry yourself.",
                date: "May 3, 2026",
                category: "Lifestyle",
              },
            ].map((post) => (
              <motion.article
                key={post.title}
                variants={fadeUp}
                className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-lg transition-shadow duration-300 group cursor-pointer"
              >
                <div className="bg-gray-100 h-48 flex items-center justify-center">
                  <div className="text-gray-300">
                    <Scissors className="w-8 h-8 mx-auto mb-1" />
                    <p className="text-xs">Blog Image</p>
                  </div>
                </div>
                <div className="p-6">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                      {post.category}
                    </span>
                    <span className="text-xs text-gray-400">{post.date}</span>
                  </div>
                  <h3 className="font-semibold mb-2 group-hover:text-amber-600 transition-colors">{post.title}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">{post.excerpt}</p>
                </div>
              </motion.article>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Analytics Dashboard Preview (Premium Feature) */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="text-center mb-12">
            <motion.p variants={fadeUp} className="text-amber-600 font-semibold text-sm uppercase tracking-widest mb-3">
              Premium Feature
            </motion.p>
            <motion.h2 variants={fadeUp} className="text-3xl md:text-4xl font-bold mb-4">
              Analytics & Reporting
            </motion.h2>
            <motion.p variants={fadeUp} className="text-gray-500 max-w-md mx-auto">
              Track your website performance with a built-in analytics dashboard.
            </motion.p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            className="bg-[#faf8f5] rounded-2xl border border-gray-200 overflow-hidden max-w-4xl mx-auto shadow-lg"
          >
            {/* Dashboard Header */}
            <div className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <BarChart3 className="w-5 h-5 text-amber-600" />
                <span className="font-semibold">Dashboard</span>
              </div>
              <div className="flex gap-2">
                {(["overview", "visitors", "products"] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`text-xs px-3 py-1.5 rounded-lg font-medium capitalize transition-colors ${
                      activeTab === tab
                        ? "bg-[#1a1a1a] text-white"
                        : "text-gray-500 hover:bg-gray-100"
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            {/* Dashboard Content */}
            <div className="p-6">
              {/* Stats Row */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                {[
                  { label: "Total Visitors", value: "2,568", change: "+12.5%", icon: Eye },
                  { label: "Bookings", value: "312", change: "+8.3%", icon: ShoppingBag },
                  { label: "Conversion Rate", value: "12.1%", change: "+2.1%", icon: TrendingUp },
                ].map((stat) => (
                  <div key={stat.label} className="bg-white rounded-xl p-4 border border-gray-100">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-gray-400">{stat.label}</span>
                      <stat.icon className="w-4 h-4 text-gray-300" />
                    </div>
                    <p className="text-2xl font-bold">{stat.value}</p>
                    <span className="text-xs text-green-500 font-medium">{stat.change}</span>
                  </div>
                ))}
              </div>

              {/* Chart Placeholder */}
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-white rounded-xl p-4 border border-gray-100">
                  <p className="text-sm font-medium mb-4">Visitors Over Time</p>
                  <div className="h-32 flex items-end gap-1.5">
                    {[40, 65, 45, 70, 55, 80, 60, 90, 75, 95, 85, 100].map((h, i) => (
                      <div key={i} className="flex-1 bg-amber-100 rounded-t-sm relative group">
                        <div
                          className="absolute bottom-0 left-0 right-0 bg-amber-400 rounded-t-sm transition-all duration-500"
                          style={{ height: `${h}%` }}
                        />
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between mt-2 text-[10px] text-gray-400">
                    <span>Jan</span>
                    <span>Jun</span>
                    <span>Dec</span>
                  </div>
                </div>

                <div className="bg-white rounded-xl p-4 border border-gray-100">
                  <p className="text-sm font-medium mb-4">Top Services</p>
                  <div className="space-y-3">
                    {[
                      { name: "Signature Fade", count: 1248, pct: 100 },
                      { name: "The Full Experience", count: 842, pct: 67 },
                      { name: "Classic Haircut", count: 623, pct: 50 },
                      { name: "Royal Shave", count: 445, pct: 36 },
                    ].map((item) => (
                      <div key={item.name} className="flex items-center gap-3">
                        <span className="text-xs text-gray-500 w-32 truncate">{item.name}</span>
                        <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
                          <div className="bg-amber-400 h-full rounded-full" style={{ width: `${item.pct}%` }} />
                        </div>
                        <span className="text-xs font-medium text-gray-600 w-10 text-right">{item.count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Contact */}
      <section id="contact" className="py-20">
        <div className="max-w-6xl mx-auto px-6">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="text-center mb-16">
            <motion.p variants={fadeUp} className="text-amber-600 font-semibold text-sm uppercase tracking-widest mb-3">
              Contact
            </motion.p>
            <motion.h2 variants={fadeUp} className="text-3xl md:text-4xl font-bold mb-4">
              Book Your Appointment
            </motion.h2>
            <motion.p variants={fadeUp} className="text-gray-500 max-w-md mx-auto">
              Walk-ins welcome, or fill out the form to reserve your spot.
            </motion.p>
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
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-amber-400 focus:ring-1 focus:ring-amber-400 outline-none transition-colors bg-white"
                      placeholder="Your name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-amber-400 focus:ring-1 focus:ring-amber-400 outline-none transition-colors bg-white"
                      placeholder="(555) 000-0000"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-amber-400 focus:ring-1 focus:ring-amber-400 outline-none transition-colors bg-white"
                    placeholder="your@email.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Service</label>
                  <select
                    value={formData.service}
                    onChange={(e) => setFormData({ ...formData, service: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-amber-400 focus:ring-1 focus:ring-amber-400 outline-none transition-colors bg-white text-gray-500"
                  >
                    <option value="">Select a service</option>
                    <option>Classic Haircut - $25</option>
                    <option>Signature Fade - $35</option>
                    <option>Beard Sculpting - $20</option>
                    <option>Royal Shave - $30</option>
                    <option>The Full Experience - $55</option>
                    <option>Kids Cut - $18</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                  <textarea
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-amber-400 focus:ring-1 focus:ring-amber-400 outline-none transition-colors bg-white resize-none"
                    placeholder="Preferred date/time or special requests"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full bg-[#1a1a1a] text-white py-3.5 rounded-xl font-semibold hover:bg-[#333] transition-colors inline-flex items-center justify-center gap-2"
                >
                  <Calendar className="w-4 h-4" /> Request Appointment
                </button>
              </form>
            </motion.div>

            {/* Map + Info */}
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}>
              <div className="bg-gray-200 rounded-2xl h-64 flex items-center justify-center relative overflow-hidden mb-6">
                <div className="absolute inset-0 bg-gradient-to-br from-gray-200 to-gray-300" />
                <div className="relative text-center text-gray-400">
                  <MapPin className="w-10 h-10 mx-auto mb-2" />
                  <p className="font-medium text-sm">Google Maps</p>
                  <p className="text-xs">123 Main Street, Anytown, USA</p>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-6 border border-gray-100 space-y-4">
                <h3 className="font-semibold text-lg mb-4">Visit Us</h3>
                {[
                  { icon: MapPin, text: "123 Main Street, Anytown, USA" },
                  { icon: Phone, text: "(555) 123-4567" },
                  { icon: Mail, text: "info@freshfadebarbershop.com" },
                  { icon: Clock, text: "Mon-Fri: 9AM-8PM | Sat: 8AM-6PM | Sun: 10AM-4PM" },
                ].map((item) => (
                  <div key={item.text} className="flex items-start gap-3">
                    <item.icon className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-600">{item.text}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#1a1a1a] text-white py-12">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div className="md:col-span-2">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                  <Scissors className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <span className="text-lg font-bold block leading-tight">Fresh Fade</span>
                  <span className="text-[10px] uppercase tracking-[0.2em] text-white/40">Barbershop & Grooming</span>
                </div>
              </div>
              <p className="text-white/40 text-sm max-w-sm leading-relaxed">
                Premium grooming experience in the heart of Anytown. Where style meets precision, every visit.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-sm mb-4">Quick Links</h4>
              <div className="space-y-2 text-sm text-white/50">
                <a href="#services" className="block hover:text-white transition-colors">Services</a>
                <a href="#team" className="block hover:text-white transition-colors">Our Team</a>
                <a href="#gallery" className="block hover:text-white transition-colors">Gallery</a>
                <a href="#blog" className="block hover:text-white transition-colors">Blog</a>
              </div>
            </div>
            <div>
              <h4 className="font-semibold text-sm mb-4">Hours</h4>
              <div className="space-y-2 text-sm text-white/50">
                <p>Mon-Fri: 9AM - 8PM</p>
                <p>Saturday: 8AM - 6PM</p>
                <p>Sunday: 10AM - 4PM</p>
              </div>
            </div>
          </div>
          <div className="border-t border-white/10 pt-6 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-white/30 text-sm">&copy; 2026 Fresh Fade Barbershop. All rights reserved.</p>
            <div className="flex gap-4">
              <a href="#" className="text-white/30 hover:text-white transition-colors">
                <Instagram className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>
      </footer>

      {/* Demo Footer */}
      <div className="bg-[#0f2645] text-center py-4 px-4">
        <p className="text-white/60 text-sm">
          This is a <span className="text-[#c9a84c] font-medium">Premium Plan</span> demo by T&T Designs —{" "}
          <Link href="/tt-designs/demo/basic" className="text-white/80 hover:underline inline-flex items-center gap-1">
            See Basic Demo <ChevronRight className="w-3 h-3" />
          </Link>
        </p>
      </div>
    </div>
  );
}
