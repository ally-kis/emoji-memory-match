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

  const progressPercentage = cards.length > 0 ? Math.round((solved.length / cards.length) * 100) : 0;

  return (
    <div className="min-h-screen bg-[#0f172a] bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-900 flex flex-col items-center justify-center p-4 text-white overflow-x-hidden">
      {/* Декоративні елементи на фоні */}
      <div className="fixed inset-0 opacity-10 pointer-events-none">
        <div className="absolute top-10 left-10 w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl animate-blob"></div>
        <div className="absolute top-40 right-10 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000"></div>
      </div>

      <div className="relative z-10 text-center mb-8">
        <h1 className="text-5xl md:text-6xl font-black mb-4 tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-400 to-emerald-400 uppercase italic whitespace-nowrap">
          Pro Memory 50
        </h1>
        
        {/* Статистика */}
        <div className="flex flex-col sm:flex-row justify-center gap-4 text-base sm:text-lg font-mono mb-6">
          <div className="bg-gradient-to-r from-blue-500/20 to-blue-400/20 border border-blue-400/40 px-5 py-2 rounded-xl shadow-lg backdrop-blur-sm hover:border-blue-400/60 transition">
            ⏱️ Time: <span className="text-blue-300 font-bold">{time}s</span>
          </div>
          <div className="bg-gradient-to-r from-emerald-500/20 to-emerald-400/20 border border-emerald-400/40 px-5 py-2 rounded-xl shadow-lg backdrop-blur-sm hover:border-emerald-400/60 transition">
            🎯 Moves: <span className="text-emerald-300 font-bold">{moves}</span>
          </div>
        </div>

        {/* Індикатор прогресу */}
        {gameStarted && (
          <div className="max-w-xs mx-auto mb-6">
            <div className="flex justify-between items-center mb-2 text-sm">
              <span className="text-gray-300">Progress</span>
              <span className="text-purple-300 font-bold">{progressPercentage}%</span>
            </div>
            <div className="w-full h-3 bg-slate-700/50 rounded-full overflow-hidden border border-slate-600/50 backdrop-blur-sm">
              <div 
                className="h-full bg-gradient-to-r from-purple-500 to-emerald-400 rounded-full transition-all duration-300 shadow-lg"
                style={{ width: `${progressPercentage}%` }}
              ></div>
            </div>
          </div>
        )}
      </div>
      
      {!gameStarted ? (
        <button 
          onClick={initGame} 
          className="relative px-12 py-6 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-3xl text-xl font-bold hover:scale-110 transition-all shadow-2xl active:scale-95 border border-blue-400/50 hover:border-blue-300 overflow-hidden group"
        >
          <span className="relative z-10">✨ START CHALLENGE ✨</span>
          <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-indigo-400 opacity-0 group-hover:opacity-30 transition-opacity rounded-3xl"></div>
        </button>
      ) : (
        <div className="grid grid-cols-10 gap-4 md:gap-5 p-6 md:p-8 bg-gradient-to-br from-slate-800/40 to-slate-900/40 rounded-3xl border border-white/10 backdrop-blur-xl shadow-2xl">
          {cards.map(card => (
            <div
              key={card.id}
              onClick={() => handleCardClick(card.id)}
              className={`w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 flex items-center justify-center rounded-2xl cursor-pointer transition-all duration-500 shadow-lg transform ${
                flipped.includes(card.id) || solved.includes(card.id) 
                ? 'bg-gradient-to-br from-white to-slate-100 text-slate-900 scale-100 rotate-0 shadow-2xl' 
                : 'bg-gradient-to-br from-slate-700 to-slate-800 text-transparent hover:from-slate-600 hover:to-slate-700 border-2 border-slate-600/50 hover:border-slate-500 hover:scale-105 active:scale-95'
              } ${solved.includes(card.id) ? 'opacity-75' : ''}`}
              style={{
                perspective: '1000px',
                transform: (flipped.includes(card.id) || solved.includes(card.id)) ? 'rotateY(0deg)' : 'rotateY(180deg)',
              }}
            >
              <span className={`text-3xl md:text-4xl lg:text-5xl select-none transition-all duration-300 ${
                flipped.includes(card.id) || solved.includes(card.id) 
                ? 'opacity-100 scale-100' 
                : 'opacity-100 scale-125'
              }`}>
                {(flipped.includes(card.id) || solved.includes(card.id)) ? card.emoji : '⚡'}
              </span>
            </div>
          ))}
        </div>
      )}

      {solved.length === cards.length && cards.length > 0 && (
        <div className="relative mt-10 p-8 md:p-10 bg-gradient-to-br from-emerald-500/30 to-teal-500/20 border-2 border-emerald-400/60 rounded-3xl text-center shadow-2xl backdrop-blur-sm animate-pulse max-w-md">
          <div className="absolute -top-5 -right-5 text-6xl animate-bounce">🎉</div>
          <div className="absolute -bottom-5 -left-5 text-6xl animate-bounce" style={{ animationDelay: '0.2s' }}>🎊</div>
          <h2 className="text-4xl md:text-5xl font-black text-emerald-300 mb-3">WINNER!</h2>
          <p className="text-lg text-gray-200 mb-2">🏆 Congratulations! 🏆</p>
          <p className="text-gray-300 mb-2">50 cards matched</p>
          <div className="flex justify-center gap-8 my-4 text-base">
            <div className="bg-black/30 px-4 py-2 rounded-lg">
              ⏱️ <span className="font-bold text-emerald-300">{time}s</span>
            </div>
            <div className="bg-black/30 px-4 py-2 rounded-lg">
              🎯 <span className="font-bold text-emerald-300">{moves}</span>
            </div>
          </div>
          <button 
            onClick={initGame} 
            className="mt-6 px-8 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold rounded-2xl hover:scale-105 transition-all shadow-lg active:scale-95 border border-emerald-300/50"
          >
            🔄 Play Again
          </button>
        </div>
      )}
    </div>
  );
}