import { Suspense, lazy } from "react";
import { useUiStore } from '@/features/workspace/store/uiStore';
import { Loading } from '@/ui/Loading';
import { useShallow } from 'zustand/react/shallow';
import { usePreviewResizeCssVars } from "@/features/preview";

const LazyPreviewPanel = lazy(async () => {
  const mod = await import("@/features/preview");
  return { default: mod.PreviewPanel };
});

interface PreviewPaneProps {
  isFullscreen?: boolean;
}

export function PreviewPane({ isFullscreen }: PreviewPaneProps) {
  const { onMouseDown, onMouseEnter, onMouseLeave, handleStyle } = usePreviewResizeCssVars();
  const previewContentSize = useUiStore(useShallow((state) => state.previewContentSize));
  return (
    <div
      className={`flex flex-col relative transition-colors box-border ${isFullscreen ? 'flex-1' : 'border-l'}`}
      style={{ 
        width: isFullscreen ? '100%' : 'var(--preview-panel-width, 300px)',
        borderLeftColor: isFullscreen ? 'transparent' : 'var(--preview-panel-border-color, #2a2f4c)',
        backgroundColor: 'rgb(15, 17, 24)'
      }}
    >
      {!isFullscreen && (
        <div
          className="absolute left-0 top-0 bottom-0 w-1 cursor-col-resize z-10 transition-colors"
          onMouseDown={onMouseDown}
          onMouseEnter={onMouseEnter}
          onMouseLeave={onMouseLeave}
          style={handleStyle}
        />
      )}
      <Suspense fallback={<Loading text="预览加载中..." className="bg-[rgb(12, 14, 23)] text-gray-400" />}>
        <LazyPreviewPanel
          previewContentSize={previewContentSize}
        />
      </Suspense>
    </div>
  );
}
