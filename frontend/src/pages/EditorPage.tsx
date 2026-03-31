import { closeFile, FeatureProvider, openFile, useEditorStore, useShallow, useUiStore } from "@collaborative-editor/shared";
import { useFileTreeActions } from "@collaborative-editor/file-tree";
import { WorkbenchHeader } from "@collaborative-editor/workbench-header";
import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { Sidebar } from "../components/Sidebar";
import copy from "copy-to-clipboard";
import { EditorContainer } from "../components/EditorContainer";
import { PreviewContainer } from "../components/PreviewContainer";
import { Topbar } from "../components/topbar/index";
import { Toast, ToastProvider, ToastTitle, ToastViewport } from "../components/ui/toast";

export function EditorPage() {
  const { roomId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const resolvedRoomId = roomId ?? "";
  const userIdRef = useRef<string>("");
  if (!userIdRef.current) {
    userIdRef.current = `demo_${Math.random().toString(36).slice(2, 9)}`;
  }
  const userId = userIdRef.current;
  const fileTreeActions = useFileTreeActions();
  const { activeFile, openFiles } = useEditorStore(
    useShallow((state) => ({
      activeFile: state.activeFile,
      openFiles: state.openFiles,
    }))
  );
  const [collaborationEnabled, setCollaborationEnabled] = useState(false);
  const [previewRevision, setPreviewRevision] = useState(0);
  const [isPreviewFullscreen, setIsPreviewFullscreen] = useState(false);
  const [toast, setToast] = useState<{ id: number; message: string } | null>(null);

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
      <ToastProvider>
        <div className="h-screen w-screen flex flex-col bg-gray-900">
          {toast && (
            <Toast
              key={toast.id}
              defaultOpen
              duration={1600}
              onOpenChange={(open) => {
                if (!open) setToast(null);
              }}
            >
              <ToastTitle>{toast.message}</ToastTitle>
            </Toast>
          )}
          <ToastViewport />

          <Topbar
            onShare={() => {
              const params = new URLSearchParams(location.search);
              if (collaborationEnabled) {
                setCollaborationEnabled(false);
                params.delete("collab");
                params.delete("ps");
                navigate({ pathname: location.pathname, search: params.toString() }, { replace: true });
                setToast({ id: Date.now(), message: "已关闭协同" });
                return;
              }

              setCollaborationEnabled(true);
              params.set("collab", "1");

              const size = useUiStore.getState().previewContentSize;
              if (size?.width && size?.height) {
                params.set("ps", `${size.width}x${size.height}`);
              } else {
                params.delete("ps");
              }

              navigate({ pathname: location.pathname, search: params.toString() }, { replace: true });

              const query = params.toString();
              const shareUrl = `${window.location.origin}${location.pathname}${query ? `?${query}` : ""}`;
              const copied = copy(shareUrl);
              setToast({ id: Date.now(), message: copied ? "链接已复制到剪贴板" : "协同已开启" });
            }}
            shareEnabled={collaborationEnabled}
          />

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
      </ToastProvider>
    </FeatureProvider>
  );
}
