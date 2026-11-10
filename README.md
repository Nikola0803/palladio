# Palladio — Vercel Monorepo

Dva Vercel projekta:
- `apps/crm` — Next.js 14 CRM + Payment Links API
- `apps/web` — React 19 + Vite storefront

## Deployment na Vercel (korak po korak)

### 1. Vercel Postgres (Neon) baza

1. Idi na [vercel.com/dashboard](https://vercel.com/dashboard) → Storage → Create Database → **Postgres**
2. Poveži bazu s CRM projektom
3. Vercel automatski injektira `POSTGRES_URL` i ostale varijable u Environment Variables

### 2. Importaj CRM projekt

1. New Project → Import Git Repository (ili upload folder)
2. Root Directory: `apps/crm`
3. Framework: **Next.js** (auto-detect)
4. Dodaj Environment Variables:
   ```
   STRIPE_SECRET_KEY=sk_live_51Nk3lQ...
   APP_USERNAME=admin
   APP_PASSWORD=your-secure-password
   NEXT_PUBLIC_WP_URL=https://palladio.hr
   ```
5. Deploy → dobit ćeš URL npr. `crm-palladio.vercel.app`
6. Postavi custom domain: `crm.palladio.hr`

### 3. Pokreni migraciju baze

Nakon prvog deploya, idi na CRM dashboard > Settings > Terminal (ili lokalno):
```bash
cd apps/crm
npx drizzle-kit push
```

### 4. Importaj Web projekt

1. New Project → Import isti repo
2. Root Directory: `apps/web`
3. Framework: **Vite** (auto-detect)
4. Dodaj Environment Variables:
   ```
   VITE_WP_URL=https://palladio.hr
   VITE_CRM_URL=https://crm.palladio.hr
   VITE_STRIPE_PUBLISHABLE_KEY=pk_live_51Nk3lQ...
   ```
5. Deploy → npr. `palladio-web.vercel.app`
6. Postavi custom domain: `store.palladio.hr` ili `www.palladio.hr`

## Payment Links tok

```
CRM → Kreiraš payment link (iznos, opis, kupac)
    → Generiše se token (UUID)
    → Kratki URL: https://crm.palladio.hr/plati/{token}
                           ili
                  https://palladio.hr/plati/{token} (web app)

Kupac otvori link →
  Web: /plati/{token} stranica učita intent od CRM API-ja
  Stripe PaymentElement se prikaže
  Kupac plati → redirect na /plati/{token}/hvala
```

## Lokalni razvoj

```bash
# CRM
cd apps/crm
cp .env.example .env.local
# Edituj .env.local s pravim vrijednostima
npm install
npm run dev  # http://localhost:3000

# Web
cd apps/web
cp .env.example .env.local
# Edituj .env.local
npm install
npm run dev  # http://localhost:5173
```

## Struktura

```
palladio-vercel/
├── apps/
│   ├── crm/                     # Next.js 14 CRM
│   │   ├── src/
│   │   │   ├── app/
│   │   │   │   └── api/
│   │   │   │       ├── payment-links/   # CRUD payment links
│   │   │   │       └── stripe/
│   │   │   │           ├── intent/      # Payment link intent
│   │   │   │           └── cart-intent/ # Cart checkout intent
│   │   │   └── lib/db/
│   │   │       ├── schema.ts    # Drizzle schema (Postgres)
│   │   │       └── index.ts     # DB connection (@vercel/postgres)
│   │   ├── drizzle.config.ts
│   │   ├── vercel.json
│   │   └── .env.example
│   └── web/                     # React 19 + Vite storefront
│       ├── src/
│       │   ├── pages/
│       │   │   ├── PlatiPage.tsx      # Payment link stranica
│       │   │   └── PlatiHvalaPage.tsx # Hvala stranica
│       │   └── lib/
│       │       └── checkout-api.ts   # Ažurirano za Vercel CRM
│       ├── vercel.json
│       └── .env.example
└── README.md
```
