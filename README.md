# ACME Monorepo

A demo monorepo showcasing the ChatWidget integration.

## Structure

- `apps/web/` - Next.js web app with ChatWidget integration and built-in token API

## Getting Started

### Prerequisites
- Node.js 18+
- npm

### Environment variables

Create `apps/web/.env` with the following variables:
```bash
# Widget version (latest or pin to specific version e.g. 1.0.1)
NEXT_PUBLIC_SDK_VERSION=latest

# Token endpoint (use /api/chat-token for local Next.js API route)
NEXT_PUBLIC_TOKEN_ENDPOINT=/api/chat-token

# Ensemble secrets - Get from https://ensembleapp.ai
# IMPORTANT: Do NOT prefix with NEXT_PUBLIC_ (server-side only)
ENSEMBLE_KEY_ID=your_key_id_here
ENSEMBLE_KEY_SECRET=your_key_secret_here
```

**Note**: The web app now includes a built-in API route at `/api/chat-token` that handles JWT token generation. You can also point `NEXT_PUBLIC_TOKEN_ENDPOINT` to an external server if needed.

### Development

1. Sync "@ensembleapp/client-sdk" in package.json to the same version as your process.env.NEXT_PUBLIC_SDK_VERSION.
This ensure the typeahead is scoped correctly to the widget version.

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development servers:
   ```bash
   npm run dev
   ```

4. Open your browser to http://localhost:4000

### Features

- **Web App**: Examples gallery showcasing multiple ChatWidget integration patterns
- **API Route**: Next.js API route at `/api/chat-token` for JWT token generation
- **ChatWidget**: Integrated chat component from `@ensembleapp/client-sdk`
- **Multiple Examples**: ACME support chat, multi-thread agent, and interactive configurator

## Deployment

### Firebase App Hosting

The web app is configured for deployment to Firebase App Hosting (Cloud Run).

**Prerequisites:**
- Firebase CLI 15.0.0+
- Blaze (pay-as-you-go) plan
- Firebase project: `ensembleapp-chat`

**Configuration Files:**
- `apps/web/apphosting.yaml` - App Hosting configuration
- `apps/web/next.config.ts` - Standalone output mode enabled
- `.firebaserc` - Firebase project association

**Deployment Options:**

**Option 1: GitHub Integration (Recommended)**
1. Commit and push your changes to `main` branch
2. Go to Firebase Console → App Hosting → Get started
3. Connect your GitHub repository
4. **Important**: Set root directory to `apps/web`
5. Choose live branch: `main`
6. Enable automatic rollouts
7. Select region: `us-central1` (or closest to your users)
8. Configure secrets in Firebase Console:
   - Navigate to App Hosting → Your backend → Environment Variables
   - Add `ENSEMBLE_KEY_ID` and `ENSEMBLE_KEY_SECRET`
   - Trigger new rollout

**Option 2: CLI Deployment**
```bash
# Create backend (first time only)
firebase apphosting:backends:create --project ensembleapp-chat --location us-central1
# When prompted, set root directory: apps/web

# Configure secrets
firebase apphosting:secrets:set ENSEMBLE_KEY_ID --project ensembleapp-chat
firebase apphosting:secrets:set ENSEMBLE_KEY_SECRET --project ensembleapp-chat

# Deploy
firebase deploy --only apphosting --project ensembleapp-chat
```

**Subsequent Deployments:**
- With GitHub integration: Simply push to `main` branch
- Manual: `firebase deploy --only apphosting --project ensembleapp-chat`

**Post-Deployment:**

Test your deployment:
```bash
# Check homepage
curl https://your-backend--ensembleapp-chat.us-central1.hosted.app

# Test API route
curl -X POST https://your-backend--ensembleapp-chat.us-central1.hosted.app/api/chat-token
```

**View Logs:**
```bash
firebase apphosting:logs --project ensembleapp-chat
```

**Rollback:**
```bash
# List rollouts
firebase apphosting:rollouts:list --project ensembleapp-chat

# Rollback to specific version
firebase apphosting:rollouts:rollback ROLLOUT_ID --project ensembleapp-chat
```

**Expected Results:**
- ✅ Next.js app with SSR on Cloud Run
- ✅ Static assets on Firebase CDN
- ✅ API routes working with server-side secrets
- ✅ Auto-deploy on push to main (with GitHub integration)
- ✅ SSL certificate automatically provisioned
- ✅ Build time: ~3-5 minutes
- ✅ Cold start: <1 second

**Cost Estimate:**
- Minimal traffic: $0-5/month
- Moderate traffic with 1 warm instance: $10-30/month
