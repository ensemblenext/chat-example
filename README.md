# ACME Monorepo

A demo monorepo showcasing the ChatWidget integration.

## Structure

- `server/` - Express server with chat token endpoint
- `web/` - Next.js web app with ChatWidget integration

## Getting Started

### Prerequisites
- Node.js 18+
- npm

### Environment variables
- Web: create .env with the following variables:
```
# widget version (latest or pin to specific version e.g. 1.0.1)
NEXT_PUBLIC_SDK_VERSION=latest
# Your server endpoint that generate a JWT token from Ensemble secret
TOKEN_ENDPOINT=https://<my-server>/chat-token
```

- Server: create .env with the following variables:
```
# the secret from https://ensembleapp.ai
JWT_SECRET=abcd...
```


### Development

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development servers:
   ```bash
   npm run dev
   ```

3. Open your browser to http://localhost:4000. Server will be running at http://localhost:4001

### Features

- **Web App**: Landing page with a chat bubble that opens the ChatWidget
- **Server**: Simple Express server with a `/chat-token` endpoint
- **ChatWidget**: Integrated chat component from `@ensemblenext/client-sdk`