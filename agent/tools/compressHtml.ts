import { minify } from "html-minifier-terser";

export async function compressHtml(html: string): Promise<string> {
  return minify(html, {
    collapseWhitespace: true,
    conservativeCollapse: true,
    removeComments: true,
    keepClosingSlash: true,
    caseSensitive: true,
    minifyCSS: false,
    minifyJS: false,
  });
}
