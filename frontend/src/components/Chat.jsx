import React, { useState, useEffect, useRef } from 'react';
import { getMessages, saveMessages, clearHistory, uploadFile } from '../api';

const Chat = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [status, setStatus] = useState(null); // 'thinking', 'executing', 'done'
  const [currentStep, setCurrentStep] = useState('');
  const [isUploading, setIsUploading] = useState(false);
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
            } else if (data.status === 'result') {
              const systemMsg = { role: 'system', content: data.output };
              currentMessages = [...currentMessages, { role: 'assistant', content: assistantContent }, systemMsg];
              setMessages(currentMessages);
              assistantContent = '';
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
    <div className="flex flex-col h-full overflow-hidden">
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
          <div className="flex flex-col items-center justify-center h-full text-center px-10 animate-in fade-in zoom-in duration-700">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-blue-800 rounded-[2.5rem] flex items-center justify-center mb-8 shadow-2xl shadow-blue-500/20">
              <span className="text-white text-4xl font-bold">M</span>
            </div>
            <h2 className="text-2xl font-bold mb-3 tracking-tight">I am Manus.</h2>
            <p className="text-gray-500 text-sm leading-relaxed max-w-xs">
              Tell me your goal. I can browse, code, and execute tasks on your device autonomously.
            </p>
          </div>
        )}

        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2 duration-300`}>
            <div className={`max-w-[90%] lg:max-w-[75%] rounded-[1.8rem] px-5 py-3.5 ${
              m.role === 'user'
                ? 'bg-[#2563eb] text-white shadow-lg rounded-tr-md'
                : m.role === 'system'
                ? 'bg-[#111] text-blue-400 font-mono text-xs border border-blue-900/20 rounded-tl-md'
                : 'bg-[#121212] text-gray-200 border border-[#222] shadow-sm rounded-tl-md'
            }`}>
              {m.role === 'system' && (
                <div className="flex items-center space-x-2 mb-2 opacity-50 text-[9px] uppercase font-bold tracking-tighter">
                   <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse"></div>
                   <span>System Observation</span>
                </div>
              )}
              <pre className="whitespace-pre-wrap font-sans text-[15px] leading-relaxed overflow-x-auto">{m.content}</pre>
            </div>
          </div>
        ))}

        {status && (
          <div className="flex justify-start">
            <div className="bg-[#121212] border border-[#222] rounded-[1.8rem] rounded-tl-md px-5 py-3.5 flex items-center space-x-4 shadow-xl">
              <div className="flex space-x-1.5">
                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '200ms' }}></div>
                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '400ms' }}></div>
              </div>
              <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">{currentStep}</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="px-4 pb-6 pt-2 bg-gradient-to-t from-[#000] to-transparent">
        <div className="max-w-4xl mx-auto">
          <div className="relative flex items-end bg-[#121212] border border-[#222] rounded-[2rem] p-2 transition-all focus-within:border-blue-500/50 shadow-2xl">
            <button
              onClick={() => fileInputRef.current.click()}
              disabled={status || isUploading}
              className="p-3 text-gray-400 hover:text-blue-500 transition-colors disabled:opacity-30"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
              </svg>
            </button>
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              onChange={handleFileUpload}
            />

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
              className="flex-1 bg-transparent text-white px-3 py-3 focus:outline-none placeholder:text-gray-600 resize-none max-h-32 text-[16px]"
              placeholder={isUploading ? "Uploading file..." : "Give me a mission..."}
              disabled={status || isUploading}
            />

            <button
              onClick={handleSend}
              aria-label="Send mission"
              disabled={status || !input.trim() || isUploading}
              className="w-11 h-11 bg-blue-600 text-white rounded-full flex items-center justify-center hover:bg-blue-700 disabled:bg-[#1a1a1a] disabled:text-gray-700 transition-all shadow-lg transform active:scale-90 flex-shrink-0"
            >
              {status ? (
                <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                </svg>
              )}
            </button>
          </div>

          <div className="mt-3 hidden lg:flex justify-center items-center space-x-4">
             <button onClick={handleNewChat} className="text-[10px] font-bold text-gray-500 hover:text-white transition-colors tracking-widest uppercase">
               + New Mission
             </button>
             <span className="text-gray-800">•</span>
             <span className="text-[10px] text-gray-700 uppercase tracking-widest">Web Engine: {localStorage.getItem('preferred_provider') || 'Gemini'}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Chat;
