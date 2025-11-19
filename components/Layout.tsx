import React from 'react';

interface LayoutProps {
  children: React.ReactNode;
  title?: string;
  onBack?: () => void;
  backgroundImage?: string;
}

export const Layout: React.FC<LayoutProps> = ({ children, title, onBack, backgroundImage }) => {
  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center p-4 md:p-8 relative overflow-x-hidden">
      
      {/* Dynamic Background */}
      {backgroundImage && (
        <div className="absolute inset-0 z-0">
          <img src={backgroundImage} alt="Theme Background" className="w-full h-full object-cover opacity-40" />
          <div className="absolute inset-0 bg-gradient-to-b from-slate-900/80 via-slate-900/60 to-slate-900/90 backdrop-blur-[2px]"></div>
        </div>
      )}
      
      {/* Content */}
      <div className="w-full max-w-4xl relative z-10">
        <header className="relative flex items-center justify-center mb-8 py-4 border-b border-white/10 min-h-[80px]">
           {onBack && (
            <button 
              onClick={onBack}
              className="absolute left-0 p-2 rounded-full hover:bg-white/10 transition-colors text-white/80 z-20"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
              </svg>
            </button>
          )}
          <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400 drop-shadow-lg text-center tracking-tight">
            {title || 'Brainstorm Nexus'}
          </h1>
        </header>
        <main className="w-full animate-fade-in">
          {children}
        </main>
      </div>
    </div>
  );
};