// frontend/src/pages/Home.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../utils/api';

export default function Home() {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleStart = async () => {
    if (code.length !== 4) {
      setError('Please enter a valid 4-digit code');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await API.post('/test/start', { code });
      localStorage.setItem('testCode', code);
      navigate('/test');
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') handleStart();
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 sm:p-6 relative overflow-hidden">
      
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-gradient-to-br from-violet-600/30 to-fuchsia-600/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] bg-gradient-to-br from-blue-600/25 to-cyan-500/15 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-br from-indigo-600/10 to-purple-600/10 rounded-full blur-3xl"></div>
        
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px]"></div>
      </div>

      <div className="max-w-md w-full relative z-10">
        
        {/* Logo & Branding */}
        <div className="text-center mb-8">
          <div className="relative inline-block mb-5">
            <div className="w-20 h-20 bg-gradient-to-br from-violet-500 via-purple-500 to-fuchsia-500 rounded-2xl flex items-center justify-center shadow-2xl shadow-violet-500/30">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <div className="absolute inset-0 w-20 h-20 bg-gradient-to-br from-violet-500 to-fuchsia-500 rounded-2xl blur-xl opacity-40 -z-10"></div>
          </div>
          
          <h1 className="text-4xl font-bold bg-gradient-to-r from-white via-violet-200 to-white bg-clip-text text-transparent tracking-tight">
            INSABHI
          </h1>
          <p className="text-slate-400 text-sm font-medium mt-1">Reasoning & Aptitude Test</p>
        </div>

        {/* Main Card - Reduced Height */}
        <div className="relative">
          <div className="absolute -inset-1 bg-gradient-to-r from-violet-600/20 via-fuchsia-600/20 to-blue-600/20 rounded-3xl blur-xl"></div>
          
          <div className="relative bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 rounded-3xl p-8 shadow-2xl">
            
            {/* Card Header */}
            <div className="text-center mb-7">
              <h2 className="text-2xl font-semibold text-white mb-2">Enter Access Code</h2>
              <p className="text-slate-400 text-sm">Enter the 4-digit code provided to you</p>
            </div>

            {/* Code Input */}
            <div className="mb-8">
              <input
                type="text"
                maxLength={4}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                onKeyPress={handleKeyPress}
                placeholder="••••"
                className="w-full text-center text-5xl font-mono tracking-[12px] bg-slate-800/50 border-2 border-slate-600/50 focus:border-violet-500 focus:ring-4 focus:ring-violet-500/20 rounded-2xl py-6 text-white placeholder:text-slate-600 outline-none transition-all"
              />
              
              <div className="flex justify-center gap-3 mt-5">
                {[0,1,2,3].map((i) => (
                  <div
                    key={i}
                    className={`w-3 h-3 rounded-full transition-all ${
                      code.length > i ? 'bg-violet-500 shadow-lg shadow-violet-500/50' : 'bg-slate-700'
                    }`}
                  ></div>
                ))}
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/30 text-red-300 px-4 py-3 rounded-xl mb-6 text-sm">
                <span>{error}</span>
              </div>
            )}

            {/* Start Button */}
            <button
              onClick={handleStart}
              disabled={loading || code.length !== 4}
              className="group relative w-full overflow-hidden bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 disabled:from-slate-700 disabled:to-slate-700 text-white font-semibold text-lg py-4 rounded-2xl transition-all shadow-xl shadow-violet-500/25 hover:shadow-2xl disabled:shadow-none active:scale-[0.98]"
            >
              <span className="relative flex items-center justify-center gap-3">
                {loading ? (
                  <>Verifying Code...</>
                ) : (
                  <>
                    <span>Start Assessment</span>
                    <svg className="w-5 h-5 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </>
                )}
              </span>
            </button>

            {/* Info - Changed to 30 Minutes */}
            <div className="grid grid-cols-2 gap-4 mt-8">
              <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4 text-center">
                <div className="text-3xl font-bold text-white mb-1">30</div>
                <div className="text-slate-400 text-xs">Minutes</div>
              </div>
              <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4 text-center">
                <div className="text-3xl font-bold text-white mb-1">20</div>
                <div className="text-slate-400 text-xs">Questions</div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-slate-500 text-xs">
          © 2026 INSABHI • Secure Professional Assessment
        </div>
      </div>
    </div>
  );
}