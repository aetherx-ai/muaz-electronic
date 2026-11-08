
import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distPath = path.join(__dirname, 'dist');

app.use(express.static(distPath));

app.get('/google:hash.html', (req, res, next) => {
  const fileName = `google${req.params.hash}.html`;
  const distFile = path.join(distPath, fileName);
  const publicFile = path.join(__dirname, 'public', fileName);

  if (fs.existsSync(distFile)) {
    return res.type('text/html').sendFile(distFile);
  }
  if (fs.existsSync(publicFile)) {
    return res.type('text/html').sendFile(publicFile);
  }
  next();
});

app.get('*', (_req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Muaz Electronic running on port ${PORT}`);
});
