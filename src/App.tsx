import React, { useState } from 'react';
import Entrance from './components/Entrance';
import Room1 from './components/Room1';
import Room2 from './components/Room2';
import Room3 from './components/Room3';
import Completion from './components/Completion';

type GameState = 'entrance' | 'room1' | 'room2' | 'room3' | 'completion';

export default function App() {
  const [gameState, setGameState] = useState<GameState>('entrance');
  const [playerName, setPlayerName] = useState('');
  const [sessionId, setSessionId] = useState('');

  const handleStart = (name: string, session: string) => {
    setPlayerName(name);
    setSessionId(session);
    setGameState('room1');
  };

  return (
    <div className="min-h-screen bg-noir-900 text-paper-light selection:bg-neon-cyan selection:text-noir-900">
      {gameState === 'entrance' && <Entrance onStart={handleStart} />}
      {gameState === 'room1' && <Room1 sessionId={sessionId} onComplete={() => setGameState('room2')} />}
      {gameState === 'room2' && <Room2 sessionId={sessionId} onComplete={() => setGameState('room3')} />}
      {gameState === 'room3' && <Room3 sessionId={sessionId} onComplete={() => setGameState('completion')} />}
      {gameState === 'completion' && <Completion playerName={playerName} sessionId={sessionId} />}
    </div>
  );
}
