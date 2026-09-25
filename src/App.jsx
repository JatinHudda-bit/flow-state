import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Plus, Trash2, CheckCircle2, Circle, Volume2, VolumeX } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function App() {
  const [secondsLeft, setSecondsLeft] = useState(25 * 60);
  const [isActive, setIsActive] = useState(false);
  const [mode, setMode] = useState('focus');

  const [tasks, setTasks] = useState(() => {
    const saved = localStorage.getItem('flowstate_tasks');
    return saved ? JSON.parse(saved) : [
      { id: 1, text: 'Review syllabus priorities', completed: false },
      { id: 2, text: 'Focus block on core topic', completed: false },
    ];
  });
  const [newTaskText, setNewTaskText] = useState('');

  const [notes, setNotes] = useState(() => {
    return localStorage.getItem('flowstate_notes') || '';
  });

  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const audioContextRef = useRef(null);

  useEffect(() => {
    localStorage.setItem('flowstate_tasks', JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    localStorage.setItem('flowstate_notes', notes);
  }, [notes]);

  useEffect(() => {
    let interval = null;
    if (isActive && secondsLeft > 0) {
      interval = setInterval(() => setSecondsLeft((prev) => prev - 1), 1000);
    } else if (secondsLeft === 0) {
      setIsActive(false);
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
      if (mode === 'focus') {
        alert('Focus session complete! Time for a quick break.');
        setMode('break');
        setSecondsLeft(5 * 60);
      } else {
        alert('Break over! Ready to get back into flow?');
        setMode('focus');
        setSecondsLeft(25 * 60);
      }
    }
    return () => clearInterval(interval);
  }, [isActive, secondsLeft, mode]);

  useEffect(() => {
    const mins = Math.floor(secondsLeft / 60);
    const secs = secondsLeft % 60;
    document.title = `(${mins}:${secs < 10 ? '0' : ''}${secs}) FlowState`;
  }, [secondsLeft]);

  const toggleAudio = () => {
    if (isPlayingAudio) {
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
      setIsPlayingAudio(false);
    } else {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      const ctx = new AudioCtx();
      const bufferSize = ctx.sampleRate * 2;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      let lastOut = 0.0;

      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        data[i] = (lastOut + 0.02 * white) / 1.02;
        lastOut = data[i];
        data[i] *= 3.5;
      }

      const noise = ctx.createBufferSource();
      noise.buffer = buffer;
      noise.loop = true;
      noise.connect(ctx.destination);
      noise.start(0);

      audioContextRef.current = ctx;
      setIsPlayingAudio(true);
    }
  };

  const addTask = (e) => {
    e.preventDefault();
    if (!newTaskText.trim()) return;
    if (tasks.length >= 3) {
      alert('Keep your daily priorities strictly to 3 tasks to maintain high focus!');
      return;
    }
    setTasks([...tasks, { id: Date.now(), text: newTaskText.trim(), completed: false }]);
    setNewTaskText('');
  };

  const toggleTask = (id) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  };

  const deleteTask = (id) => {
    setTasks(tasks.filter(t => t.id !== id));
  };

  const formatTime = (totalSeconds) => {
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center p-6 selection:bg-indigo-500 selection:text-white">
      <header className="w-full max-w-4xl flex justify-between items-center py-4 border-b border-slate-800">
        <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-indigo-400 to-sky-400 bg-clip-text text-transparent">
          FlowState
        </h1>
        <button
          onClick={toggleAudio}
          className={`flex items-center gap-2 text-sm px-3.5 py-1.5 rounded-full border transition ${
            isPlayingAudio 
              ? 'border-indigo-500 bg-indigo-500/10 text-indigo-300' 
              : 'border-slate-700 hover:border-slate-500 text-slate-400'
          }`}
        >
          {isPlayingAudio ? <Volume2 size={16} /> : <VolumeX size={16} />}
          <span>{isPlayingAudio ? 'Brown Noise Active' : 'Sound Off'}</span>
        </button>
      </header>

      <main className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-8 mt-10">
        <section className="flex flex-col gap-6">
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-8 flex flex-col items-center text-center shadow-lg backdrop-blur-sm">
            <span className="text-xs uppercase tracking-widest text-slate-400 font-semibold mb-2">
              {mode === 'focus' ? 'Deep Work Session' : 'Quick Recharge'}
            </span>
            <div className="text-7xl font-extrabold tracking-tighter text-slate-100 my-4 font-mono">
              {formatTime(secondsLeft)}
            </div>
            <div className="flex gap-4 mt-2">
              <button
                onClick={() => setIsActive(!isActive)}
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-medium px-6 py-2.5 rounded-xl transition shadow cursor-pointer"
              >
                {isActive ? <Pause size={18} /> : <Play size={18} />}
                <span>{isActive ? 'Pause' : 'Start Focus'}</span>
              </button>
              <button
                onClick={() => {
                  setIsActive(false);
                  setSecondsLeft(mode === 'focus' ? 25 * 60 : 5 * 60);
                }}
                className="p-2.5 rounded-xl border border-slate-700 hover:bg-slate-800 text-slate-400 transition cursor-pointer"
                title="Reset Timer"
              >
                <RotateCcw size={18} />
              </button>
            </div>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 shadow-lg backdrop-blur-sm">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-sm font-semibold tracking-wide text-slate-300">Rule of 3 Priorities</h2>
              <span className="text-xs text-slate-500 font-mono">{tasks.length}/3 tasks</span>
            </div>

            <div className="flex flex-col gap-2.5">
              {tasks.map((task) => (
                <div
                  key={task.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 group hover:border-slate-700 transition"
                >
                  <button
                    onClick={() => toggleTask(task.id)}
                    className="flex items-center gap-3 text-left flex-1 cursor-pointer"
                  >
                    {task.completed ? (
                      <CheckCircle2 size={18} className="text-indigo-400 shrink-0" />
                    ) : (
                      <Circle size={18} className="text-slate-500 shrink-0" />
                    )}
                    <span className={`text-sm ${task.completed ? 'line-through text-slate-500' : 'text-slate-200'}`}>
                      {task.text}
                    </span>
                  </button>
                  <button
                    onClick={() => deleteTask(task.id)}
                    className="text-slate-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition p-1 cursor-pointer"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              ))}
            </div>

            {tasks.length < 3 && (
              <form onSubmit={addTask} className="mt-4 flex gap-2">
                <input
                  type="text"
                  placeholder="Add a high-priority task..."
                  value={newTaskText}
                  onChange={(e) => setNewTaskText(e.target.value)}
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition"
                />
                <button
                  type="submit"
                  className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-3.5 py-2 rounded-xl transition cursor-pointer"
                >
                  <Plus size={16} />
                </button>
              </form>
            )}
          </div>
        </section>

        <section className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 flex flex-col shadow-lg backdrop-blur-sm h-full">
          <div className="mb-2">
            <h2 className="text-sm font-semibold tracking-wide text-slate-300">Distraction Dump</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Offload thoughts here during work sprints. Automatically saves to your browser.
            </p>
          </div>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. Check assignment submission, reply to email later..."
            className="flex-1 min-h-[220px] bg-slate-950 border border-slate-800 rounded-xl p-4 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500 resize-none font-mono transition leading-relaxed"
          />
        </section>
      </main>
    </div>
  );
}