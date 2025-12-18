# DEPRECATED: Express Token Server

⚠️ **This Express server is deprecated.** The token generation functionality has been moved to the Next.js web app as an API route.

## Migration Path

The `/chat-token` endpoint is now available at `/api/chat-token` in the web app (`apps/web`).

To migrate:
1. Copy your `ENSEMBLE_KEY_ID` and `ENSEMBLE_KEY_SECRET` from `apps/server/.env` to `apps/web/.env`
2. Update `NEXT_PUBLIC_TOKEN_ENDPOINT=/api/chat-token` in `apps/web/.env`
3. Run the web app: `npm run dev` (from project root)

## Why Deprecated?

- **Simpler deployment**: One application instead of two
- **Easier development**: Single dev server instead of two
- **Better security**: Secrets managed in one place
- **No CORS issues**: Same-origin requests eliminate CORS configuration
- **Unified codebase**: All logic collocated in one app

## If You Still Need a Standalone Server

This code remains functional and can be used as-is for deploying a separate token service if you have specific requirements:
- Multiple applications need tokens from the same service
- Token generation has complex logic or high load requiring independent scaling
- Organizational boundaries between teams
- Different deployment/scaling requirements

### Running the Standalone Server

```bash
cd apps/server
npm install
cp .env.example .env
# Add your ENSEMBLE_KEY_ID and ENSEMBLE_KEY_SECRET to .env
npm run dev
```

The server will start on `http://localhost:4001` with the `/chat-token` endpoint.
