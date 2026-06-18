# footballsite (Livescore.site scaffold)

This repository will implement a World Cup-focused near-live scores site. The architecture and implementation plan are described in the project spec.

Initial scaffold: TypeScript + Next.js app router + Tailwind + Firebase client/admin stubs + football API provider interface + core types.

See .env.example for environment variables.

Next steps (recommended)
1. Make repo public or allow write access so I can create a feature branch and push these files (done).
2. If you prefer manual application: copy the files above into the repo, run:
   - npm install
   - npx tailwindcss init -p (if you want PostCSS files)
   - npm run dev
3. After scaffold is in the repo, I'll:
   - Add src/types/* for teams & trends (I can do that next).
   - Implement lib/football-api/footballDataOrg.ts adapter (with request-rate logic & caching).
   - Implement src/app/api/cron/sync-fixtures route + vercel.json.
   - Add Firestore security rules and deployment notes.

What I can do next right now
- I will create a branch called livescore-scaffold and push these files (one commit). I will then implement the TypeScript types for all entities and the provider adapter skeleton (footballDataOrg.ts) next.
- If you prefer the copy/paste route, tell me and I’ll continue by generating the next set of files: provider adapter skeleton, cron routes, and the basic /api/matches/fixtures route with zod validation and a Firestore caching helper.
