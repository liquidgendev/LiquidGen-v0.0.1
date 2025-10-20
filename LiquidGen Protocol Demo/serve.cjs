const http = require('http');
const fs = require('fs');
const path = require('path');

const port = process.env.PORT || 8000;
const dir = process.cwd();

const mime = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.json': 'application/json',
  '.map': 'application/octet-stream'
};

const server = http.createServer((req, res) => {
  let reqPath = decodeURIComponent(req.url.split('?')[0]);
  if (reqPath === '/') reqPath = '/index.html';
  const filePath = path.join(dir, reqPath);

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.statusCode = 404;
      res.end('Not found');
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    res.setHeader('Content-Type', mime[ext] || 'application/octet-stream');
    const stream = fs.createReadStream(filePath);
    stream.pipe(res);
    stream.on('error', () => res.end('Server error'));
  });
});

server.listen(port, () => {
  console.log(`Static server serving ${dir} at http://localhost:${port}`);
});
