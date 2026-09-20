# Thieu Le — Portfolio

[![Live site](https://img.shields.io/badge/live-thieu--le--portfolio.vercel.app-000?logo=vercel&logoColor=white)](https://thieu-le-portfolio.vercel.app)
[![Next.js](https://img.shields.io/badge/Next.js-16-000?logo=nextdotjs&logoColor=white)](https://nextjs.org)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com)

My personal site — and the place I ship small, self-contained web apps rather than
leaving them as local experiments. Alongside the résumé and contact pages, the same
Next.js app serves three standalone projects: two accessibility-first learning tools
and a freelance web-design landing page.

**Live:** <https://thieu-le-portfolio.vercel.app>

---

## What's in here

| Route | What it is |
|---|---|
| `/` | The portfolio itself — hero, about, skills, résumé, and a working contact form. |
| `/NICOLE` | An alphabet and vocabulary learning app built to a calm, autism-friendly interaction spec. |
| `/phrases` | Everyday-communication phrase practice using the browser's Web Speech API. |
| `/tt-designs` | A landing page for T&T Designs, with two demo sites (`basic`, `premium`). |

### NICOLE — alphabet learning

A letter-and-word learning flow designed around a deliberate set of constraints
rather than gamification: no auto-playing sounds, no timers, no score, large touch
targets, one primary action per screen, and predictable back-navigation.

Letters open into a word with a real photograph, a sentence using the word, and
finger-tracing practice for both the letter and the word (`LetterTracing.tsx`,
`WordTracing.tsx`). Vocabulary lives in `app/NICOLE/data/words.json`, so adding
words is a data change, not a code change.

### Phrases — speech practice

Pick a phrase ("I am hungry", "I need to use the restroom"), see the real-world
prompt for when to use it, then say it. The page captures speech through
`SpeechRecognition` and grades it with a deliberately forgiving matcher in
`utils/phraseValidation.ts` — a partial match gets "Try again", never a failure
state. Feedback is encouragement-only by design, and the page degrades gracefully
when the browser has no speech input.

### T&T Designs

A marketing page for a small web-design service, plus two demo tiers so a
prospective client can see the difference between packages instead of reading
about it. Animated with Framer Motion.

---

## Stack

- **Next.js 16** (App Router) + **React 19**
- **TypeScript 5**
- **Tailwind CSS 4**
- **Framer Motion** for page and section animation
- **lucide-react** for iconography
- **Resend** for transactional email from the contact form
- Deployed on **Vercel**

## Running locally

```bash
npm install
npm run dev
```

Then open <http://localhost:3000>.

```bash
npm run build     # production build
npm run start     # serve the production build
npm run lint      # eslint
```

## Contact form

`app/api/contact/route.ts` validates the submission server-side and sends it via
Resend. It needs one environment variable:

```bash
# .env.local
RESEND_API_KEY=re_...
```

The key is required at build time, not just at request time — the Resend client is
constructed at module scope, so `npm run build` fails without it. Set it in
`.env.local` locally and in your Vercel project settings for deploys. Full
walkthrough in [`CONTACT_FORM_SETUP.md`](CONTACT_FORM_SETUP.md).

## Project layout

```
app/
├── page.tsx              # Portfolio composition
├── layout.tsx            # Root layout, fonts, metadata
├── components/           # Hero, About, Skills, Résumé, Contact, Footer, Nav
├── config/features.ts    # Feature flags (e.g. Projects vs Résumé section)
├── api/contact/route.ts  # Resend-backed contact endpoint
├── NICOLE/               # Alphabet learning app
├── phrases/              # Speech-practice app
└── tt-designs/           # Web-design landing page + demos
```

Section visibility is flag-driven through `app/config/features.ts`, so swapping the
Résumé section for a Projects grid is a one-line change.
