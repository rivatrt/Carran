import React, { useState, useEffect, useRef } from 'react';
import { getMessages, saveMessages, clearHistory, uploadFile } from '../api';

const Chat = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [status, setStatus] = useState(null); // 'thinking', 'executing', 'done'
  const [currentStep, setCurrentStep] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [screenshotUrl, setScreenshotUrl] = useState(null);
  const [showBrowser, setShowBrowser] = useState(false);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    getMessages().then(setMessages);
  }, []);

  useEffect(() => {
    saveMessages(messages);
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleNewChat = async () => {
    if (window.confirm('Start a new chat? Current history will be cleared.')) {
      setMessages([]);
      saveMessages([]);
      setScreenshotUrl(null);
      await clearHistory();
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const res = await uploadFile(file);
      const systemMsg = {
        role: 'system',
        content: `File uploaded: ${res.filename}. Path: ${res.path}. I can now access this file.`
      };
      setMessages(prev => [...prev, systemMsg]);
    } catch (error) {
      alert('Upload failed: ' + error.message);
    } finally {
      setIsUploading(false);
      e.target.value = ''; // Reset input
    }
  };

  const handleSend = async () => {
    if (!input.trim() || status) return;

    const userMessage = { role: 'user', content: input };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setStatus('thinking');
    setCurrentStep('Analyzing intent...');

    try {
      const apiKey = localStorage.getItem('api_key');
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': apiKey,
        },
        body: JSON.stringify(newMessages),
      });

      if (!response.ok) throw new Error('Failed to connect to server');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let assistantContent = '';
      let currentMessages = [...newMessages];

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = JSON.parse(line.replace('data: ', ''));

            if (data.status === 'thinking') {
              setStatus('thinking');
              setCurrentStep('Deep thinking...');
            } else if (data.status === 'thought') {
              assistantContent = data.content;
              setStatus('thought');
              setCurrentStep('Formulating plan...');
              setMessages([...currentMessages, { role: 'assistant', content: assistantContent }]);
            } else if (data.status === 'executing') {
              setStatus('executing');
              setCurrentStep(`Action: ${data.command.substring(0, 30)}${data.command.length > 30 ? '...' : ''}`);
              if (data.command.includes('browser_tool')) {
                  // If it's a browser action, we might have a screenshot soon
              }
            } else if (data.status === 'result') {
              const systemMsg = { role: 'system', content: data.output };
              currentMessages = [...currentMessages, { role: 'assistant', content: assistantContent }, systemMsg];
              setMessages(currentMessages);
              assistantContent = '';

              // If the result contains a screenshot notification
              if (data.output.includes('Screenshot saved')) {
                  setScreenshotUrl(`/test_screenshot.png?t=${Date.now()}`); // Use a cache buster
                  setShowBrowser(true);
              }
            } else if (data.status === 'done') {
              setStatus(null);
              setCurrentStep('');
            } else if (data.status === 'error') {
              setMessages([...currentMessages, { role: 'system', content: `Execution Error: ${data.message}` }]);
              setStatus(null);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages([...newMessages, { role: 'system', content: 'Neural link failed. Verify your connection or API key.' }]);
      setStatus(null);
    }
  };

  return (
    <div className="flex flex-col h-full overflow-hidden animate-fadeIn">
      {/* Mobile Top Bar */}
      <div className="lg:hidden flex justify-between items-center px-4 py-2 bg-[#000000] border-b border-[#111]">
        <button
          onClick={handleNewChat}
          className="text-xs font-bold text-blue-500 bg-blue-500/10 px-3 py-1.5 rounded-full"
        >
          + NEW CHAT
        </button>
        <div className="text-[10px] text-gray-600 tracking-widest uppercase">Agentic Mode Active</div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6 scrollbar-hide">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center px-10">
            <div className="w-24 h-24 bg-gradient-to-br from-blue-600 to-blue-800 rounded-[3rem] flex items-center justify-center mb-10 shadow-2xl shadow-blue-500/20">
              <span className="text-white text-5xl font-bold">C</span>
            </div>
            <h2 className="text-3xl font-bold mb-4 tracking-tight">I am Carren.</h2>
            <p className="text-gray-500 text-sm leading-relaxed max-w-xs">
              Tell me your goal. I can browse, code, and execute tasks on your device autonomously.
            </p>
          </div>
        )}

        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-fadeIn`}>
            <div className={`max-w-[92%] lg:max-w-[80%] rounded-[2rem] px-6 py-4 ${
              m.role === 'user'
                ? 'bg-[#0381fe] text-white shadow-lg rounded-tr-md'
                : m.role === 'system'
                ? 'bg-[#111] text-blue-400 font-mono text-xs border border-blue-900/20 rounded-tl-md'
                : 'bg-[#1a1a1a] text-gray-200 border border-[#222] shadow-sm rounded-tl-md'
            }`}>
              {m.role === 'system' && (
                <div className="flex items-center space-x-2 mb-2 opacity-50 text-[9px] uppercase font-bold tracking-tighter">
                   <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse"></div>
                   <span>System Observation</span>
                </div>
              )}
              <pre className="whitespace-pre-wrap font-sans text-[16px] leading-relaxed overflow-x-auto">{m.content}</pre>
            </div>
          </div>
        ))}

        {status && (
          <div className="flex justify-start items-center space-x-2 px-2">
            <div className="w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
            </div>
            <span className="text-sm text-gray-400">Using browser</span>
          </div>
        )}

        {screenshotUrl && showBrowser && (
           <div className="bg-[#121212] border border-[#222] rounded-[2.5rem] p-4 space-y-4 animate-fadeIn">
              <div className="flex justify-between items-center">
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Agent Visual Bridge</h3>
                  <button onClick={() => setShowBrowser(false)} className="text-gray-600 hover:text-white">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                  </button>
              </div>
              <div className="rounded-[1.5rem] overflow-hidden border border-[#222]">
                  <img src={screenshotUrl} alt="Agent Browser" className="w-full h-auto" />
              </div>
              <p className="text-[10px] text-gray-500 text-center italic">Agent is currently at this page. You can give it instructions to click or type.</p>
           </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <div className="px-4 pb-8 pt-2 bg-black sticky bottom-0">
        <div className="max-w-screen-md mx-auto">
          <div className="relative flex items-center bg-[#1c1c1c] rounded-[2.5rem] px-2 py-2 transition-all shadow-2xl">
            <button
              onClick={() => fileInputRef.current.click()}
              disabled={status || isUploading}
              className="w-12 h-12 flex items-center justify-center text-gray-400 hover:text-white disabled:opacity-30"
            >
              <div className="w-10 h-10 rounded-full bg-[#2a2a2a] flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </div>
            </button>
            <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileUpload} />

            <button className="w-10 h-10 flex items-center justify-center text-gray-400 hover:text-white">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/>
                <path d="M12 5v14M5 12h14" className="opacity-20" />
                <path d="M4.5 16.5c1.5-1.5 3-1.5 4.5 0s3 1.5 4.5 0 3-1.5 4.5 0" strokeWidth="1.5" />
              </svg>
            </button>

            <textarea
              rows="1"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              className="flex-1 bg-transparent text-white px-3 py-3 focus:outline-none placeholder:text-gray-600 resize-none max-h-32 text-lg"
              placeholder={isUploading ? "Uploading..." : "Message Carren"}
              disabled={status || isUploading}
            />

            <div className="flex items-center space-x-1 pr-1">
              <button className="w-10 h-10 flex items-center justify-center text-gray-400 hover:text-white">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
              </button>

              <button
                onClick={handleSend}
                disabled={status || !input.trim() || isUploading}
                className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${status ? 'bg-transparent' : 'bg-white text-black hover:bg-gray-200'}`}
              >
                {status ? (
                  <div className="w-10 h-10 bg-[#2a2a2a] rounded-lg flex items-center justify-center">
                    <div className="w-4 h-4 bg-white rounded-sm"></div>
                  </div>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414z" clipRule="evenodd" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          <div className="mt-4 flex justify-center items-center space-x-6">
             <button onClick={handleNewChat} className="text-[11px] font-bold text-gray-500 hover:text-white transition-colors tracking-widest uppercase">
               + New Mission
             </button>
             {screenshotUrl && (
                 <button onClick={() => setShowBrowser(!showBrowser)} className="text-[11px] font-bold text-blue-500 hover:text-blue-400 transition-colors tracking-widest uppercase">
                   {showBrowser ? 'Hide Browser' : 'Show Browser'}
                 </button>
             )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Chat;
