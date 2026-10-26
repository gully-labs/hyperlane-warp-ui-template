// Local design picker on :5230 (iframe switcher between direction A on :5231 and B on :5232).
import { readFileSync } from 'node:fs';
import { createServer } from 'node:http';

const html = readFileSync(new URL('../picker/index.html', import.meta.url));
const port = Number(process.env.PORT || 5230);
createServer((req, res) => {
  res.writeHead(200, { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' });
  res.end(html);
}).listen(port, '127.0.0.1', () => console.log(`picker on http://127.0.0.1:${port}/`));
