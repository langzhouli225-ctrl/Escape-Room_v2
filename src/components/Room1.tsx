import React, { useState } from 'react';
import { motion } from 'motion/react';
import { DndContext, useDraggable, useDroppable, DragEndEvent } from '@dnd-kit/core';
import { X, Lock, Unlock } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Room1Props {
  sessionId: string;
  onComplete: () => void;
}

type ItemId = string;

interface Item {
  id: ItemId;
  label: string;
  correctBucket: 'PI' | 'SPI';
}

const ITEMS: Item[] = [
  { id: 'event_name', label: 'Event Name', correctBucket: 'PI' },
  { id: 'event_date', label: 'Event Date', correctBucket: 'PI' },
  { id: 'venue', label: 'Venue', correctBucket: 'PI' },
  { id: 'work_unit', label: 'Work Unit', correctBucket: 'PI' },
  { id: 'phone', label: 'Phone Number', correctBucket: 'PI' },
  { id: 'email', label: 'Email Address', correctBucket: 'PI' },
  { id: 'id_number', label: 'ID Number', correctBucket: 'SPI' },
  { id: 'bank_account', label: 'Bank Account', correctBucket: 'SPI' },
  { id: 'role', label: 'Professional/Guideline Committee Role', correctBucket: 'PI' },
];

function DraggableItem({ item, onRemove }: { key?: React.Key, item: Item, onRemove?: () => void }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: item.id,
  });

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    zIndex: isDragging ? 50 : 1,
  } : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`relative px-3 py-2 text-sm font-mono border ${isDragging ? 'border-neon-cyan bg-noir-800 shadow-[0_0_15px_rgba(0,243,255,0.3)]' : 'border-noir-600 bg-noir-800/50 hover:border-gray-400'} cursor-grab active:cursor-grabbing rounded-sm transition-colors`}
    >
      {item.label}
      {onRemove && (
        <button 
          onClick={(e) => { e.stopPropagation(); onRemove(); }}
          className="absolute -top-2 -right-2 bg-noir-900 border border-noir-600 rounded-full p-0.5 hover:text-neon-red hover:border-neon-red transition-colors"
          onPointerDown={(e) => e.stopPropagation()}
        >
          <X className="w-3 h-3" />
        </button>
      )}
    </div>
  );
}

function DroppableBucket({ id, title, items, onRemoveItem }: { id: string, title: string, items: Item[], onRemoveItem: (id: ItemId) => void }) {
  const { isOver, setNodeRef } = useDroppable({ id });

  return (
    <div
      ref={setNodeRef}
      className={`p-4 border-2 border-dashed min-h-[150px] flex flex-col transition-colors ${isOver ? 'border-neon-cyan bg-neon-cyan/5' : 'border-noir-600 bg-noir-800/30'}`}
    >
      <h3 className="font-mono text-neon-cyan mb-3 uppercase tracking-wider text-sm">{title}</h3>
      <div className="flex flex-wrap gap-2">
        {items.map(item => (
          <DraggableItem key={item.id} item={item} onRemove={() => onRemoveItem(item.id)} />
        ))}
      </div>
    </div>
  );
}

export default function Room1({ sessionId, onComplete }: Room1Props) {
  const [unassigned, setUnassigned] = useState<Item[]>(ITEMS);
  const [piBucket, setPiBucket] = useState<Item[]>([]);
  const [spiBucket, setSpiBucket] = useState<Item[]>([]);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [shake, setShake] = useState(false);
  const [attempts, setAttempts] = useState<string[]>([]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    const itemId = active.id as string;
    const targetBucket = over.id as string;

    const item = ITEMS.find(i => i.id === itemId);
    if (!item) return;

    // Remove from current
    setUnassigned(prev => prev.filter(i => i.id !== itemId));
    setPiBucket(prev => prev.filter(i => i.id !== itemId));
    setSpiBucket(prev => prev.filter(i => i.id !== itemId));

    // Add to new
    if (targetBucket === 'PI') {
      setPiBucket(prev => [...prev, item]);
    } else if (targetBucket === 'SPI') {
      setSpiBucket(prev => [...prev, item]);
    } else {
      setUnassigned(prev => [...prev, item]);
    }
  };

  const handleRemoveFromBucket = (itemId: ItemId) => {
    const item = ITEMS.find(i => i.id === itemId);
    if (!item) return;
    
    setPiBucket(prev => prev.filter(i => i.id !== itemId));
    setSpiBucket(prev => prev.filter(i => i.id !== itemId));
    setUnassigned(prev => [...prev, item]);
  };

  const handleSubmit = async () => {
    if (unassigned.length > 0) {
      setFeedback("Please classify all items before submitting.");
      return;
    }

    const isPiCorrect = piBucket.every(i => i.correctBucket === 'PI');
    const isSpiCorrect = spiBucket.every(i => i.correctBucket === 'SPI');
    const allCorrect = isPiCorrect && isSpiCorrect;

    const attemptStr = `PI:[${piBucket.map(i => i.id).join(',')}] SPI:[${spiBucket.map(i => i.id).join(',')}]`;
    const newAttempts = [...attempts, attemptStr];
    setAttempts(newAttempts);

    try {
      const { error: supabaseError } = await supabase.from('game_sessions').update({
        room1_attempts: newAttempts.join(' | '),
        room1_completed: allCorrect,
        status: allCorrect ? 'room1_cleared' : 'started'
      }).eq('session_id', sessionId);
      if (supabaseError) console.error('Supabase update error:', supabaseError);
    } catch (e) {
      console.warn('Supabase log failed', e);
    }

    if (allCorrect) {
      setFeedback(null);
      setIsUnlocked(true);
      setTimeout(() => {
        onComplete();
      }, 2000);
    } else {
      setFeedback("Some items have been classified incorrectly. SPI refers to the PI that is likely to result in damage to the personal dignity of any natural person or damage to his or her personal or property safety once disclosed or illegally used.");
      setShake(true);
      setTimeout(() => setShake(false), 500);
    }
  };

  return (
    <div className="min-h-screen p-6 flex flex-col max-w-7xl mx-auto">
      <div className="mb-8 glass-panel p-6 border-l-4 border-l-neon-cyan">
        <p className="font-mono text-paper-light">
          You found a Speaker Invitation Planning sheet on the desk.<br/>
          Drag each PI element into the correct classification category: PI or SPI.<br/>
          You can remove and reclassify items before submitting.<br/>
          Match all items correctly to unlock the drawer.
        </p>
      </div>

      <div className="flex flex-col gap-8 flex-grow">
        
        {/* Top: Planning Sheet */}
        <div className="paper-card p-8 shadow-2xl">
          <div className="border-b-2 border-gray-800 pb-4 mb-6">
            <h2 className="font-serif text-2xl text-gray-900 font-bold uppercase tracking-widest text-center">Speaker Invitation Planning</h2>
            <p className="text-center font-mono text-xs text-gray-600 mt-2">CONFIDENTIAL - INTERNAL USE ONLY</p>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left border-collapse">
              <thead>
                <tr className="border-b-2 border-gray-400">
                  <th className="p-2 font-bold">Event Name</th>
                  <th className="p-2 font-bold">Event Date</th>
                  <th className="p-2 font-bold">Venue</th>
                  <th className="p-2 font-bold">Work Unit</th>
                  <th className="p-2 font-bold">Phone Number</th>
                  <th className="p-2 font-bold">Email Address</th>
                  <th className="p-2 font-bold">ID Number</th>
                  <th className="p-2 font-bold">Bank Account</th>
                  <th className="p-2 font-bold">Professional Role</th>
                </tr>
              </thead>
              <tbody className="font-mono text-xs">
                <tr className="border-b border-gray-300">
                  <td className="p-2">Gastroenterology Scientific Exchange 2025</td>
                  <td className="p-2">18 Nov 2025</td>
                  <td className="p-2">Chengdu Jinjiang Conference Center</td>
                  <td className="p-2">West China Hospital</td>
                  <td className="p-2">+86 13844238888</td>
                  <td className="p-2">Zhang_san@wchospital.cn</td>
                  <td className="p-2">510101198012311234</td>
                  <td className="p-2">6217000188231234</td>
                  <td className="p-2">Chinese Society of Gastroenterology IBD Committee Member</td>
                </tr>
                <tr>
                  <td className="p-2">Precision Oncology Forum 2025</td>
                  <td className="p-2">05 Dec 2025</td>
                  <td className="p-2">Shanghai Internal Medical Center</td>
                  <td className="p-2">Ruijin Hospital</td>
                  <td className="p-2">+86 13977881122</td>
                  <td className="p-2">Li_si@rjhospital.cn</td>
                  <td className="p-2">310110199012311234</td>
                  <td className="p-2">6222848812345678</td>
                  <td className="p-2">CSCO Lung Cancer Committee Youth Member</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Bottom: Drag and Drop */}
        <DndContext onDragEnd={handleDragEnd}>
          <div className="glass-panel p-6 flex-grow flex flex-col">
            <h2 className="font-serif text-xl mb-4 text-gray-300 border-b border-noir-600 pb-2">Classification</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <DroppableBucket id="PI" title="PI (Personal Information)" items={piBucket} onRemoveItem={handleRemoveFromBucket} />
              <DroppableBucket id="SPI" title="SPI (Sensitive Personal Information)" items={spiBucket} onRemoveItem={handleRemoveFromBucket} />
            </div>

            <div className="mt-8">
              <h3 className="font-mono text-gray-400 mb-3 text-sm">Unassigned Elements:</h3>
              <div className="flex flex-wrap gap-2 min-h-[100px] p-4 border border-noir-600 bg-noir-900/50">
                {unassigned.map(item => (
                  <DraggableItem key={item.id} item={item} />
                ))}
              </div>
            </div>

            {/* Drawer Interaction */}
            <div className="mt-8 flex flex-col items-center">
              {feedback && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-4 p-4 bg-noir-800 border border-neon-red text-paper-light font-mono text-sm max-w-md text-center"
                >
                  {feedback}
                </motion.div>
              )}
              
              <motion.button
                animate={shake ? { x: [-10, 10, -10, 10, 0] } : {}}
                transition={{ duration: 0.4 }}
                onClick={handleSubmit}
                className={`group relative w-64 h-20 bg-noir-800 border-2 ${isUnlocked ? 'border-neon-cyan' : 'border-noir-600'} rounded-sm flex items-center justify-center shadow-lg hover:bg-noir-700 transition-colors`}
              >
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/50 pointer-events-none"></div>
                <div className="flex items-center gap-3 font-mono uppercase tracking-widest text-gray-300 group-hover:text-white">
                  {isUnlocked ? (
                    <>
                      <Unlock className="w-5 h-5 text-neon-cyan" />
                      <span className="text-neon-cyan">Unlocked</span>
                    </>
                  ) : (
                    <>
                      <Lock className="w-5 h-5" />
                      <span>Unlock Drawer</span>
                    </>
                  )}
                </div>
              </motion.button>
            </div>
          </div>
        </DndContext>
      </div>
    </div>
  );
}
