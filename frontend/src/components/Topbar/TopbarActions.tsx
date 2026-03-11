import shareIconUrl from '../../../assets/Share.svg';
import settingIconUrl from '../../../assets/Setting.svg';

interface TopbarActionsProps {
  onShare?: () => void;
  shareEnabled?: boolean;
}

export function TopbarActions({ onShare, shareEnabled }: TopbarActionsProps) {
  return (
    <div className="flex items-center gap-2">
      {onShare && (
        <button 
          onClick={onShare}
          className={`w-6 h-6 rounded-md group transition-colors focus:outline-none flex items-center justify-center ${
            shareEnabled ? 'bg-[#1337ec]/20' : 'hover:bg-[#2a2f4c]'
          }`}
          title={shareEnabled ? '已开启协作' : '开启协作分享'}
        >
          <img 
            src={shareIconUrl} 
            alt="Share" 
            className={`w-3 h-3 transition-opacity ${shareEnabled ? '' : 'opacity-60 group-hover:opacity-100'}`}
            style={{ 
              filter: shareEnabled ? 'invert(48%) sepia(79%) saturate(2476%) hue-rotate(215deg) brightness(98%) contrast(92%)' : 'brightness(0) invert(1)' 
            }}
          />
        </button>
      )}

      <button className="w-6 h-6 hover:bg-[#2a2f4c] group rounded-md transition-colors focus:outline-none flex items-center justify-center">
        <img 
          src={settingIconUrl} 
          alt="Settings" 
          className="w-3 h-3 opacity-60 group-hover:opacity-100 transition-opacity" 
          style={{ filter: 'brightness(0) invert(1)' }}
        />
      </button>
    </div>
  );
}
