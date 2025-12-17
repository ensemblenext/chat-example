import path from 'path';
import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';

const envFile = `.env.${process.env.NODE_ENV || 'development'}`;
dotenv.config({ path: path.resolve(process.cwd(), envFile) });
dotenv.config();

const app = express();
const port = process.env.PORT || 4001;
const secretId = process.env.SECRET_ID;
const secretValue = process.env.SECRET_VALUE;

app.use(cors());
app.use(express.json());

app.post('/chat-token', (req, res) => {
  if (!secretId || !secretValue) {
    res.status(500).json({ error: 'SECRET_ID/SECRET_VALUE not set in the environment' });
    return;
  }

  const userId = 'demo-user';
  const nowInSeconds = Math.floor(Date.now() / 1000);

  const token = jwt.sign({
    sub: userId,
    exp: nowInSeconds + 60 * 60, // 1 hour
    iat: nowInSeconds,
    aud: 'ensembleapp.ai',
    secretId,
    userId,
    }, secretValue, { algorithm: 'HS256' });

  res.json({ token });
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
