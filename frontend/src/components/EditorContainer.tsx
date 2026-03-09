import { Suspense, lazy } from "react";
import { Loading } from "@collaborative-editor/shared";

const LazyEditor = lazy(async () => {
  const mod = await import("@collaborative-editor/editor");
  return { default: mod.Editor };
});

type EditorProps = {
  roomId: string;
  userId: string;
  initialFiles?: Record<string, string>;
  collaborationEnabled?: boolean;
};

export function EditorContainer({ roomId, userId, initialFiles, collaborationEnabled }: EditorProps) {
  return (
    <div className="flex flex-1 flex-col overflow-hidden relative">
      <div className="flex-1 overflow-hidden relative">
        <Suspense fallback={<Loading text="正在初始化编辑器..." />}>
          <LazyEditor
            roomId={roomId}
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
  );
}
