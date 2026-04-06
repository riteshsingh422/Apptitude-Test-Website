// frontend/src/pages/Test.jsx

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../utils/api';

export default function Test() {
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [remainingTime, setRemainingTime] = useState(1800);
  const [loading, setLoading] = useState(true);
  const [showInstruction, setShowInstruction] = useState(true);
  const [showTabWarning, setShowTabWarning] = useState(false);
  const [tabSwitchCount, setTabSwitchCount] = useState(0);

  const navigate = useNavigate();
  const code = localStorage.getItem('testCode');

  useEffect(() => {
    if (!code) {
      navigate('/');
      return;
    }

    const fetchTest = async () => {
      try {
        const res = await API.post('/test/start', { code });

        setQuestions(res.data.questions || []);
        setCurrentIndex(res.data.currentIndex || 0);
        setRemainingTime(res.data.remainingTime || 1800);
        setAnswers(res.data.answers || {});
      } catch (err) {
        alert('Session error. Contact admin with your code.');
        navigate('/');
      } finally {
        setLoading(false);
      }
    };

    fetchTest();

    const timer = setInterval(() => {
      setRemainingTime(prev => {
        const newTime = prev - 1;

        if (newTime <= 0) {
          clearInterval(timer);
          handleSubmitTest();
          return 0;
        }

        if (newTime % 30 === 0) {
          API.post('/test/time', {
            code,
            remainingTime: newTime
          }).catch(() => {});
        }

        return newTime;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [code, navigate]);

  // ✅ FINAL FIX: Only real tab change detection
  useEffect(() => {
    const handleTabSwitch = () => {
      if (document.visibilityState !== 'hidden') return;

      setTabSwitchCount(prev => {
        const newCount = prev + 1;

        if (newCount === 1 || newCount === 2) {
          setShowTabWarning(true);
        } else if (newCount >= 3) {
          handleSubmitTest();
          localStorage.removeItem('testCode');
          navigate('/');
        }

        return newCount;
      });
    };

    document.addEventListener('visibilitychange', handleTabSwitch);

    return () => {
      document.removeEventListener('visibilitychange', handleTabSwitch);
    };
  }, [navigate]);

  const selectOption = async (optionIndex) => {
    const newAnswers = {
      ...answers,
      [currentIndex]: optionIndex
    };

    setAnswers(newAnswers);

    await API.post('/test/answer', {
      code,
      questionIndex: currentIndex,
      selectedOption: optionIndex
    });
  };

  const nextQuestion = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handleSubmitTest = async () => {
    await API.post('/test/submit', { code });
    localStorage.removeItem('testCode');
  };

  const closeInstruction = () => {
    setShowInstruction(false);
  };

  const closeTabWarning = () => {
    setShowTabWarning(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white text-2xl">
        Loading Test...
      </div>
    );
  }

  const currentQ = questions[currentIndex];
  const timeMin = Math.floor(remainingTime / 60);
  const timeSec = remainingTime % 60;

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">

      {/* Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-gradient-to-br from-violet-600/30 to-fuchsia-600/20 rounded-full blur-3xl animate-pulse"></div>
        <div
          className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] bg-gradient-to-br from-blue-600/25 to-cyan-500/15 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: '1s' }}
        ></div>
      </div>

      <div className="max-w-3xl w-full relative z-10">

        {/* Header */}
        <div className="flex justify-between items-center mb-8 bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 rounded-3xl p-6">
          <div>
            <h1 className="text-3xl font-bold text-white">INSABHI</h1>
            <p className="text-slate-400">
              Question {currentIndex + 1} of {questions.length}
            </p>
          </div>

          <div className="text-right">
            <div className="text-4xl font-mono font-bold text-violet-400">
              {timeMin}:{timeSec < 10 ? '0' : ''}{timeSec}
            </div>
            <p className="text-xs text-slate-500">Remaining Time</p>
          </div>
        </div>

        {/* Question */}
        <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 rounded-3xl p-10 shadow-2xl">
          <h2 className="text-2xl leading-relaxed text-white mb-10">
            {currentQ.question}
          </h2>

          <div className="grid gap-4">
            {currentQ.options.map((opt, idx) => (
              <button
                key={idx}
                onClick={() => selectOption(idx)}
                className={`w-full text-left p-6 rounded-2xl border transition-all text-lg ${
                  answers[currentIndex] === idx
                    ? 'bg-violet-600 border-violet-400 text-white'
                    : 'bg-slate-800 border-slate-700 hover:border-violet-500 hover:bg-slate-700'
                }`}
              >
                {String.fromCharCode(65 + idx)}. {opt}
              </button>
            ))}
          </div>
        </div>

        {/* Buttons */}
        <div className="flex justify-end mt-8">
          {currentIndex < questions.length - 1 ? (
            <button
              onClick={nextQuestion}
              className="bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white font-semibold px-12 py-4 rounded-2xl flex items-center gap-3 transition-all active:scale-95"
            >
              Next Question →
            </button>
          ) : (
            <button
              onClick={handleSubmitTest}
              className="bg-green-600 hover:bg-green-700 text-white font-semibold px-12 py-4 rounded-2xl transition-all active:scale-95"
            >
              Submit Test
            </button>
          )}
        </div>
      </div>

      {/* Instructions */}
      {showInstruction && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-slate-900 border border-violet-500 rounded-3xl p-10 max-w-md text-center shadow-2xl">
            <h3 className="text-2xl font-semibold text-white mb-6">
              Important Instructions
            </h3>

            <div className="space-y-4 text-left text-slate-300 text-[15px]">
              <p>• You cannot go back to previous questions once you move forward.</p>
              <p>• If you face any technical issue, internet disconnection, or accidentally close the tab, immediately contact the official / admin with your 4-digit code.</p>
              <p>• All your answers and progress are automatically saved.</p>
              <p>• Do not switch tabs or open a new tab during the test. Multiple tab switches will lead to automatic submission of your test.</p>
            </div>

            <button
              onClick={closeInstruction}
              className="mt-8 w-full bg-violet-600 hover:bg-violet-700 text-white font-semibold py-4 rounded-2xl transition-all"
            >
              I Understand - Start Test
            </button>
          </div>
        </div>
      )}

      {/* Tab Warning */}
      {showTabWarning && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-[60]">
          <div className="bg-slate-900 border border-red-500 rounded-3xl p-10 max-w-md text-center shadow-2xl">
            <h3 className="text-2xl font-semibold text-red-400 mb-6">
              ⚠️ Warning
            </h3>

            <p className="text-slate-300 mb-8">
              Tab switching detected ({tabSwitchCount}/2). 
              Do not switch tabs again or the test will be auto-submitted.
            </p>

            <button
              onClick={closeTabWarning}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-4 rounded-2xl transition-all"
            >
              I Understand - Continue Test
            </button>
          </div>
        </div>
      )}

    </div>
  );
}