import logoUrl from '../../assets/Logo.svg';

export function Brand() {
  return (
    <div className="flex items-center gap-3">
      <div 
        className="flex items-center justify-center"
        style={{ 
          width: '32px', 
          height: '32px', 
          borderRadius: '8px', 
          backgroundColor: 'rgba(19, 55, 236, 0.2)' 
        }}
      >
        <img src={logoUrl} alt="Logo" className="w-[15px] h-[9px]" />
      </div>
      <span className="text-white font-bold text-lg tracking-tight select-none">
        Figma2Code <span className="text-blue-400">IDE</span>
      </span>
    </div>
  );
}
