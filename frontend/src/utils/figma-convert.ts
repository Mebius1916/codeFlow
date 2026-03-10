import type { FigmaParseResult } from "../hooks/useFigmaUrlParser";
import { DEFAULT_RESET_CSS } from './default'
import { formatCss, formatHtml } from './code-format'

type FileContent = string | Uint8Array;


export async function handleFigmaConvertSuccess(
  result: FigmaParseResult,
  deps: {
    getCachedContentByUrl: (url: string) => Promise<FileContent | undefined>;
    initializeFiles: (files: Record<string, FileContent>) => void;
    openFile: (path: string) => void;
  },
) {
  if (!result.codegen_result) return;

  const { html, body, css } = result.codegen_result;
  const assetsPathMap = result.assets_path_map;

  const newFiles: Record<string, FileContent> = {
    "src/index.html": formatHtml(body ?? html),
    "src/reset.css": DEFAULT_RESET_CSS,
    "src/style.css": formatCss(css),
  };

  const assetEntries = Array.from(assetsPathMap.entries());
  const assetContents = await Promise.all(
    assetEntries.map(async ([path, url]) => {
      const content = await deps.getCachedContentByUrl(url);
      return [path, content] as const;
    }),
  );

  assetContents.forEach(([path, content]) => {
    if (content !== undefined) {
      newFiles[path] = content;
    }
  });

  deps.initializeFiles(newFiles);
  deps.openFile("src/index.html");
}
