import { useEditorStore, useShallow } from "@collaborative-editor/shared";
import type { FigmaParseResult } from "./useFigmaUrlParser";
import { getCachedResourceByAssetPath } from "../utils/cache/image";
import { handleFigmaConvertSuccess as handleFigmaConvertSuccessImpl } from "../utils/figma/convert-success";

export function useFigmaConvertSuccess() {
  const { initializeFiles, openFile } = useEditorStore(
    useShallow((state) => ({
      initializeFiles: state.initializeFiles,
      openFile: state.openFile,
    }))
  );

  return async (result: FigmaParseResult) => {
    await handleFigmaConvertSuccessImpl(result, {
      getCachedResourceByAssetPath,
      initializeFiles,
      openFile,
    });
  };
}
