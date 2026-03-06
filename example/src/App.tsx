import { FeatureProvider, useEditorStore, useResizable, useUiStore } from "@collaborative-editor/shared";
import { FileTreePanel, useFileTreeActions } from "@collaborative-editor/file-tree";
import { PreviewPanel } from "@collaborative-editor/preview";
import { TopBar } from "@collaborative-editor/topbar";
import { lazy, Suspense, useEffect, useMemo, useRef } from "react";

const LazyEditor = lazy(async () => {
  const mod = await import("@collaborative-editor/editor");
  return { default: mod.Editor };
});

type LazyEditorType = React.ComponentType<{
  roomId: string;
  user: { id: string; name?: string; color?: string };
  wsUrl?: string;
  onSave?: (files: Record<string, string>) => void;
}>;
const Editor = LazyEditor as unknown as LazyEditorType;

export default function App() {
  const userId = useMemo(() => `demo_${Math.random().toString(36).slice(2, 9)}`, []);
  const fileTreeActions = useFileTreeActions();
  const { activeFile, openFiles, openFile, closeFile, addFile } = useEditorStore();
  const { previewWidth, setPreviewWidth } = useUiStore();
  const initializedRef = useRef(false);

  const initialFiles = useMemo(
    () => ({
      "src/index.html": ``,
      "src/style.css": ``,
      "src/reset.css": ``,
      "assets/remote-logo.png": "../assets/Code.svg",
    }),
    [],
  );

  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    Object.entries(initialFiles).forEach(([path, content]) => {
      addFile(path, content);
    });

    const firstFile = Object.keys(initialFiles)[0];
    if (firstFile) {
      openFile(firstFile);
    }
  }, [addFile, openFile, initialFiles]);

  const { handleMouseDown: handlePreviewResize } = useResizable({
    initialSize: previewWidth,
    onSizeChange: setPreviewWidth,
    direction: "left",
    minSize: 200,
    maxSize: 800,
  });

  return (
    <FeatureProvider features={{ fileTree: true, fileTreeHeader: false, toolbar: false, preview: true }}>
      <div className="h-screen w-screen flex flex-col bg-gray-900">
        <TopBar
          activeFile={activeFile}
          openFiles={openFiles}
          onOpenFile={(path: string) => {
            openFile(path);
          }}
          onCloseFile={(path: string) => {
            closeFile(path);
          }}
          onNewFile={() => fileTreeActions.handleStartCreate(null, "file")}
          onNewFolder={() => fileTreeActions.handleStartCreate(null, "folder")}
        />

        <div className="flex flex-1 overflow-hidden relative">
          <div
            className="h-full border-r box-border flex flex-col"
            style={{
              width: "var(--file-tree-width, 250px)",
              backgroundColor: "rgb(15, 17, 25)",
              borderRightColor: "var(--file-tree-border-color, #2a2f4c)",
            }}
          >
            <FileTreePanel actions={fileTreeActions} showHeader={false} />
          </div>

          <div className="flex flex-1 flex-col overflow-hidden relative">
            <div className="flex-1 overflow-hidden relative">
              <Suspense
                fallback={
                  <div className="h-full w-full flex items-center justify-center text-gray-400 text-sm">
                    正在加载编辑器...
                  </div>
                }
              >
                <Editor
                  roomId="demo-room"
                  user={{
                    id: userId,
                    name: "演示用户",
                  }}
                  wsUrl="ws://localhost:8848"
                />
              </Suspense>
            </div>
          </div>

          <div
            className="border-l border-[#2a2f4c] flex flex-col bg-[#1e1e1e] relative"
            style={{ width: previewWidth }}
          >
            <div
              className="absolute left-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-blue-500/50 z-10 -ml-0.5 transition-colors"
              onMouseDown={handlePreviewResize}
            />
            <PreviewPanel />
          </div>
        </div>
      </div>
    </FeatureProvider>
  );
}
