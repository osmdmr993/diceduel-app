'use client';

import React, { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import confetti from 'canvas-confetti';
import { Wallet, Swords, Plus, Flame, TrendingUp, ShieldCheck, Trophy, RotateCcw, Activity, WifiOff, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

const SERVER_URL = 'https://diceduel-server.onrender.com';
let socket: Socket;

interface Room {
  id: string;
  creator: string;
  betAmount: number;
}

export default function LobbyPage() {
  const [account, setAccount] = useState<string | null>(null);
  const [balance, setBalance] = useState<number>(250.0);
  const [stakeReward] = useState<number>(12.45);
  const [betInput, setBetInput] = useState<string>('5');
  const [rooms, setRooms] = useState<Room[]>([]);
  const [activeGame, setActiveGame] = useState<boolean>(false);
  const [isRolling, setIsRolling] = useState<boolean>(false);
  const [isServerConnected, setIsServerConnected] = useState<boolean>(false);
  
  const isRollingRef = useRef<boolean>(false);
  const currentBetRef = useRef<number>(0);

  const [gameResult, setGameResult] = useState<{
    opponent: string;
    p1Score: number | null;
    p2Score: number | null;
    winner: string | null;
  }>({
    opponent: 'Rakip',
    p1Score: null,
    p2Score: null,
    winner: null,
  });

  const triggerConfetti = () => {
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
    });
  };

  useEffect(() => {
    socket = io(SERVER_URL);

    socket.on('connect', () => setIsServerConnected(true));
    socket.on('disconnect', () => setIsServerConnected(false));

    socket.on('rooms_update', (updatedRooms: Room[]) => {
      setRooms(updatedRooms);
    });

    socket.on('game_started', (data: { opponent: string; p1Score: number; p2Score: number; winner: string }) => {
      if (!isRollingRef.current) return;

      isRollingRef.current = false;
      setIsRolling(false);
      setGameResult({
        opponent: data.opponent,
        p1Score: data.p1Score,
        p2Score: data.p2Score,
        winner: data.winner,
      });

      if (data.winner === 'Sen') {
        triggerConfetti();
        setBalance((prev) => prev + currentBetRef.current * 2 * 0.97);
      }
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const connectWallet = async () => {
    if (typeof window !== 'undefined' && (window as any).ethereum) {
      try {
        const accounts = await (window as any).ethereum.request({ method: 'eth_requestAccounts' });
        if (accounts.length > 0) setAccount(accounts[0]);
      } catch (error) {
        console.error('Cüzdan hatası:', error);
      }
    } else {
      alert('Lütfen MetaMask yükleyin.');
    }
  };

  const handleStartDuel = (amount: number) => {
    if (isNaN(amount) || amount <= 0 || amount > balance) return;

    currentBetRef.current = amount;
    setBalance((prev) => prev - amount);
    setActiveGame(true);
    setIsRolling(true);
    isRollingRef.current = true;
    setGameResult({ opponent: 'Rakip Eşleşiyor...', p1Score: null, p2Score: null, winner: null });

    if (isServerConnected) {
      socket.emit('create_room', {
        creator: account ? `${account.substring(0, 6)}...` : 'Sen',
        betAmount: amount,
      });
    }

    setTimeout(() => {
      if (isRollingRef.current) {
        isRollingRef.current = false;
        setIsRolling(false);
        
        const p1Score = Math.floor(Math.random() * 100) + 1;
        let p2Score = Math.floor(Math.random() * 100) + 1;
        while (p1Score === p2Score) p2Score = Math.floor(Math.random() * 100) + 1;
        const winner = p1Score > p2Score ? 'Sen' : 'Hibrit Bot';

        setGameResult({ opponent: 'Hibrit Bot', p1Score, p2Score, winner });
        
        if (winner === 'Sen') {
          triggerConfetti();
          setBalance((prev) => prev + amount * 2 * 0.97);
        }
      }
    }, 4500);
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8 font-sans">
      <div className="max-w-4xl mx-auto space-y-6">
        
        <header className="flex flex-wrap items-center justify-between gap-4 p-4 bg-slate-900 border border-slate-800 rounded-2xl shadow-lg">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600/20 border border-indigo-500/40 rounded-xl flex items-center justify-center text-indigo-400 font-black text-xl">🎲</div>
            <div>
              <h1 className="font-bold text-base leading-none">DiceDuel P2P</h1>
              <div className={`flex items-center gap-1.5 mt-1 text-[11px] ${isServerConnected ? 'text-emerald-400' : 'text-rose-400'}`}>
                {isServerConnected ? <Activity className="w-3 h-3 animate-pulse" /> : <WifiOff className="w-3 h-3" />}
                <span>{isServerConnected ? 'Canlı Lobi Akışı Aktif' : 'Sunucu Uyanıyor...'}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm font-bold text-amber-400">
              <Wallet className="w-4 h-4 text-slate-400" />
              <span>{balance.toFixed(2)} USDT</span>
            </div>

            <button onClick={connectWallet} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl transition shadow-lg shadow-indigo-600/20 active:scale-95">
              {account ? `${account.substring(0, 6)}...` : 'Cüzdan Bağla'}
            </button>
          </div>
        </header>

        {activeGame ? (
          <div className="flex flex-col items-center justify-center p-6 bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-xl mx-auto shadow-2xl">
            <div className="flex justify-between w-full items-center mb-8 px-2">
              <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium bg-emerald-950/60 border border-emerald-800/50 px-3 py-1 rounded-full">
                <ShieldCheck className="w-4 h-4" />
                <span>Provably Fair RNG</span>
              </div>
              <div className="text-sm font-semibold text-slate-300">Ödül: <span className="text-amber-400 font-bold">{(currentBetRef.current * 2 * 0.97).toFixed(2)} USDT</span></div>
            </div>

            <div className="grid grid-cols-2 gap-4 w-full relative mb-8">
              <div className="flex flex-col items-center p-4 bg-slate-800/60 rounded-2xl border border-slate-700/50">
                <span className="text-xs text-slate-400 mb-2">Sen</span>
                <motion.div animate={isRolling ? { rotate: [0, 360] } : {}} transition={{ repeat: isRolling ? Infinity : 0, duration: 0.4 }} className="w-24 h-24 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center text-4xl font-black shadow-lg">
                  {isRolling ? '?' : gameResult.p1Score ?? '-'}
                </motion.div>
              </div>

              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-slate-950 border border-slate-700 text-xs font-black text-slate-400 w-8 h-8 rounded-full flex items-center justify-center">VS</div>

              <div className="flex flex-col items-center p-4 bg-slate-800/60 rounded-2xl border border-slate-700/50">
                <span className="text-xs text-slate-400 mb-2 truncate max-w-[110px]">{gameResult.opponent}</span>
                <motion.div animate={isRolling ? { rotate: [0, -360] } : {}} transition={{ repeat: isRolling ? Infinity : 0, duration: 0.4 }} className="w-24 h-24 bg-gradient-to-br from-rose-500 to-amber-600 rounded-2xl flex items-center justify-center text-4xl font-black shadow-lg">
                  {isRolling ? '?' : gameResult.p2Score ?? '-'}
                </motion.div>
              </div>
            </div>

            {gameResult.winner && !isRolling && (
              <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center gap-3 w-full">
                <div className="flex items-center gap-2 text-emerald-400 font-bold text-lg">
                  <Trophy className="w-5 h-5 text-amber-400" />
                  <span>Kazanan: {gameResult.winner}!</span>
                </div>
                <button onClick={() => setActiveGame(false)} className="flex items-center gap-2 mt-2 px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-semibold rounded-xl transition border border-slate-700 active:scale-95">
                  <RotateCcw className="w-4 h-4" /> Lobiye Dön
                </button>
              </motion.div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 h-fit">
              <h2 className="font-bold text-sm flex items-center gap-2 text-slate-200"><Plus className="w-4 h-4 text-indigo-400" /> Oda Aç</h2>
              <div>
                <input type="number" value={betInput} onChange={(e) => setBetInput(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm font-bold text-white focus:outline-none" />
              </div>
              <button onClick={() => handleStartDuel(parseFloat(betInput))} className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm rounded-xl transition shadow-lg shadow-indigo-600/20 active:scale-95">
                Meydan Oku
              </button>
            </div>

            <div className="md:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="font-bold text-sm flex items-center gap-2 text-slate-200"><Flame className="w-4 h-4 text-rose-400" /> Canlı Odalar</h2>
                <span className="text-[11px] text-indigo-400 flex items-center gap-1"><Sparkles className="w-3 h-3" /> Canlı Akış</span>
              </div>
              <div className="space-y-2.5">
                {rooms.map((r) => (
                  <div key={r.id} className="flex items-center justify-between p-3 bg-slate-950 border border-slate-800 rounded-xl hover:border-slate-700 transition">
                    <span className="text-xs font-semibold text-slate-300">{r.creator}</span>
                    <div className="flex items-center gap-4">
                      <span className="text-xs font-bold text-amber-400">{r.betAmount} USDT</span>
                      <button onClick={() => handleStartDuel(r.betAmount)} className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 active:scale-95 transition">
                        <Swords className="w-3.5 h-3.5" /> Zar At
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
