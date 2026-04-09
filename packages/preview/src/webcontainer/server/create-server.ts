import { PREVIEW_SHELL_BODY } from '../shell/shell-body'
import { PREVIEW_SHELL_HEAD } from '../shell/shell-head'
import { PREVIEW_SHELL_RUNTIME } from '../shell/shell-runtime'
import { PREVIEW_SHELL_STYLE } from '../shell/shell-style'
import { createBuildShellSection } from './build-shell'

const PREVIEW_SHELL_TEMPLATE = [PREVIEW_SHELL_HEAD, PREVIEW_SHELL_STYLE, PREVIEW_SHELL_RUNTIME, PREVIEW_SHELL_BODY].join(
  '',
)
const BUILD_SHELL_SECTION = createBuildShellSection({
  innerHtmlToken: '__PREVIEW_INNER_HTML__',
  resetCssToken: '__PREVIEW_RESET_CSS__',
  styleCssToken: '__PREVIEW_STYLE_CSS__',
})

export const createServerScript = (entryPoint: string | null) => `
const http = require('http');
const fs = require('fs');
const path = require('path');

const ENTRY_POINT = ${entryPoint ? `'${entryPoint}'` : 'null'};

const PREVIEW_SHELL_TEMPLATE = ${JSON.stringify(PREVIEW_SHELL_TEMPLATE)};
${BUILD_SHELL_SECTION}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, 'http://localhost');
  let filePath = '.' + url.pathname;
  
  if (filePath === './') {
    if (ENTRY_POINT) {
      filePath = ENTRY_POINT;
    } else {
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
