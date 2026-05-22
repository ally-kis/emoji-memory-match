"use client";
import React, { useState, useEffect, useRef } from 'react';

const EMOJIS = [
  '🦄', '🌈', '🍕', '🍭', '🥑', '🎮', '🎸', '🦊', '🚀', '💎',
  '👻', '🌙'
];

export default function MemoryGame() {
  const [cards, setCards] = useState<{id: number, emoji: string}[]>([]);
  const [flipped, setFlipped] = useState<number[]>([]);
  const [solved, setSolved] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [time, setTime] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);
  const [botMessage, setBotMessage] = useState('');
  const [playerComment, setPlayerComment] = useState('');
  const [showCat, setShowCat] = useState(false);
  const [catMood, setCatMood] = useState<'waiting' | 'satisfied' | 'idle'>('idle');
  const lastInteractionRef = useRef<number>(Date.now());
  const [botCards, setBotCards] = useState<{id: number, emoji: string}[]>([]);
  const [botSolved, setBotSolved] = useState<number[]>([]);
  const [mistakes, setMistakes] = useState(0);
  const [shuffling, setShuffling] = useState(false);
  const [botPaused, setBotPaused] = useState(false);
  const mercyUsedRef = useRef(false);

  // used phrase trackers to avoid immediate repeats
  const mistakeUsedRef = useRef<Set<number>>(new Set());
  const matchUsedRef = useRef<Set<number>>(new Set());
  const idleUsedRef = useRef<Set<number>>(new Set());
  const tauntUsedRef = useRef<Set<number>>(new Set());

  const mistakePhrases = [
    'Моя бабуся шукає пари швидше',
    'Серйозно? Знову повз?',
    'Спробуй увімкнути інтуїцію, вона тобі допоможе',
    'Ти ж був упевнений... правда?',
    'Ой-ой, майстер промаху' 
  ];

  const matchPhrases = [
    'Ого, випадково вгадав',
    'Не радій, попереду ще 40 карток',
    'Хмм, вдача на твоєму боці',
    'Та невже? Гарна пара.'
  ];

  const idlePhrases = [
    'Заснув чи що? Я взагалі то чекаю',
    'Йой, ти тут? Я вже нудьгую',
    'Клацни щось, будь ласка, або я почну мурчати'
  ];

  const botTaunts = [
    'Дивись, навіть у кота пам\'ять краща',
    'Ти граєш чи як?',
    'Заснув? Я би поміркував над цим',
    'Хмм, треба потренуватися'
  ];

  const pickUnique = (arr: string[], usedRef: React.MutableRefObject<Set<number>>) => {
    if (usedRef.current.size >= arr.length) usedRef.current.clear();
    const unused = arr.map((v, i) => i).filter(i => !usedRef.current.has(i));
    const idx = unused[Math.floor(Math.random() * unused.length)];
    usedRef.current.add(idx);
    return arr[idx];
  };

  const initGame = () => {
    const shuffled = [...EMOJIS, ...EMOJIS]
      .sort(() => Math.random() - 0.5)
      .map((emoji, i) => ({ id: i, emoji }));
    const botShuffled = [...EMOJIS, ...EMOJIS]
      .sort(() => Math.random() - 0.5)
      .map((emoji, i) => ({ id: i, emoji }));
    setCards(shuffled);
    setBotCards(botShuffled);
    setSolved([]);
    setFlipped([]);
    setMoves(0);
    setTime(0);
    setGameStarted(true);
    setBotMessage('');
    setShowCat(false);
    setCatMood('idle');
    setBotSolved([]);
    setMistakes(0);
    lastInteractionRef.current = Date.now();
    mercyUsedRef.current = false; // allow mercy pause again for new game
  };

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (gameStarted && solved.length < cards.length) {
      timer = setInterval(() => setTime(prev => prev + 1), 1000);
    }
    return () => clearInterval(timer);
  }, [gameStarted, solved.length, cards.length]);

  // When player finishes the game, show satisfied cat message
  useEffect(() => {
    if (cards.length > 0 && solved.length === cards.length) {
      setShowCat(true);
      setCatMood('satisfied');
      setBotMessage('А я в тобі і не сумнівався!');
    }
  }, [solved.length, cards.length]);

  // Bot autoplay: periodically finds a pair among unsolved with some probability
  useEffect(() => {
    if (!gameStarted) return;
    const id = setInterval(() => {
      if (botCards.length === 0) return;
      // skip if bot already solved all
      if (botSolved.length >= botCards.length) return;
      // skip while bot is paused (mercy period)
      if (botPaused) return;
      // occasional slow behavior: skip this tick so bot plays slower sometimes
      if (Math.random() < 0.22) return;
      // build map of unsolved emoji -> indices
      const map = new Map<string, number[]>();
      botCards.forEach(c => {
        if (botSolved.includes(c.id)) return;
        const arr = map.get(c.emoji) || [];
        arr.push(c.id);
        map.set(c.emoji, arr);
      });
      const candidates = Array.from(map.entries()).filter(([e, idxs]) => idxs.length >= 2);
      if (candidates.length === 0) return;
      const shouldFind = Math.random() < 0.7; // bot finds a pair often
      if (shouldFind) {
        const [emoji, idxs] = candidates[Math.floor(Math.random() * candidates.length)];
        setBotSolved(prev => {
          // avoid duplicates
          const toAdd = idxs.slice(0,2).filter(i => !prev.includes(i));
          return [...prev, ...toAdd];
        });
        const taunt = pickUnique(botTaunts, tauntUsedRef);
        setBotMessage(taunt);
        setTimeout(() => setBotMessage(''), 10000);
      } else {
        // occasionally taunt even if not finding
        if (Math.random() < 0.25) {
          const taunt = pickUnique(botTaunts, tauntUsedRef);
          setBotMessage(taunt);
          setTimeout(() => setBotMessage(''), 10000);
        }
      }
    }, 2500);
    return () => clearInterval(id);
    }, [gameStarted, botCards, botSolved.length, botPaused]);

    // If player finishes before bot, bot congratulates
    useEffect(() => {
      if (cards.length === 0) return;
      if (solved.length === cards.length && botSolved.length < cards.length) {
        // player beat the bot
        const congrats = 'Такого я не очікував, але треба вміти програвати, вітаю! Даш майстерклас?';
        setBotMessage(congrats);
        setCatMood('satisfied');
        // keep message visible a bit
        setTimeout(() => setBotMessage(''), 10000);
      }
    }, [solved.length, botSolved.length, cards.length]);

  // Mercy pause: once per game, after a short delay from start, bot will pause for 40s and show message
  useEffect(() => {
    if (!gameStarted) return;
    if (mercyUsedRef.current) return;
    mercyUsedRef.current = true;
    const outer = setTimeout(() => {
      setBotPaused(true);
      setBotMessage("Бачу тобі треба дати фору,не дякуй,в тебе 10 сек");
      const inner = setTimeout(() => {
        setBotPaused(false);
        setBotMessage('');
      }, 10000);
      // store inner timer id on mercyUsedRef for cleanup reference
      // (attach to ref as property)
      // @ts-ignore
      mercyUsedRef.currentInner = inner;
    }, 40000); // schedule mercy 40s after game start
    return () => {
      clearTimeout(outer);
      // @ts-ignore
      if (mercyUsedRef.currentInner) clearTimeout(mercyUsedRef.currentInner);
    };
  }, [gameStarted]);

  const handleCardClick = (id: number) => {
    if (flipped.length === 2 || flipped.includes(id) || solved.includes(id)) return;
    // register interaction (resets idle timer / hides cat)
    lastInteractionRef.current = Date.now();
    if (showCat) setShowCat(false);
    setBotMessage('');
    setPlayerComment('');
    const newFlipped = [...flipped, id];
    setFlipped(newFlipped);
    
    if (newFlipped.length === 2) {
      setMoves(m => m + 1);
      if (cards[newFlipped[0]].emoji === cards[newFlipped[1]].emoji) {
        setSolved(prev => [...prev, ...newFlipped]);
        setFlipped([]);
        // positive player reaction (unique)
        const msg = pickUnique(matchPhrases, matchUsedRef);
      setPlayerComment(msg);
      setTimeout(() => setPlayerComment(''), 10000);
      } else {
        setTimeout(() => setFlipped([]), 800);
            // negative player reaction (unique)
            const msg = pickUnique(mistakePhrases, mistakeUsedRef);
            setPlayerComment(msg);
            setTimeout(() => setPlayerComment(''), 10000);
          // increment mistake counter and check for shuffle penalty
          incrementMistake();
      }
    }
  };


  const shuffleArray = <T,>(arr: T[]) => arr.sort(() => Math.random() - 0.5);

  const shuffleRemaining = () => {
    setCards(prev => {
      // keep solved card emojis in place, shuffle only unsolved emojis
      const unsolvedIndices = prev.map((c, idx) => solved.includes(c.id) ? -1 : idx).filter(i => i >= 0);
      const unsolvedEmojis = unsolvedIndices.map(i => prev[i].emoji);
      const shuffledEmojis = shuffleArray(unsolvedEmojis.slice());
      const next = prev.map((c, idx) => {
        if (solved.includes(c.id)) return c;
        const emoji = shuffledEmojis.shift() || c.emoji;
        return { ...c, emoji };
      });
      return next;
    });
    // also nudge player's last interaction to avoid immediate idle
    lastInteractionRef.current = Date.now();
  };

  const incrementMistake = () => {
    setMistakes(prev => {
      const next = prev + 1;
      if (next >= 8) {
        // shuffle remaining (unsolved) cards to increase difficulty with visual cue
        setShuffling(true);
        const warning = pickUnique(["Ти думав це просто гра? Тренуй пам'ять!"], tauntUsedRef);
        setBotMessage(warning);
        setTimeout(() => {
          shuffleRemaining();
          setShuffling(false);
          // keep warning visible slightly longer after shuffle
          setTimeout(() => setBotMessage(''), 3000);
        }, 800);
        return 0;
      }
      return next;
    });
  };
  const progressPercentage = cards.length > 0 ? Math.round((solved.length / cards.length) * 100) : 0;

  return (
    <div className="min-h-screen bg-[#0f172a] bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-900 flex flex-col items-center justify-center p-4 text-white overflow-x-hidden">
      <style>{`
        @keyframes shuffle {
          0% { transform: translateX(0) }
          20% { transform: translateX(-10px) }
          40% { transform: translateX(10px) }
          60% { transform: translateX(-8px) }
          80% { transform: translateX(8px) }
          100% { transform: translateX(0) }
        }
        .shuffle { animation: shuffle 800ms ease-in-out; }
      `}</style>
      {/* Декоративні елементи на фоні */}
      <div className="fixed inset-0 opacity-10 pointer-events-none">
        <div className="absolute top-10 left-10 w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl animate-blob"></div>
        <div className="absolute top-40 right-10 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000"></div>
      </div>

      <div className="relative z-10 text-center mb-8">
        <h1 className="text-5xl md:text-6xl font-black mb-4 tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-400 to-emerald-400 uppercase italic break-words leading-tight max-w-full px-2">
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
        {/* inline comments now appear over each board */}
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
        <div className="flex flex-col items-center gap-4">
          <div className="text-center text-lg md:text-2xl font-black uppercase tracking-tight px-4">
            ЗМОЖЕШ ПЕРЕМОГТИ КОТА? ТОДІ ТИСНИ
          </div>
          <button 
            onClick={initGame} 
            className="relative px-12 py-6 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-3xl text-xl font-bold hover:scale-110 transition-all shadow-2xl active:scale-95 border border-blue-400/50 hover:border-blue-300 overflow-hidden group"
          >
            <span className="relative z-10">✨ START CHALLENGE ✨</span>
            <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-indigo-400 opacity-0 group-hover:opacity-30 transition-opacity rounded-3xl"></div>
          </button>
        </div>
      ) : (
        <div className="w-full max-w-6xl grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Player board */}
          <div className="p-4 bg-gradient-to-br from-slate-800/30 to-slate-900/30 rounded-2xl border border-white/5 relative">
            {/* centered overlay comment for player */}
            <div className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-56 w-80 pointer-events-none transition-opacity duration-300 ${playerComment && !shuffling ? 'opacity-100' : 'opacity-0'}`}>
              <div className="mx-auto bg-black/80 text-white px-4 py-2 rounded-2xl text-center shadow-lg">
                {playerComment}
              </div>
            </div>
            <h3 className="text-lg font-semibold mb-3">Ти</h3>
            <div className={`grid grid-cols-6 gap-3 p-2 ${shuffling ? 'opacity-80 shuffle' : ''}`} style={{ transition: 'transform 300ms' }}>
              {cards.map(card => (
                <div
                  key={card.id}
                  onClick={() => handleCardClick(card.id)}
                  className={`w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 flex items-center justify-center rounded-lg cursor-pointer transition-all duration-500 shadow-md transform ${
                    flipped.includes(card.id) || solved.includes(card.id) 
                    ? 'bg-gradient-to-br from-white to-slate-100 text-slate-900 scale-100 rotate-0 shadow-xl' 
                    : 'bg-gradient-to-br from-slate-700 to-slate-800 text-transparent border-2 border-slate-600/40 hover:border-slate-500 hover:scale-105 active:scale-95'
                  } ${solved.includes(card.id) ? 'opacity-75' : ''}`}
                >
                  <span className={`text-2xl md:text-3xl select-none transition-all duration-300 ${
                    flipped.includes(card.id) || solved.includes(card.id) 
                    ? 'opacity-100 scale-100' 
                    : 'opacity-100 scale-110'
                  }`}>
                    {(flipped.includes(card.id) || solved.includes(card.id)) ? card.emoji : '⚡'}
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-3 text-sm text-gray-300">Mistakes: <span className="text-yellow-200 font-bold">{mistakes}</span></div>
          </div>

          {/* Bot board */}
          <div className="p-4 bg-gradient-to-br from-slate-800/30 to-slate-900/30 rounded-2xl border border-white/5 relative flex flex-col">
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-3">Кіт (бот)</h3>
            <div className="flex items-start gap-4">
              <img src="/cat-photo.jpg" alt="cat" className="w-20 h-20 rounded-xl shadow-lg object-cover" />
              <div className="flex-1">
                <div className="grid grid-cols-6 gap-3 p-2">
                  {botCards.map(card => (
                    <div
                      key={`bot-${card.id}`}
                      className={`w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 flex items-center justify-center rounded-lg transition-all duration-500 shadow-md transform ${
                        botSolved.includes(card.id) 
                        ? 'bg-gradient-to-br from-white to-slate-100 text-slate-900 scale-100 shadow-xl' 
                        : 'bg-gradient-to-br from-slate-700 to-slate-800 text-transparent border-2 border-slate-600/40'
                      } ${botSolved.includes(card.id) ? 'opacity-75' : ''}`}
                    >
                      <span className={`text-2xl md:text-3xl select-none transition-all duration-300 ${
                        botSolved.includes(card.id) 
                        ? 'opacity-100 scale-100' 
                        : 'opacity-100 scale-110'
                      }`}>
                        {botSolved.includes(card.id) ? card.emoji : '⚡'}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="mt-3 text-sm text-gray-300">Pairs found: <span className="text-emerald-300 font-bold">{Math.round((botSolved.length / botCards.length) * 100)}%</span></div>
              </div>
            </div>

            {/* bot comment bubble near cat */}
                    <div className="absolute left-32 top-0 pointer-events-none">
                      <div className="bg-black/80 text-white px-3 py-2 rounded-2xl shadow-lg max-w-xs">
                        {botMessage && botMessage}
                      </div>
                      <div className="w-0 h-0 border-t-8 border-t-transparent border-b-8 border-b-transparent border-l-8 border-l-black/80 mt-[-6px]"></div>
                    </div>
          </div>
        </div>
      )}

      {/* Cat helper / idle UI */}
      {showCat && (
        <div className="fixed right-6 bottom-6 z-50 w-64 bg-gradient-to-br from-black/60 to-slate-800/60 border border-white/10 rounded-2xl p-4 shadow-2xl backdrop-blur-md flex gap-3 items-center">
          <div className="text-4xl">{catMood === 'satisfied' ? '😺' : '😼'}</div>
          <div className="text-sm text-gray-200">
            {catMood === 'satisfied' ? 'А я в тобі і не сумнівався!' : (botMessage || idlePhrases[Math.floor(Math.random() * idlePhrases.length)])}
          </div>
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

      {/* Idle detector: show cat after inactivity */}
      <IdleWatcher
        enabled={gameStarted && solved.length < cards.length}
        onIdle={() => {
          setShowCat(true);
          setCatMood('waiting');
          const msg = pickUnique(idlePhrases, idleUsedRef);
          setBotMessage(msg);
        }}
        lastInteractionRef={lastInteractionRef}
      />

      {/* Final winner cat message */}
      {solved.length === cards.length && cards.length > 0 && (
        <div className="fixed right-6 bottom-6">
          <div className="text-4xl">😺</div>
        </div>
      )}
    </div>
  );
}

function IdleWatcher({ enabled, onIdle, lastInteractionRef }: { enabled: boolean; onIdle: () => void; lastInteractionRef: React.RefObject<number> }) {
  useEffect(() => {
    if (!enabled) return;
    const check = () => {
      const delta = Date.now() - (lastInteractionRef.current || 0);
      if (delta > 8000) onIdle();
    };
    const id = setInterval(check, 1000);
    return () => clearInterval(id);
  }, [enabled, onIdle, lastInteractionRef]);
  return null;
}