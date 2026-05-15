"use client";
import React, { useState, useEffect } from 'react';

const EMOJIS = [
  '🦄', '🌈', '🍕', '🍭', '🥑', '🎮', '🎸', '🦊', '🚀', '💎',
  '👻', '🌙', '🔥', '🎨', '🧩', '🐙', '🐳', '🦜', '🦖', '🍿',
  '🍩', '🍣', '🥨', '🛹', '🎡'
];

export default function MemoryGame() {
  const [cards, setCards] = useState<{id: number, emoji: string}[]>([]);
  const [flipped, setFlipped] = useState<number[]>([]);
  const [solved, setSolved] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [time, setTime] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);

  const initGame = () => {
    const shuffled = [...EMOJIS, ...EMOJIS]
      .sort(() => Math.random() - 0.5)
      .map((emoji, i) => ({ id: i, emoji }));
    setCards(shuffled);
    setSolved([]);
    setFlipped([]);
    setMoves(0);
    setTime(0);
    setGameStarted(true);
  };

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (gameStarted && solved.length < cards.length) {
      timer = setInterval(() => setTime(prev => prev + 1), 1000);
    }
    return () => clearInterval(timer);
  }, [gameStarted, solved.length, cards.length]);

  const handleCardClick = (id: number) => {
    if (flipped.length === 2 || flipped.includes(id) || solved.includes(id)) return;
    const newFlipped = [...flipped, id];
    setFlipped(newFlipped);
    
    if (newFlipped.length === 2) {
      setMoves(m => m + 1);
      if (cards[newFlipped[0]].emoji === cards[newFlipped[1]].emoji) {
        setSolved(prev => [...prev, ...newFlipped]);
        setFlipped([]);
      } else {
        setTimeout(() => setFlipped([]), 800);
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#0f172a] bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-900 flex flex-col items-center justify-center p-4 text-white">
      <div className="text-center mb-6">
        <h1 className="text-4xl md:text-5xl font-black mb-2 tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-emerald-400 uppercase italic">
          Pro Memory 50
        </h1>
        <div className="flex justify-center gap-4 text-lg font-mono">
          <div className="bg-white/5 border border-white/10 px-4 py-1 rounded-xl shadow-xl">
            Moves: <span className="text-emerald-400">{moves}</span>
          </div>
          <div className="bg-white/5 border border-white/10 px-4 py-1 rounded-xl shadow-xl">
            Time: <span className="text-blue-400">{time}s</span>
          </div>
        </div>
      </div>
      
      {!gameStarted ? (
        <button 
          onClick={initGame} 
          className="px-10 py-5 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl text-xl font-bold hover:scale-105 transition-all shadow-lg active:scale-95"
        >
          START CHALLENGE
        </button>
      ) : (
        <div className="grid grid-cols-5 sm:grid-cols-5 md:grid-cols-10 gap-2 p-4 bg-black/20 rounded-3xl border border-white/5 backdrop-blur-xl">
          {cards.map(card => (
            <div
              key={card.id}
              onClick={() => handleCardClick(card.id)}
              className={`w-12 h-16 sm:w-16 sm:h-20 flex items-center justify-center text-2xl sm:text-3xl rounded-xl cursor-pointer transition-all duration-300 shadow-lg ${
                flipped.includes(card.id) || solved.includes(card.id) 
                ? 'bg-white text-slate-900 rotate-0 scale-100' 
                : 'bg-slate-800 text-transparent rotate-180 hover:bg-slate-700 border border-slate-600'
              }`}
            >
              {(flipped.includes(card.id) || solved.includes(card.id)) ? card.emoji : '⚡'}
            </div>
          ))}
        </div>
      )}

      {solved.length === cards.length && cards.length > 0 && (
        <div className="mt-8 p-6 bg-emerald-500/20 border border-emerald-500/50 rounded-2xl text-center animate-pulse">
          <h2 className="text-3xl font-bold text-emerald-400">WINNER! 🎉</h2>
          <p className="text-gray-300">50 cards matched in {time}s</p>
          <button onClick={initGame} className="mt-4 text-white underline hover:text-emerald-400 transition">Play Again</button>
        </div>
      )}
    </div>
  );
}