const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const rootDir = '/workspace';
const port = process.env.PORT ? Number(process.env.PORT) : 8080;
const host = '0.0.0.0';

const mime = {
  '.html': 'text/html; charset=utf-8',
  '.htm': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.txt': 'text/plain; charset=utf-8'
};

const send = (res, status, body, headers = {}) => {
  res.writeHead(status, { 'Access-Control-Allow-Origin': '*', ...headers });
  if (body && Buffer.isBuffer(body)) res.end(body);
  else if (body) res.end(String(body));
  else res.end();
};

const server = http.createServer((req, res) => {
  try {
    const parsed = url.parse(req.url || '/');
    let pathname = decodeURIComponent(parsed.pathname || '/');
    if (pathname === '/') pathname = '/temp foundry.html';
    const filePath = path.normalize(path.join(rootDir, pathname));
    if (!filePath.startsWith(rootDir)) return send(res, 403, 'Forbidden');

    fs.stat(filePath, (err, stat) => {
      if (err) return send(res, 404, 'Not found');
      const serveFile = (p) => {
        const ext = path.extname(p).toLowerCase();
        const type = mime[ext] || 'application/octet-stream';
        fs.readFile(p, (e, data) => {
          if (e) return send(res, 500, 'Server error');
          send(res, 200, data, { 'Content-Type': type });
        });
      };
      if (stat.isDirectory()) {
        const indexHtml = path.join(filePath, 'index.html');
        return fs.stat(indexHtml, (e2) => {
          if (!e2) return serveFile(indexHtml);
          send(res, 403, 'Directory listing is disabled');
        });
      }
      serveFile(filePath);
    });
  } catch (e) {
    send(res, 500, 'Server error');
  }
});

server.listen(port, host, () => {
  console.log(`Static server running at http://${host}:${port}/`);
});

