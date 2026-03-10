export const createServerScript = (entryPoint: string | null) => `
const http = require('http');
const fs = require('fs');
const path = require('path');

const ENTRY_POINT = ${entryPoint ? `'${entryPoint}'` : 'null'};

const buildShell = (innerHtml) => {
  return \`<!DOCTYPE html>
<html lang="en" style="background: rgb(12, 14, 23); color-scheme: dark;">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="stylesheet" href="./reset.css">
    <link rel="stylesheet" href="./style.css">
    <title>Preview</title>
    <style>
      html, body {
        width: 100%;
        height: 100%;
        margin: 0;
        padding: 0;
        background: rgb(12, 14, 23) !important;
      }
      #preview-container {
        position: relative;
        overflow: hidden;
        width: 100%;
        height: 100%;
        background: rgb(12, 14, 23) !important;
      }
      #preview-scale-root {
        width: var(--preview-width, 0px);
        height: var(--preview-height, 0px);
        position: absolute;
        left: 0;
        top: 0;
        background-color: #ffffff;
        background-size: 24px 24px;
        background-position: 0 0, 12px 12px;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.25);
        outline: 1px solid rgba(255, 255, 255, 0.16);
        transform: translate(var(--preview-offset-x, 0px), var(--preview-offset-y, 0px)) scale(var(--preview-scale, 1));
        transform-origin: top left;
      }
    </style>
    <script>
      (function () {
        var s = document.documentElement.style;
        var n = function (v) { return typeof v === 'number' && isFinite(v) && v > 0; };
        var state = { scale: 1, width: 0, height: 0 };
        var notifyReady = function () {
          try {
            window.parent && window.parent.postMessage && window.parent.postMessage({ type: 'preview:ready' }, '*');
          } catch (e) {}
        };
        function layout() {
          var scale = state.scale;
          var width = state.width;
          var height = state.height;
          if (!n(scale) || !n(width) || !n(height)) return;
          var scaledW = width * scale;
          var scaledH = height * scale;
          var offsetX = (window.innerWidth - scaledW) / 2;
          var offsetY = (window.innerHeight - scaledH) / 2;
          s.setProperty('--preview-scale', String(scale));
          s.setProperty('--preview-width', width + 'px');
          s.setProperty('--preview-height', height + 'px');
          s.setProperty('--preview-offset-x', offsetX + 'px');
          s.setProperty('--preview-offset-y', offsetY + 'px');
        }
        window.addEventListener('message', function (e) {
          var d = e && e.data;
          if (!d || typeof d !== 'object' || d.type !== 'preview:layout') return;
          var p = d.payload || d;
          var scale = p.scale, width = p.width, height = p.height;
          if (n(scale)) state.scale = scale;
          if (n(width)) state.width = width;
          if (n(height)) state.height = height;
          layout();
        });
        if (document.readyState === 'complete' || document.readyState === 'interactive') {
          notifyReady();
        } else {
          document.addEventListener('DOMContentLoaded', notifyReady);
        }
        window.addEventListener('load', notifyReady);
        window.addEventListener('resize', layout);
      })();
    </script>
  </head>
  <body style="background: rgb(12, 14, 23);">
    <div id="preview-container">
      <div id="preview-scale-root">\${innerHtml}</div>
    </div>
  </body>
</html>\`;
};

const server = http.createServer((req, res) => {
  const url = new URL(req.url, 'http://localhost');
  let filePath = '.' + url.pathname;
  console.log('[PreviewServer] request', { url: url.pathname, entryPoint: ENTRY_POINT });
  
  if (filePath === './') {
    if (ENTRY_POINT) {
      filePath = ENTRY_POINT;
    } else {
      console.log('[PreviewServer] Entry point not found', { entryPoint: ENTRY_POINT, cwd: process.cwd(), url: url.pathname });
      res.writeHead(404);
      res.end('Entry point not found');
      return;
    }
  }

  if (!fs.existsSync(filePath) && ENTRY_POINT) {
    const entryDir = path.dirname(ENTRY_POINT);
    const relativePath = path.join(entryDir, url.pathname);
    if (fs.existsSync(relativePath)) {
      filePath = relativePath;
    }
  }
  console.log('[PreviewServer] resolved path', { filePath });

  const extname = path.extname(filePath);
  let contentType = 'text/html';
  
  switch (extname) {
    case '.js': contentType = 'text/javascript'; break;
    case '.css': contentType = 'text/css'; break;
    case '.json': contentType = 'application/json'; break;
    case '.png': contentType = 'image/png'; break;
    case '.jpg': contentType = 'image/jpg'; break;
    case '.svg': contentType = 'image/svg+xml'; break;
  }

  fs.readFile(filePath, (error, content) => {
    if (error) {
      if(error.code == 'ENOENT'){
        console.log('[PreviewServer] File not found', {
          entryPoint: ENTRY_POINT,
          url: url.pathname,
          filePath,
          cwd: process.cwd(),
          entryExists: ENTRY_POINT ? fs.existsSync(ENTRY_POINT) : null,
        });
        res.writeHead(404);
        res.end('File not found: ' + filePath);
      } else {
        res.writeHead(500);
        res.end('Server Error: '+error.code);
      }
    } else {
      res.writeHead(200, { 
        'Content-Type': contentType,
        'Access-Control-Allow-Origin': '*'
      });
      if (contentType === 'text/html') {
        const shell = buildShell(content.toString());
        res.end(shell, 'utf-8');
        return;
      }
      res.end(content, 'utf-8');
    }
  });
});

server.listen(3111);
`
