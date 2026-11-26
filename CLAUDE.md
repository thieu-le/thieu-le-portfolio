# CLAUDE.md

Personal portfolio (Next.js 16 App Router, React 19, Tailwind 4) deployed to Vercel
from `main`: <https://thieu-le-portfolio.vercel.app>. Routes are described in README.md.

Most active work is **One-Trick Stats** (`/otp`, `collector/`, `supabase/`). Before
touching it, read:

- [docs/OTP.md](docs/OTP.md): architecture, Supabase project, collector, workflow,
  the user's product decisions, working rules and current status.
- [docs/WPA.md](docs/WPA.md): win probability added (model, formulas, backfill).
- [collector/README.md](collector/README.md): collector steps and settings.

## Rules

- Commit and push only when the user asks. Never commit `.claude/`, `.env*` or keys.
- Everything must stay on free tiers (Supabase Free 500 MB, public-repo Actions, Vercel Hobby).
- Riot API only; never scrape op.gg or u.gg.
- Secrets (Supabase service role, Riot key) live only in GitHub Actions secrets. Never
  type them into pages or chat.
- Database migrations are applied by hand. Try the Supabase MCP, and if that's declined,
  ask the user (details in docs/OTP.md). Apply a migration before pushing code that needs it.
- Checks: `npm run otp:typecheck && npx tsc --noEmit -p . && npx eslint app/otp collector`.
- Keep docs/OTP.md "Status" and docs/WPA.md current when you change the system.
