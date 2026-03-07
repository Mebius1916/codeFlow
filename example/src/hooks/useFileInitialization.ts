import { useEffect, useMemo, useRef } from 'react';
import { useEditorStore } from '@collaborative-editor/shared';
import { getSnapshot } from '@collaborative-editor/yjs-local-forage';

export function useFileInitialization(roomId: string) {
  const { addFile, openFile, updateFileContent } = useEditorStore.getState();
  const initializedRef = useRef(false);

  const initialFiles = useMemo(
    () => ({
      "src/index.html": ``,
      "src/style.css": ``,
      "src/reset.css": ``,
    }),
    [],
  );

  const initialAssets = useMemo<Record<string, string>>(
    () => ({
      "assets/remote-logo.svg": "../assets/Code.svg",
    }),
    [],
  );

  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    const init = async () => {
      const snapshot = await getSnapshot(roomId);
      const sourceFiles: Record<string, string> =
        snapshot && Object.keys(snapshot).length > 0 ? snapshot : initialFiles;
      const firstFile = Object.keys(sourceFiles)[0];

      Object.keys(sourceFiles).forEach((path) => {
        const content = path === firstFile ? sourceFiles[path] : '';
        addFile(path, content);
      });

      Object.keys(initialAssets).forEach((path) => {
        addFile(path, '');
      });

      if (firstFile) {
        openFile(firstFile);
      }
    };

    init();
  }, [initialFiles, initialAssets, roomId]);

  useEffect(() => {
    let previousFile = useEditorStore.getState().activeFile;
    const unsubscribe = useEditorStore.subscribe((state) => {
      const activeFile = state.activeFile;
      if (activeFile === previousFile) return;

      if (previousFile && initialAssets[previousFile]) {
        updateFileContent(previousFile, '');
      }

      if (!activeFile) {
        previousFile = activeFile;
        return;
      }

      const assetUrl = initialAssets[activeFile];
      if (assetUrl) {
        const currentContent = useEditorStore.getState().files[activeFile];
        if (!(currentContent instanceof Uint8Array)) {
          fetch(assetUrl)
            .then((res) => res.arrayBuffer())
            .then((buffer) => {
              const uint8Array = new Uint8Array(buffer);
              updateFileContent(activeFile, uint8Array);
            })
            .catch((err) => {
              console.error('[Assets] 加载失败', { path: activeFile, url: assetUrl, error: err });
            });
        }
        previousFile = activeFile;
        return;
      }

      const currentContent = useEditorStore.getState().files[activeFile];
      if (typeof currentContent === 'string' && currentContent.length === 0) {
        getSnapshot(roomId).then((snapshot) => {
          if (!snapshot) return;
          if (useEditorStore.getState().activeFile !== activeFile) return;
          const content = snapshot[activeFile] ?? '';
          if (content) {
            updateFileContent(activeFile, content);
          }
        });
      }

      previousFile = activeFile;
    });

    return () => {
      unsubscribe();
    };
  }, [initialAssets]);

  return { initialFiles };
}
