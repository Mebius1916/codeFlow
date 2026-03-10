import { FeatureProvider, useEditorStore, useShallow } from "@collaborative-editor/shared";
import { useFileTreeActions } from "@collaborative-editor/file-tree";
import { TopBar as FileTreeBar } from "@collaborative-editor/topbar";
import { useCallback, useMemo, useState } from "react";
import { useSnapshotPersistence } from "./hooks/useSnapshotPersistence";
import { Sidebar } from "./components/Sidebar";
import { EditorContainer } from "./components/EditorContainer";
import { PreviewContainer } from "./components/PreviewContainer";
import { Topbar } from "./components/Topbar/index";
import { useFigmaConvertSuccess } from "./hooks/useFigmaConvertSuccess";

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
  const [collaborationEnabled, setCollaborationEnabled] = useState(false);
  const [previewKey, setPreviewKey] = useState(0);

  // 持久化管理 & 单机模式下的内容缓存 & 资源加载
  const { initialFiles } = useSnapshotPersistence({
    roomId: "demo-room",
    collaborationEnabled,
  });

  const handleConvertSuccessImpl = useFigmaConvertSuccess("demo-room");
  const handleConvertSuccess = useCallback(
    async (result: Parameters<typeof handleConvertSuccessImpl>[0]) => {
      await handleConvertSuccessImpl(result);
      setPreviewKey((k) => k + 1);
    },
    [handleConvertSuccessImpl]
  );

  return (
    <FeatureProvider features={{ fileTree: true, fileTreeHeader: false, toolbar: false, preview: true }}>
      <div className="h-screen w-screen flex flex-col bg-gray-900">
        <Topbar 
          onShare={() => setCollaborationEnabled(true)} 
          shareEnabled={collaborationEnabled}
          onConvertSuccess={handleConvertSuccess}
        />
        <FileTreeBar
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

        <div className="flex flex-1 overflow-hidden relative border-t border-[#2a2f4c]">
          <Sidebar fileTreeActions={fileTreeActions} />

          <EditorContainer
            roomId="demo-room"
            userId={userId}
            initialFiles={initialFiles}
            collaborationEnabled={collaborationEnabled}
          />

          <PreviewContainer
            roomId="demo-room"
            refreshKey={previewKey}
          />
        </div>
      </div>
    </FeatureProvider>
  );
}
