console.log(`
After \`npm run insforge:link\`, set function secrets from your project dashboard or CLI:

  insforge secrets add INSFORGE_BASE_URL https://YOUR_APP_KEY.YOUR_REGION.insforge.app
  insforge secrets add ANON_KEY your-anon-key
  insforge secrets add OPENROUTER_API_KEY sk-or-v1-...   # Model Gateway — required for action:route

Find values in .insforge/project.json or run: insforge metadata
Or run: npx @insforge/cli ai setup   # writes OPENROUTER_API_KEY to .env.local for local dev
`)
