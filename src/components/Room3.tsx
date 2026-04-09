import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, CheckCircle, AlertTriangle } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Room3Props {
  sessionId: string;
  onComplete: () => void;
}

interface Field {
  id: string;
  category: string;
  value: string;
  shouldRemove: boolean;
}

const INITIAL_FIELDS: Field[] = [
  { id: 'speaker_id', category: 'Speaker ID', value: 'Speaker-2025-0834', shouldRemove: false },
  { id: 'city', category: 'City', value: 'Chengdu', shouldRemove: false },
  { id: 'arrival_time', category: 'Arrival Time', value: '17 Nov 2025 – 09:30', shouldRemove: false },
  { id: 'checkin_date', category: 'Hotel Check-in Date', value: '17 Nov 2025', shouldRemove: false },
  { id: 'mobile', category: 'Mobile Number', value: '+86 138 4423 8888', shouldRemove: false },
  { id: 'specialty', category: 'Specialty', value: 'Gastroenterology', shouldRemove: true },
  { id: 'history', category: 'Congress Speaking History', value: 'Speaker – Provincial IBD Forum (Oct 2025)', shouldRemove: true },
  { id: 'score', category: 'Internal Engagement Score', value: '8.7 / 10', shouldRemove: true },
  { id: 'note', category: 'Internal CRM note', value: '"High scientific influence, low digital responsiveness"', shouldRemove: true },
  { id: 'pickup', category: 'Airport Pickup Needed', value: 'Yes', shouldRemove: false },
];

export default function Room3({ sessionId, onComplete }: Room3Props) {
  const [activeFields, setActiveFields] = useState<Field[]>(INITIAL_FIELDS);
  const [removedFields, setRemovedFields] = useState<Field[]>([]);
  const [feedback, setFeedback] = useState<{ message: string, type: 'success' | 'error' } | null>(null);
  const [isCleared, setIsCleared] = useState(false);
  const [attempts, setAttempts] = useState<string[]>([]);

  const handleRemove = (field: Field) => {
    if (isCleared) return;
    setActiveFields(prev => prev.filter(f => f.id !== field.id));
    setRemovedFields(prev => [...prev, field]);
    setFeedback(null);
  };

  const handleRestore = (field: Field) => {
    if (isCleared) return;
    setRemovedFields(prev => prev.filter(f => f.id !== field.id));
    
    // Restore to original position
    const originalIndex = INITIAL_FIELDS.findIndex(f => f.id === field.id);
    setActiveFields(prev => {
      const newActive = [...prev];
      // Find where to insert based on original order
      let insertIndex = newActive.length;
      for (let i = 0; i < newActive.length; i++) {
        const currentOriginalIndex = INITIAL_FIELDS.findIndex(f => f.id === newActive[i].id);
        if (originalIndex < currentOriginalIndex) {
          insertIndex = i;
          break;
        }
      }
      newActive.splice(insertIndex, 0, field);
      return newActive;
    });
    setFeedback(null);
  };

  const handleSubmit = async () => {
    if (removedFields.length !== 4) {
      setFeedback({ message: "You must remove exactly 4 fields.", type: 'error' });
      return;
    }

    const allCorrectlyRemoved = removedFields.every(f => f.shouldRemove);
    
    const attemptStr = removedFields.map(f => f.id).join(',');
    const newAttempts = [...attempts, attemptStr];
    setAttempts(newAttempts);

    try {
      const { error: supabaseError } = await supabase.from('game_sessions').update({
        room3_attempts: newAttempts.join(' | '),
        room3_completed: allCorrectlyRemoved,
        status: allCorrectlyRemoved ? 'room3_cleared' : 'room2_cleared'
      }).eq('session_id', sessionId);
      if (supabaseError) console.error('Supabase update error:', supabaseError);
    } catch (e) {
      console.warn('Supabase log failed', e);
    }

    if (allCorrectlyRemoved) {
      setFeedback({ 
        message: "Correct. Only the data necessary for the agency's task should be shared. The dataset has been cleared.", 
        type: 'success' 
      });
      setIsCleared(true);
      setTimeout(() => {
        onComplete();
      }, 3000);
    } else {
      setFeedback({ 
        message: "Some of the removed information is required for event logistics.", 
        type: 'error' 
      });
    }
  };

  return (
    <div className="min-h-screen p-6 flex flex-col max-w-5xl mx-auto">
      <div className="mb-8 glass-panel p-6 border-l-4 border-l-neon-cyan">
        <p className="font-mono text-paper-light">
          Found a file containing speaker PI that is about to be sent to the logistics agency for logistics arrangements.<br/>
          Remove 4 fields they should not receive.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 flex-grow">
        
        {/* Left/Main: Active Fields Table */}
        <div className="lg:col-span-2 flex flex-col">
          <div className="glass-panel p-1 flex-grow flex flex-col">
            <div className="bg-noir-900 border-b border-noir-600 p-4 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-neon-red"></div>
                <div className="w-3 h-3 rounded-full bg-neon-yellow"></div>
                <div className="w-3 h-3 rounded-full bg-neon-cyan"></div>
              </div>
              <span className="font-mono text-xs text-gray-500">export_logistics_v1.csv</span>
            </div>
            
            <div className="p-6 flex-grow overflow-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-noir-600 text-neon-cyan font-mono text-sm uppercase tracking-wider">
                    <th className="py-3 px-4 font-normal">Category</th>
                    <th className="py-3 px-4 font-normal">Value</th>
                    <th className="py-3 px-4 font-normal text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="font-mono text-sm text-gray-300">
                  <AnimatePresence>
                    {activeFields.map((field) => (
                      <motion.tr 
                        key={field.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20, backgroundColor: 'rgba(255,0,60,0.2)' }}
                        className="border-b border-noir-700 hover:bg-noir-800 transition-colors group"
                      >
                        <td className="py-3 px-4">{field.category}</td>
                        <td className="py-3 px-4 text-gray-400">{field.value}</td>
                        <td className="py-3 px-4 text-right">
                          <button 
                            onClick={() => handleRemove(field)}
                            disabled={isCleared}
                            className="text-noir-600 group-hover:text-neon-red transition-colors disabled:opacity-0"
                            title="Remove field"
                          >
                            <X className="w-5 h-5 inline-block" />
                          </button>
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right: Removed Fields & Submit */}
        <div className="flex flex-col gap-6">
          <div className="glass-panel p-6 flex-grow">
            <h3 className="font-mono text-neon-red mb-4 uppercase tracking-wider text-sm flex items-center justify-between">
              <span>Removed Fields</span>
              <span className="bg-noir-900 px-2 py-1 rounded text-xs">{removedFields.length} / 4</span>
            </h3>
            
            <div className="space-y-3 min-h-[200px]">
              <AnimatePresence>
                {removedFields.length === 0 && (
                  <motion.p 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-gray-600 font-mono text-sm italic"
                  >
                    No fields removed yet.
                  </motion.p>
                )}
                {removedFields.map(field => (
                  <motion.div
                    key={field.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="bg-noir-900 border border-neon-red/50 p-3 rounded-sm flex justify-between items-center group"
                  >
                    <span className="font-mono text-xs text-gray-400 line-through">{field.category}</span>
                    <button 
                      onClick={() => handleRestore(field)}
                      disabled={isCleared}
                      className="text-gray-500 hover:text-neon-cyan text-xs font-mono disabled:opacity-0"
                    >
                      Restore
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <AnimatePresence>
              {feedback && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`p-4 border font-mono text-sm flex items-start gap-3 ${
                    feedback.type === 'success' 
                      ? 'bg-neon-cyan/10 border-neon-cyan text-neon-cyan' 
                      : 'bg-neon-red/10 border-neon-red text-neon-red'
                  }`}
                >
                  {feedback.type === 'success' ? <CheckCircle className="w-5 h-5 shrink-0" /> : <AlertTriangle className="w-5 h-5 shrink-0" />}
                  <p>{feedback.message}</p>
                </motion.div>
              )}
            </AnimatePresence>

            <button
              onClick={handleSubmit}
              disabled={isCleared || removedFields.length === 0}
              className="btn-neon w-full"
            >
              {isCleared ? 'DATASET CLEARED' : 'TRANSMIT FILE'}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
