# LU Bar Sports

League tables, fixtures and results for Lancaster University's inter-college pool, darts and dominoes leagues, with an admin area for committee members and college coordinators.

Next.js 15 (App Router, server actions), Prisma and PostgreSQL (Neon), Tailwind CSS 4. Hosted on Vercel. The look follows the LUPSC rankings site.

## How it fits together

- **Seasons.** Every fixture belongs to a season. The *current* season is what the public site shows; earlier seasons are under **Archive**, with their final tables and every result.
- **Tables are calculated, not stored.** Points are worked out from results each time a page is shown: 1 per frame (leg, game) won, plus the season's win bonus (2) and draw bonus (0), plus any points adjustments. Changing a result updates every table straight away, and an archived season always shows the table it finished with.
- **Weeks** follow the university calendar: weeks 1–10 count from the Monday of Michaelmas week 1, weeks 11–20 from the Monday of Lent week 11. Each league has a match night (e.g. Open Darts on Mondays).
- **Fixture template.** New seasons are generated from the 2025/26 double round robin (`src/lib/fixture-template.ts`): weeks 2–9 and 11–20, four matches a week, one college resting.

## Admin roles

| Role | Can |
| --- | --- |
| Super admin | Everything, including admin accounts and seasons |
| Admin | Results, fixtures, league settings, points adjustments and announcements for every league |
| College pool coordinator (CPC) | Results for pool and dominoes, for fixtures involving their college |
| College darts coordinator (CDC) | Results for darts and dominoes, for fixtures involving their college |

Sign in at `/admin`. New accounts get a temporary password, shown once to the super admin who created them, and must choose their own at first sign-in. Every change is recorded in the audit log.

## Starting a new season

In the admin: **Seasons → Start a new season**. Check the suggested term dates against the university calendar, choose the leagues, and keep "Make it the current season now" ticked. The old season moves to the archive. If the term dates turn out wrong, edit them on the same page and fixtures move to match.

From a terminal instead:

```bash
DATABASE_URL=... npx tsx scripts/start-season.ts --name 2027/28 --michaelmas 2027-10-04 --lent 2028-01-10 --dry-run
```

## Local development

```bash
npm install
DATABASE_URL=postgresql://localhost/lubarsports npx prisma migrate deploy
DATABASE_URL=postgresql://localhost/lubarsports npm run db:seed     # empty databases only
DATABASE_URL=postgresql://localhost/lubarsports npx tsx scripts/set-admin.ts --email you@example.com --name "You" --role SUPER
DATABASE_URL=postgresql://localhost/lubarsports npm run dev
```

`lubarsports/.env` points at the production database, and Prisma and Next.js both read it. Set `DATABASE_URL` explicitly, as above, whenever you don't mean production.

## Environment

| Variable | |
| --- | --- |
| `DATABASE_URL` | PostgreSQL connection string (Neon in production) |
| `SESSION_SECRET` | Optional but recommended: 32+ random characters used to sign admin sessions. Without it, a key derived from `DATABASE_URL` is used. Changing it signs everyone out. |

## Deploying

1. Back up the database (`pg_dump`).
2. Apply migrations: `DATABASE_URL=<production> npx prisma migrate deploy`.
3. Push to `main`; Vercel builds and deploys. Pages render on request, so the build doesn't touch the database.

## Scripts

| | |
| --- | --- |
| `scripts/set-admin.ts` | Create or update an admin account from a terminal, e.g. the first super admin, or to recover access. Prompts for the password (hidden), or `--generate` for a temporary one. |
| `scripts/start-season.ts` | Create a season with fixtures and make it current. |
| `prisma/seed.ts` | Set up an empty database for development. Refuses to touch one that has data. |
