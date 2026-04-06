// frontend/src/pages/AdminDashboard.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../utils/api';

export default function AdminDashboard() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  const token = localStorage.getItem('adminToken');

  const fetchSessions = async () => {
    if (!token) return;
    try {
      const res = await API.get('/admin/sessions', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSessions(res.data || []);
    } catch (err) {
      console.error("Failed to fetch sessions:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token) {
      navigate('/admin');
      return;
    }
    fetchSessions();

    const interval = setInterval(fetchSessions, 5000);
    return () => clearInterval(interval);
  }, [token, navigate]);

  const generateStudents = async () => {
    if (!confirm('Are you sure you want to generate 100 new unique 4-digit codes?\n\nThis will delete all previous codes and sessions.')) return;

    setMessage('Generating 100 codes... Please wait');
    try {
      const res = await API.post('/admin/generate-students', {}, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setMessage(res.data.message || '✅ 100 codes generated successfully!');
      setTimeout(fetchSessions, 1000);
      setTimeout(() => setMessage(''), 6000);
    } catch (err) {
      setMessage('❌ Failed to generate codes. Please try again.');
      console.error(err);
    }
  };

  const restartTest = async (studentCode) => {
    if (!confirm(`Restart test for code: ${studentCode}?`)) return;

    try {
      await API.post('/admin/restart', { studentCode }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessage(`✅ Test restarted for code ${studentCode}`);
      fetchSessions();
      setTimeout(() => setMessage(''), 4000);
    } catch (err) {
      alert('Failed to restart test. Please try again.');
    }
  };

  const filteredSessions = sessions.filter(s => 
    s.studentCode && s.studentCode.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Top 30 by score (only completed)
  const top30 = [...sessions]
    .filter(s => s.status === 'completed' && Number(s.score) > 0)
    .sort((a, b) => (b.score || 0) - (a.score || 0))
    .slice(0, 30);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white text-3xl">
        Loading INSABHI Admin Dashboard...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white p-8">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="flex justify-between items-center mb-10">
          <div>
            <h1 className="text-5xl font-bold bg-gradient-to-r from-white via-violet-200 to-white bg-clip-text text-transparent">INSABHI</h1>
            <p className="text-violet-300 text-2xl">Admin Dashboard - Live Monitoring</p>
          </div>
          <div className="flex gap-4">
            <button 
              onClick={generateStudents}
              className="bg-emerald-600 hover:bg-emerald-700 px-10 py-4 rounded-2xl font-semibold text-lg transition-all"
            >
              Generate 100 New Codes
            </button>
            <button 
              onClick={() => {
                localStorage.removeItem('adminToken');
                navigate('/admin');
              }}
              className="bg-red-600 hover:bg-red-700 px-8 py-4 rounded-2xl text-lg transition-all"
            >
              Logout
            </button>
          </div>
        </div>

        {message && (
          <div className="mb-8 p-5 bg-violet-900/70 border border-violet-400 rounded-3xl text-lg text-violet-100">
            {message}
          </div>
        )}

        {/* Search */}
        <div className="mb-6">
          <input
            type="text"
            placeholder="Search student code..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded-2xl px-6 py-4 text-lg focus:border-violet-500 focus:ring-2 focus:ring-violet-500/30 outline-none"
          />
        </div>

        {/* Main Table */}
        <div className="bg-slate-900 border border-slate-700 rounded-3xl overflow-hidden shadow-2xl mb-12">
          <div className="p-8 border-b border-slate-700 flex justify-between items-center">
            <h2 className="text-2xl font-semibold">All Student Codes ({filteredSessions.length})</h2>
            <p className="text-slate-400 text-sm">Auto refreshes every 5 seconds</p>
          </div>

          <table className="w-full">
            <thead>
              <tr className="bg-slate-800 text-slate-300">
                <th className="py-6 px-10 text-left font-medium">Student Code</th>
                <th className="py-6 px-10 text-left font-medium">Status</th>
                <th className="py-6 px-10 text-left font-medium">Score %</th>
                <th className="py-6 px-10 text-left font-medium">Time Left</th>
                <th className="py-6 px-10 text-center font-medium">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700 text-lg">
              {filteredSessions.length === 0 ? (
                <tr>
                  <td colSpan="5" className="py-24 text-center text-slate-400 text-xl">
                    {searchTerm ? "No matching codes found" : "No codes found yet.\nClick the \"Generate 100 New Codes\" button above"}
                  </td>
                </tr>
              ) : (
                filteredSessions.map((s, i) => {
                  const min = Math.floor((s.remainingTime || 1800) / 60);
                  const sec = (s.remainingTime || 1800) % 60;

                  return (
                    <tr key={i} className="hover:bg-slate-800/60 transition-colors">
                      <td className="py-8 px-10 font-mono text-4xl tracking-widest text-violet-300">
                        {s.studentCode}
                      </td>
                      <td className="py-8 px-10">
                        <span className={`inline-block px-6 py-2 rounded-full text-sm font-medium
                          ${s.status === 'completed' ? 'bg-emerald-500' : 
                            s.status === 'in_progress' ? 'bg-amber-500 text-black' : 'bg-slate-600'}`}>
                          {s.status.replace('_', ' ').toUpperCase()}
                        </span>
                      </td>
                      <td className="py-8 px-10 font-medium text-lg text-violet-300">
                        {Number(s.score) || 0}%
                      </td>
                      <td className="py-8 px-10 font-mono text-2xl text-violet-300">
                        {min}:{sec < 10 ? '0' : ''}{sec}
                      </td>
                      <td className="py-8 px-10 text-center">
                        {s.status !== 'completed' ? (
                          <button
                            onClick={() => restartTest(s.studentCode)}
                            className="bg-orange-600 hover:bg-orange-700 px-8 py-3 rounded-xl font-medium transition-all active:scale-95"
                          >
                            Start
                          </button>
                        ) : (
                          <span className="text-emerald-400 font-medium">✓ Completed</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Top 30 Scorers Table */}
        <div className="bg-slate-900 border border-slate-700 rounded-3xl overflow-hidden shadow-2xl">
          <div className="p-8 border-b border-slate-700">
            <h2 className="text-2xl font-semibold">Top 30 Scorers</h2>
          </div>

          <table className="w-full">
            <thead>
              <tr className="bg-slate-800 text-slate-300">
                <th className="py-6 px-10 text-left font-medium">Rank</th>
                <th className="py-6 px-10 text-left font-medium">Student Code</th>
                <th className="py-6 px-10 text-left font-medium">Score %</th>
                <th className="py-6 px-10 text-left font-medium">Time Left</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700 text-lg">
              {top30.length === 0 ? (
                <tr>
                  <td colSpan="4" className="py-16 text-center text-slate-400">No completed tests yet</td>
                </tr>
              ) : (
                top30.map((s, i) => (
                  <tr key={i} className="hover:bg-slate-800/60">
                    <td className="py-8 px-10 font-bold text-violet-400">#{i + 1}</td>
                    <td className="py-8 px-10 font-mono text-3xl text-violet-300">{s.studentCode}</td>
                    <td className="py-8 px-10 font-medium text-2xl text-emerald-400">{s.score}%</td>
                    <td className="py-8 px-10 font-mono text-xl">{Math.floor((s.remainingTime || 0) / 60)}:{(s.remainingTime || 0) % 60 < 10 ? '0' : ''}{(s.remainingTime || 0) % 60}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <p className="text-center mt-10 text-slate-500 text-sm">
          INSABHI Reasoning & Aptitude Test Platform
        </p>
      </div>
    </div>
  );
}