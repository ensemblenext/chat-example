import express from 'express';
import cors from 'cors';

const app = express();
const port = process.env.PORT || 4001;
const jwtSecret = process.env.JWT_SECRET;

app.use(cors());
app.use(express.json());

app.post('/chat-token', (req, res) => {
  res.json({
    token: 'abcd...',
  });
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
