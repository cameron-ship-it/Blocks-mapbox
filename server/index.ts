import 'dotenv/config';
import express from 'express';

const app = express();

// simple health route so you can verify it runs
app.get('/', (_req, res) => {
  res.send('Server is running ✅');
});

// define once
const PORT = Number(process.env.PORT) || 3001;
const HOST = process.env.HOST || '127.0.0.1';

// start server
app.listen(PORT, HOST, () => {
  console.log(`Server running at http://${HOST}:${PORT}`);
});
