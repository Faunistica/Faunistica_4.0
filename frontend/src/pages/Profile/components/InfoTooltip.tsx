import { Info } from 'lucide-react';
import { useState } from 'react';

interface InfoTooltipProps {
  content: string;
}

export function InfoTooltip({ content }: InfoTooltipProps) {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div className="relative inline-block">
      <button
        type="button"
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
        className="w-5 h-5 rounded-full bg-gray-200 hover:bg-[#2bb3d9] text-gray-600 hover:text-white flex items-center justify-center transition-colors"
        aria-label="Информация"
      >
        <Info className="w-3 h-3" />
      </button>

      {isVisible && (
        <div className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-120 pointer-events-none">
          <div className="bg-[#1a2332] text-white text-xs rounded-lg p-3 shadow-lg">
            <div className="whitespace-pre-line">{content}</div>
          </div>
          <div className="w-2 h-2 bg-[#1a2332] absolute top-full left-1/2 -translate-x-1/2 -translate-y-1/2 rotate-45"></div>
        </div>
      )}
    </div>
  );
}