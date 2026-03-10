import refreshIconUrl from '../assets/Refresh.svg'

type TopBarActionsProps = {
  onPreviewRefresh?: () => void
  onPreviewFullscreenToggle?: () => void
  isPreviewFullscreen?: boolean
}

export function TopBarActions({
  onPreviewRefresh,
  onPreviewFullscreenToggle,
  isPreviewFullscreen,
}: TopBarActionsProps) {
  return (
    <div
      className="flex items-center h-full px-3 w-full justify-between"
      style={{ backgroundColor: 'rgb(25, 30, 50)' }}
    >
       <h3 className="text-xs font-semibold text-gray-300 uppercase tracking-wider">PREVIEW</h3>
       <div className="flex items-center gap-2">
         <button
           onClick={onPreviewRefresh}
           className="w-7 h-7 rounded-md hover:bg-[#2a2f4c] transition-colors flex items-center justify-center"
           disabled={!onPreviewRefresh}
           title="刷新预览"
         >
           <img
             src={refreshIconUrl}
             alt="Refresh"
             className="w-4 h-4 opacity-70"
             style={{ filter: 'brightness(0) invert(1)' }}
           />
         </button>
         <button
           onClick={onPreviewFullscreenToggle}
           className={`w-7 h-7 rounded-md transition-colors flex items-center justify-center ${
             isPreviewFullscreen ? 'bg-[#1337ec]/20' : 'hover:bg-[#2a2f4c]'
           }`}
           disabled={!onPreviewFullscreenToggle}
           title={isPreviewFullscreen ? '退出全屏' : '全屏预览'}
         >
           <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
             <path
               d="M8 3H5a2 2 0 0 0-2 2v3"
               stroke="white"
               strokeOpacity="0.7"
               strokeWidth="2"
               strokeLinecap="round"
             />
             <path
               d="M16 3h3a2 2 0 0 1 2 2v3"
               stroke="white"
               strokeOpacity="0.7"
               strokeWidth="2"
               strokeLinecap="round"
             />
             <path
               d="M3 16v3a2 2 0 0 0 2 2h3"
               stroke="white"
               strokeOpacity="0.7"
               strokeWidth="2"
               strokeLinecap="round"
             />
             <path
               d="M21 16v3a2 2 0 0 1-2 2h-3"
               stroke="white"
               strokeOpacity="0.7"
               strokeWidth="2"
               strokeLinecap="round"
             />
           </svg>
         </button>
       </div>
    </div>
  );
}
