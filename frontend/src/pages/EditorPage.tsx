import { FeatureProvider, useEditorStore, useShallow, useUiStore } from "@collaborative-editor/shared";
import { useFileTreeActions } from "@collaborative-editor/file-tree";
import { WorkbenchHeader } from "@collaborative-editor/workbench-header";
import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { Sidebar } from "../components/Sidebar";
import { EditorContainer } from "../components/EditorContainer";
import { PreviewContainer } from "../components/PreviewContainer";
import { Topbar } from "../components/Topbar/index";

export function EditorPage() {
  const { roomId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const resolvedRoomId = roomId ?? "";
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
  const [previewRevision, setPreviewRevision] = useState(0);
  const [isPreviewFullscreen, setIsPreviewFullscreen] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get("collab") === "1") {
      setCollaborationEnabled(true);
    }

    const ps = params.get("ps");
    if (ps) {
      const match = ps.match(/^(\d+)x(\d+)$/);
      if (match) {
        const width = Number(match[1]);
        const height = Number(match[2]);
        if (Number.isFinite(width) && Number.isFinite(height) && width > 0 && height > 0) {
          useUiStore.getState().setPreviewContentSize({ width, height });
        }
      }
    }
  }, [location.search]);

  if (!resolvedRoomId) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-gray-900 text-gray-300">
        未指定 roomId，请从主页进入。
      </div>
    );
  }

  return (
    <FeatureProvider features={{ fileTree: true, fileTreeHeader: false, toolbar: false, preview: true }}>
      <div className="h-screen w-screen flex flex-col bg-gray-900">
        <Topbar
          onShare={() => {
            setCollaborationEnabled(true);
            const params = new URLSearchParams(location.search);
            if (params.get("collab") !== "1") {
              params.set("collab", "1");
            }

            const size = useUiStore.getState().previewContentSize;
            if (size?.width && size?.height) {
              params.set("ps", `${size.width}x${size.height}`);
            } else {
              params.delete("ps");
            }

            navigate({ pathname: location.pathname, search: params.toString() }, { replace: true });

            const shareUrl = `${window.location.origin}${location.pathname}?${params.toString()}`;
            if (navigator.clipboard?.writeText) {
              navigator.clipboard.writeText(shareUrl);
            }
          }}
          shareEnabled={collaborationEnabled}
        />
        <WorkbenchHeader
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
          onPreviewRefresh={() => setPreviewRevision((value) => value + 1)}
          onPreviewFullscreenToggle={() => setIsPreviewFullscreen((value) => !value)}
          isPreviewFullscreen={isPreviewFullscreen}
        />

        <div className="flex flex-1 overflow-hidden relative border-t border-[#2a2f4c]">
          {!isPreviewFullscreen && <Sidebar fileTreeActions={fileTreeActions} />}

          {!isPreviewFullscreen && (
            <EditorContainer
              key={`editor:${resolvedRoomId}`}
              roomId={resolvedRoomId}
              userId={userId}
              collaborationEnabled={collaborationEnabled}
            />
          )}

          <PreviewContainer
            key={`preview:${resolvedRoomId}:${previewRevision}`}
            roomId={resolvedRoomId}
            isFullscreen={isPreviewFullscreen}
          />
        </div>
      </div>
    </FeatureProvider>
  );
}
