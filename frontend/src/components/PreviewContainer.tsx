import { Suspense, lazy, useEffect, useState } from "react";
import { Loading } from "@collaborative-editor/shared";
import { usePreviewResizeCssVars } from "@collaborative-editor/preview";
import { getCachedPreviewSize, type PreviewContentSize } from "../utils/url-cache";

const LazyPreviewPanel = lazy(async () => {
  const mod = await import("@collaborative-editor/preview");
  return { default: mod.PreviewPanel };
});

interface PreviewContainerProps {
  roomId: string;
  refreshKey: number;
}

export function PreviewContainer({ roomId, refreshKey }: PreviewContainerProps) {
  const [previewEnabled] = useState(true);
  const [previewContentSize, setPreviewContentSize] = useState<PreviewContentSize | null>(null);
  const { onMouseDown, onMouseEnter, onMouseLeave, handleStyle } = usePreviewResizeCssVars();

  useEffect(() => {
    let cancelled = false;
    getCachedPreviewSize(roomId).then((size) => {
      if (!cancelled) setPreviewContentSize(size ?? null);
    });
    return () => {
      cancelled = true;
    };
  }, [roomId, refreshKey]);

  return (
    <div
      className="border-l flex flex-col relative transition-colors box-border"
      style={{ 
        width: 'var(--preview-panel-width, 300px)',
        borderLeftColor: 'var(--preview-panel-border-color, #2a2f4c)',
        backgroundColor: 'rgb(15, 17, 24)'
      }}
    >
      <div
        className="absolute left-0 top-0 bottom-0 w-1 cursor-col-resize z-10 transition-colors"
        onMouseDown={onMouseDown}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        style={handleStyle}
      />
      {previewEnabled && (
        <Suspense fallback={
          <Loading 
            text="预览加载中..." 
            detail={'Waiting'}
          />
        }>
          <LazyPreviewPanel key={refreshKey} roomId={roomId} previewContentSize={previewContentSize} />
        </Suspense>
      )}
    </div>
  );
}
