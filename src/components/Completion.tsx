import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { supabase } from '../lib/supabase';

interface CompletionProps {
  playerName: string;
  sessionId: string;
}

export default function Completion({ playerName, sessionId }: CompletionProps) {
  const [typedText, setTypedText] = useState('');
  
  const fullText = `Three cases.\nOne Careful investigator.\nYou distinguished PI from SPI, recognized indirect identification, and stopped unnecessary information from leaving the office.\nThe case files are sealed.\n\n${playerName}, you are now a certified Privacy Detective.`;

  useEffect(() => {
    // Log completion
    const logCompletion = async () => {
      try {
        const { error: supabaseError } = await supabase.from('game_sessions').update({ status: 'completed' }).eq('session_id', sessionId);
        if (supabaseError) console.error('Supabase update error:', supabaseError);
      } catch (e) {
        console.warn('Supabase update failed', e);
      }
    };
    logCompletion();

    let i = 0;
    const interval = setInterval(() => {
      setTypedText(fullText.substring(0, i));
      i++;
      if (i > fullText.length) {
        clearInterval(interval);
      }
    }, 40);
    return () => clearInterval(interval);
  }, [fullText, sessionId]);

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-black relative overflow-hidden">
      {/* Desk lamp click off effect */}
      <motion.div 
        initial={{ opacity: 1 }}
        animate={{ opacity: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="absolute inset-0 bg-radial-gradient from-transparent to-black pointer-events-none z-0"
        style={{ background: 'radial-gradient(circle at 50% 30%, rgba(255,255,255,0.1) 0%, rgba(0,0,0,1) 100%)' }}
      />

      <div className="max-w-2xl w-full relative z-10">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="font-mono text-gray-300 text-lg md:text-xl leading-relaxed whitespace-pre-line"
        >
          {typedText}
          <span className="animate-pulse text-neon-cyan">_</span>
        </motion.div>

        {typedText.length >= fullText.length && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1, duration: 1 }}
            className="mt-12 border-t border-noir-600 pt-8 text-center"
          >
            <div className="inline-block border-2 border-neon-cyan text-neon-cyan px-8 py-4 font-serif text-2xl tracking-widest uppercase transform -rotate-2">
              CASE CLOSED
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
