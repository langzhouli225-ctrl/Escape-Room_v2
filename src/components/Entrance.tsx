import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { supabase } from '../lib/supabase';
import { Search } from 'lucide-react';

interface EntranceProps {
  onStart: (playerName: string, sessionId: string) => void;
}

export default function Entrance({ onStart }: EntranceProps) {
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [isStarting, setIsStarting] = useState(false);
  const [typedText, setTypedText] = useState('');
  const [currentSessionId, setCurrentSessionId] = useState('');
  
  const fullText = `Entering the Privacy Detective Office ...\nYou must solve three privacy cases to unlock the title of "Privacy Detective"\nInspect the evidence carefully.\nUnlock each case to move forward.`;

  useEffect(() => {
    if (isStarting) {
      let i = 0;
      const interval = setInterval(() => {
        setTypedText(fullText.substring(0, i));
        i++;
        if (i > fullText.length) {
          clearInterval(interval);
          setTimeout(() => {
            // Call onStart with the session ID we generated during form submit
            onStart(name, currentSessionId);
          }, 2000);
        }
      }, 30);
      return () => clearInterval(interval);
    }
  }, [isStarting, name, onStart, fullText, currentSessionId]);

  const handleStart = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Detective, we need your name for the file.');
      return;
    }
    setError('');
    
    const newSessionId = crypto.randomUUID();
    setCurrentSessionId(newSessionId);
    
    // Write to Supabase
    try {
      const { error: supabaseError } = await supabase.from('game_sessions').insert([
        { session_id: newSessionId, player_name: name, status: 'started' }
      ]);
      if (supabaseError) console.error('Supabase insert error:', supabaseError);
    } catch (err) {
      console.warn('Supabase write failed, proceeding anyway', err);
    }

    setIsStarting(true);
  };

  if (isStarting) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="max-w-2xl w-full">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="font-mono text-neon-cyan text-lg md:text-xl leading-relaxed whitespace-pre-line"
          >
            {typedText}
            <span className="animate-pulse">_</span>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 relative z-10">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="glass-panel p-8 md:p-12 max-w-md w-full rounded-sm border-t-4 border-t-neon-cyan"
      >
        <div className="flex justify-center mb-6">
          <Search className="w-12 h-12 text-neon-cyan opacity-80" />
        </div>
        
        <h1 className="text-3xl md:text-4xl font-serif text-center mb-2 tracking-wide">
          PRIVACY<br/>INVESTIGATION
        </h1>
        <div className="h-px w-full bg-gradient-to-r from-transparent via-noir-600 to-transparent mb-8"></div>
        
        <form onSubmit={handleStart} className="space-y-6">
          <div>
            <label htmlFor="name" className="block text-sm font-mono text-gray-400 mb-2 uppercase tracking-wider">
              Investigator Name (English)
            </label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (error) setError('');
              }}
              className="w-full bg-noir-900 border-b border-noir-600 px-4 py-3 text-paper-light focus:outline-none focus:border-neon-cyan transition-colors font-mono"
              placeholder="e.g. John Doe"
              autoComplete="off"
            />
            {error && (
              <motion.p 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="text-neon-red text-sm mt-2 font-mono"
              >
                {error}
              </motion.p>
            )}
          </div>
          
          <button type="submit" className="w-full btn-neon mt-4">
            Start Investigation
          </button>
        </form>
      </motion.div>
    </div>
  );
}
