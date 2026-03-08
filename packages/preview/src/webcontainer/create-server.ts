export const createServerScript = (entryPoint: string | null) => `
const http = require('http');
const fs = require('fs');
const path = require('path');

const ENTRY_POINT = ${entryPoint ? `'${entryPoint}'` : 'null'};
const BRIDGE_SCRIPT = '<script id="__preview_bridge__">(function(){var send=function(type){try{window.parent&&window.parent.postMessage({type:type}, "*")}catch(e){}};window.addEventListener("focus",function(){send("preview:focus")});window.addEventListener("blur",function(){send("preview:blur")});window.addEventListener("message",function(event){var data=event.data||{};if(data.type==="preview:focus"){try{window.focus()}catch(e){}}});send("preview:ready")})();</script>';

const injectBridge = (html) => {
  if (html.includes('__preview_bridge__')) return html;
  if (html.includes('</body>')) {
    return html.replace('</body>', BRIDGE_SCRIPT + '</body>');
  }
  return html + BRIDGE_SCRIPT;
};

const server = http.createServer((req, res) => {
  const url = new URL(req.url, 'http://localhost');
  let filePath = '.' + url.pathname;
  
  console.log('[Server] Request:', req.method, url.pathname, '->', filePath);
  console.log('[Server] Exists:', filePath, fs.existsSync(filePath));

  if (filePath === './') {
    if (ENTRY_POINT) {
      filePath = ENTRY_POINT;
    } else {
      fs.readdir('.', (err, files) => {
        if (err) {
          res.writeHead(500);
          res.end('Server Error: Cannot read directory');
        } else {
          res.writeHead(200, { 'Content-Type': 'text/html' });
          const fileList = files.map(f => '<li><a href="/' + f + '">' + f + '</a></li>').join('');
          res.end('<h1>No index.html found</h1><p>File Browser:</p><ul>' + fileList + '</ul>');
        }
      });
      return;
    }
  }

  if (!fs.existsSync(filePath) && ENTRY_POINT) {
    const entryDir = path.dirname(ENTRY_POINT);
    const relativePath = path.join(entryDir, url.pathname);
    console.log('[Server] Trying relative fallback:', relativePath);
    console.log('[Server] Entry dir:', entryDir, 'Request path:', url.pathname);
    console.log('[Server] Fallback exists:', relativePath, fs.existsSync(relativePath));
    if (fs.existsSync(relativePath)) {
      console.log('[Server] Found relative fallback:', relativePath);
      filePath = relativePath;
    } else {
      console.log('[Server] Relative fallback not found:', relativePath);
    }
  }

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
        const html = injectBridge(content.toString());
        res.end(html, 'utf-8');
        return;
      }
      res.end(content, 'utf-8');
    }
  });
});

server.listen(3111);
`
