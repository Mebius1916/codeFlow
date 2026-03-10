import { useCallback } from "react";
import { useEditorStore, useShallow } from "@collaborative-editor/shared";
import { setSnapshot } from "@collaborative-editor/yjs-local-forage";
import type { FigmaParseResult } from "./useFigmaUrlParser";
import { getCachedContentByUrl, setCachedPreviewSize } from "../utils/url-cache";
import { handleFigmaConvertSuccess as handleFigmaConvertSuccessImpl } from "../utils/figma-convert";

export function useFigmaConvertSuccess(roomId: string) {
  const { initializeFiles, openFile } = useEditorStore(
    useShallow((state) => ({
      initializeFiles: state.initializeFiles,
      openFile: state.openFile,
    }))
  );

  return useCallback(
    async (result: FigmaParseResult) => {
      await handleFigmaConvertSuccessImpl(result, {
        getCachedContentByUrl,
        initializeFiles,
        openFile,
      });

      const files = useEditorStore.getState().files;
      await setSnapshot(roomId, files);

      const size = result.codegen_result?.size;
      if (size?.width && size?.height) {
        setCachedPreviewSize(roomId, size);
      }
    },
    [initializeFiles, openFile, roomId]
  );
}
