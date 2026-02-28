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
      <div className="min-h-screen bg-[#000000] flex items-center justify-center p-8 font-sans">
        <div className="bg-[#0a0a0a] p-10 md:p-14 rounded-[3.5rem] shadow-[0_0_100px_rgba(3,129,254,0.05)] w-full max-w-md border border-white/5 animate-fadeIn">
          <div className="flex flex-col items-center mb-14">
            <div className="w-24 h-24 bg-gradient-to-br from-[#0381fe] to-[#0061c2] rounded-[2.8rem] flex items-center justify-center mb-8 shadow-[0_20px_40px_rgba(3,129,254,0.25)]">
              <span className="text-white text-5xl font-black">C</span>
            </div>
            <h1 className="text-4xl font-black text-white tracking-tighter">Carren AI</h1>
            <p className="text-gray-500 mt-4 text-sm font-bold uppercase tracking-[0.2em]">Neural Interface</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-10">
            <div className="space-y-3">
              <label className="text-[10px] font-black text-gray-700 uppercase tracking-[0.3em] ml-6">Encryption Key</label>
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="w-full bg-[#151515] text-white border border-white/5 rounded-[2.2rem] px-8 py-5 focus:ring-2 focus:ring-[#0381fe] focus:bg-[#1a1a1a] outline-none transition-all placeholder:text-gray-800 text-xl font-medium"
                placeholder="••••••••••••"
                required
              />
            </div>
            <button
              type="submit"
              className="w-full bg-[#0381fe] text-white font-black py-5 rounded-[2.2rem] hover:bg-[#0070e0] active:scale-[0.97] transition-all shadow-[0_15px_35px_rgba(3,129,254,0.3)] text-lg"
            >
              Initialize Link
            </button>
            <p className="text-[11px] text-gray-600 text-center font-bold tracking-tight px-4 leading-relaxed">
              Verify your key from the Termux terminal output to establish a secure link.
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
    <div className="min-h-screen bg-[#000000] text-white flex flex-col font-sans selection:bg-[#0381fe]/30">
      <header className="px-6 py-6 flex justify-between items-center bg-[#000000]/90 backdrop-blur-2xl sticky top-0 z-50 border-b border-white/[0.03]">
        <div className="flex items-center space-x-3">
          <button className="p-2 -ml-2 text-gray-500 hover:text-white transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="flex items-center space-x-2.5 cursor-pointer group">
            <h1 className="text-[22px] font-black tracking-tighter">Carren <span className="text-[#0381fe] ml-1">1.6</span></h1>
            <div className="bg-white/5 px-2 py-0.5 rounded-md">
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 group-hover:text-blue-500 transition-colors">LITE</span>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-6">
           <button
             onClick={() => setTab(tab === 'chat' ? 'config' : 'chat')}
             className={`flex items-center space-x-2 px-4 py-2 rounded-full transition-all ${tab === 'config' ? 'bg-white text-black font-black' : 'text-gray-500 hover:text-white font-bold'}`}
           >
             {tab === 'chat' ? (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span className="text-sm">Settings</span>
                </>
             ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                  </svg>
                  <span className="text-sm">Chat</span>
                </>
             )}
           </button>

           <div className="hidden md:flex items-center space-x-6 text-gray-500">
             <button className="hover:text-white transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
             </button>
             <button className="hover:text-white transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
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
