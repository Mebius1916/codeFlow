interface BuildShellSectionOptions {
  innerHtmlToken: string
  resetCssToken: string
  styleCssToken: string
}

export function createBuildShellSection(input: BuildShellSectionOptions) {
  return `
const readTextIfExists = (filePath) => {
  if (!fs.existsSync(filePath)) return null;
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch (_) {
    return null;
  }
};

const resolveTextFromDirs = (fileName, dirs) => {
  for (let i = 0; i < dirs.length; i += 1) {
    const p = path.join(dirs[i], fileName);
    const t = readTextIfExists(p);
    if (t != null) return t;
  }
  return '';
};

const CSS_DIRS = ENTRY_POINT ? [path.dirname(ENTRY_POINT), '.'] : ['.'];
const RESET_CSS_TEXT = resolveTextFromDirs('reset.css', CSS_DIRS);
const STYLE_CSS_TEXT = resolveTextFromDirs('style.css', CSS_DIRS);

// 约定：reset.css / style.css / index.html 以及静态资源都在 /src 下。

// 替换 css 里的 url
const absolutizeCssUrls = (cssText, base) => {
  return String(cssText).replace(/url\\((['"]?)(.*?)\\1\\)/g, (m, q, raw) => {
    const u = String(raw).trim();
    try {
      return 'url(' + q + new URL(u, base).href + q + ')';
    } catch (_) {
      return 'url(' + q + u + q + ')';
    }
  });
};

// 替换 html 里的 url
const absolutizeHtmlAttrs = (html, base) => {
  let out = String(html);
  out = out.replace(/(<img\\b[^>]*\\bsrc\\s*=\\s*)(['"])(.*?)\\2/gi, (m, prefix, q, v) => {
    try {
      return prefix + q + new URL(String(v).trim(), base).href + q;
    } catch (_) {
      return m;
    }
  });
  return out;
};

const buildShell = (innerHtml, origin) => {
  const base = String(origin || '').replace(/\\/$/, '');
  const nextInnerHtml = absolutizeHtmlAttrs(innerHtml, base);
  const nextResetCss = absolutizeCssUrls(RESET_CSS_TEXT, base);
  const nextStyleCss = absolutizeCssUrls(STYLE_CSS_TEXT, base);

  return PREVIEW_SHELL_TEMPLATE
    .replace(${JSON.stringify(input.innerHtmlToken)}, nextInnerHtml)
    .replace(${JSON.stringify(input.resetCssToken)}, nextResetCss)
    .replace(${JSON.stringify(input.styleCssToken)}, nextStyleCss);
};
`.trim()
}
