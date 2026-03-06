export const generateServerScript = (fileTree: Record<string, string>) => {
  const findEntry = () => {
    const paths = Object.keys(fileTree)
    console.log('[Preview] Analyzing file tree for entry point. Paths:', paths)

    const common = paths.find((path) => path === 'src/index.html')
    if (common) {
      console.log(`[Preview] Found entry in common dir: ./${common}`)
      return './' + common
    }

    console.warn('[Preview] No index.html found in file tree')
    return null
  }

  const entryPoint = findEntry()

  return `
const http = require('http');
const fs = require('fs');
const path = require('path');

const ENTRY_POINT = ${entryPoint ? `'${entryPoint}'` : 'null'};

const server = http.createServer((req, res) => {
  const url = new URL(req.url, 'http://localhost');
  let filePath = '.' + url.pathname;
  
  console.log('[Server] Request:', req.method, url.pathname, '->', filePath);

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

  console.log('[Server] Response Content-Type:', contentType, 'for', filePath);

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
      if (contentType === 'text/html' || contentType === 'text/css') {
        console.log('[Server] ' + contentType + ' Preview (' + filePath + '): ' + content.toString().substring(0, 100).replace(/\\n/g, ' '));
      }
      
      res.writeHead(200, { 
        'Content-Type': contentType,
        'Access-Control-Allow-Origin': '*'
      });
      res.end(content, 'utf-8');
    }
  });
});

server.listen(3111, () => {
  console.log('Server running at http://localhost:3111/');
});
`
}

