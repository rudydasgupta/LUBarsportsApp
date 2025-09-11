## Deploy (Free) – Neon Postgres + Vercel

1) Create a free Postgres (Neon)
- neon.tech → New Project → copy the connection string.

2) Configure env locally
- In `lubarsports/.env`, set:
```
DATABASE_URL="postgres://USER:PASSWORD@HOST:PORT/DBNAME?sslmode=require"
```

3) Switch Prisma to Postgres (already done)
- `prisma/schema.prisma` now uses `provider = "postgresql"`.

4) Migrate and seed locally
```
cd lubarsports
npm run prisma:migrate:dev -- --name init
npm run db:seed
```

5) Push your repo to GitHub

6) Vercel
- Import the repo
- Project → Settings → Environment Variables → add `DATABASE_URL` with the Neon string
- Optional Build Command: `npm run prisma:migrate:deploy && next build`

7) Domain
- Use a free `*.vercel.app` subdomain or add your own domain (paid) and point DNS.


