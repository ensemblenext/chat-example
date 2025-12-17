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
# Get your secret id/value from https://ensembleapp.ai
SECRET_ID=
SECRET_VALUE=
```

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

4. Open your browser to http://localhost:4000. Server will be running at http://localhost:4001

### Features

- **Web App**: Landing page with a chat bubble that opens the ChatWidget
- **Server**: Simple Express server with a `/chat-token` endpoint
- **ChatWidget**: Integrated chat component from `@ensemblenext/client-sdk`