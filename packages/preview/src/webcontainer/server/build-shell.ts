export function createBuildShellSection(input: {
  innerHtmlToken: string
  resetCssToken: string
  styleCssToken: string
}) {
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

const buildShell = (innerHtml) => {
  return PREVIEW_SHELL_TEMPLATE
    .replace(${JSON.stringify(input.innerHtmlToken)}, innerHtml)
    .replace(${JSON.stringify(input.resetCssToken)}, RESET_CSS_TEXT)
    .replace(${JSON.stringify(input.styleCssToken)}, STYLE_CSS_TEXT);
};
`.trim()
}
