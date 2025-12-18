import path from 'path';
import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';

const envFile = `.env.${process.env.NODE_ENV || 'development'}`;
dotenv.config({ path: path.resolve(process.cwd(), envFile) });
dotenv.config();

const AUDIENCE = 'ensembleapp.ai';

const app = express();
const port = process.env.PORT || 4001;
const keyId = process.env.ENSEMBLE_KEY_ID;
const keySecret = process.env.ENSEMBLE_KEY_SECRET;

app.use(cors());
app.use(express.json());

app.post('/chat-token', (req, res) => {
  if (!keyId || !keySecret) {
    res.status(500).json({ error: 'ENSEMBLE_KEY_ID/ENSEMBLE_KEY_SECRET not set in the environment' });
    return;
  }

  const userId = 'demo-user';
  const nowInSeconds = Math.floor(Date.now() / 1000);

  const token = jwt.sign({
    sub: userId,
    exp: nowInSeconds + 60 * 60, // 1 hour
    iat: nowInSeconds,
    aud: AUDIENCE,
  }, keySecret, {
    algorithm: 'HS256',
    keyid: keyId,
  });

  res.json({ token });
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
