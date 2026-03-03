export const Loading = ({ text = '正在初始化编辑器...' }: { text?: string }) => (
  <div className="flex flex-col items-center justify-center h-full bg-[#1e1e1e] text-gray-400 gap-3">
    <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
    <span className="text-sm font-medium animate-pulse">{text}</span>
  </div>
)