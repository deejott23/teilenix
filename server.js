// Custom Next.js server for Plesk/Passenger (Serverprofis Elastic Siteserver)
// Set this file as "Application Startup File" in the Node.js panel.

const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');

const port = parseInt(process.env.PORT, 10) || 3000;
const hostname = process.env.HOSTNAME || '0.0.0.0';
const dev = process.env.NODE_ENV !== 'production';

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare()
  .then(() => {
    createServer((req, res) => {
      const parsedUrl = parse(req.url, true);
      handle(req, res, parsedUrl);
    }).listen(port, () => {
      console.log(
        `> Sharepa ready on http://${hostname}:${port} (NODE_ENV=${process.env.NODE_ENV || 'development'})`
      );
    });
  })
  .catch((err) => {
    console.error('Failed to start Next.js server:', err);
    process.exit(1);
  });
