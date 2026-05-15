# Weave

timeline ordering

## Stack

- Next.js (App Router)
- React
- Clerk auth
- MongoDB
- Vercel Blob (for uploaded avatars)
- Vitest + Playwright

## Run locally

```bash
npm install
npm run dev
```

App runs at [http://localhost:3000](http://localhost:3000).

## Environment variables

Create a `.env.local` file and set:

```env
CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
SKYFORGE_DB_MONGODB_URI=
WEAVE_READ_WRITE_TOKEN=
RESEND_API_KEY=
```

Notes:

- `WEAVE_READ_WRITE_TOKEN` is used for avatar upload/delete via Vercel Blob.
- `RESEND_API_KEY` is used for the in-app feedback form (`/api/contact`).
- `SKYFORGE_DB_MONGODB_URI` is the primary database connection string.
- There is fallback support for `MONGODB_URI`, but the project is wired for `SKYFORGE_DB_MONGODB_URI`.

## Scripts

```bash
npm run dev
npm run lint
npm run test
npm run test:watch
npm run test:coverage
npm run test:e2e
```

## What is in here

- `src/app` - routes, layout, API handlers
- `src/components` - UI components
- `src/lib` - shared utilities and data helpers

## Future Goals

- tiered difficulty on all existing + future event objects
- more thing's i'll come up with 

## Feedback/Contact

- GitHub: [@lancebailey26](https://github.com/lancebailey26)
- LinkedIn: [lance-bailey](https://www.linkedin.com/in/lance-bailey)
- Portfolio: [lbailey.dev](https://lbailey.dev)
