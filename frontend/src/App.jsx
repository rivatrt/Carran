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
              <span className="text-white text-5xl font-bold">M</span>
            </div>
            <h1 className="text-4xl font-extrabold text-white tracking-tight">Manus AI</h1>
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

  return (
    <div className="min-h-screen bg-[#000000] text-white flex flex-col font-sans">
      <header className="px-8 py-8 flex justify-between items-center bg-[#000000]/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-[#0381fe] rounded-[1.5rem] flex items-center justify-center shadow-lg shadow-blue-500/20">
            <span className="text-white font-bold text-xl">M</span>
          </div>
          <div className="hidden sm:block">
            <h1 className="text-2xl font-bold tracking-tight">Manus AI</h1>
            <div className="flex items-center space-x-1.5">
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-[10px] text-gray-500 font-bold uppercase tracking-tighter">System Online</span>
            </div>
          </div>
        </div>

        <nav className="bg-[#121212] p-1.5 rounded-[2rem] flex space-x-1 border border-[#222222] shadow-inner">
          <button
            onClick={() => setTab('chat')}
            className={`px-8 py-2.5 rounded-[1.8rem] text-sm font-bold transition-all ${tab === 'chat' ? 'bg-[#0381fe] text-white shadow-xl' : 'text-gray-500 hover:text-white'}`}
          >
            Mission
          </button>
          <button
            onClick={() => setTab('config')}
            className={`px-8 py-2.5 rounded-[1.8rem] text-sm font-bold transition-all ${tab === 'config' ? 'bg-[#0381fe] text-white shadow-xl' : 'text-gray-500 hover:text-white'}`}
          >
            Core
          </button>
        </nav>

        <button
          onClick={() => { localStorage.removeItem('api_key'); setIsAuthed(false); }}
          className="w-12 h-12 bg-[#121212] rounded-[1.5rem] flex items-center justify-center border border-[#222222] hover:bg-red-900/10 transition-all group active:scale-90"
        >
           <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-500 group-hover:text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
        </button>
      </header>

      <main className="flex-1 flex flex-col overflow-hidden max-w-6xl mx-auto w-full px-4">
        {tab === 'chat' ? <Chat /> : <Config />}
      </main>
    </div>
  );
}

export default App;
