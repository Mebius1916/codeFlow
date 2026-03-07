import { FeatureProvider, useEditorStore, useResizable, useUiStore, useShallow } from "@collaborative-editor/shared";
import { FileTreePanel, useFileTreeActions } from "@collaborative-editor/file-tree";
import { TopBar } from "@collaborative-editor/topbar";
import { lazy, Suspense, useMemo, useState } from "react";
import { Loading } from "./components/Loading";
import { useFileInitialization } from "./hooks/useFileInitialization";

const LazyEditor = lazy(async () => {
  const mod = await import("@collaborative-editor/editor");
  return { default: mod.Editor };
});

const LazyPreviewPanel = lazy(async () => {
  const mod = await import("@collaborative-editor/preview");
  return { default: mod.PreviewPanel };
});

type LazyEditorType = React.ComponentType<{
  roomId: string;
  user: { id: string; name?: string; color?: string };
  wsUrl?: string;
  initialFiles?: Record<string, string>;
  collaborationEnabled?: boolean;
  onSave?: (files: Record<string, string>) => void;
}>;
const Editor = LazyEditor as unknown as LazyEditorType;
const PreviewPanel = LazyPreviewPanel as unknown as React.ComponentType;

export default function App() {
  const userId = useMemo(() => `demo_${Math.random().toString(36).slice(2, 9)}`, []);
  const fileTreeActions = useFileTreeActions();
  const { activeFile, openFiles, openFile, closeFile } = useEditorStore(
    useShallow((state) => ({
      activeFile: state.activeFile,
      openFiles: state.openFiles,
      openFile: state.openFile,
      closeFile: state.closeFile,
    }))
  );
  const { previewWidth, setPreviewWidth } = useUiStore(
    useShallow((state) => ({
      previewWidth: state.previewWidth,
      setPreviewWidth: state.setPreviewWidth,
    }))
  );
  const [previewKey, setPreviewKey] = useState(0);
  const [previewEnabled, setPreviewEnabled] = useState(false);
  const [collaborationEnabled, setCollaborationEnabled] = useState(false);

  // Initialize example files
  const { initialFiles } = useFileInitialization("demo-room");

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
          onShare={() => setCollaborationEnabled(true)}
          shareEnabled={collaborationEnabled}
        />

        <div className="flex flex-1 overflow-hidden relative border-t border-[#2a2f4c]">
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
              <Suspense fallback={<Loading text="正在初始化编辑器..." />}>
                <Editor
                  roomId="demo-room"
                  user={{
                    id: userId,
                    name: "演示用户",
                  }}
                  wsUrl="ws://localhost:8848"
                  initialFiles={initialFiles}
                  collaborationEnabled={collaborationEnabled}
                />
              </Suspense>
            </div>
          </div>

          <div
            className="border-l border-[#2a2f4c] flex flex-col bg-[#1e1e1e] relative"
            style={{ width: previewWidth }}
          >
            <div className="h-8 bg-[#111827] border-b border-[#2a2f4c] flex items-center justify-between px-2">
              <span className="text-xs text-gray-400">预览</span>
              <button
                className="text-xs text-blue-400 hover:text-blue-300"
                onClick={() => {
                  if (!previewEnabled) {
                    setPreviewEnabled(true);
                    return;
                  }
                  setPreviewKey((prev) => prev + 1);
                }}
              >
                {previewEnabled ? "刷新" : "启动"}
              </button>
            </div>
            <div
              className="absolute left-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-blue-500/50 z-10 -ml-0.5 transition-colors"
              onMouseDown={handlePreviewResize}
            />
            {previewEnabled ? (
              <Suspense fallback={<Loading text="预览加载中..." />}>
                <PreviewPanel key={previewKey} />
              </Suspense>
            ) : (
              <div className="flex-1 flex items-center justify-center text-xs text-gray-500">
                点击启动预览
              </div>
            )}
          </div>
        </div>
      </div>
    </FeatureProvider>
  );
}
