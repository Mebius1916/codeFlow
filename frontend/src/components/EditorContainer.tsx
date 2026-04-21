import { Suspense, lazy } from "react";
import { Loading } from "@collaborative-editor/shared";

const LazyEditor = lazy(async () => {
  const mod = await import("@collaborative-editor/editor");
  return { default: mod.Editor };
});

export function EditorContainer() {
  return (
    <div className="flex flex-1 flex-col overflow-hidden relative">
      <div className="flex-1 overflow-hidden relative">
        <Suspense fallback={<Loading text="正在初始化编辑器..." />}>
          <LazyEditor />
        </Suspense>
      </div>
    </div>
  );
}
