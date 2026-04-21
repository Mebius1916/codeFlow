import { closeFile, FeatureProvider, openFile, useEditorStore, useShallow } from "@collaborative-editor/shared";
import { useFileTreeActions } from "@collaborative-editor/file-tree";
import { WorkbenchHeader } from "@collaborative-editor/workbench-header";
import { useState } from "react";
import { Sidebar } from "../components/Sidebar";
import { EditorContainer } from "../components/EditorContainer";
import { PreviewContainer } from "../components/PreviewContainer";
import { Topbar } from "../components/topbar/index";

export function EditorPage() {
  const fileTreeActions = useFileTreeActions();
  const { activeFile, openFiles } = useEditorStore(
    useShallow((state) => ({
      activeFile: state.activeFile,
      openFiles: state.openFiles,
    }))
  );
  const [previewRevision, setPreviewRevision] = useState(0);
  const [isPreviewFullscreen, setIsPreviewFullscreen] = useState(false);

  return (
    <FeatureProvider features={{ fileTree: true, fileTreeHeader: false, toolbar: false, preview: true }}>
      <div className="h-screen w-screen flex flex-col bg-gray-900">
        <Topbar />

        <WorkbenchHeader
          activeFile={activeFile}
          openFiles={openFiles}
          onOpenFile={openFile}
          onCloseFile={closeFile}
          onNewFile={() => fileTreeActions.handleStartCreate(null, "file")}
          onNewFolder={() => fileTreeActions.handleStartCreate(null, "folder")}
          onPreviewRefresh={() => setPreviewRevision((value) => value + 1)}
          onPreviewFullscreenToggle={() => setIsPreviewFullscreen((value) => !value)}
          isPreviewFullscreen={isPreviewFullscreen}
        />

        <div className="flex flex-1 overflow-hidden relative border-t border-[#2a2f4c]">
          {!isPreviewFullscreen && <Sidebar fileTreeActions={fileTreeActions} />}

          {!isPreviewFullscreen && <EditorContainer key="editor" />}

          <PreviewContainer key={`preview:${previewRevision}`} isFullscreen={isPreviewFullscreen} />
        </div>
      </div>
    </FeatureProvider>
  );
}
