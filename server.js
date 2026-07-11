const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');

const PORT = 3000;
const BACKEND_URL = 'https://backend-xaya.onrender.com/metrics';
const INDEX_PATH = path.join(__dirname, 'index.html');

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*'
  });
  res.end(JSON.stringify(payload));
}

function serveIndex(res) {
  fs.readFile(INDEX_PATH, 'utf8', (error, content) => {
    if (error) {
      res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('No se pudo cargar index.html');
      return;
    }

    res.writeHead(200, {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store'
    });
    res.end(content);
  });
}

function proxyMetrics(res) {
  const backendTarget = new URL(BACKEND_URL);
  const client = backendTarget.protocol === 'https:' ? https : http;
  const request = client.get(backendTarget, (backendRes) => {
    let body = '';

    backendRes.on('data', (chunk) => {
      body += chunk;
    });

    backendRes.on('end', () => {
      res.writeHead(backendRes.statusCode || 502, {
        'Content-Type': backendRes.headers['content-type'] || 'application/json; charset=utf-8',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'no-store'
      });
      res.end(body);
    });
  });

  request.on('error', (error) => {
    sendJson(res, 200, {
      cpu_percent: null,
      cpu_per_core: [],
      memory: {},
      network_latency_ms: null,
      services: [],
      backend_error: 'No fue posible contactar al backend',
      detail: error.message,
      backend: BACKEND_URL
    });
  });
}

const server = http.createServer((req, res) => {
  if (!req.url) {
    serveIndex(res);
    return;
  }

  if (req.url === '/metrics') {
    proxyMetrics(res);
    return;
  }

  if (req.url === '/' || req.url === '/index.html') {
    serveIndex(res);
    return;
  }

  res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.end('Not found');
});

server.listen(PORT, () => {
  console.log(`CloudPulse disponible en http://localhost:${PORT}`);
  console.log(`Proxy de métricas en http://localhost:${PORT}/metrics -> ${BACKEND_URL}`);
});