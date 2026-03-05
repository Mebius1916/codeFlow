import { CodeEditor, type CodeEditorRef, useFileTreeActions } from "@collaborative-editor/core";
import { useMemo, useRef, useState } from "react";
import { TopBar } from "./components/TopBar";

export default function App() {
  const userId = useMemo(() => `demo_${Math.random().toString(36).slice(2, 9)}`, []);
  const editorRef = useRef<CodeEditorRef>(null);
  const fileTreeActions = useFileTreeActions();

  // 本地状态，用于渲染自定义标签栏
  const [activeFile, setActiveFile] = useState<string | null>(null);
  const [openFiles, setOpenFiles] = useState<string[]>([]);

  const initialFiles = useMemo(
    () => ({
      "src/index.html": ``,
      "src/style.css": ``,
      "src/reset.css": ``,
      "assets/remote-logo.png": "../assets/Code.svg",
    }),
    [],
  );

  return (
    <div className="h-screen w-screen flex flex-col bg-gray-900">
      <TopBar
        activeFile={activeFile}
        openFiles={openFiles}
        onOpenFile={(path) => {
          editorRef.current?.openFile(path);
        }}
        onCloseFile={(path) => {
          editorRef.current?.closeFile(path);
        }}
        onNewFile={() => fileTreeActions.handleStartCreate(null, 'file')}
        onNewFolder={() => fileTreeActions.handleStartCreate(null, 'folder')}
      />

      <div className="flex-1 overflow-hidden">
        <CodeEditor
          ref={editorRef}
          roomId="demo-room"
          user={{
            id: userId,
            name: "演示用户",
          }}
          wsUrl="ws://localhost:8848"
          initialFiles={initialFiles}
          features={{
            fileTree: true,
            fileTreeHeader: false,
            preview: true,
          }}
          onStateChange={(state) => {
            setActiveFile(state.activeFile);
            setOpenFiles(state.openFiles);
          }}
          fileTreeActions={fileTreeActions}
        />
      </div>
    </div>
  );
}
