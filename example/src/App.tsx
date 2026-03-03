import { CodeEditor, type CodeEditorRef } from "@collaborative-editor/core";
import { useMemo, useRef } from "react";

export default function App() {
  const userId = useMemo(() => `demo_${Math.random().toString(36).slice(2, 9)}`, []);
  const editorRef = useRef<CodeEditorRef>(null);

  const handleOpenNewFile = () => {
    const fileName = `temp-${Date.now()}.js`;
    if (editorRef.current) {
      editorRef.current.addFile(fileName, '// Generated file\nconsole.log("Hello from external control!")');
      editorRef.current.openFile(fileName);
    }
  };

  return (
    <div className="h-screen w-screen flex flex-col">
      <div className="h-12 bg-gray-800 flex items-center px-4 gap-4">
        <h1 className="text-white font-bold">CodeFlow Demo</h1>
        <button 
          onClick={handleOpenNewFile}
          className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
        >
          外部控制：新建文件
        </button>
      </div>
      <div className="flex-1">
        <CodeEditor
          ref={editorRef}
          roomId="demo-room"
          user={{
            id: userId,
            name: "演示用户",
          }}
          wsUrl="ws://localhost:8848"
          initialFiles={{
            "main.js": `// 欢迎使用协同代码编辑器
const arr = [1, 2, 2, 3, 3, 4]
const unique = [...new Set(arr)]
console.log(unique)
`,
            "style.css": `/* 样式文件示例 */
body {
  background: #1e1e1e;
  color: #fff;
}
`,
          }}
        />
      </div>
    </div>
  );
}
