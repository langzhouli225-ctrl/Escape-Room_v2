import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowRight, Laptop } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Room2Props {
  sessionId: string;
  onComplete: () => void;
}

const COMBINATIONS = [
  {
    id: 'A',
    details: ['China', 'Physician', 'Attended event'],
    feedback: 'This combination is too broad to identify a specific individual.'
  },
  {
    id: 'B',
    details: ['Chengdu', 'Gastroenterology', 'Deputy Director', 'Spoke at provincial IBD forum in Oct 2025'],
    feedback: 'Correct. Even without names or contact details a person can become identifiable when several details about their location, specialty, role, and professional activity are combined.',
    isCorrect: true
  },
  {
    id: 'C',
    details: ['Vegetarian', 'Prefers rail travel', 'Needs hotel booking'],
    feedback: 'These details describe preferences, but they do not uniquely identify the HCP.'
  }
];

export default function Room2({ sessionId, onComplete }: Room2Props) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState(false);
  const [password, setPassword] = useState('');
  const [laptopUnlocked, setLaptopUnlocked] = useState(false);
  const [attempts, setAttempts] = useState<string[]>([]);

  const handleSelect = async (id: string) => {
    if (isCorrect) return; // Prevent changing after correct
    
    setSelectedId(id);
    const combo = COMBINATIONS.find(c => c.id === id);
    if (!combo) return;

    setFeedback(combo.feedback);
    
    const correct = !!combo.isCorrect;
    if (correct) {
      setIsCorrect(true);
    }

    const newAttempts = [...attempts, id];
    setAttempts(newAttempts);

    try {
      const { error: supabaseError } = await supabase.from('game_sessions').update({
        room2_attempts: newAttempts.join(','),
        room2_completed: correct,
        status: correct ? 'room2_cleared' : 'room1_cleared'
      }).eq('session_id', sessionId);
      if (supabaseError) console.error('Supabase update error:', supabaseError);
    } catch (e) {
      console.warn('Supabase log failed', e);
    }
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === '9258') {
      setLaptopUnlocked(true);
      setTimeout(() => {
        onComplete();
      }, 1500);
    }
  };

  return (
    <div className="min-h-screen p-6 flex flex-col max-w-5xl mx-auto relative">
      <div className="mb-8 glass-panel p-6 border-l-4 border-l-neon-cyan">
        <p className="font-mono text-paper-light">
          The drawer clicks open. Inside is a set of speaker profile cards.<br/>
          Somewhere in these details is the key to identifying a specific speaker.<br/>
          Choose the correct combination to unlock the laptop.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        {COMBINATIONS.map((combo) => (
          <motion.div
            key={combo.id}
            whileHover={{ y: -5 }}
            onClick={() => handleSelect(combo.id)}
            className={`paper-card p-6 cursor-pointer transition-all duration-300 ${
              selectedId === combo.id 
                ? (combo.isCorrect ? 'ring-2 ring-neon-cyan' : 'ring-2 ring-neon-red')
                : 'hover:shadow-2xl'
            }`}
          >
            <div className="border-b border-gray-300 pb-2 mb-4 flex justify-between items-center">
              <span className="font-serif font-bold text-gray-800">Profile {combo.id}</span>
              <span className="text-xs font-mono text-gray-500">CONFIDENTIAL</span>
            </div>
            <ul className="space-y-3 font-mono text-sm text-gray-700">
              {combo.details.map((detail, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-gray-400 mt-0.5">-</span>
                  <span>{detail}</span>
                </li>
              ))}
            </ul>
          </motion.div>
        ))}
      </div>

      <AnimatePresence>
        {feedback && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`glass-panel p-6 mb-12 border-l-4 ${isCorrect ? 'border-l-neon-cyan' : 'border-l-neon-red'}`}
          >
            <p className="font-mono text-lg">{feedback}</p>
            {isCorrect && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1 }}
                className="mt-6"
              >
                <p className="font-mono text-gray-400 mb-2">Password Fragment Recovered:</p>
                <div className="text-4xl font-mono text-neon-cyan animate-pulse tracking-widest">
                  9258
                </div>
                <p className="font-mono text-sm mt-6 text-gray-300">
                  Use the 👆 password fragment to unlock the laptop on the desk and continue your investigation.
                </p>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Laptop Interaction */}
      <motion.div 
        className={`mt-auto mx-auto w-full max-w-md ${laptopUnlocked ? 'fixed inset-0 z-50 max-w-none flex items-center justify-center bg-noir-900' : ''}`}
        layout
      >
        <div className={`glass-panel p-8 rounded-t-xl border-b-0 flex flex-col items-center transition-all duration-700 ${laptopUnlocked ? 'w-full h-full rounded-none border-0' : ''}`}>
          <Laptop className={`w-16 h-16 mb-6 ${isCorrect ? 'text-neon-cyan' : 'text-noir-600'}`} />
          
          {laptopUnlocked ? (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center"
            >
              <h2 className="text-2xl font-mono text-neon-cyan mb-4">SYSTEM UNLOCKED</h2>
              <p className="text-gray-400 font-mono animate-pulse">Accessing secure files...</p>
            </motion.div>
          ) : (
            <form onSubmit={handlePasswordSubmit} className="w-full relative">
              <input
                type="text"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={!isCorrect}
                placeholder="Enter Password"
                className="w-full bg-noir-900 border border-noir-600 px-4 py-3 text-neon-cyan font-mono tracking-widest focus:outline-none focus:border-neon-cyan disabled:opacity-50 transition-colors"
              />
              <button 
                type="submit"
                disabled={!isCorrect || !password}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-gray-400 hover:text-neon-cyan disabled:opacity-50 transition-colors"
              >
                <ArrowRight className="w-5 h-5" />
              </button>
            </form>
          )}
        </div>
        {!laptopUnlocked && (
          <div className="h-4 bg-noir-700 rounded-b-xl w-[110%] -ml-[5%] shadow-2xl border-t border-noir-600"></div>
        )}
      </motion.div>

    </div>
  );
}
