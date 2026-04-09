// frontend/src/pages/AdminDashboard.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../utils/api';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, RadialBarChart, RadialBar, Legend, Cell
} from 'recharts';

export default function AdminDashboard() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('monitor'); // 'monitor' | 'analytics'
  const [selectedStudent, setSelectedStudent] = useState(null);
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
    if (!token) { navigate('/admin'); return; }
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
    }
  };

  // FIXED: Restart resets the session entirely
  const restartTest = async (studentCode) => {
    if (!confirm(`Restart test for code: ${studentCode}?\n\nThis will reset all their answers and timer.`)) return;
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

  const top30 = [...sessions]
    .filter(s => s.status === 'completed' && Number(s.score) > 0)
    .sort((a, b) => (b.score || 0) - (a.score || 0))
    .slice(0, 30);

  // ─── Analytics helpers ───────────────────────────────────────────────
  const completedSessions = sessions.filter(s => s.status === 'completed');

  const getSectionStats = (session) => {
    if (!session || !session.questions || !session.answers) return null;
    const sections = { aptitude: { total: 0, correct: 0 }, reasoning: { total: 0, correct: 0 }, coding: { total: 0, correct: 0 } };
    session.questions.forEach((q, idx) => {
      const cat = (q.category || 'aptitude').toLowerCase();
      if (!sections[cat]) sections[cat] = { total: 0, correct: 0 };
      sections[cat].total += 1;
      const ans = session.answers?.[idx.toString()];
      if (ans !== undefined && ans === q.correctAnswer) {
        sections[cat].correct += 1;
      }
    });
    return Object.entries(sections).map(([name, data]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      correct: data.correct,
      total: data.total,
      percentage: data.total > 0 ? Math.round((data.correct / data.total) * 100) : 0
    }));
  };

  const SECTION_COLORS = { Aptitude: '#8b5cf6', Reasoning: '#06b6d4', Coding: '#10b981' };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white text-3xl">
        Loading INSABHI Admin Dashboard...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* ── Top Header ── */}
      <div className="border-b border-slate-800 bg-slate-900/60 backdrop-blur px-8 py-5 flex justify-between items-center sticky top-0 z-40">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-white via-violet-200 to-white bg-clip-text text-transparent">INSABHI</h1>
          <p className="text-violet-400 text-sm">Admin Dashboard</p>
        </div>
        <div className="flex gap-3">
          <button onClick={generateStudents} className="bg-emerald-600 hover:bg-emerald-700 px-6 py-3 rounded-xl font-medium transition-all text-sm">
            Generate 100 Codes
          </button>
          <button onClick={() => { localStorage.removeItem('adminToken'); navigate('/admin'); }}
            className="bg-red-600 hover:bg-red-700 px-6 py-3 rounded-xl text-sm transition-all">
            Logout
          </button>
        </div>
      </div>

      {/* ── Nav Tabs ── */}
      <div className="px-8 pt-6 flex gap-2 border-b border-slate-800">
        {['monitor', 'analytics'].map(tab => (
          <button key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-6 py-3 rounded-t-xl font-medium capitalize transition-all text-sm ${
              activeTab === tab
                ? 'bg-violet-600 text-white'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}>
            {tab === 'monitor' ? '📡 Live Monitor' : '📊 Student Analytics'}
          </button>
        ))}
      </div>

      <div className="p-8 max-w-7xl mx-auto">
        {message && (
          <div className="mb-6 p-4 bg-violet-900/70 border border-violet-400 rounded-2xl text-violet-100">
            {message}
          </div>
        )}

        {/* ══════════════ MONITOR TAB ══════════════ */}
        {activeTab === 'monitor' && (
          <>
            <div className="mb-5">
              <input type="text" placeholder="Search student code..."
                value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-5 py-3 focus:border-violet-500 outline-none" />
            </div>

            {/* All Students Table */}
            <div className="bg-slate-900 border border-slate-700 rounded-2xl overflow-hidden shadow-2xl mb-10">
              <div className="p-6 border-b border-slate-700 flex justify-between items-center">
                <h2 className="text-xl font-semibold">All Student Codes ({filteredSessions.length})</h2>
                <p className="text-slate-400 text-xs">Auto-refreshes every 5s</p>
              </div>
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-800 text-slate-300 text-sm">
                    <th className="py-4 px-8 text-left">Student Code</th>
                    <th className="py-4 px-8 text-left">Status</th>
                    <th className="py-4 px-8 text-left">Score %</th>
                    <th className="py-4 px-8 text-left">Time Left</th>
                    <th className="py-4 px-8 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700">
                  {filteredSessions.length === 0 ? (
                    <tr><td colSpan="5" className="py-16 text-center text-slate-400">No codes found yet.</td></tr>
                  ) : filteredSessions.map((s, i) => {
                    const min = Math.floor((s.remainingTime || 1800) / 60);
                    const sec = (s.remainingTime || 1800) % 60;
                    return (
                      <tr key={i} className="hover:bg-slate-800/60 transition-colors">
                        <td className="py-5 px-8 font-mono text-2xl tracking-widest text-violet-300">{s.studentCode}</td>
                        <td className="py-5 px-8">
                          <span className={`inline-block px-4 py-1 rounded-full text-xs font-medium
                            ${s.status === 'completed' ? 'bg-emerald-500' :
                              s.status === 'in_progress' ? 'bg-amber-500 text-black' : 'bg-slate-600'}`}>
                            {s.status.replace('_', ' ').toUpperCase()}
                          </span>
                        </td>
                        <td className="py-5 px-8 text-violet-300 font-medium">{Number(s.score) || 0}%</td>
                        <td className="py-5 px-8 font-mono text-lg text-violet-300">
                          {min}:{sec < 10 ? '0' : ''}{sec}
                        </td>
                        <td className="py-5 px-8 text-center">
                          {s.status === 'completed' ? (
                            <span className="text-emerald-400 font-medium text-sm">✓ Done</span>
                          ) : (
                            // FIXED: Shows "Restart" for in_progress too, not just not_started
                            <button onClick={() => restartTest(s.studentCode)}
                              className="bg-orange-600 hover:bg-orange-700 px-6 py-2 rounded-lg font-medium text-sm transition-all active:scale-95">
                              🔄 Restart
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Top 30 */}
            <div className="bg-slate-900 border border-slate-700 rounded-2xl overflow-hidden shadow-2xl">
              <div className="p-6 border-b border-slate-700">
                <h2 className="text-xl font-semibold">🏆 Top 30 Scorers</h2>
              </div>
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-800 text-slate-300 text-sm">
                    <th className="py-4 px-8 text-left">Rank</th>
                    <th className="py-4 px-8 text-left">Student Code</th>
                    <th className="py-4 px-8 text-left">Score %</th>
                    <th className="py-4 px-8 text-left">Time Left</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700">
                  {top30.length === 0 ? (
                    <tr><td colSpan="4" className="py-12 text-center text-slate-400">No completed tests yet</td></tr>
                  ) : top30.map((s, i) => (
                    <tr key={i} className="hover:bg-slate-800/60">
                      <td className="py-5 px-8 font-bold text-violet-400">#{i + 1}</td>
                      <td className="py-5 px-8 font-mono text-2xl text-violet-300">{s.studentCode}</td>
                      <td className="py-5 px-8 font-medium text-xl text-emerald-400">{s.score}%</td>
                      <td className="py-5 px-8 font-mono">{Math.floor((s.remainingTime || 0) / 60)}:{((s.remainingTime || 0) % 60 < 10 ? '0' : '')}{(s.remainingTime || 0) % 60}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* ══════════════ ANALYTICS TAB ══════════════ */}
        {activeTab === 'analytics' && (
          <div className="mt-2">
            {!selectedStudent ? (
              <>
                {/* Overview cards */}
                <div className="grid grid-cols-3 gap-5 mb-8">
                  <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6">
                    <p className="text-slate-400 text-sm mb-1">Total Students</p>
                    <p className="text-4xl font-bold text-white">{sessions.length}</p>
                  </div>
                  <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6">
                    <p className="text-slate-400 text-sm mb-1">Completed</p>
                    <p className="text-4xl font-bold text-emerald-400">{completedSessions.length}</p>
                  </div>
                  <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6">
                    <p className="text-slate-400 text-sm mb-1">Avg Score</p>
                    <p className="text-4xl font-bold text-violet-400">
                      {completedSessions.length > 0
                        ? Math.round(completedSessions.reduce((a, s) => a + (s.score || 0), 0) / completedSessions.length)
                        : 0}%
                    </p>
                  </div>
                </div>

                {/* Student list — click to drill down */}
                <div className="bg-slate-900 border border-slate-700 rounded-2xl overflow-hidden">
                  <div className="p-6 border-b border-slate-700">
                    <h2 className="text-lg font-semibold">Click a student to see detailed analysis</h2>
                  </div>
                  <div className="divide-y divide-slate-700">
                    {completedSessions.length === 0 ? (
                      <p className="py-12 text-center text-slate-400">No completed tests yet</p>
                    ) : completedSessions
                        .sort((a, b) => (b.score || 0) - (a.score || 0))
                        .map((s, i) => {
                          const stats = getSectionStats(s);
                          return (
                            <div key={i}
                              onClick={() => setSelectedStudent(s)}
                              className="flex items-center justify-between px-6 py-4 hover:bg-slate-800 cursor-pointer transition-colors">
                              <div className="flex items-center gap-5">
                                <span className="text-slate-500 w-8">#{i + 1}</span>
                                <span className="font-mono text-2xl text-violet-300">{s.studentCode}</span>
                              </div>
                              <div className="flex items-center gap-8">
                                {stats && stats.filter(st => st.total > 0).map(st => (
                                  <div key={st.name} className="text-center">
                                    <p className="text-xs text-slate-400">{st.name}</p>
                                    <p className="font-mono text-sm" style={{ color: SECTION_COLORS[st.name] }}>
                                      {st.correct}/{st.total}
                                    </p>
                                  </div>
                                ))}
                                <div className="text-right">
                                  <p className="text-2xl font-bold text-emerald-400">{s.score}%</p>
                                </div>
                                <span className="text-slate-500">›</span>
                              </div>
                            </div>
                          );
                        })}
                  </div>
                </div>
              </>
            ) : (
              /* ── Drill-down: Individual student ── */
              <div>
                <button onClick={() => setSelectedStudent(null)}
                  className="mb-6 text-violet-400 hover:text-violet-300 text-sm flex items-center gap-2">
                  ← Back to all students
                </button>

                <div className="flex items-center gap-4 mb-8">
                  <div className="w-14 h-14 bg-violet-700 rounded-2xl flex items-center justify-center text-2xl font-bold">
                    {selectedStudent.studentCode}
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">Student {selectedStudent.studentCode}</h2>
                    <p className="text-slate-400 text-sm">
                      Score: <span className="text-emerald-400 font-bold">{selectedStudent.score}%</span>
                      &nbsp;·&nbsp;
                      Time used: {Math.floor((1800 - (selectedStudent.remainingTime || 0)) / 60)}m {(1800 - (selectedStudent.remainingTime || 0)) % 60}s
                    </p>
                  </div>
                </div>

                {(() => {
                  const stats = getSectionStats(selectedStudent);
                  if (!stats) return <p className="text-slate-400">No detailed data available.</p>;
                  const filtered = stats.filter(s => s.total > 0);

                  return (
                    <div className="grid grid-cols-1 gap-8">
                      {/* Section bar chart */}
                      <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6">
                        <h3 className="text-lg font-semibold mb-6">Section-wise Performance</h3>
                        <ResponsiveContainer width="100%" height={280}>
                          <BarChart data={filtered} barSize={50}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                            <XAxis dataKey="name" tick={{ fill: '#94a3b8' }} />
                            <YAxis domain={[0, 100]} tick={{ fill: '#94a3b8' }} unit="%" />
                            <Tooltip
                              contentStyle={{ background: '#1e293b', border: '1px solid #475569', borderRadius: 12 }}
                              formatter={(value, name) => [`${value}%`, name]}
                            />
                            <Bar dataKey="percentage" radius={[8, 8, 0, 0]} name="Score %">
                              {filtered.map((entry) => (
                                <Cell key={entry.name} fill={SECTION_COLORS[entry.name] || '#8b5cf6'} />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>

                      {/* Section cards */}
                      <div className="grid grid-cols-3 gap-5">
                        {filtered.map(st => (
                          <div key={st.name} className="bg-slate-900 border border-slate-700 rounded-2xl p-6">
                            <div className="flex justify-between items-start mb-4">
                              <p className="font-semibold text-lg text-white">{st.name}</p>
                              <span className="text-xs px-3 py-1 rounded-full"
                                style={{ background: SECTION_COLORS[st.name] + '33', color: SECTION_COLORS[st.name] }}>
                                {st.percentage}%
                              </span>
                            </div>
                            <p className="text-4xl font-bold mb-1" style={{ color: SECTION_COLORS[st.name] }}>
                              {st.correct}<span className="text-xl text-slate-500">/{st.total}</span>
                            </p>
                            <p className="text-slate-400 text-sm">Correct answers</p>
                            {/* Progress bar */}
                            <div className="mt-4 h-2 bg-slate-700 rounded-full overflow-hidden">
                              <div className="h-full rounded-full transition-all"
                                style={{ width: `${st.percentage}%`, background: SECTION_COLORS[st.name] }} />
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Q-by-Q breakdown */}
                      <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6">
                        <h3 className="text-lg font-semibold mb-5">Question-by-Question Breakdown</h3>
                        <div className="grid grid-cols-5 gap-3">
                          {selectedStudent.questions?.map((q, idx) => {
                            const ans = selectedStudent.answers?.[idx.toString()];
                            const attempted = ans !== undefined;
                            const correct = attempted && ans === q.correctAnswer;
                            const cat = (q.category || 'aptitude');
                            return (
                              <div key={idx}
                                className={`rounded-xl p-3 border text-center ${
                                  !attempted ? 'border-slate-700 bg-slate-800 text-slate-500' :
                                  correct ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400' :
                                  'border-red-500/40 bg-red-500/10 text-red-400'
                                }`}>
                                <p className="text-xs mb-1">Q{idx + 1}</p>
                                <p className="text-lg">{!attempted ? '–' : correct ? '✓' : '✗'}</p>
                                <p className="text-[10px] mt-1 opacity-60 capitalize">{cat}</p>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}
          </div>
        )}

        <p className="text-center mt-10 text-slate-500 text-xs">
          INSABHI Reasoning & Aptitude Test Platform
        </p>
      </div>
    </div>
  );
}