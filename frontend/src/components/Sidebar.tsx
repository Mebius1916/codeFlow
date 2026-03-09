import { FileTreePanel, type useFileTreeActions } from "@collaborative-editor/file-tree";

interface SidebarProps {
  fileTreeActions: ReturnType<typeof useFileTreeActions>;
}

export function Sidebar({ fileTreeActions }: SidebarProps) {
  return (
    <div
      className="h-full border-r box-border flex flex-col"
      style={{
        width: "var(--file-tree-width, 250px)",
        backgroundColor: "rgb(15, 17, 25)",
        borderRightColor: "var(--file-tree-border-color, #2a2f4c)",
      }}
    >
      <FileTreePanel actions={fileTreeActions} showHeader={false} />
    </div>
  );
}
