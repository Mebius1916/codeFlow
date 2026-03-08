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
      "assets/icons/remote-logo.svg": "../assets/Code.svg",
    }),
    [],
  );

  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    const init = async () => {
      const snapshot = await getSnapshot(roomId);
      const sourceFiles: Record<string, string> =
        snapshot && Object.keys(snapshot).length > 0 ? (snapshot as Record<string, string>) : initialFiles;

      // 打开第一个文件
      const firstFile = Object.keys(sourceFiles)[0];
      
      // 注册路径
      Object.keys(sourceFiles).forEach((path) => {
        addFile(path, '');
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

    // 资源内容懒加载器
    const loadAssetContent = (activeFile: string, assetUrl: string) => {
      const currentContent = useEditorStore.getState().activeContent;
      if (currentContent instanceof Uint8Array) return;
      fetch(assetUrl)
        .then((res) => res.arrayBuffer())
        .then((buffer) => {
          const uint8Array = new Uint8Array(buffer);
          updateFileContent(activeFile, uint8Array);
        })
        .catch((err) => {
          console.error('[Assets] 加载失败', { path: activeFile, url: assetUrl, error: err });
        });
    };

    // 文本内容懒加载器
    const loadTextContent = (activeFile: string) => {
      const currentContent = useEditorStore.getState().activeContent;
      if (currentContent !== null) return;
      getSnapshot(roomId).then((snapshot) => {
        if (!snapshot) return;
        if (useEditorStore.getState().activeFile !== activeFile) return;
        const content = snapshot[activeFile] ?? '';
        if (typeof content === 'string') {
          updateFileContent(activeFile, content);
        }
      });
    };

    const handleActiveFileChange = (activeFile: string | null) => {
      if (!activeFile || activeFile === previousFile) return;
      previousFile = activeFile;
      // 如果没有路径则加载文本内容
      const assetUrl = initialAssets[activeFile];
      if (assetUrl) {
        loadAssetContent(activeFile, assetUrl);
        return;
      }
      loadTextContent(activeFile);
    };

    const unsubscribe = useEditorStore.subscribe((state) => {
      handleActiveFileChange(state.activeFile);
    });

    return () => {
      unsubscribe();
    };
  }, [initialAssets, roomId]);

  return { initialFiles };
}
