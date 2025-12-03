# ACME Monorepo

A demo monorepo showcasing the ChatWidget integration.

## Structure

- `server/` - Express server with chat token endpoint
- `web/` - Next.js web app with ChatWidget integration

## Getting Started

### Prerequisites
- Node.js 18+
- npm

### Development

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development servers:
   ```bash
   # In one terminal - start the server
   cd server && npm run dev

   # In another terminal - start the web app
   cd web && npm run dev
   ```

3. Open your browser:
   - Web app: http://localhost:3000
   - Server: http://localhost:3001

### Features

- **Web App**: Landing page with a chat bubble that opens the ChatWidget
- **Server**: Simple Express server with a `/chat-token` endpoint
- **ChatWidget**: Integrated chat component from `@ensemblenext/client-sdk`

### Usage

1. Visit http://localhost:3000
2. Click the blue chat bubble in the bottom right
3. The ChatWidget will open and connect to the server at http://localhost:3001