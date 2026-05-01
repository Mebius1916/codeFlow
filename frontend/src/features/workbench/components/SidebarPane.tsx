import { FileTreePanel, type useFileTreeActions } from "@/features/file-tree";

interface SidebarPaneProps {
  fileTreeActions: ReturnType<typeof useFileTreeActions>;
}

export function SidebarPane({ fileTreeActions }: SidebarPaneProps) {
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
