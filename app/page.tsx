'use client';

import React, { useState, useEffect } from 'react';
import { Wallet, Swords, Plus, Flame, TrendingUp, ShieldCheck, Trophy, RotateCcw } from 'lucide-react';
import { motion } from 'framer-motion';

export default function LobbyPage() {
  const [account, setAccount] = useState<string | null>(null);
  const [balance, setBalance] = useState<number>(250.0);
  const [stakeReward] = useState<number>(12.45);
  const [betInput, setBetInput] = useState<string>('5');
  const [activeGame, setActiveGame] = useState<boolean>(false);
  const [isRolling, setIsRolling] = useState<boolean>(false);
  const [scores, setScores] = useState<{ p1: number | null; p2: number | null }>({ p1: null, p2: null });

  // Tarayıcıdaki Web3 Cüzdanını (MetaMask vb.) Doğrudan Bağlama
  const connectWallet = async () => {
    if (typeof window !== 'undefined' && (window as any).ethereum) {
      try {
        const accounts = await (window as any).ethereum.request({
          method: 'eth_requestAccounts',
        });
        if (accounts.length > 0) {
          setAccount(accounts[0]);
        }
      } catch (error) {
        console.error('Cüzdan bağlantı hatası:', error);
      }
    } else {
      alert('Lütfen MetaMask veya uyumlu bir Web3 cüzdanı yükleyin.');
    }
  };

  const rooms = [
    { id: '1', creator: 'CryptoWhale_88', betAmount: 10 },
    { id: '2', creator: 'SolanaKing', betAmount: 2.5 },
    { id: '3', creator: 'DegenTrader', betAmount: 20 },
  ];

  const handleStartGame = (amount: number) => {
    if (amount <= 0 || amount > balance) return;
    setBalance((prev) => prev - amount);
    setActiveGame(true);
    setIsRolling(true);
    setScores({ p1: null, p2: null });

    setTimeout(() => {
      const p1Score = Math.floor(Math.random() * 100) + 1;
      let p2Score = Math.floor(Math.random() * 100) + 1;
      while (p1Score === p2Score) p2Score = Math.floor(Math.random() * 100) + 1;

      setScores({ p1: p1Score, p2: p2Score });
      setIsRolling(false);

      if (p1Score > p2Score) {
        setBalance((prev) => prev + amount * 2 * 0.97);
      }
    }, 2000);
  };

  const winner = scores.p1 && scores.p2 ? (scores.p1 > scores.p2 ? 'Sen' : 'Rakip') : null;

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8 font-sans">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Üst Bar */}
        <header className="flex flex-wrap items-center justify-between gap-4 p-4 bg-slate-900 border border-slate-800 rounded-2xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600/20 border border-indigo-500/40 rounded-xl flex items-center justify-center text-indigo-400 font-black text-xl">🎲</div>
            <div>
              <h1 className="font-bold text-base leading-none">DiceDuel P2P</h1>
              <span className="text-xs text-slate-400">Yüksek Atan Kazanır</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-2 bg-emerald-950/40 border border-emerald-800/40 rounded-xl text-xs font-semibold text-emerald-400">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Kasa Payı: +{stakeReward} USDT</span>
            </div>

            <div className="flex items-center gap-2 px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm font-bold text-amber-400">
              <Wallet className="w-4 h-4 text-slate-400" />
              <span>{balance.toFixed(2)} USDT</span>
            </div>

            {/* Yerleşik Güvenli Cüzdan Butonu */}
            <button
              onClick={connectWallet}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl transition shadow-lg shadow-indigo-600/20 active:scale-95"
            >
              {account ? `${account.substring(0, 6)}...${account.substring(account.length - 4)}` : 'Cüzdan Bağla'}
            </button>
          </div>
        </header>

        {/* Oyun Arenası */}
        {activeGame ? (
          <div className="flex flex-col items-center justify-center p-6 bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-xl mx-auto shadow-2xl">
            <div className="flex justify-between w-full items-center mb-8 px-2">
              <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium bg-emerald-950/60 border border-emerald-800/50 px-3 py-1 rounded-full">
                <ShieldCheck className="w-4 h-4" />
                <span>Provably Fair</span>
              </div>
              <div className="text-sm font-semibold text-slate-300">
                Ödül: <span className="text-amber-400 font-bold">{(parseFloat(betInput) * 2 * 0.97).toFixed(2)} USDT</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 w-full relative mb-8">
              <div className="flex flex-col items-center p-4 bg-slate-800/60 rounded-2xl border border-slate-700/50">
                <span className="text-xs text-slate-400 mb-2">Sen</span>
                <motion.div animate={isRolling ? { rotate: [0, 360] } : {}} transition={{ repeat: isRolling ? Infinity : 0, duration: 0.4 }} className="w-24 h-24 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center text-4xl font-black">
                  {isRolling ? '?' : scores.p1 ?? '-'}
                </motion.div>
              </div>

              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-slate-950 border border-slate-700 text-xs font-black text-slate-400 w-8 h-8 rounded-full flex items-center justify-center">VS</div>

              <div className="flex flex-col items-center p-4 bg-slate-800/60 rounded-2xl border border-slate-700/50">
                <span className="text-xs text-slate-400 mb-2">Rakip (Bot)</span>
                <motion.div animate={isRolling ? { rotate: [0, -360] } : {}} transition={{ repeat: isRolling ? Infinity : 0, duration: 0.4 }} className="w-24 h-24 bg-gradient-to-br from-rose-500 to-amber-600 rounded-2xl flex items-center justify-center text-4xl font-black">
                  {isRolling ? '?' : scores.p2 ?? '-'}
                </motion.div>
              </div>
            </div>

            {winner && !isRolling && (
              <div className="flex flex-col items-center gap-3 w-full">
                <div className="flex items-center gap-2 text-emerald-400 font-bold text-lg">
                  <Trophy className="w-5 h-5 text-amber-400" />
                  <span>Kazanan: {winner}!</span>
                </div>
                <button onClick={() => setActiveGame(false)} className="flex items-center gap-2 mt-2 px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-semibold rounded-xl transition">
                  <RotateCcw className="w-4 h-4" /> Lobiye Dön
                </button>
              </div>
            )}
          </div>
        ) : (
          /* Lobi */
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 h-fit">
              <h2 className="font-bold text-sm flex items-center gap-2 text-slate-200"><Plus className="w-4 h-4 text-indigo-400" /> Oda Aç</h2>
              <input type="number" value={betInput} onChange={(e) => setBetInput(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm font-bold text-white focus:outline-none" />
              <button onClick={() => handleStartGame(parseFloat(betInput))} className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm rounded-xl transition">Zar At</button>
            </div>

            <div className="md:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
              <h2 className="font-bold text-sm flex items-center gap-2 text-slate-200"><Flame className="w-4 h-4 text-rose-400" /> Açık Odalar</h2>
              <div className="space-y-2.5">
                {rooms.map((r) => (
                  <div key={r.id} className="flex items-center justify-between p-3 bg-slate-950 border border-slate-800 rounded-xl">
                    <span className="text-xs font-semibold">{r.creator}</span>
                    <div className="flex items-center gap-4">
                      <span className="text-xs font-bold text-amber-400">{r.betAmount} USDT</span>
                      <button onClick={() => { setBetInput(r.betAmount.toString()); handleStartGame(r.betAmount); }} className="px-3.5 py-1.5 bg-emerald-600 text-xs font-bold rounded-lg flex items-center gap-1.5">
                        <Swords className="w-3.5 h-3.5" /> Katıl
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
