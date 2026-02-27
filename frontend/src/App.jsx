import React, { useState, useEffect } from 'react';
import Chat from './components/Chat';
import Config from './components/Config';
import { checkAuth } from './api';

function App() {
  const [tab, setTab] = useState('chat');
  const [apiKey, setApiKey] = useState(localStorage.getItem('api_key') || '');
  const [isAuthed, setIsAuthed] = useState(false);

  useEffect(() => {
    if (apiKey) {
      checkAuth().then(setIsAuthed).catch(() => setIsAuthed(false));
    }
  }, [apiKey]);

  const handleLogin = (e) => {
    e.preventDefault();
    localStorage.setItem('api_key', apiKey);
    checkAuth().then(setIsAuthed).catch(() => {
        setIsAuthed(false);
        alert("Invalid API Key");
    });
  };

  if (!isAuthed) {
    return (
      <div className="min-h-screen bg-[#000000] flex items-center justify-center p-6 font-sans">
        <div className="bg-[#121212] p-12 rounded-[4rem] shadow-2xl w-full max-w-md border border-[#222222] animate-fadeIn">
          <div className="flex flex-col items-center mb-12">
            <div className="w-24 h-24 bg-[#0381fe] rounded-[2.5rem] flex items-center justify-center mb-8 shadow-[0_0_40px_rgba(3,129,254,0.3)]">
              <span className="text-white text-5xl font-bold">C</span>
            </div>
            <h1 className="text-4xl font-extrabold text-white tracking-tight">Carren AI</h1>
            <p className="text-gray-500 mt-3 font-medium">Remote Neural Access</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-8">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-gray-600 uppercase tracking-widest ml-4">Access Key</label>
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="w-full bg-[#1e1e1e] text-white border-none rounded-[1.8rem] px-8 py-5 focus:ring-2 focus:ring-[#0381fe] outline-none transition-all placeholder:text-gray-700 text-lg font-medium"
                placeholder="••••••••••••"
                required
              />
            </div>
            <button
              type="submit"
              className="w-full bg-[#0381fe] text-white font-bold py-5 rounded-[1.8rem] hover:bg-blue-600 active:scale-95 transition-all shadow-xl text-lg"
            >
              Initialize Link
            </button>
            <p className="text-xs text-gray-600 text-center font-medium">
              Key is generated in your Termux console.
            </p>
          </form>
        </div>
      </div>
    );
  }

  const handleLogout = () => {
    localStorage.removeItem('api_key');
    setIsAuthed(false);
  };

  return (
    <div className="min-h-screen bg-[#000000] text-white flex flex-col font-sans">
      <header className="px-6 py-6 flex justify-between items-center bg-[#000000]/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="flex items-center space-x-3">
          <button className="p-2 -ml-2 text-gray-400 hover:text-white">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="flex items-center space-x-2 cursor-pointer group">
            <h1 className="text-xl font-bold tracking-tight">Carren 1.6 Lite</h1>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-500 group-hover:text-white transition-colors" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </div>
        </div>

        <div className="flex items-center space-x-5">
           <button onClick={() => setTab(tab === 'chat' ? 'config' : 'chat')} className="text-xs font-bold text-gray-500 hover:text-white uppercase tracking-tighter">
             {tab === 'chat' ? 'Settings' : 'Back to Chat'}
           </button>
           <div className="flex items-center space-x-4 text-gray-400">
             <button className="hover:text-white">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
             </button>
             <button className="hover:text-white">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
             </button>
             <button className="hover:text-white">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z" />
                </svg>
             </button>
           </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col overflow-hidden max-w-6xl mx-auto w-full px-4">
        {tab === 'chat' ? <Chat /> : <Config onLogout={handleLogout} />}
      </main>
    </div>
  );
}

export default App;
