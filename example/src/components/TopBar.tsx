import { FileTabsBar, type FileTabsBarProps } from "./FileTabsBar";
import { FileTreeHeader } from "@collaborative-editor/core";

export type TopBarProps = FileTabsBarProps & {
  onNewFile: () => void;
  onNewFolder: () => void;
};

export function TopBar(props: TopBarProps) {
  return (
    <div className="h-10 bg-[#18181b] flex items-center">
      <div className="w-[240px] flex-shrink-0 border-r border-[#2a2f4c] h-full overflow-hidden">
        <FileTreeHeader
          width={240}
          withRightBorder={false}
          onNewFile={props.onNewFile}
          onNewFolder={props.onNewFolder}
        />
      </div>
      <FileTabsBar {...props} />
    </div>
  );
}
