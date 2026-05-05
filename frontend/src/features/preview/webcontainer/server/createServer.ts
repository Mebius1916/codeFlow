import { PREVIEW_SHELL_BODY } from '../shell/shellBody'
import { PREVIEW_SHELL_HEAD } from '../shell/shellHead'
import { PREVIEW_SHELL_RUNTIME } from '../shell/shellRuntime'
import { PREVIEW_SHELL_STYLE } from '../shell/shellStyle'

const PREVIEW_SHELL_TEMPLATE = [PREVIEW_SHELL_HEAD, PREVIEW_SHELL_STYLE, PREVIEW_SHELL_RUNTIME, PREVIEW_SHELL_BODY].join(
  '',
)

export const createServerScript = () => `
const http = require('http');

const PREVIEW_SHELL_TEMPLATE = ${JSON.stringify(PREVIEW_SHELL_TEMPLATE)};

const server = http.createServer((_req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/html',
    'Access-Control-Allow-Origin': '*'
  });
  res.end(PREVIEW_SHELL_TEMPLATE, 'utf-8');
});

server.listen(3111);
`
