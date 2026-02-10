# Jobio

CRM de prospection intelligent pour freelances tech.

## Stack technique

- **Framework** : Next.js 15 (App Router)
- **Auth** : Better Auth (email/password, GitHub OAuth, magic links)
- **Base de donnees** : PostgreSQL + Prisma
- **Paiements** : Stripe (plans Free / Pro / Ultra)
- **UI** : shadcn/ui, TailwindCSS v4
- **Formulaires** : TanStack Form + Zod
- **Email** : Resend + React Email

## Demarrage rapide

```bash
cp .env-template .env
# Remplir les variables dans .env
pnpm install
pnpm dev
```

## Commandes

| Commande | Description |
|----------|-------------|
| `pnpm dev` | Serveur de developpement |
| `pnpm build` | Build production |
| `pnpm lint` | ESLint |
| `pnpm ts` | Verification TypeScript |
| `pnpm test` | Tests unitaires |
| `pnpm stripe-webhooks` | Ecouter les webhooks Stripe |
