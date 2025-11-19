import React, { useState, useEffect } from 'react';
import { Session, UserRole } from './types';
import { 
  createSession, 
  getSessions, 
  deleteSession, 
  registerUser, 
  loginUser, 
  getUserSessions,
  changeUserPassword
} from './services/storageService';
import { Layout } from './components/Layout';
import { Card } from './components/Card';
import SessionView from './views/SessionView';

// Simple Router States
type Route = 
  | { name: 'HOME' }
  | { name: 'ADMIN_DASHBOARD' }
  | { name: 'SESSION'; id: string; role: UserRole };

const APP_TITLE = 'Brainstorm Nexus';
const BACKGROUND_IMAGE = '/images/background.png';

const App: React.FC = () => {
  const [route, setRoute] = useState<Route>({ name: 'HOME' });
  
  // Current User State (Global for the session)
  const [currentUser, setCurrentUser] = useState<string | null>(null);

  // Check URL hash on mount for direct linking
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.slice(1); // Remove #
      if (hash.startsWith('session/')) {
        const parts = hash.split('/');
        const id = parts[1];
        const role = parts[2] as UserRole || UserRole.STUDENT;
        setRoute({ name: 'SESSION', id, role });
      } else if (hash === 'admin') {
        if (currentUser) {
          setRoute({ name: 'ADMIN_DASHBOARD' });
        } else {
          // Redirect to home if not logged in
          window.location.hash = ''; 
          setRoute({ name: 'HOME' });
        }
      } else {
        setRoute({ name: 'HOME' });
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    handleHashChange(); 

    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [currentUser]);

  const navigateTo = (newHash: string) => {
    window.location.hash = newHash;
  };

  // VIEWS

  if (route.name === 'SESSION') {
    return <SessionView sessionId={route.id} role={route.role} onExit={() => navigateTo(route.role === UserRole.ADMIN ? 'admin' : '')} backgroundImage={BACKGROUND_IMAGE} appTitle={APP_TITLE} />;
  }

  if (route.name === 'ADMIN_DASHBOARD' && currentUser) {
    return <AdminDashboard currentUser={currentUser} onLogout={() => { setCurrentUser(null); navigateTo(''); }} onNavigate={navigateTo} backgroundImage={BACKGROUND_IMAGE} appTitle={APP_TITLE} />;
  }

  return <Home onLogin={(user) => setCurrentUser(user)} onNavigate={navigateTo} backgroundImage={BACKGROUND_IMAGE} appTitle={APP_TITLE} />;
};

// --- SUB-COMPONENTS ---

interface HomeProps {
  onNavigate: (h: string) => void;
  onLogin: (user: string) => void;
  backgroundImage?: string;
  appTitle?: string;
}

const Home: React.FC<HomeProps> = ({ onNavigate, onLogin, backgroundImage, appTitle }) => {
  const [code, setCode] = useState('');
  
  // Admin Auth State
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [authTab, setAuthTab] = useState<'LOGIN' | 'REGISTER'>('LOGIN');
  
  // Form Fields
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [authMessage, setAuthMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length >= 7) { 
      onNavigate(`session/${code.toUpperCase()}/${UserRole.STUDENT}`);
    }
  };

  const resetAuthForm = () => {
    setUsername('');
    setPassword('');
    setConfirmPassword('');
    setAuthMessage(null);
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthMessage(null);

    if (!username || !password) {
      setAuthMessage({ type: 'error', text: 'Please fill in all fields.' });
      return;
    }

    setIsLoading(true);
    try {
      if (authTab === 'LOGIN') {
        const result = await loginUser(username, password);
        if (result.success) {
          onLogin(username);
          onNavigate('admin');
        } else {
          setAuthMessage({ type: 'error', text: result.message });
        }
      } else {
        // Register
        if (password.length < 4) {
          setAuthMessage({ type: 'error', text: 'Password too short (min 4 chars).' });
          return;
        }
        if (password !== confirmPassword) {
          setAuthMessage({ type: 'error', text: 'Passwords do not match.' });
          return;
        }
        
        const result = await registerUser(username, password);
        if (result.success) {
          setAuthMessage({ type: 'success', text: 'Account created! Please Sign In.' });
          setAuthTab('LOGIN');
          setPassword('');
          setConfirmPassword('');
        } else {
          setAuthMessage({ type: 'error', text: result.message });
        }
      }
    } catch (err) {
      setAuthMessage({ type: 'error', text: 'An unexpected error occurred.' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Layout backgroundImage={backgroundImage} title={appTitle}>
      <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto mt-10 items-stretch">
        {/* TEACHER CARD */}
        <Card className="h-full min-h-[400px] hover:shadow-md transition-shadow border-l-4 border-l-blue-500 flex flex-col justify-between bg-white/95 backdrop-blur overflow-hidden">
          {!showAdminPanel ? (
            <>
              <div>
                <img src="/images/teacher.jpg" alt="Teacher" className="w-full h-24 object-cover rounded-t-lg mb-4 -mt-4 -mx-4" style={{ width: 'calc(100% + 2rem)' }} />
                <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4 text-blue-600">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <h2 className="text-xl font-bold mb-2 text-slate-800">I am a Teacher</h2>
                <p className="text-slate-500 text-sm">Login to your account to manage sessions and visualize results.</p>
              </div>
              <button 
                onClick={() => { setShowAdminPanel(true); resetAuthForm(); }}
                className="w-full py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors mt-auto shadow-lg shadow-blue-600/20"
              >
                Access Teacher Panel
              </button>
            </>
          ) : (
            <div className="flex flex-col h-full animate-fade-in">
              {/* Tabs */}
              <div className="flex border-b border-slate-200 mb-4">
                <button 
                  onClick={() => { setAuthTab('LOGIN'); resetAuthForm(); }}
                  className={`flex-1 py-2 text-sm font-semibold transition-colors ${authTab === 'LOGIN' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  Sign In
                </button>
                <button 
                  onClick={(e) => e.preventDefault()}
                  className="flex-1 py-2 text-sm font-semibold transition-colors text-slate-300 cursor-not-allowed relative group"
                  title="Soon"
                >
                  Sign Up
                   <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                    Soon
                  </span>
                </button>
              </div>

              <form onSubmit={handleAuthSubmit} className="flex flex-col flex-grow">
                <div className="space-y-3 flex-grow">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Username</label>
                    <input 
                      type="text" 
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                      placeholder="admin"
                      autoFocus
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Password</label>
                    <input 
                      type="password" 
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                      placeholder="••••••••"
                    />
                  </div>
                  
                  {authTab === 'REGISTER' && (
                    <div className="animate-fade-in">
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Confirm Password</label>
                      <input 
                        type="password" 
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        placeholder="••••••••"
                      />
                    </div>
                  )}

                  {authMessage && (
                    <div className={`p-2 rounded text-xs ${authMessage.type === 'error' ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'}`}>
                      {authMessage.text}
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-2 mt-4">
                  <button 
                    type="submit"
                    disabled={isLoading || authTab === 'REGISTER'}
                    className="w-full py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex justify-center"
                  >
                    {isLoading ? (
                      <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    ) : (
                      authTab === 'LOGIN' ? 'Login' : 'Create Account'
                    )}
                  </button>
                  <button 
                    type="button"
                    onClick={() => setShowAdminPanel(false)}
                    className="w-full py-2 text-slate-500 hover:text-slate-700 text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}
        </Card>

        {/* STUDENT CARD */}
        <Card className="h-full min-h-[400px] hover:shadow-md transition-shadow border-l-4 border-l-emerald-500 flex flex-col justify-between bg-white/95 backdrop-blur overflow-hidden">
           <div>
            <img src="/images/students.jpg" alt="Students" className="w-full h-24 object-cover rounded-t-lg mb-4 -mt-4 -mx-4" style={{ width: 'calc(100% + 2rem)' }} />
            <div className="h-12 w-12 bg-emerald-100 rounded-lg flex items-center justify-center mb-4 text-emerald-600">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold mb-2 text-slate-800">I am a Student</h2>
            <p className="text-slate-500 text-sm">Join a session with a code and share your ideas anonymously.</p>
          </div>
          <form onSubmit={handleJoin} className="w-full flex flex-col gap-2 mt-6">
            <input 
              type="text" 
              placeholder="Code XXX-XXX"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none text-center font-mono tracking-wider uppercase"
              pattern="[A-Z0-9]{3}-[A-Z0-9]{3}"
              required
            />
            <button 
              type="submit"
              className="w-full py-3 bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-emerald-600/20"
              disabled={code.length < 7}
            >
              Enter
            </button>
          </form>
        </Card>
      </div>
    </Layout>
  );
};

interface DashboardProps {
  currentUser: string;
  onLogout: () => void;
  onNavigate: (h: string) => void;
  backgroundImage?: string;
  appTitle?: string;
}

const AdminDashboard: React.FC<DashboardProps> = ({ currentUser, onLogout, onNavigate, backgroundImage, appTitle }) => {
  const [sessions, setSessions] = useState<Session[]>([]);
  
  // Password Change Modal
  const [showSettings, setShowSettings] = useState(false);
  const [oldPwd, setOldPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirmNewPwd, setConfirmNewPwd] = useState('');
  const [pwdMessage, setPwdMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Delete Modal
  const [deleteModal, setDeleteModal] = useState<{isOpen: boolean, sessionId: string | null}>({isOpen: false, sessionId: null});

  const refreshSessions = async () => {
    const userSessions = await getUserSessions(currentUser);
    setSessions(userSessions);
  };

  useEffect(() => {
    refreshSessions();
    const interval = setInterval(refreshSessions, 2000); // Poll for updates
    return () => clearInterval(interval);
  }, [currentUser]);

  const handleCreate = async () => {
    const id = await createSession(currentUser);
    onNavigate(`session/${id}/${UserRole.ADMIN}`);
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwdMessage(null);

    // "Verificar dos veces la contraseña actual" -> Implemented as Check Old + Confirm New
    if (newPwd !== confirmNewPwd) {
      setPwdMessage({ type: 'error', text: 'New passwords do not match.' });
      return;
    }

    if (newPwd.length < 4) {
      setPwdMessage({ type: 'error', text: 'New password too short.' });
      return;
    }

    setIsProcessing(true);
    const result = await changeUserPassword(currentUser, oldPwd, newPwd);
    setIsProcessing(false);
    
    if (result.success) {
      setPwdMessage({ type: 'success', text: 'Password updated successfully.' });
      setOldPwd('');
      setNewPwd('');
      setConfirmNewPwd('');
      setTimeout(() => {
        setShowSettings(false);
        setPwdMessage(null);
      }, 2000);
    } else {
      setPwdMessage({ type: 'error', text: result.message });
    }
  };

  const executeDelete = async () => {
    if (deleteModal.sessionId) {
      await deleteSession(deleteModal.sessionId);
      await refreshSessions();
      setDeleteModal({ isOpen: false, sessionId: null });
    }
  };

  return (
    <Layout title={`Dashboard | ${appTitle || 'Brainstorm'}`} backgroundImage={backgroundImage}>
      <div className="flex flex-col gap-6 mb-8">
        {/* Header Actions */}
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
          <div>
             <h2 className="text-xl font-bold text-white drop-shadow-md">Welcome, <span className="text-cyan-300">{currentUser}</span></h2>
             <p className="text-white/60 text-sm">Manage your brainstorming sessions.</p>
          </div>
          <div className="flex gap-3">
             <button
              onClick={() => setShowSettings(true)}
              className="px-4 py-2 text-slate-200 bg-white/10 backdrop-blur border border-white/20 rounded-lg hover:bg-white/20 text-sm transition-colors flex items-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
              </svg>
              Security
            </button>
            <button
              onClick={onLogout}
              className="px-4 py-2 text-red-200 bg-red-500/20 backdrop-blur border border-red-500/30 rounded-lg hover:bg-red-500/30 text-sm transition-colors"
            >
              Logout
            </button>
            <button 
              onClick={handleCreate}
              className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-2 rounded-lg hover:from-blue-500 hover:to-indigo-500 shadow-lg shadow-blue-900/50 transition-all"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              New Session
            </button>
          </div>
        </div>

        {/* Settings / Password Change Modal Overlay */}
        {showSettings && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-xl p-6 max-w-md w-full shadow-2xl border border-slate-200">
              <h3 className="text-lg font-bold text-slate-800 mb-4 border-b pb-2">Security Settings</h3>
              
              <form onSubmit={handleChangePassword} className="flex flex-col gap-3">
                 <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Current Password</label>
                  <input 
                    type="password" 
                    value={oldPwd}
                    onChange={(e) => setOldPwd(e.target.value)}
                    className="w-full px-3 py-2 rounded border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none"
                    required
                  />
                </div>

                <hr className="border-slate-100 my-1" />

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">New Password</label>
                  <input 
                    type="password" 
                    value={newPwd}
                    onChange={(e) => setNewPwd(e.target.value)}
                    className="w-full px-3 py-2 rounded border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none"
                    required
                  />
                </div>
                 <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Confirm New Password</label>
                  <input 
                    type="password" 
                    value={confirmNewPwd}
                    onChange={(e) => setConfirmNewPwd(e.target.value)}
                    className="w-full px-3 py-2 rounded border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none"
                    required
                  />
                </div>

                {pwdMessage && (
                  <p className={`text-sm mt-2 p-2 rounded ${pwdMessage.type === 'success' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                    {pwdMessage.text}
                  </p>
                )}

                <div className="flex gap-3 mt-4">
                  <button 
                    type="button" 
                    onClick={() => { setShowSettings(false); setPwdMessage(null); }}
                    className="flex-1 py-2 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    disabled={isProcessing}
                    className="flex-1 py-2 bg-slate-800 text-white rounded hover:bg-slate-700 transition-colors disabled:opacity-50"
                  >
                    {isProcessing ? 'Updating...' : 'Update Password'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>

      {/* SESSIONS GRID */}
      {sessions.length === 0 ? (
        <div className="text-center py-20 bg-white/10 backdrop-blur rounded-xl border border-dashed border-white/20">
          <p className="text-slate-300">You haven't created any sessions yet.</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sessions.map((s) => (
            <div 
              key={s.id} 
              onClick={() => onNavigate(`session/${s.id}/${UserRole.ADMIN}`)}
              className="bg-white/90 backdrop-blur p-5 rounded-xl border border-white/50 hover:border-blue-400 hover:shadow-xl transition-all cursor-pointer group relative"
            >
              <div className="flex justify-between items-start mb-3">
                <span className="font-mono text-lg font-bold text-slate-800 tracking-wide bg-slate-200/50 px-2 py-1 rounded">{s.id}</span>
                <div className="flex items-center gap-2">
                  <span className={`h-2.5 w-2.5 rounded-full ${s.status === 'OPEN' ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`}></span>
                  <button 
                    onClick={(e) => { e.stopPropagation(); setDeleteModal({ isOpen: true, sessionId: s.id }); }}
                    className="p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors ml-1"
                    title="Delete session"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                    </svg>
                  </button>
                </div>
              </div>
              <div className="flex justify-between items-end mt-4">
                <div className="text-sm text-slate-500">
                  <p>{new Date(s.createdAt).toLocaleDateString()}</p>
                  <p>{s.words.length} ideas sent</p>
                </div>
                <div className="opacity-0 group-hover:opacity-100 transition-opacity text-blue-600">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                  </svg>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-xl p-6 max-w-sm w-full shadow-2xl animate-scale-in border border-slate-200">
            <div className="flex items-center gap-3 text-red-600 mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
              <h3 className="text-lg font-bold text-slate-800">Delete Session?</h3>
            </div>
            <p className="text-slate-600 mb-6">
              Are you sure you want to delete session <span className="font-mono font-bold">{deleteModal.sessionId}</span>? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setDeleteModal({ isOpen: false, sessionId: null })}
                className="px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100 font-medium transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={executeDelete}
                className="px-4 py-2 rounded-lg bg-red-600 text-white font-medium hover:bg-red-700 shadow-lg shadow-red-600/30 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default App;