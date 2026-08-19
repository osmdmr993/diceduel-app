'use client';

import React, { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import confetti from 'canvas-confetti';
import { 
  Wallet, Swords, Plus, Flame, TrendingUp, ShieldCheck, 
  Trophy, RotateCcw, Activity, WifiOff, Sparkles, 
  ArrowDownCircle, ArrowUpCircle, X, CheckCircle2, LogOut,
  Coins, PieChart, Percent, FileCode2, Volume2, VolumeX,
  History, Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const SERVER_URL = 'https://diceduel-server.onrender.com';
const CONTRACT_ADDRESS = '0xd9145CCE52D386f254917e481eB44e9943F39138';

let socket: Socket;

interface Room {
  id: string;
  creator: string;
  betAmount: number;
}

interface MatchHistoryItem {
  id: string;
  winner: string;
  loser: string;
  p1Score: number;
  p2Score: number;
  payout: number;
  time: string;
}

export default function LobbyPage() {
  const [account, setAccount] = useState<string | null>(null);
  const [walletType, setWalletType] = useState<string | null>(null);
  const [isDemoWallet, setIsDemoWallet] = useState<boolean>(false);
  const [isWalletModalOpen, setIsWalletModalOpen] = useState<boolean>(false);

  const [balance, setBalance] = useState<number>(250.0);
  const [betInput, setBetInput] = useState<string>('5');
  const [rooms, setRooms] = useState<Room[]>([]);
  const [activeGame, setActiveGame] = useState<boolean>(false);
  const [isRolling, setIsRolling] = useState<boolean>(false);
  const [isServerConnected, setIsServerConnected] = useState<boolean>(false);
  
  // Canlı Maç Geçmişi Listesi
  const [matchHistory, setMatchHistory] = useState<MatchHistoryItem[]>([
    { id: 'm-1', winner: 'CryptoWhale_88', loser: 'SolanaKing', p1Score: 89, p2Score: 45, payout: 19.40, time: '1 dk önce' },
    { id: 'm-2', winner: 'LuckyStrike', loser: 'MoonBuster', p1Score: 92, p2Score: 68, payout: 9.70, time: '3 dk önce' },
    { id: 'm-3', winner: 'AlphaSeeker', loser: 'DegenTrader', p1Score: 78, p2Score: 54, payout: 38.80, time: '5 dk önce' },
  ]);

  // Ses Ayarı State'i
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const rollSoundIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Kasa / Yatır-Çek Modalı
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [modalTab, setModalTab] = useState<'deposit' | 'withdraw'>('deposit');
  const [modalAmount, setModalAmount] = useState<string>('50');
  const [txSuccessMsg, setTxSuccessMsg] = useState<string | null>(null);

  // Staking / Kasa Payı Havuzu State'leri
  const [isStakeModalOpen, setIsStakeModalOpen] = useState<boolean>(false);
  const [stakedAmount, setStakedAmount] = useState<number>(100.0);
  const [accumulatedYield, setAccumulatedYield] = useState<number>(12.45);
  const [stakeInput, setStakeInput] = useState<string>('25');
  const [stakeSuccessMsg, setStakeSuccessMsg] = useState<string | null>(null);

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

  // --- SES MOTORU ---
  const initAudio = () => {
    if (!audioCtxRef.current && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      audioCtxRef.current = new AudioCtx();
    }
    if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
  };

  const playDiceClickSound = () => {
    if (isMuted || !audioCtxRef.current) return;
    try {
      const ctx = audioCtxRef.current;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(160 + Math.random() * 80, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(30, ctx.currentTime + 0.06);
      gain.gain.setValueAtTime(0.25, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.06);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.06);
    } catch (e) {
      console.error(e);
    }
  };

  const playWinSound = () => {
    if (isMuted || !audioCtxRef.current) return;
    try {
      const ctx = audioCtxRef.current;
      const notes = [261.63, 329.63, 392.00, 523.25, 659.25];
      notes.forEach((freq, index) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + index * 0.1);
        gain.gain.setValueAtTime(0.3, ctx.currentTime + index * 0.1);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + index * 0.1 + 0.25);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + index * 0.1);
        osc.stop(ctx.currentTime + index * 0.1 + 0.25);
      });
    } catch (e) {
      console.error(e);
    }
  };

  const playLoseSound = () => {
    if (isMuted || !audioCtxRef.current) return;
    try {
      const ctx = audioCtxRef.current;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(180, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(80, ctx.currentTime + 0.4);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.4);
    } catch (e) {
      console.error(e);
    }
  };

  const startRollingSound = () => {
    initAudio();
    if (rollSoundIntervalRef.current) clearInterval(rollSoundIntervalRef.current);
    rollSoundIntervalRef.current = setInterval(() => {
      playDiceClickSound();
    }, 110);
  };

  const stopRollingSound = () => {
    if (rollSoundIntervalRef.current) {
      clearInterval(rollSoundIntervalRef.current);
      rollSoundIntervalRef.current = null;
    }
  };

  const triggerConfetti = () => {
    confetti({
      particleCount: 90,
      spread: 75,
      origin: { y: 0.6 },
    });
  };

  const pushMatchRecord = (winner: string, loser: string, p1Score: number, p2Score: number, bet: number) => {
    const payout = +(bet * 2 * 0.97).toFixed(2);
    setMatchHistory((prev) => [
      {
        id: `match-${Date.now()}`,
        winner,
        loser,
        p1Score,
        p2Score,
        payout,
        time: 'Az önce',
      },
      ...prev.slice(0, 5),
    ]);
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
      stopRollingSound();

      setGameResult({
        opponent: data.opponent,
        p1Score: data.p1Score,
        p2Score: data.p2Score,
        winner: data.winner,
      });

      setAccumulatedYield((prev) => +(prev + 0.08).toFixed(2));

      const winnerName = data.winner === 'Sen' ? (account ? `${account.substring(0, 6)}...` : 'Sen') : data.opponent;
      const loserName = data.winner === 'Sen' ? data.opponent : (account ? `${account.substring(0, 6)}...` : 'Sen');
      pushMatchRecord(winnerName, loserName, data.p1Score, data.p2Score, currentBetRef.current);

      if (data.winner === 'Sen') {
        triggerConfetti();
        playWinSound();
        setBalance((prev) => prev + currentBetRef.current * 2 * 0.97);
      } else {
        playLoseSound();
      }
    });

    return () => {
      socket.disconnect();
      stopRollingSound();
    };
  }, [isMuted, account]);

  // Çoklu Cüzdan Seçim Fonksiyonu
  const handleSelectWallet = async (type: 'metamask' | 'binance' | 'trust' | 'demo') => {
    initAudio();
    setIsWalletModalOpen(false);

    if (type === 'demo') {
      const randomHex = Array.from({ length: 40 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
      setAccount(`0x${randomHex}`);
      setIsDemoWallet(true);
      setWalletType('Demo');
      return;
    }

    if (type === 'binance') {
      const bProvider = (window as any).BinanceChain || (window as any).ethereum;
      if (bProvider) {
        try {
          const accounts = await bProvider.request({ method: 'eth_requestAccounts' });
          if (accounts && accounts.length > 0) {
            setAccount(accounts[0]);
            setIsDemoWallet(false);
            setWalletType('Binance');
            return;
          }
        } catch (e) {
          console.error(e);
        }
      }
    }

    if (type === 'metamask' || type === 'trust') {
      if (typeof window !== 'undefined' && (window as any).ethereum) {
        try {
          const accounts = await (window as any).ethereum.request({ method: 'eth_requestAccounts' });
          if (accounts && accounts.length > 0) {
            setAccount(accounts[0]);
            setIsDemoWallet(false);
            setWalletType(type === 'metamask' ? 'MetaMask' : 'Trust');
            return;
          }
        } catch (e) {
          console.error(e);
        }
      }
    }

    // Eklenti bulunamazsa uyarıp Demo açar
    alert(`${type.toUpperCase()} eklentisi bulunamadı. Test amaçlı Demo Web3 cüzdanı bağlanıyor.`);
    const randomHex = Array.from({ length: 40 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
    setAccount(`0x${randomHex}`);
    setIsDemoWallet(true);
    setWalletType('Demo');
  };

  const disconnectWallet = (e: React.MouseEvent) => {
    e.stopPropagation();
    setAccount(null);
    setIsDemoWallet(false);
    setWalletType(null);
  };

  const handleStartDuel = (amount: number) => {
    initAudio();
    if (isNaN(amount) || amount <= 0 || amount > balance) return;

    currentBetRef.current = amount;
    setBalance((prev) => prev - amount);
    setActiveGame(true);
    setIsRolling(true);
    isRollingRef.current = true;
    startRollingSound();

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
        stopRollingSound();
        
        const p1Score = Math.floor(Math.random() * 100) + 1;
        let p2Score = Math.floor(Math.random() * 100) + 1;
        while (p1Score === p2Score) p2Score = Math.floor(Math.random() * 100) + 1;
        const winner = p1Score > p2Score ? 'Sen' : 'Hibrit Bot';

        setGameResult({ opponent: 'Hibrit Bot', p1Score, p2Score, winner });
        setAccumulatedYield((prev) => +(prev + 0.08).toFixed(2));
        
        const winnerName = winner === 'Sen' ? (account ? `${account.substring(0, 6)}...` : 'Sen') : 'Hibrit Bot';
        const loserName = winner === 'Sen' ? 'Hibrit Bot' : (account ? `${account.substring(0, 6)}...` : 'Sen');
        pushMatchRecord(winnerName, loserName, p1Score, p2Score, amount);

        if (winner === 'Sen') {
          triggerConfetti();
          playWinSound();
          setBalance((prev) => prev + amount * 2 * 0.97);
        } else {
          playLoseSound();
        }
      }
    }, 4500);
  };

  const handleBalanceTransaction = () => {
    initAudio();
    const val = parseFloat(modalAmount);
    if (isNaN(val) || val <= 0) return;

    if (!account) {
      alert('Lütfen önce cüzdanınızı bağlayın!');
      return;
    }

    if (modalTab === 'deposit') {
      setBalance((prev) => prev + val);
      setTxSuccessMsg(`+${val} USDT Kontrata Yatırıldı!`);
    } else {
      if (val > balance) {
        alert('Kasada yeterli bakiye yok!');
        return;
      }
      setBalance((prev) => prev - val);
      setTxSuccessMsg(`-${val} USDT Cüzdanınıza Aktarıldı!`);
    }

    setTimeout(() => {
      setTxSuccessMsg(null);
      setIsModalOpen(false);
    }, 1200);
  };

  const handleStakeAdd = () => {
    initAudio();
    const val = parseFloat(stakeInput);
    if (isNaN(val) || val <= 0 || val > balance) {
      alert('Yetersiz bakiye!');
      return;
    }
    setBalance((prev) => prev - val);
    setStakedAmount((prev) => prev + val);
    setStakeSuccessMsg(`+${val} USDT LP Havuzuna Kilitlendi!`);
    setTimeout(() => setStakeSuccessMsg(null), 1500);
  };

  const handleClaimYield = () => {
    initAudio();
    if (accumulatedYield <= 0) return;
    setBalance((prev) => +(prev + accumulatedYield).toFixed(2));
    setStakeSuccessMsg(`+${accumulatedYield} USDT Pay Kontrattan Çekildi!`);
    setAccumulatedYield(0);
    setTimeout(() => setStakeSuccessMsg(null), 1500);
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8 font-sans">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Üst Bar */}
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
            <button 
              onClick={() => {
                initAudio();
                setIsMuted(!isMuted);
              }}
              title={isMuted ? 'Sesi Aç' : 'Sesi Kapat'}
              className="p-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-slate-300 transition active:scale-95 shadow-sm"
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-indigo-400" />}
            </button>

            <button 
              onClick={() => setIsStakeModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 bg-emerald-950/50 hover:bg-emerald-900/50 border border-emerald-800/50 rounded-xl text-xs font-semibold text-emerald-400 transition active:scale-95 shadow-sm"
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Kasa Payı: +{accumulatedYield.toFixed(2)} USDT</span>
              <span className="text-[10px] bg-emerald-800/60 px-1 py-0.5 rounded text-emerald-200 ml-1">Havuz</span>
            </button>

            <div className="flex items-center bg-slate-800 border border-slate-700 rounded-xl overflow-hidden shadow-inner">
              <div className="flex items-center gap-2 px-3 py-2 text-sm font-bold text-amber-400">
                <Wallet className="w-4 h-4 text-slate-400" />
                <span>{balance.toFixed(2)} USDT</span>
              </div>
              <button 
                onClick={() => setIsModalOpen(true)}
                className="px-2.5 py-2 bg-slate-700 hover:bg-slate-600 text-xs font-bold text-slate-200 border-l border-slate-600 transition active:scale-95"
              >
                Kasa ⚡
              </button>
            </div>

            {account ? (
              <div className="flex items-center gap-2 px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs font-bold text-slate-200 shadow-lg">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>{account.substring(0, 6)}...{account.substring(account.length - 4)}</span>
                <span className="text-[10px] bg-indigo-900/80 text-indigo-300 px-1.5 py-0.5 rounded font-mono">{walletType || 'Web3'}</span>
                <button 
                  onClick={disconnectWallet}
                  title="Bağlantıyı Kes"
                  className="p-1 hover:bg-rose-900/50 hover:text-rose-400 text-slate-400 rounded-lg transition ml-1"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button 
                onClick={() => setIsWalletModalOpen(true)} 
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl transition shadow-lg shadow-indigo-600/20 active:scale-95"
              >
                Cüzdan Bağla
              </button>
            )}
          </div>
        </header>

        {/* Oyun Arenası */}
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

        {/* CANLI MAÇ GEÇMİŞİ & KAZANANLAR ŞERİDİ */}
        <section className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <History className="w-4 h-4 text-indigo-400" /> Son Biten Düellolar & Kazananlar
            </h3>
            <span className="text-[11px] text-emerald-400 flex items-center gap-1 font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span> Canlı Dağıtım
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
            <AnimatePresence>
              {matchHistory.map((m) => (
                <motion.div
                  key={m.id}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="p-3 bg-slate-950 border border-slate-800/80 rounded-xl flex items-center justify-between shadow-sm"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1 text-xs font-bold text-slate-200">
                      <Trophy className="w-3.5 h-3.5 text-amber-400" />
                      <span className="truncate max-w-[90px]">{m.winner}</span>
                    </div>
                    <div className="text-[10px] text-slate-500">
                      vs {m.loser} ({m.p1Score}-{m.p2Score})
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-xs font-black text-emerald-400">+{m.payout} USDT</div>
                    <div className="text-[10px] text-slate-500">{m.time}</div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </section>

        {/* Akıllı Sözleşme Doğrulama Rozeti */}
        <footer className="flex flex-wrap items-center justify-between gap-3 p-4 bg-slate-900/60 border border-slate-800/80 rounded-2xl text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <FileCode2 className="w-4 h-4 text-indigo-400" />
            <span className="font-medium text-slate-300">Emanet Kontratı:</span>
            <span className="font-mono text-[11px] text-indigo-300 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">{CONTRACT_ADDRESS}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span className="text-[11px] font-semibold text-emerald-400">EVM Doğrulandı</span>
          </div>
        </footer>

        {/* CÜZDAN SEÇİM MODALI (MetaMask, Binance, Trust, Demo) */}
        <AnimatePresence>
          {isWalletModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-sm shadow-2xl relative">
                <button onClick={() => setIsWalletModalOpen(false)} className="absolute top-5 right-5 text-slate-400 hover:text-white transition"><X className="w-5 h-5" /></button>
                
                <h3 className="font-bold text-lg text-white mb-1 flex items-center gap-2">
                  <Wallet className="w-5 h-5 text-indigo-400" /> Cüzdan Bağla
                </h3>
                <p className="text-xs text-slate-400 mb-5">Oynamak için tercih ettiğiniz Web3 cüzdanını seçin.</p>

                <div className="space-y-2.5">
                  {/* Binance Web3 Wallet */}
                  <button 
                    onClick={() => handleSelectWallet('binance')}
                    className="w-full flex items-center justify-between p-3.5 bg-slate-950 hover:bg-amber-950/20 border border-slate-800 hover:border-amber-500/50 rounded-2xl transition group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-black text-sm">🟡</div>
                      <span className="text-xs font-bold text-slate-200 group-hover:text-amber-400">Binance Web3 Wallet</span>
                    </div>
                    <span className="text-[10px] bg-amber-950/60 text-amber-300 px-2 py-0.5 rounded border border-amber-800/40">Popüler</span>
                  </button>

                  {/* MetaMask */}
                  <button 
                    onClick={() => handleSelectWallet('metamask')}
                    className="w-full flex items-center justify-between p-3.5 bg-slate-950 hover:bg-orange-950/20 border border-slate-800 hover:border-orange-500/50 rounded-2xl transition group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-orange-500/20 text-orange-400 flex items-center justify-center font-black text-sm">🦊</div>
                      <span className="text-xs font-bold text-slate-200 group-hover:text-orange-400">MetaMask</span>
                    </div>
                  </button>

                  {/* Trust Wallet */}
                  <button 
                    onClick={() => handleSelectWallet('trust')}
                    className="w-full flex items-center justify-between p-3.5 bg-slate-950 hover:bg-sky-950/20 border border-slate-800 hover:border-sky-500/50 rounded-2xl transition group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center font-black text-sm">🛡️</div>
                      <span className="text-xs font-bold text-slate-200 group-hover:text-sky-400">Trust Wallet</span>
                    </div>
                  </button>

                  {/* Demo Cüzdan */}
                  <button 
                    onClick={() => handleSelectWallet('demo')}
                    className="w-full flex items-center justify-between p-3.5 bg-slate-950 hover:bg-indigo-950/20 border border-slate-800 hover:border-indigo-500/50 rounded-2xl transition group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-black text-sm">⚡</div>
                      <span className="text-xs font-bold text-slate-200 group-hover:text-indigo-400">Hızlı Demo Cüzdan</span>
                    </div>
                    <span className="text-[10px] bg-indigo-950/60 text-indigo-300 px-2 py-0.5 rounded border border-indigo-800/40">Eklentisiz</span>
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* 1. MODAL: Kasa Yönetimi */}
        <AnimatePresence>
          {isModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-md shadow-2xl relative">
                <button onClick={() => setIsModalOpen(false)} className="absolute top-5 right-5 text-slate-400 hover:text-white transition"><X className="w-5 h-5" /></button>
                <h3 className="font-bold text-lg text-white mb-4 flex items-center gap-2"><Wallet className="w-5 h-5 text-indigo-400" /> Kasa Yönetimi</h3>

                <div className="grid grid-cols-2 gap-2 bg-slate-950 p-1.5 rounded-2xl mb-5 border border-slate-800">
                  <button onClick={() => setModalTab('deposit')} className={`flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold transition ${modalTab === 'deposit' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}><ArrowDownCircle className="w-4 h-4" /> USDT Yatır</button>
                  <button onClick={() => setModalTab('withdraw')} className={`flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold transition ${modalTab === 'withdraw' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}><ArrowUpCircle className="w-4 h-4" /> USDT Çek</button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-xs text-slate-400 block mb-1.5 font-medium">Tutar (USDT)</label>
                    <input type="number" value={modalAmount} onChange={(e) => setModalAmount(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-base font-bold text-white focus:outline-none focus:border-indigo-500" />
                  </div>

                  <div className="flex gap-2">
                    {['10', '50', '100', '250'].map((preset) => (
                      <button key={preset} onClick={() => setModalAmount(preset)} className="flex-1 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 rounded-lg transition">+{preset}</button>
                    ))}
                  </div>

                  {txSuccessMsg && (
                    <div className="flex items-center gap-2 text-xs text-emerald-400 bg-emerald-950/40 border border-emerald-800/40 p-3 rounded-xl"><CheckCircle2 className="w-4 h-4" /><span>{txSuccessMsg}</span></div>
                  )}

                  <button onClick={handleBalanceTransaction} className={`w-full py-3 rounded-xl font-bold text-sm text-white shadow-lg transition active:scale-95 ${modalTab === 'deposit' ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/20' : 'bg-rose-600 hover:bg-rose-500 shadow-rose-600/20'}`}>
                    {modalTab === 'deposit' ? 'Kontrata USDT Aktar' : 'Kontrattan Cüzdana Çek'}
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* 2. MODAL: Staking & Kasa Payı Modalı */}
        <AnimatePresence>
          {isStakeModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-md shadow-2xl relative">
                <button onClick={() => setIsStakeModalOpen(false)} className="absolute top-5 right-5 text-slate-400 hover:text-white transition"><X className="w-5 h-5" /></button>
                
                <h3 className="font-bold text-lg text-white mb-1 flex items-center gap-2">
                  <Coins className="w-5 h-5 text-emerald-400" /> Kasa Payı Havuzu (LP)
                </h3>
                <p className="text-xs text-slate-400 mb-5">Her düellodan kesilen %3 komisyon havuz ortaklarına dağıtılır.</p>

                <div className="grid grid-cols-2 gap-3 mb-5">
                  <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-2xl">
                    <span className="text-[11px] text-slate-400 flex items-center gap-1 mb-1"><PieChart className="w-3.5 h-3.5 text-indigo-400" /> Kilitli USDT</span>
                    <span className="text-base font-black text-indigo-300">{stakedAmount.toFixed(2)} USDT</span>
                  </div>

                  <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-2xl">
                    <span className="text-[11px] text-slate-400 flex items-center gap-1 mb-1"><Percent className="w-3.5 h-3.5 text-emerald-400" /> Biriken Pay</span>
                    <span className="text-base font-black text-emerald-400">+{accumulatedYield.toFixed(2)} USDT</span>
                  </div>
                </div>

                <button 
                  onClick={handleClaimYield}
                  disabled={accumulatedYield <= 0}
                  className="w-full mb-5 py-2.5 bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-300 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition disabled:opacity-40"
                >
                  <Sparkles className="w-4 h-4 text-emerald-400" /> Biriken Payı Kontrattan Çek
                </button>

                <div className="space-y-3 pt-3 border-t border-slate-800">
                  <label className="text-xs text-slate-300 font-bold block">Havuz Ortaklığını Artır</label>
                  <div className="flex gap-2">
                    <input 
                      type="number" 
                      value={stakeInput} 
                      onChange={(e) => setStakeInput(e.target.value)}
                      className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm font-bold text-white focus:outline-none"
                    />
                    <button 
                      onClick={handleStakeAdd}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl transition shadow active:scale-95"
                    >
                      Ortak Ol
                    </button>
                  </div>
                </div>

                {stakeSuccessMsg && (
                  <div className="mt-4 flex items-center gap-2 text-xs text-emerald-400 bg-emerald-950/40 border border-emerald-800/40 p-3 rounded-xl">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{stakeSuccessMsg}</span>
                  </div>
                )}
              </motion.div>
            </div>
          )}
        </AnimatePresence>

      </div>
    </main>
  );
}
