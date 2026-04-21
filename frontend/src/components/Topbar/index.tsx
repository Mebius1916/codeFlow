import { Brand } from './Brand';
import { SearchBox } from './SearchBox';
import { TopbarActions } from './TopbarActions';

export function Topbar() {
  return (
    <div 
      className="h-[56px] border-b border-[#2a2f4c] flex items-center px-4 justify-between relative"
      style={{ backgroundColor: 'rgb(25, 30, 50)' }}
    >
      <Brand />
      <SearchBox />
      <TopbarActions />
    </div>
  );
}
