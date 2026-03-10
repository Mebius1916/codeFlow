import { useCallback } from "react";
import { useEditorStore, useShallow } from "@collaborative-editor/shared";
import { setSnapshot } from "@collaborative-editor/yjs-local-forage";
import type { FigmaParseResult } from "./useFigmaUrlParser";
import { getCachedContentByUrl } from "../utils/cache/image";
import { handleFigmaConvertSuccess as handleFigmaConvertSuccessImpl } from "../utils/figma/convert-success";

export function useFigmaConvertSuccess() {
  const { initializeFiles, openFile } = useEditorStore(
    useShallow((state) => ({
      initializeFiles: state.initializeFiles,
      openFile: state.openFile,
    }))
  );

  return useCallback(
    async (roomId: string, result: FigmaParseResult) => {
      await handleFigmaConvertSuccessImpl(result, {
        getCachedContentByUrl,
        initializeFiles,
        openFile,
      });

      const files = useEditorStore.getState().files;
      await setSnapshot(roomId, files);
    },
    [initializeFiles, openFile]
  );
}
