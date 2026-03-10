import { Suspense, lazy, useState } from "react";
import { Loading } from "@collaborative-editor/shared";
import { usePreviewResizeCssVars } from "@collaborative-editor/preview";
import { usePreviewContentSize } from "../hooks/usePreviewContentSize";

const LazyPreviewPanel = lazy(async () => {
  const mod = await import("@collaborative-editor/preview");
  return { default: mod.PreviewPanel };
});

interface PreviewContainerProps {
  roomId: string;
}

export function PreviewContainer({ roomId }: PreviewContainerProps) {
  const [previewEnabled] = useState(true);
  const { onMouseDown, onMouseEnter, onMouseLeave, handleStyle } = usePreviewResizeCssVars();
  const previewContentSize = usePreviewContentSize(roomId);

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
          <LazyPreviewPanel roomId={roomId} previewContentSize={previewContentSize} />
        </Suspense>
      )}
    </div>
  );
}
