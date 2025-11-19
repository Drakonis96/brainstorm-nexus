import React, { useState } from 'react';
import { Session, UserRole } from '../types';
import { addWordToSession, updateSessionGroups, useSession } from '../services/storageService';
import { groupWordsWithGemini } from '../services/geminiService';
import { Layout } from '../components/Layout';
import { Card } from '../components/Card';
import { Badge } from '../components/Badge';

interface SessionViewProps {
  sessionId: string;
  role: UserRole;
  onExit: () => void;
  backgroundImage?: string;
  appTitle?: string;
}

const SessionView: React.FC<SessionViewProps> = ({ sessionId, role, onExit, backgroundImage, appTitle }) => {
  const session = useSession(sessionId);
  
  // Admin State
  const [groupCount, setGroupCount] = useState(3);
  const [isGrouping, setIsGrouping] = useState(false);
  const [adminError, setAdminError] = useState<string | null>(null);
  const [generateImages, setGenerateImages] = useState(false);

  // Student State
  const [inputWord, setInputWord] = useState('');
  const [sending, setSending] = useState(false);

  // Copy State
  const [copied, setCopied] = useState(false);

  if (!session) {
    return (
      <Layout onBack={onExit} backgroundImage={backgroundImage} title={appTitle}>
        <div className="text-center text-white/80 mt-20 bg-black/30 p-8 rounded-xl backdrop-blur">
          <h2 className="text-xl font-bold text-white mb-2">Session not found</h2>
          <p>The code {sessionId} does not exist or has been deleted.</p>
        </div>
      </Layout>
    );
  }

  // --- LOGIC ---

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(session.id);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Error copying to clipboard:', error);
    }
  };

  const handleStudentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputWord.trim()) return;
    
    setSending(true);
    try {
      await addWordToSession(sessionId, inputWord.trim());
      setInputWord('');
    } catch (error) {
      console.error('Error submitting word:', error);
    } finally {
      setSending(false);
    }
  };

  const handleAdminGroup = async () => {
    if (session.words.length === 0) {
      setAdminError("No words to group.");
      return;
    }
    setAdminError(null);
    setIsGrouping(true);
    
    try {
      const groups = await groupWordsWithGemini(session.words, groupCount, generateImages);
      await updateSessionGroups(sessionId, groups);
    } catch (e) {
      console.error(e);
      setAdminError("Error connecting to AI. Check your API Key and try again.");
    } finally {
      setIsGrouping(false);
    }
  };

  // --- RENDER HELPERS ---

  const renderHeader = () => (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
      <div>
        <h2 className="text-white/70 text-sm font-medium uppercase tracking-wider mb-1">
          {role === UserRole.ADMIN ? 'Teacher Panel' : 'Student View'}
        </h2>
        <div className="flex items-center gap-3">
          <span className="text-3xl font-mono font-bold text-white">{session.id}</span>
          <button
            onClick={handleCopyCode}
            className="group relative p-2 rounded-lg bg-white/10 hover:bg-white/20 backdrop-blur border border-white/20 transition-all hover:scale-105 active:scale-95"
            title="Copy session code"
          >
            {copied ? (
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-green-400">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-white">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184" />
              </svg>
            )}
            <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black/90 text-white text-xs px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
              {copied ? '¡Copiado!' : 'Copiar código'}
            </span>
          </button>
          <Badge status={session.status} />
        </div>
      </div>
      <div className="text-right text-white/90">
        <span className="text-2xl font-bold block drop-shadow">{session.words.length}</span>
        <span className="text-xs uppercase tracking-wide text-white/70">Ideas Received</span>
      </div>
    </div>
  );

  const renderWordsGrid = () => (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 max-h-[60vh] overflow-y-auto p-2">
      {session.words.slice().reverse().map((word, idx) => (
        <div 
          key={`${idx}-${word}`} 
          className="animate-fade-in-up bg-white/90 backdrop-blur border border-white/50 rounded-lg p-4 shadow-sm text-center flex items-center justify-center break-words"
          style={{ animationDelay: `${idx * 50}ms` }}
        >
          <span className="text-slate-800 font-medium">{word}</span>
        </div>
      ))}
      {session.words.length === 0 && (
        <div className="col-span-full py-12 text-center text-white/50 italic border-2 border-dashed border-white/20 rounded-xl bg-black/10">
          Waiting for ideas...
        </div>
      )}
    </div>
  );

  const renderGroupsTable = () => {
    if (!session.groups) return null;

    return (
      <div className="space-y-6 animate-fade-in">
        <div className="bg-emerald-900/40 border border-emerald-500/30 p-4 rounded-lg mb-6 text-center backdrop-blur">
          <h3 className="text-emerald-100 font-bold text-lg">AI Analysis Results</h3>
          <p className="text-emerald-200/70 text-sm">Ideas have been organized into {session.groups.length} categories.</p>
        </div>
        
        <div className="grid md:grid-cols-2 gap-6">
          {session.groups.map((group, idx) => (
            <Card key={idx} className="h-full border-t-4 border-t-indigo-500 bg-white/95 backdrop-blur overflow-hidden">
              {/* AI Generated Image Header */}
              {group.imageUrl && (
                <div className="w-full h-32 mb-4 rounded-lg overflow-hidden bg-slate-100 relative">
                   <img 
                    src={group.imageUrl} 
                    alt={group.category} 
                    className="w-full h-full object-cover transform hover:scale-105 transition-transform duration-500"
                   />
                   <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                   <h4 className="absolute bottom-2 left-3 text-xl font-bold text-white drop-shadow-md flex items-center gap-2">
                    {group.category.replace(/\$/g, '')}
                  </h4>
                </div>
              )}

              {!group.imageUrl && (
                 <h4 className="text-lg font-bold text-indigo-900 mb-4 flex items-center gap-2">
                  {group.category.replace(/\$/g, '')}
                </h4>
              )}

              <div className="flex justify-between items-center mb-3 px-1">
                <span className="bg-indigo-100 text-indigo-700 text-xs px-2 py-0.5 rounded-full font-bold">
                  {group.items.length} Items
                </span>
              </div>

              <ul className="space-y-2">
                {group.items.map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-slate-700 text-sm bg-slate-50 p-2 rounded hover:bg-indigo-50 transition-colors">
                    <span className="text-indigo-400 mt-1">•</span>
                    {item.replace(/#/g, '')}
                  </li>
                ))}
              </ul>
            </Card>
          ))}
        </div>
      </div>
    );
  };

  // --- MAIN RENDER ---

  return (
    <Layout onBack={onExit} backgroundImage={backgroundImage} title={role === UserRole.ADMIN ? 'Active Session' : 'Participate'}>
      {renderHeader()}

      {/* CLOSED STATE (Results) */}
      {session.status === 'CLOSED' && (
        <>
          {renderGroupsTable()}
          <div className="mt-8 text-center">
            <button 
              onClick={onExit}
              className="text-white/70 hover:text-white underline decoration-white/30"
            >
              Exit Session
            </button>
          </div>
        </>
      )}

      {/* OPEN STATE */}
      {session.status === 'OPEN' && (
        <>
          {/* Student Input Area */}
          {role === UserRole.STUDENT && (
            <div className="mb-8">
              <Card className="bg-white/95 backdrop-blur border-none shadow-lg">
                <form onSubmit={handleStudentSubmit} className="flex flex-col md:flex-row gap-3">
                  <input
                    type="text"
                    value={inputWord}
                    onChange={(e) => setInputWord(e.target.value)}
                    placeholder="Type your idea or word here..."
                    className="flex-1 px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none shadow-sm"
                    maxLength={50}
                    autoFocus
                  />
                  <button
                    type="submit"
                    disabled={!inputWord.trim() || sending}
                    className="px-8 py-3 bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-600/20 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {sending ? 'Sending...' : 'Send'}
                  </button>
                </form>
                <p className="text-xs text-slate-500 mt-2 ml-1">
                  * Your submissions are anonymous.
                </p>
              </Card>
            </div>
          )}

          {/* Word Cloud / Grid */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-white/90 drop-shadow-md">Idea Wall</h3>
            </div>
            <div className="bg-white/10 backdrop-blur border border-white/10 rounded-xl p-4 min-h-[300px]">
              {renderWordsGrid()}
            </div>
          </div>

          {/* Admin Controls */}
          {role === UserRole.ADMIN && (
            <Card className="border-t-4 border-t-blue-500 sticky bottom-4 shadow-2xl z-20 bg-white/95 backdrop-blur">
              <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex-1">
                  <h3 className="font-bold text-slate-800 flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-blue-600">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
                    </svg>
                    Group with AI
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    End session and group words automatically.
                  </p>
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto">
                  <div className="flex items-center bg-slate-100 rounded-lg px-3 py-2 border border-slate-200">
                    <span className="text-sm text-slate-600 mr-2">Groups:</span>
                    <input 
                      type="number" 
                      min="1" 
                      max="10"
                      value={groupCount}
                      onChange={(e) => setGroupCount(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-12 bg-transparent font-bold text-center outline-none"
                    />
                  </div>

                  <div className="flex items-center bg-slate-100 rounded-lg px-3 py-2 border border-slate-200 gap-2">
                    <span className="text-sm text-slate-600">Images:</span>
                    <button
                      type="button"
                      onClick={() => setGenerateImages(!generateImages)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
                        generateImages ? 'bg-indigo-600' : 'bg-slate-300'
                      }`}
                      title={generateImages ? 'Image generation enabled (slower)' : 'Image generation disabled (faster)'}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          generateImages ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>

                  <button 
                    onClick={handleAdminGroup}
                    disabled={isGrouping || session.words.length === 0}
                    className="flex-1 md:flex-none bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-2.5 rounded-lg font-semibold shadow-md hover:shadow-lg hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isGrouping ? (
                      <>
                        <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Processing...
                      </>
                    ) : (
                      'Analyze & Close'
                    )}
                  </button>
                </div>
              </div>
              {adminError && (
                <p className="text-red-500 text-xs mt-2 text-center">{adminError}</p>
              )}
            </Card>
          )}
        </>
      )}
    </Layout>
  );
};

export default SessionView;