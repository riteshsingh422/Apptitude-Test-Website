// frontend/src/pages/AdminLogin.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../utils/api';

export default function AdminLogin() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await API.post('/admin/login', { username, password });
      localStorage.setItem('adminToken', res.data.token);
      navigate('/admin/dashboard');
    } catch (err) {
      setError('Invalid admin credentials. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-950 via-cyan-950 to-teal-950 flex items-center justify-center p-6 relative overflow-hidden">
      
      {/* Background Glows */}
      <div className="absolute top-40 left-40 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-40 right-40 w-[500px] h-[500px] bg-teal-500/10 rounded-full blur-3xl"></div>

      <div className="max-w-sm w-full relative z-10">   {/* Reduced max width */}

        {/* Logo & Title */}
        <div className="text-center mb-10">
          <div className="mx-auto w-20 h-20 bg-gradient-to-br from-emerald-400 to-teal-400 rounded-3xl flex items-center justify-center shadow-2xl mb-5">
            <span className="text-5xl">🔐</span>
          </div>
          <h1 className="text-5xl font-bold text-white tracking-tighter">INSABHI</h1>
          <p className="text-emerald-300 text-xl font-light mt-2">Admin Portal</p>
        </div>

        {/* Smaller Login Card */}
        <div className="bg-white/10 backdrop-blur-3xl border border-white/20 rounded-3xl p-10 shadow-2xl">
          
          <div className="text-center mb-8">
            <h2 className="text-xl font-semibold text-white">Administrator Login</h2>
            <p className="text-emerald-400 text-sm mt-1">Restricted Access</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full text-base bg-transparent border-2 border-emerald-400/60 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-500/30 rounded-2xl py-4 px-6 text-white placeholder:text-emerald-700 outline-none transition-all"
            />

            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full text-base bg-transparent border-2 border-emerald-400/60 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-500/30 rounded-2xl py-4 px-6 text-white placeholder:text-emerald-700 outline-none transition-all"
            />

            {error && (
              <div className="bg-red-500/10 border border-red-400 text-red-300 text-center py-3 rounded-2xl text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 disabled:from-gray-600 disabled:to-gray-700 text-white font-semibold text-lg py-5 rounded-3xl transition-all duration-300 shadow-xl shadow-emerald-500/40 active:scale-95 disabled:scale-100"
            >
              {loading ? "Verifying..." : "LOGIN AS ADMIN"}
            </button>
          </form>
        </div>

        <div className="text-center mt-8">
          <p className="text-emerald-400/60 text-xs">
            Secure Admin Access • INSABHI Assessment Platform
          </p>
        </div>
      </div>
    </div>
  );
}