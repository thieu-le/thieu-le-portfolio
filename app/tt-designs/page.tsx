"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Monitor,
  Smartphone,
  CheckCircle2,
  MapPin,
  Mail,
  BarChart3,
  Star,
  ArrowRight,
  Sparkles,
  Layout,
  Search,
  FileText,
  RefreshCw,
  Globe,
  ChevronDown,
} from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
};

const stagger = {
  visible: { transition: { staggerChildren: 0.1 } },
};

export default function TTDesignsPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-white text-gray-900" style={{ fontFamily: "'Geist', sans-serif" }}>
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#0f2645] flex items-center justify-center">
              <span className="text-[#c9a84c] font-bold text-sm">T&T</span>
            </div>
            <span className="text-xl font-semibold tracking-tight">
              <span className="text-[#0f2645]">T&T</span>{" "}
              <span className="text-gray-400 font-light">designs</span>
            </span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm">
            <a href="#pricing" className="text-gray-600 hover:text-[#0f2645] transition-colors">
              Pricing
            </a>
            <a href="#features" className="text-gray-600 hover:text-[#0f2645] transition-colors">
              Features
            </a>
            <a href="#demos" className="text-gray-600 hover:text-[#0f2645] transition-colors">
              Examples
            </a>
            <a href="#faq" className="text-gray-600 hover:text-[#0f2645] transition-colors">
              FAQ
            </a>
            <a
              href="#cta"
              className="bg-[#0f2645] text-white px-5 py-2.5 rounded-lg hover:bg-[#1a3a6a] transition-colors font-medium"
            >
              Get Started
            </a>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#0a1c38] via-[#0f2645] to-[#162d50] text-white">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 w-72 h-72 bg-[#c9a84c] rounded-full blur-[120px]" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-blue-400 rounded-full blur-[150px]" />
        </div>
        <div className="max-w-6xl mx-auto px-6 py-20 md:py-32 relative z-10">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={stagger}
            className="max-w-2xl"
          >
            <motion.div variants={fadeUp} className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-1.5 text-sm mb-6 border border-white/10">
              <Sparkles className="w-4 h-4 text-[#c9a84c]" />
              <span className="text-white/80">Professional websites for small businesses</span>
            </motion.div>
            <motion.h1 variants={fadeUp} className="text-4xl md:text-6xl font-bold leading-tight mb-6">
              Website Design
              <br />
              <span className="text-[#c9a84c]">Beautiful. Simple. Effective.</span>
            </motion.h1>
            <motion.p variants={fadeUp} className="text-lg text-white/70 mb-8 max-w-lg">
              Get a modern, mobile-friendly website that looks great, builds trust, and helps your business grow. Starting at just $999.
            </motion.p>
            <motion.div variants={fadeUp} className="flex flex-wrap gap-4">
              <a
                href="#pricing"
                className="bg-[#c9a84c] text-[#0a1c38] px-8 py-3.5 rounded-lg font-semibold hover:bg-[#d4b35a] transition-colors inline-flex items-center gap-2"
              >
                View Pricing <ArrowRight className="w-4 h-4" />
              </a>
              <a
                href="#demos"
                className="bg-white/10 backdrop-blur-sm text-white px-8 py-3.5 rounded-lg font-medium hover:bg-white/20 transition-colors border border-white/20"
              >
                See Examples
              </a>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Trust Bar */}
      <section className="bg-gray-50 border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { icon: Smartphone, title: "Mobile Responsive", desc: "Looks great on any device" },
              { icon: MapPin, title: "Google Maps", desc: "Help customers find you" },
              { icon: Mail, title: "Contact Forms", desc: "Make it easy to reach you" },
              { icon: BarChart3, title: "Analytics", desc: "Track your growth" },
            ].map((item) => (
              <div key={item.title} className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-[#0f2645]/5 flex items-center justify-center flex-shrink-0">
                  <item.icon className="w-5 h-5 text-[#0f2645]" />
                </div>
                <div>
                  <p className="font-semibold text-sm text-gray-900">{item.title}</p>
                  <p className="text-xs text-gray-500">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 md:py-28">
        <div className="max-w-6xl mx-auto px-6">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
            className="text-center mb-16"
          >
            <motion.p variants={fadeUp} className="text-[#c9a84c] font-semibold text-sm uppercase tracking-wider mb-3">
              Pricing
            </motion.p>
            <motion.h2 variants={fadeUp} className="text-3xl md:text-4xl font-bold mb-4">
              Choose the Plan That&apos;s Right for You
            </motion.h2>
            <motion.p variants={fadeUp} className="text-gray-500 max-w-lg mx-auto">
              Whether you&apos;re just getting started or ready to grow, we have a plan that fits your needs.
            </motion.p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Basic Plan */}
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
              className="relative bg-white rounded-2xl border border-gray-200 p-8 hover:shadow-xl transition-shadow duration-300"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                  <Monitor className="w-5 h-5 text-gray-600" />
                </div>
                <h3 className="text-2xl font-bold">Basic</h3>
              </div>
              <p className="text-gray-500 text-sm mb-6">Everything you need to get started.</p>

              <div className="mb-2">
                <span className="text-5xl font-bold text-[#0f2645]">$999</span>
              </div>
              <p className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-2">One-Time</p>
              <div className="bg-gray-50 rounded-lg px-4 py-3 mb-6 text-center">
                <p className="text-sm text-gray-600">
                  or <span className="font-semibold text-[#0f2645]">$100</span>/month for 12 months
                  <span className="text-xs text-gray-400 block">Total: $1,200</span>
                </p>
              </div>

              <ul className="space-y-3 mb-8">
                {["5 Pages", "Mobile Responsive", "Contact Form", "Google Maps Integration"].map((item) => (
                  <li key={item} className="flex items-center gap-3 text-sm">
                    <CheckCircle2 className="w-5 h-5 text-[#0f2645] flex-shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>

              <Link
                href="/tt-designs/demo/basic"
                className="block w-full text-center bg-gray-100 text-[#0f2645] py-3 rounded-lg font-medium hover:bg-gray-200 transition-colors"
              >
                View Basic Demo
              </Link>
            </motion.div>

            {/* Premium Plan */}
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
              className="relative bg-[#0f2645] rounded-2xl p-8 text-white hover:shadow-xl hover:shadow-[#0f2645]/20 transition-shadow duration-300"
            >
              <div className="absolute -top-3 right-6">
                <span className="bg-[#c9a84c] text-[#0a1c38] text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                  Most Popular
                </span>
              </div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center">
                  <Star className="w-5 h-5 text-[#c9a84c]" />
                </div>
                <h3 className="text-2xl font-bold">Premium</h3>
              </div>
              <p className="text-white/60 text-sm mb-6">Everything in Basic, plus more power to grow.</p>

              <div className="mb-2">
                <span className="text-5xl font-bold text-[#c9a84c]">$2,499</span>
              </div>
              <p className="text-sm font-medium text-white/40 uppercase tracking-wider mb-2">One-Time</p>
              <div className="bg-white/10 rounded-lg px-4 py-3 mb-6 text-center">
                <p className="text-sm text-white/70">
                  or <span className="font-semibold text-[#c9a84c]">$250</span>/month for 12 months
                  <span className="text-xs text-white/40 block">Total: $3,000</span>
                </p>
              </div>

              <ul className="space-y-3 mb-8">
                {[
                  "Everything in Basic",
                  "Custom Design",
                  "Local SEO",
                  "Blog",
                  "Analytics & Reporting",
                  "More Revisions",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-3 text-sm">
                    <CheckCircle2 className="w-5 h-5 text-[#c9a84c] flex-shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>

              <Link
                href="/tt-designs/demo/premium"
                className="block w-full text-center bg-[#c9a84c] text-[#0a1c38] py-3 rounded-lg font-semibold hover:bg-[#d4b35a] transition-colors"
              >
                View Premium Demo
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 bg-gray-50">
        <div className="max-w-6xl mx-auto px-6">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
            className="text-center mb-16"
          >
            <motion.p variants={fadeUp} className="text-[#c9a84c] font-semibold text-sm uppercase tracking-wider mb-3">
              Features
            </motion.p>
            <motion.h2 variants={fadeUp} className="text-3xl md:text-4xl font-bold mb-4">
              Everything Your Business Needs Online
            </motion.h2>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
            className="grid md:grid-cols-3 gap-8"
          >
            {[
              {
                icon: Layout,
                title: "Clean, Modern Design",
                desc: "Professional layouts that build trust with your customers from the first visit.",
              },
              {
                icon: Smartphone,
                title: "Mobile Responsive",
                desc: "Your site looks and works perfectly on phones, tablets, and desktops.",
              },
              {
                icon: Search,
                title: "SEO-Friendly",
                desc: "Built with search engine best practices so customers can find you on Google.",
              },
              {
                icon: Globe,
                title: "Google Maps Integration",
                desc: "Help customers find your physical location with an embedded map.",
              },
              {
                icon: FileText,
                title: "Blog & Content",
                desc: "Share updates, tips, and news to keep customers engaged and improve SEO.",
                premium: true,
              },
              {
                icon: BarChart3,
                title: "Analytics & Reporting",
                desc: "Track visitors, page views, and conversions to understand your audience.",
                premium: true,
              },
            ].map((feature) => (
              <motion.div
                key={feature.title}
                variants={fadeUp}
                className="bg-white rounded-xl p-6 border border-gray-100 hover:shadow-lg transition-shadow duration-300"
              >
                <div className="w-12 h-12 rounded-xl bg-[#0f2645]/5 flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6 text-[#0f2645]" />
                </div>
                <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
                  {feature.title}
                  {feature.premium && (
                    <span className="text-[10px] font-bold bg-[#c9a84c]/10 text-[#c9a84c] px-2 py-0.5 rounded-full uppercase">
                      Premium
                    </span>
                  )}
                </h3>
                <p className="text-gray-500 text-sm leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Demo Section */}
      <section id="demos" className="py-20">
        <div className="max-w-6xl mx-auto px-6">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
            className="text-center mb-16"
          >
            <motion.p variants={fadeUp} className="text-[#c9a84c] font-semibold text-sm uppercase tracking-wider mb-3">
              Examples
            </motion.p>
            <motion.h2 variants={fadeUp} className="text-3xl md:text-4xl font-bold mb-4">
              See What We Build
            </motion.h2>
            <motion.p variants={fadeUp} className="text-gray-500 max-w-lg mx-auto">
              Check out our demo sites to see the difference between Basic and Premium.
            </motion.p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Basic Demo Card */}
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
            >
              <Link href="/tt-designs/demo/basic" className="group block">
                <div className="relative overflow-hidden rounded-xl border border-gray-200 bg-gray-50 aspect-[4/3] mb-4">
                  <div className="absolute inset-0 bg-gradient-to-br from-gray-100 to-gray-200 flex flex-col">
                    {/* Mini mockup of basic site */}
                    <div className="bg-[#1a1a1a] px-4 py-2 flex items-center gap-2">
                      <div className="flex gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
                        <div className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
                        <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
                      </div>
                      <div className="flex-1 bg-[#333] rounded-md px-3 py-1 text-[10px] text-gray-400 text-center">
                        freshfadebarbershop.com
                      </div>
                    </div>
                    <div className="flex-1 bg-white p-4">
                      <div className="bg-[#2c2c2c] rounded-lg h-24 mb-3 flex items-center justify-center">
                        <span className="text-white/80 text-xs font-medium">FRESH FADE BARBERSHOP</span>
                      </div>
                      <div className="space-y-2">
                        <div className="h-2 bg-gray-200 rounded w-3/4" />
                        <div className="h-2 bg-gray-200 rounded w-1/2" />
                        <div className="grid grid-cols-3 gap-2 mt-3">
                          <div className="h-12 bg-gray-100 rounded" />
                          <div className="h-12 bg-gray-100 rounded" />
                          <div className="h-12 bg-gray-100 rounded" />
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="absolute inset-0 bg-[#0f2645]/0 group-hover:bg-[#0f2645]/60 transition-all duration-300 flex items-center justify-center">
                    <span className="text-white font-semibold opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center gap-2">
                      View Demo <ArrowRight className="w-4 h-4" />
                    </span>
                  </div>
                </div>
                <h3 className="font-semibold text-lg">Basic Plan Demo</h3>
                <p className="text-gray-500 text-sm">Clean, professional 5-page barbershop website</p>
              </Link>
            </motion.div>

            {/* Premium Demo Card */}
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
            >
              <Link href="/tt-designs/demo/premium" className="group block">
                <div className="relative overflow-hidden rounded-xl border border-[#c9a84c]/30 bg-[#0f2645] aspect-[4/3] mb-4">
                  <div className="absolute inset-0 flex flex-col">
                    <div className="bg-[#0a1628] px-4 py-2 flex items-center gap-2">
                      <div className="flex gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
                        <div className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
                        <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
                      </div>
                      <div className="flex-1 bg-white/10 rounded-md px-3 py-1 text-[10px] text-white/40 text-center">
                        freshfadebarbershop.com
                      </div>
                    </div>
                    <div className="flex-1 bg-[#faf8f5] p-4">
                      <div className="bg-gradient-to-r from-[#0f2645] to-[#1a3a6a] rounded-lg h-24 mb-3 flex items-center justify-center relative overflow-hidden">
                        <div className="absolute inset-0 bg-[#c9a84c]/10" />
                        <span className="text-[#c9a84c] text-xs font-bold tracking-widest">FRESH FADE BARBERSHOP</span>
                      </div>
                      <div className="space-y-2">
                        <div className="h-2 bg-[#0f2645]/10 rounded w-3/4" />
                        <div className="h-2 bg-[#0f2645]/10 rounded w-1/2" />
                        <div className="grid grid-cols-3 gap-2 mt-3">
                          <div className="h-12 bg-[#0f2645]/5 rounded border border-[#0f2645]/10" />
                          <div className="h-12 bg-[#0f2645]/5 rounded border border-[#0f2645]/10" />
                          <div className="h-12 bg-[#0f2645]/5 rounded border border-[#0f2645]/10" />
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="absolute inset-0 bg-[#0f2645]/0 group-hover:bg-[#0f2645]/60 transition-all duration-300 flex items-center justify-center">
                    <span className="text-[#c9a84c] font-semibold opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center gap-2">
                      View Demo <ArrowRight className="w-4 h-4" />
                    </span>
                  </div>
                </div>
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  Premium Plan Demo
                  <Star className="w-4 h-4 text-[#c9a84c]" />
                </h3>
                <p className="text-gray-500 text-sm">Custom design with blog, SEO, and analytics</p>
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-20 bg-[#0f2645] text-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}>
              <motion.p variants={fadeUp} className="text-[#c9a84c] font-semibold text-sm uppercase tracking-wider mb-3">
                Why T&T Designs
              </motion.p>
              <motion.h2 variants={fadeUp} className="text-3xl md:text-4xl font-bold mb-8">
                We Build Websites That Work for You
              </motion.h2>
              <motion.ul variants={stagger} className="space-y-5">
                {[
                  "Clean, modern design that builds trust",
                  "Fast turnaround — your site live in weeks, not months",
                  "SEO-friendly structure so customers find you",
                  "Reliable support & revisions",
                  "No hidden fees — transparent pricing",
                ].map((item) => (
                  <motion.li key={item} variants={fadeUp} className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-[#c9a84c] flex-shrink-0 mt-0.5" />
                    <span className="text-white/80">{item}</span>
                  </motion.li>
                ))}
              </motion.ul>
            </motion.div>

            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
              className="bg-white/5 rounded-2xl p-8 border border-white/10"
            >
              <div className="flex items-center gap-2 mb-6">
                <RefreshCw className="w-5 h-5 text-[#c9a84c]" />
                <h3 className="font-semibold text-lg">Our Process</h3>
              </div>
              <div className="space-y-6">
                {[
                  { step: "01", title: "Discovery", desc: "We learn about your business, goals, and audience." },
                  { step: "02", title: "Design", desc: "We create a custom layout tailored to your brand." },
                  { step: "03", title: "Build", desc: "We develop your site with clean, modern code." },
                  { step: "04", title: "Launch", desc: "We deploy your site and make sure everything is perfect." },
                ].map((item) => (
                  <div key={item.step} className="flex gap-4">
                    <span className="text-[#c9a84c] font-bold text-sm mt-1">{item.step}</span>
                    <div>
                      <p className="font-semibold">{item.title}</p>
                      <p className="text-white/50 text-sm">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-20">
        <div className="max-w-3xl mx-auto px-6">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="text-center mb-12">
            <motion.p variants={fadeUp} className="text-[#c9a84c] font-semibold text-sm uppercase tracking-wider mb-3">
              FAQ
            </motion.p>
            <motion.h2 variants={fadeUp} className="text-3xl md:text-4xl font-bold">
              Common Questions
            </motion.h2>
          </motion.div>

          <div className="space-y-3">
            {[
              {
                q: "How long does it take to build my website?",
                a: "Most Basic websites are completed within 1-2 weeks. Premium websites typically take 2-4 weeks depending on the complexity of your requirements.",
              },
              {
                q: "Do I need to provide my own content?",
                a: "We can work with whatever you have. If you have photos and text ready, great! If not, we can help you with stock photography and draft copy to get started.",
              },
              {
                q: "What if I need changes after the site is launched?",
                a: "Both plans include revisions during the build process. After launch, we offer affordable maintenance packages. Premium plans include additional revisions.",
              },
              {
                q: "Will my website work on mobile devices?",
                a: "Absolutely. Every website we build is fully responsive and optimized for phones, tablets, and desktops.",
              },
              {
                q: "Do you handle hosting and domain?",
                a: "We can help you set up hosting and a custom domain. We'll walk you through the options and find what works best for your budget.",
              },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                className="border border-gray-200 rounded-xl overflow-hidden"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full text-left px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                >
                  <span className="font-medium">{item.q}</span>
                  <ChevronDown
                    className={`w-5 h-5 text-gray-400 transition-transform duration-200 flex-shrink-0 ml-4 ${
                      openFaq === i ? "rotate-180" : ""
                    }`}
                  />
                </button>
                {openFaq === i && (
                  <div className="px-6 pb-4 text-gray-500 text-sm leading-relaxed">{item.a}</div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section id="cta" className="py-20 bg-gradient-to-br from-[#0a1c38] to-[#162d50] text-white">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}>
            <motion.h2 variants={fadeUp} className="text-3xl md:text-4xl font-bold mb-4">
              Let&apos;s Build Your Online Presence
            </motion.h2>
            <motion.p variants={fadeUp} className="text-white/60 mb-8 max-w-lg mx-auto">
              Get a website that represents your business and drives results. Reach out today for a free consultation.
            </motion.p>
            <motion.div variants={fadeUp} className="flex flex-wrap gap-4 justify-center">
              <a
                href="mailto:contact@ttdesigns.com"
                className="bg-[#c9a84c] text-[#0a1c38] px-8 py-3.5 rounded-lg font-semibold hover:bg-[#d4b35a] transition-colors inline-flex items-center gap-2"
              >
                Get Started Today <ArrowRight className="w-4 h-4" />
              </a>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#0a1628] text-white/40 py-8 border-t border-white/5">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <div className="flex items-center justify-center gap-2 mb-3">
            <div className="w-6 h-6 rounded bg-[#0f2645] flex items-center justify-center">
              <span className="text-[#c9a84c] font-bold text-[10px]">T&T</span>
            </div>
            <span className="text-white/60 text-sm font-medium">T&T designs</span>
          </div>
          <p className="text-sm">Professional Websites That Work for You.</p>
        </div>
      </footer>
    </div>
  );
}
