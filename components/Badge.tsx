import React from 'react';

interface BadgeProps {
  status: 'OPEN' | 'CLOSED';
}

export const Badge: React.FC<BadgeProps> = ({ status }) => {
  const colors = status === 'OPEN' 
    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' 
    : 'bg-slate-700/50 text-slate-400 border-slate-600';

  const label = status === 'OPEN' ? 'Live' : 'Ended';

  return (
    <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${colors} flex items-center gap-1.5 backdrop-blur-md`}>
      {status === 'OPEN' && (
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
        </span>
      )}
      {label}
    </span>
  );
};