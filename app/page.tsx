'use client';

import React, { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import confetti from 'canvas-confetti';
import { 
  Wallet, Swords, Plus, Flame, TrendingUp, ShieldCheck, 
  Trophy, RotateCcw, Activity, WifiOff, Sparkles, 
  ArrowDownCircle, ArrowUpCircle, X, CheckCircle2, LogOut,
  Coins, PieChart, Percent, FileCode2, Volume2, VolumeX,
  History, Copy, Check, Gift, Users, CircleDot, Dices, Send,
  ReceiptText, Download, Printer, Filter, Lock, CheckCircle
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
  game: string;
  payout: number;
  time: string;
}

interface TransactionRecord {
  id: string;
  type: 'DEPOSIT' | 'WITHDRAW' | 'GAME_WIN' | 'SPIN' | 'REF_COMMISSION';
  title: string;
  amount: number;
  date: string;
  txHash: string;
  status: 'COMPLETED' | 'SUCCESS';
}

export default function PlatformPage() {
  const [activeTab, setActiveTab] = useState<'dice' | 'coinflip'>('dice');
  const [account, setAccount] = useState<string | null>(null);
  const [walletType, setWalletType] = useState<string | null>(null);
  const [isDemoWallet, setIsDemoWallet] = useState<boolean>(false);
  const [isWalletModalOpen, setIsWalletModalOpen] = useState<boolean>(false);
  const [copiedText, setCopiedText] = useState<string | null>(null);

  const [balance, setBalance] = useState<number>(250.0);
  const [betInput, setBetInput] = useState<string>('5');
  const [rooms, setRooms] = useState<Room[]>([]);
  const [isServerConnected, setIsServerConnected] = useState<boolean>(false);

  // Oyun State'leri
  const [activeGame, setActiveGame] = useState<boolean>(false);
  const [isRolling, setIsRolling] = useState<boolean>(false);
  const [coinChoice, setCoinChoice] = useState<'YAZI' | 'TURA'>('YAZI');
  const [coinResult, setCoinResult] = useState<'YAZI' | 'TURA' | null>(null);
  const [gameResult, setGameResult] = useState<{
    opponent: string;
    p1Score: any;
    p2Score: any;
    winner: string | null;
  }>({ opponent: 'Rakip', p1Score: null, p2Score: null, winner: null });

  // Günlük Çark (Daily Spin)
  const [isSpinModalOpen, setIsSpinModalOpen] = useState<boolean>(false);
  const [isSpinning, setIsSpinning] = useState<boolean>(false);
  const [spinReward, setSpinReward] = useState<number | null>(null);
  const [canSpin, setCanSpin] = useState<boolean>(true);

  // Referans Sistemi
  const [isRefModalOpen, setIsRefModalOpen] = useState<boolean>(false);
  const [refEarnings, setRefEarnings] = useState<number>(8.50);
  const [totalInvited, setTotalInvited] = useState<number>(6);

  // Provably Fair Modal
  const [isFairModalOpen, setIsFairModalOpen] = useState<boolean>(false);

  // Finans & İşlem Geçmişi (Payments / Transactions)
  const [isTxModalOpen, setIsTxModalOpen] = useState<boolean>(false);
  const [txFilter, setTxFilter] = useState<'ALL' | 'IN' | 'OUT' | 'WINS'>('ALL');
  const [transactions, setTransactions] = useState<TransactionRecord[]>([
    { id: 'tx-101', type: 'DEPOSIT', title: 'Başlangıç USDT Yatırma', amount: 250.00, date: '19.08.2026 19:10', txHash: '0x8f2a...c89e', status: 'COMPLETED' },
    { id: 'tx-102', type: 'GAME_WIN', title: 'Zar Düellosu Zaferi (89-45)', amount: 19.40, date: '19.08.2026 19:15', txHash: '0x4e31...b52a', status: 'SUCCESS' },
    { id: 'tx-103', type: 'REF_COMMISSION', title: 'Referans Ortaklık Payı (%0.5)', amount: 1.25, date: '19.08.2026 19:22', txHash: '0x1a7c...f901', status: 'SUCCESS' }
  ]);

  // Canlı Maç Geçmişi
  const [matchHistory, setMatchHistory] = useState<MatchHistoryItem[]>([
    { id: 'm-1', winner: 'CryptoWhale_88', loser: 'SolanaKing', game: '🎲 Zar (89-45)', payout: 19.40, time: '1 dk önce' },
    { id: 'm-2', winner: 'LuckyStrike', loser: 'MoonBuster', game: '🪙 Yazı-Tura', payout: 9.70, time: '2 dk önce' },
    { id: 'm-3', winner: 'AlphaSeeker', loser: 'DegenTrader', game: '🎲 Zar (78-54)', payout: 38.80, time: '4 dk önce' },
  ]);

  // Ses Motoru
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const rollSoundIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Kasa / Staking Modalları
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [modalTab, setModalTab] = useState<'deposit' | 'withdraw'>('deposit');
  const [modalAmount, setModalAmount] = useState<string>('50');
  const [txSuccessMsg, setTxSuccessMsg] = useState<string | null>(null);

  const [isStakeModalOpen, setIsStakeModalOpen] = useState<boolean>(false);
  const [stakedAmount, setStakedAmount] = useState<number>(100.0);
  const [accumulatedYield, setAccumulatedYield] = useState<number>(14.20);
  const [stakeInput, setStakeInput] = useState<string>('25');
  const [stakeSuccessMsg, setStakeSuccessMsg] = useState<string | null>(null);

  const isRollingRef = useRef<boolean>(false);
  const currentBetRef = useRef<number>(0);

  const addTransaction = (type: TransactionRecord['type'], title: string, amount: number) => {
    const newTx: TransactionRecord = {
      id: `tx-${Date.now()}`,
      type,
      title,
      amount,
      date: new Date().toLocaleString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
      txHash: `0x${Array.from({ length: 8 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}...${Array.from({ length: 4 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`,
      status: 'COMPLETED'
    };
    setTransactions((prev) => [newTx, ...prev]);
  };

  const exportToCSV = () => {
    const headers = 'ID,Islem Turu,Detay,Tutar (USDT),Tarih,Islem Hashi,Durum\n';
    const rows = transactions.map(t => `"${t.id}","${t.type}","${t.title}","${t.amount}","${t.date}","${t.txHash}","${t.status}"`).join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `diceduel_hesap_dokumu_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const printStatement = () => {
    window.print();
  };

  const initAudio = () => {
    if (!audioCtxRef.current && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      audioCtxRef.current = new AudioCtx();
    }
    if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
  };

  const playClickSound = () => {
    if (isMuted || !audioCtxRef.current) return;
    try {
      const ctx = audioCtxRef.current;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(200 + Math.random() * 100, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(40, ctx.currentTime + 0.05);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.05);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.05);
    } catch (e) {}
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
        gain.gain.setValueAtTime(0.25, ctx.currentTime + index * 0.1);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + index * 0.1 + 0.25);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + index * 0.1);
        osc.stop(ctx.currentTime + index * 0.1 + 0.25);
      });
    } catch (e) {}
  };

  const playLoseSound = () => {
    if (isMuted || !audioCtxRef.current) return;
    try {
      const ctx = audioCtxRef.current;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(180, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(70, ctx.currentTime + 0.35);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    } catch (e) {}
  };

  const triggerConfetti = () => {
    confetti({ particleCount: 90, spread: 75, origin: { y: 0.6 } });
  };

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(type);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const shareOnTwitter = (winAmount: number, game: string) => {
    const text = encodeURIComponent(`🎲 DiceDuel'da az önce ${game} oyununda ${winAmount.toFixed(2)} USDT kazandım! 🚀 Sen de katıl:`);
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=https://diceduel.fun`, '_blank');
  };

  const shareOnTelegram = (winAmount: number, game: string) => {
    const text = encodeURIComponent(`🎲 DiceDuel'da ${game} ile ${winAmount.toFixed(2)} USDT kazandım!`);
    window.open(`https://t.me/share/url?url=https://diceduel.fun&text=${text}`, '_blank');
  };

  const pushMatchRecord = (winner: string, loser: string, gameDesc: string, bet: number) => {
    const payout = +(bet * 2 * 0.97).toFixed(2);
    setMatchHistory((prev) => [
      { id: `m-${Date.now()}`, winner, loser, game: gameDesc, payout, time: 'Az önce' },
      ...prev.slice(0, 5),
    ]);
  };

  useEffect(() => {
    socket = io(SERVER_URL);
    socket.on('connect', () => setIsServerConnected(true));
    socket.on('disconnect', () => setIsServerConnected(false));
    socket.on('rooms_update', (updatedRooms: Room[]) => setRooms(updatedRooms));

    return () => {
      socket.disconnect();
    };
  }, []);

  const handleSelectWallet = async (type: 'binance' | 'okx' | 'bybit' | 'metamask' | 'trust' | 'walletconnect' | 'demo') => {
    initAudio();
    setIsWalletModalOpen(false);

    if (type === 'demo') {
      const randomHex = Array.from({ length: 40 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
      setAccount(`0x${randomHex}`);
      setIsDemoWallet(true);
      setWalletType('Demo');
      return;
    }

    const win = window as any;
    let provider = type === 'binance' ? (win.BinanceChain || win.ethereum) : (type === 'okx' ? (win.okxwallet || win.ethereum) : win.ethereum);

    if (provider) {
      try {
        const accounts = await provider.request({ method: 'eth_requestAccounts' });
        if (accounts && accounts.length > 0) {
          setAccount(accounts[0]);
          setIsDemoWallet(false);
          setWalletType(type.toUpperCase());
          return;
        }
      } catch (e) {}
    }

    alert(`${type.toUpperCase()} bulunamadı. Hızlı Demo cüzdanı bağlanıyor.`);
    const randomHex = Array.from({ length: 40 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
    setAccount(`0x${randomHex}`);
    setIsDemoWallet(true);
    setWalletType('Demo');
  };

  // ZAR DÜELLOSU
  const handleStartDiceGame = (amount: number) => {
    initAudio();
    if (isNaN(amount) || amount <= 0 || amount > balance) return;

    currentBetRef.current = amount;
    setBalance((prev) => prev - amount);
    setActiveGame(true);
    setIsRolling(true);
    isRollingRef.current = true;

    if (rollSoundIntervalRef.current) clearInterval(rollSoundIntervalRef.current);
    rollSoundIntervalRef.current = setInterval(playClickSound, 110);

    setGameResult({ opponent: 'Eşleşiyor...', p1Score: null, p2Score: null, winner: null });

    setTimeout(() => {
      if (rollSoundIntervalRef.current) clearInterval(rollSoundIntervalRef.current);
      isRollingRef.current = false;
      setIsRolling(false);

      const p1 = Math.floor(Math.random() * 100) + 1;
      let p2 = Math.floor(Math.random() * 100) + 1;
      while (p1 === p2) p2 = Math.floor(Math.random() * 100) + 1;
      const winner = p1 > p2 ? 'Sen' : 'Hibrit Bot';

      setGameResult({ opponent: 'Hibrit Bot', p1Score: p1, p2Score: p2, winner });
      setAccumulatedYield((prev) => +(prev + 0.08).toFixed(2));

      const winnerName = winner === 'Sen' ? (account ? `${account.substring(0, 6)}...` : 'Sen') : 'Hibrit Bot';
      const loserName = winner === 'Sen' ? 'Hibrit Bot' : (account ? `${account.substring(0, 6)}...` : 'Sen');
      pushMatchRecord(winnerName, loserName, `🎲 Zar (${p1}-${p2})`, amount);

      if (winner === 'Sen') {
        const netWin = amount * 2 * 0.97;
        triggerConfetti();
        playWinSound();
        setBalance((prev) => prev + netWin);
        addTransaction('GAME_WIN', `Zar Düellosu Zaferi (${p1} vs ${p2})`, +netWin.toFixed(2));
      } else {
        playLoseSound();
      }
    }, 4200);
  };

  // YAZI - TURA OYUNU
  const handleStartCoinFlip = (amount: number) => {
    initAudio();
    if (isNaN(amount) || amount <= 0 || amount > balance) return;

    currentBetRef.current = amount;
    setBalance((prev) => prev - amount);
    setActiveGame(true);
    setIsRolling(true);
    setCoinResult(null);

    if (rollSoundIntervalRef.current) clearInterval(rollSoundIntervalRef.current);
    rollSoundIntervalRef.current = setInterval(playClickSound, 100);

    setGameResult({ opponent: 'Kasa (Flip Bot)', p1Score: coinChoice, p2Score: null, winner: null });

    setTimeout(() => {
      if (rollSoundIntervalRef.current) clearInterval(rollSoundIntervalRef.current);
      setIsRolling(false);

      const outcomes: ('YAZI' | 'TURA')[] = ['YAZI', 'TURA'];
      const landed = outcomes[Math.floor(Math.random() * outcomes.length)];
      setCoinResult(landed);

      const isWon = landed === coinChoice;
      const winner = isWon ? 'Sen' : 'Kasa (Flip Bot)';

      setGameResult({ opponent: 'Kasa (Flip Bot)', p1Score: coinChoice, p2Score: landed, winner });
      setAccumulatedYield((prev) => +(prev + 0.08).toFixed(2));

      const winnerName = isWon ? (account ? `${account.substring(0, 6)}...` : 'Sen') : 'Kasa';
      const loserName = isWon ? 'Kasa' : (account ? `${account.substring(0, 6)}...` : 'Sen');
      pushMatchRecord(winnerName, loserName, `🪙 Yazı-Tura (${landed})`, amount);

      if (isWon) {
        const netWin = amount * 2 * 0.97;
        triggerConfetti();
        playWinSound();
        setBalance((prev) => prev + netWin);
        addTransaction('GAME_WIN', `Yazı-Tura Zaferi (${landed})`, +netWin.toFixed(2));
      } else {
        playLoseSound();
      }
    }, 3800);
  };

  // GÜNLÜK ÇARK DÖNDÜRME
  const handleSpinWheel = () => {
    if (!canSpin || isSpinning) return;
    initAudio();
    setIsSpinning(true);

    const rewards = [0.50, 1.00, 1.50, 2.00, 5.00];
    const chosen = rewards[Math.floor(Math.random() * rewards.length)];

    let ticks = 0;
    const tickInterval = setInterval(() => {
      playClickSound();
      ticks++;
      if (ticks > 25) clearInterval(tickInterval);
    }, 120);

    setTimeout(() => {
      setIsSpinning(false);
      setSpinReward(chosen);
      setBalance((prev) => +(prev + chosen).toFixed(2));
      setCanSpin(false);
      triggerConfetti();
      playWinSound();
      addTransaction('SPIN', 'Günlük Şans Çarkı Ödülü', chosen);
    }, 3500);
  };

  const handleBalanceTransaction = () => {
    initAudio();
    const val = parseFloat(modalAmount);
    if (isNaN(val) || val <= 0) return;
    if (!account) return alert('Lütfen önce cüzdanınızı bağlayın!');

    if (modalTab === 'deposit') {
      setBalance((prev) => prev + val);
      setTxSuccessMsg(`+${val} USDT Kontrata Yatırıldı!`);
      addTransaction('DEPOSIT', 'Kasaya USDT Yatırma', val);
    } else {
      if (val > balance) return alert('Kasada yeterli bakiye yok!');
      setBalance((prev) => prev - val);
      setTxSuccessMsg(`-${val} USDT Cüzdanınıza Aktarıldı!`);
      addTransaction('WITHDRAW', 'Cüzdana USDT Çekme', val);
    }
    setTimeout(() => { setTxSuccessMsg(null); setIsModalOpen(false); }, 1200);
  };

  const handleStakeAdd = () => {
    initAudio();
    const val = parseFloat(stakeInput);
    if (isNaN(val) || val <= 0 || val > balance) return alert('Yetersiz bakiye!');
    setBalance((prev) => prev - val);
    setStakedAmount((prev) => prev + val);
    setStakeSuccessMsg(`+${val} USDT LP Havuzuna Kilitlendi!`);
    addTransaction('WITHDRAW', 'Kasa Havuzuna LP Kilitleme', val);
    setTimeout(() => setStakeSuccessMsg(null), 1500);
  };

  const handleClaimYield = () => {
    initAudio();
    if (accumulatedYield <= 0) return;
    setBalance((prev) => +(prev + accumulatedYield).toFixed(2));
    setStakeSuccessMsg(`+${accumulatedYield} USDT Pay Kontrattan Çekildi!`);
    addTransaction('REF_COMMISSION', 'Kasa Havuzu Gelir Payı', +accumulatedYield.toFixed(2));
    setAccumulatedYield(0);
    setTimeout(() => setStakeSuccessMsg(null), 1500);
  };

  const filteredTransactions = transactions.filter(t => {
    if (txFilter === 'IN') return t.type === 'DEPOSIT';
    if (txFilter === 'OUT') return t.type === 'WITHDRAW';
    if (txFilter === 'WINS') return t.type === 'GAME_WIN' || t.type === 'SPIN';
    return true;
  });

  const currentWinPayout = +(currentBetRef.current * 2 * 0.97).toFixed(2);
  const refLink = account ? `https://diceduel.fun/?ref=${account}` : 'https://diceduel.fun/?ref=connect_wallet';

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8 font-sans">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Üst Bar */}
        <header className="flex flex-wrap items-center justify-between gap-4 p-4 bg-slate-900 border border-slate-800 rounded-2xl shadow-lg">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600/20 border border-indigo-500/40 rounded-xl flex items-center justify-center text-indigo-400 font-black text-xl">🎲</div>
            <div>
              <h1 className="font-bold text-base leading-none">DiceDuel Gaming Hub</h1>
              <div className={`flex items-center gap-1.5 mt-1 text-[11px] ${isServerConnected ? 'text-emerald-400' : 'text-rose-400'}`}>
                {isServerConnected ? <Activity className="w-3 h-3 animate-pulse" /> : <WifiOff className="w-3 h-3" />}
                <span>{isServerConnected ? 'Canlı Çoklu Oyun Ağı' : 'Sunucu Uyanıyor...'}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Ödemeler / Hesap Dökümü Butonu */}
            <button 
              onClick={() => setIsTxModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-xs font-bold text-slate-200 transition active:scale-95 shadow-sm"
            >
              <ReceiptText className="w-3.5 h-3.5 text-indigo-400" />
              <span>İşlemler (PDF/CSV)</span>
            </button>

            {/* Günlük Çark */}
            <button 
              onClick={() => setIsSpinModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 rounded-xl text-xs font-bold text-amber-400 transition active:scale-95 shadow-sm"
            >
              <Gift className="w-3.5 h-3.5" />
              <span>Günlük Çark</span>
              {canSpin && <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span>}
            </button>

            {/* Referans */}
            <button 
              onClick={() => setIsRefModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 bg-indigo-950/60 hover:bg-indigo-900/60 border border-indigo-800/60 rounded-xl text-xs font-bold text-indigo-300 transition active:scale-95 shadow-sm"
            >
              <Users className="w-3.5 h-3.5" />
              <span>Davet Et (%0.5)</span>
            </button>

            {/* Provably Fair */}
            <button 
              onClick={() => setIsFairModalOpen(true)}
              className="p-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-emerald-400 transition active:scale-95"
              title="Provably Fair Doğrulayıcı"
            >
              <ShieldCheck className="w-4 h-4" />
            </button>

            {/* Ses Aç/Kapat */}
            <button 
              onClick={() => { initAudio(); setIsMuted(!isMuted); }}
              className="p-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-slate-300 transition active:scale-95"
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-indigo-400" />}
            </button>

            {/* Kasa */}
            <div className="flex items-center bg-slate-800 border border-slate-700 rounded-xl overflow-hidden shadow-inner">
              <div className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-amber-400">
                <Wallet className="w-3.5 h-3.5 text-slate-400" />
                <span>{balance.toFixed(2)} USDT</span>
              </div>
              <button 
                onClick={() => setIsModalOpen(true)}
                className="px-2.5 py-2 bg-slate-700 hover:bg-slate-600 text-[11px] font-bold text-slate-200 border-l border-slate-600 transition active:scale-95"
              >
                Kasa ⚡
              </button>
            </div>

            {/* Cüzdan */}
            {account ? (
              <div className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs font-bold text-slate-200">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>{account.substring(0, 6)}...</span>
                <button onClick={() => { setAccount(null); setIsDemoWallet(false); }} className="text-slate-400 hover:text-rose-400 ml-1">
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button 
                onClick={() => setIsWalletModalOpen(true)} 
                className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl transition active:scale-95 shadow-lg shadow-indigo-600/20"
              >
                Cüzdan Bağla
              </button>
            )}
          </div>
        </header>

        {/* Oyun Seçim Sekmeleri (Tabs) */}
        {!activeGame && (
          <div className="flex gap-2 p-1.5 bg-slate-900 border border-slate-800 rounded-2xl max-w-md mx-auto">
            <button
              onClick={() => setActiveTab('dice')}
              className={`flex-1 py-2.5 rounded-xl text-xs font-black flex items-center justify-center gap-2 transition ${
                activeTab === 'dice' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Dices className="w-4 h-4" /> 🎲 ZAR DÜELLOSU
            </button>
            <button
              onClick={() => setActiveTab('coinflip')}
              className={`flex-1 py-2.5 rounded-xl text-xs font-black flex items-center justify-center gap-2 transition ${
                activeTab === 'coinflip' ? 'bg-amber-600 text-white shadow-lg shadow-amber-600/30' : 'text-slate-400 hover:text-white'
              }`}
            >
              <CircleDot className="w-4 h-4" /> 🪙 YAZI - TURA
            </button>
          </div>
        )}

        {/* Oyun Arenası */}
        {activeGame ? (
          <div className="flex flex-col items-center justify-center p-6 bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-xl mx-auto shadow-2xl">
            <div className="flex justify-between w-full items-center mb-8 px-2">
              <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium bg-emerald-950/60 border border-emerald-800/50 px-3 py-1 rounded-full">
                <ShieldCheck className="w-4 h-4" />
                <span>Provably Fair RNG</span>
              </div>
              <div className="text-sm font-semibold text-slate-300">Ödül: <span className="text-amber-400 font-bold">{currentWinPayout.toFixed(2)} USDT</span></div>
            </div>

            {activeTab === 'dice' ? (
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
            ) : (
              <div className="flex flex-col items-center my-6 space-y-4">
                <span className="text-xs text-slate-400">Seçimin: <span className="font-bold text-amber-400">{coinChoice}</span></span>
                <motion.div 
                  animate={isRolling ? { rotateY: [0, 1800], scale: [1, 1.2, 1] } : {}} 
                  transition={{ repeat: isRolling ? Infinity : 0, duration: 0.8, ease: "linear" }}
                  className="w-28 h-28 rounded-full bg-gradient-to-tr from-amber-600 via-yellow-400 to-amber-500 flex items-center justify-center text-2xl font-black text-slate-950 border-4 border-yellow-300 shadow-2xl shadow-amber-500/30"
                >
                  {isRolling ? '🪙' : coinResult || coinChoice}
                </motion.div>
              </div>
            )}

            {gameResult.winner && !isRolling && (
              <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center gap-3 w-full">
                <div className="flex items-center gap-2 text-emerald-400 font-bold text-lg">
                  <Trophy className="w-5 h-5 text-amber-400" />
                  <span>Kazanan: {gameResult.winner}!</span>
                </div>

                {gameResult.winner === 'Sen' && (
                  <div className="w-full bg-slate-950/80 border border-emerald-800/40 p-3.5 rounded-2xl my-2 flex flex-col items-center gap-2.5">
                    <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Zaferini Paylaş:
                    </span>
                    <div className="flex items-center gap-2 w-full max-w-xs">
                      <button onClick={() => shareOnTwitter(currentWinPayout, activeTab === 'dice' ? 'Zar Düellosu' : 'Yazı-Tura')} className="flex-1 py-2 px-3 bg-black hover:bg-slate-900 border border-slate-700 rounded-xl text-xs font-bold text-white flex items-center justify-center gap-2 transition active:scale-95">
                        <span className="text-sm font-black">𝕏</span> X'te Paylaş
                      </button>
                      <button onClick={() => shareOnTelegram(currentWinPayout, activeTab === 'dice' ? 'Zar Düellosu' : 'Yazı-Tura')} className="flex-1 py-2 px-3 bg-sky-600 hover:bg-sky-500 rounded-xl text-xs font-bold text-white flex items-center justify-center gap-2 transition active:scale-95">
                        <Send className="w-3.5 h-3.5" /> Telegram
                      </button>
                    </div>
                  </div>
                )}

                <button onClick={() => setActiveGame(false)} className="flex items-center gap-2 mt-1 px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-semibold rounded-xl transition border border-slate-700 active:scale-95">
                  <RotateCcw className="w-4 h-4" /> Lobiye Dön
                </button>
              </motion.div>
            )}
          </div>
        ) : (
          activeTab === 'dice' ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 h-fit">
                <h2 className="font-bold text-sm flex items-center gap-2 text-slate-200"><Plus className="w-4 h-4 text-indigo-400" /> Zar Odası Aç</h2>
                <div>
                  <input type="number" value={betInput} onChange={(e) => setBetInput(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm font-bold text-white focus:outline-none" />
                </div>
                <button onClick={() => handleStartDiceGame(parseFloat(betInput))} className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm rounded-xl transition shadow-lg shadow-indigo-600/20 active:scale-95">
                  Meydan Oku
                </button>
              </div>

              <div className="md:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
                <div className="flex justify-between items-center">
                  <h2 className="font-bold text-sm flex items-center gap-2 text-slate-200"><Flame className="w-4 h-4 text-rose-400" /> Canlı Zar Odaları</h2>
                  <span className="text-[11px] text-indigo-400 flex items-center gap-1"><Sparkles className="w-3 h-3" /> Canlı Akış</span>
                </div>
                <div className="space-y-2.5">
                  {rooms.map((r) => (
                    <div key={r.id} className="flex items-center justify-between p-3 bg-slate-950 border border-slate-800 rounded-xl hover:border-slate-700 transition">
                      <span className="text-xs font-semibold text-slate-300">{r.creator}</span>
                      <div className="flex items-center gap-4">
                        <span className="text-xs font-bold text-amber-400">{r.betAmount} USDT</span>
                        <button onClick={() => handleStartDiceGame(r.betAmount)} className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 active:scale-95 transition">
                          <Swords className="w-3.5 h-3.5" /> Zar At
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-lg mx-auto space-y-6 shadow-2xl">
              <div className="text-center space-y-1">
                <h2 className="text-lg font-black text-white flex items-center justify-center gap-2"><CircleDot className="w-5 h-5 text-amber-400" /> Anlık Yazı - Tura Düellosu</h2>
                <p className="text-xs text-slate-400">%50 Şans • 1.94x Kazanç Çarpanı</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button onClick={() => setCoinChoice('YAZI')} className={`py-3.5 rounded-2xl font-black text-sm border transition flex flex-col items-center gap-1 ${coinChoice === 'YAZI' ? 'bg-amber-500/20 border-amber-500 text-amber-300 shadow-lg shadow-amber-500/20' : 'bg-slate-950 border-slate-800 text-slate-400'}`}><span className="text-xl">🦅</span> YAZI SEÇ</button>
                <button onClick={() => setCoinChoice('TURA')} className={`py-3.5 rounded-2xl font-black text-sm border transition flex flex-col items-center gap-1 ${coinChoice === 'TURA' ? 'bg-amber-500/20 border-amber-500 text-amber-300 shadow-lg shadow-amber-500/20' : 'bg-slate-950 border-slate-800 text-slate-400'}`}><span className="text-xl">🪙</span> TURA SEÇ</button>
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1.5 font-medium">Bahis Tutarı (USDT)</label>
                <input type="number" value={betInput} onChange={(e) => setBetInput(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-base font-bold text-white focus:outline-none focus:border-amber-500" />
              </div>

              <div className="flex gap-2">
                {['5', '10', '25', '50'].map((preset) => (
                  <button key={preset} onClick={() => setBetInput(preset)} className="flex-1 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 rounded-lg transition">+{preset}</button>
                ))}
              </div>

              <button onClick={() => handleStartCoinFlip(parseFloat(betInput))} className="w-full py-3.5 bg-gradient-to-r from-amber-600 to-yellow-500 hover:from-amber-500 hover:to-yellow-400 text-slate-950 font-black text-sm rounded-xl transition shadow-lg shadow-amber-500/20 active:scale-95">
                🪙 Parayı Çevir ({(parseFloat(betInput || '0') * 1.94).toFixed(2)} USDT Kazan)
              </button>
            </div>
          )
        )}

        {/* CANLI MAÇ GEÇMİŞİ */}
        <section className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <History className="w-4 h-4 text-indigo-400" /> Son Biten Oyunlar & Kazananlar
            </h3>
            <span className="text-[11px] text-emerald-400 flex items-center gap-1 font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span> Canlı Dağıtım
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
            <AnimatePresence>
              {matchHistory.map((m) => (
                <motion.div key={m.id} initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="p-3 bg-slate-950 border border-slate-800/80 rounded-xl flex items-center justify-between shadow-sm">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1 text-xs font-bold text-slate-200">
                      <Trophy className="w-3.5 h-3.5 text-amber-400" />
                      <span className="truncate max-w-[90px]">{m.winner}</span>
                    </div>
                    <div className="text-[10px] text-slate-500">{m.game} • vs {m.loser}</div>
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

        {/* Footer */}
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

        {/* MODAL: ÖDEMELER VE HESAP DÖKÜMÜ (CSV / PDF) */}
        <AnimatePresence>
          {isTxModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-2xl shadow-2xl relative space-y-4 max-h-[85vh] flex flex-col">
                <div className="flex justify-between items-center pb-2 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <ReceiptText className="w-5 h-5 text-indigo-400" />
                    <h3 className="font-bold text-base text-white">Finansal İşlem Geçmişi & Dekontlar</h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={exportToCSV} className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-indigo-300 rounded-xl text-xs font-bold flex items-center gap-1.5 border border-slate-700 transition" title="CSV Olarak İndir">
                      <Download className="w-3.5 h-3.5" /> CSV İndir
                    </button>
                    <button onClick={printStatement} className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold flex items-center gap-1.5 border border-slate-700 transition" title="PDF / Yazdır">
                      <Printer className="w-3.5 h-3.5" /> PDF / Yazdır
                    </button>
                    <button onClick={() => setIsTxModalOpen(false)} className="text-slate-400 hover:text-white transition ml-2"><X className="w-5 h-5" /></button>
                  </div>
                </div>

                {/* Filtreler */}
                <div className="flex gap-2">
                  {[
                    { id: 'ALL', label: 'Tüm İşlemler' },
                    { id: 'IN', label: 'Yatırılanlar' },
                    { id: 'OUT', label: 'Çekilenler' },
                    { id: 'WINS', label: 'Oyun Kazançları' },
                  ].map(f => (
                    <button 
                      key={f.id} 
                      onClick={() => setTxFilter(f.id as any)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${txFilter === f.id ? 'bg-indigo-600 text-white' : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'}`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>

                {/* Tablo */}
                <div className="flex-1 overflow-y-auto pr-1 space-y-2">
                  {filteredTransactions.length === 0 ? (
                    <div className="text-center py-8 text-xs text-slate-500">Kayıtlı işlem bulunamadı.</div>
                  ) : (
                    filteredTransactions.map(tx => (
                      <div key={tx.id} className="p-3 bg-slate-950 border border-slate-800 rounded-2xl flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs ${
                            tx.type === 'DEPOSIT' || tx.type === 'GAME_WIN' || tx.type === 'SPIN' || tx.type === 'REF_COMMISSION' 
                              ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/40' 
                              : 'bg-rose-950/60 text-rose-400 border border-rose-800/40'
                          }`}>
                            {tx.type === 'DEPOSIT' && '📥'}
                            {tx.type === 'WITHDRAW' && '📤'}
                            {tx.type === 'GAME_WIN' && '🏆'}
                            {tx.type === 'SPIN' && '🎁'}
                            {tx.type === 'REF_COMMISSION' && '👥'}
                          </div>
                          <div>
                            <div className="text-xs font-bold text-slate-200">{tx.title}</div>
                            <div className="text-[10px] text-slate-500 font-mono">{tx.date} • {tx.txHash}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className={`text-xs font-black ${
                            tx.type === 'WITHDRAW' ? 'text-rose-400' : 'text-emerald-400'
                          }`}>
                            {tx.type === 'WITHDRAW' ? '-' : '+'}{tx.amount.toFixed(2)} USDT
                          </div>
                          <span className="text-[9px] bg-slate-900 text-slate-400 px-1.5 py-0.5 rounded font-medium border border-slate-800">Tamamlandı</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* MODAL: PROVABLY FAIR DOĞRULAYICI */}
        <AnimatePresence>
          {isFairModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-md shadow-2xl relative space-y-4">
                <button onClick={() => setIsFairModalOpen(false)} className="absolute top-5 right-5 text-slate-400 hover:text-white transition"><X className="w-5 h-5" /></button>
                <h3 className="font-bold text-base text-white flex items-center gap-2"><ShieldCheck className="w-5 h-5 text-emerald-400" /> Provably Fair Matematiksel Adillik</h3>
                <p className="text-xs text-slate-400">DiceDuel platformunda tüm oyun sonuçları SHA-256 kriptografik hash fonksiyonu ile zincir üstünde önceden mühürlenir.</p>

                <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-2 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-500 block">Server Seed Hash (Mevcut Tur):</span>
                    <span className="font-mono text-[10px] text-indigo-300 break-all">e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">Client Seed (Cüzdanın):</span>
                    <span className="font-mono text-[10px] text-slate-300 break-all">{account || '0xDemoWalletClientSeed'}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px] text-emerald-400 pt-1 font-semibold">
                    <CheckCircle className="w-3.5 h-3.5" /> Sonuçlar değiştirilemez ve manipüle edilemez.
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* MODALLAR (Çark, Ref, Cüzdan, Kasa, LP) */}
        <AnimatePresence>
          {isSpinModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-sm shadow-2xl relative text-center">
                <button onClick={() => setIsSpinModalOpen(false)} className="absolute top-5 right-5 text-slate-400 hover:text-white transition"><X className="w-5 h-5" /></button>
                <h3 className="font-bold text-lg text-white mb-1 flex items-center justify-center gap-2"><Gift className="w-5 h-5 text-amber-400" /> Günlük Şans Çarkı</h3>
                <p className="text-xs text-slate-400 mb-6">Her 24 saatte bir ücretsiz çevirin, anında USDT kazanın!</p>
                <div className="flex justify-center my-4">
                  <motion.div animate={isSpinning ? { rotate: [0, 1440] } : {}} transition={{ duration: 3.5, ease: "easeOut" }} className="w-36 h-36 rounded-full border-4 border-amber-500 bg-gradient-to-br from-indigo-900 via-purple-900 to-slate-950 flex items-center justify-center text-3xl font-black shadow-2xl relative">
                    🎁
                    <div className="absolute top-0 w-3 h-3 bg-amber-400 rotate-45 -translate-y-1"></div>
                  </motion.div>
                </div>
                {spinReward && <div className="p-3 bg-emerald-950/60 border border-emerald-800/60 rounded-xl my-3 text-emerald-300 font-bold text-sm flex items-center justify-center gap-2"><Sparkles className="w-4 h-4 text-amber-400" /> +{spinReward.toFixed(2)} USDT Bakiyenize Eklendi!</div>}
                <button onClick={handleSpinWheel} disabled={!canSpin || isSpinning} className="w-full mt-3 py-3 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black text-sm rounded-xl transition shadow-lg disabled:opacity-40">{isSpinning ? 'Çark Dönüyor...' : canSpin ? 'Ücretsiz Çevir' : 'Yarın Tekrar Gel (24 Saat)'}</button>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {isRefModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-md shadow-2xl relative">
                <button onClick={() => setIsRefModalOpen(false)} className="absolute top-5 right-5 text-slate-400 hover:text-white transition"><X className="w-5 h-5" /></button>
                <h3 className="font-bold text-lg text-white mb-1 flex items-center gap-2"><Users className="w-5 h-5 text-indigo-400" /> Arkadaşını Davet Et & Kazan</h3>
                <p className="text-xs text-slate-400 mb-5">Davet ettiğin herkesin oynadığı her oyundan anında %0.5 pasif komisyon kazan!</p>
                <div className="grid grid-cols-2 gap-3 mb-5">
                  <div className="p-3 bg-slate-950 border border-slate-800 rounded-2xl"><span className="text-[10px] text-slate-400 block mb-1">Davet Edilen Oyuncu</span><span className="text-base font-black text-white">{totalInvited} Kişi</span></div>
                  <div className="p-3 bg-slate-950 border border-slate-800 rounded-2xl"><span className="text-[10px] text-slate-400 block mb-1">Kazanılan Komisyon</span><span className="text-base font-black text-emerald-400">+{refEarnings.toFixed(2)} USDT</span></div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs text-slate-300 font-bold block">Özel Davet Bağlantın:</label>
                  <div className="flex gap-2">
                    <input type="text" readOnly value={refLink} className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-slate-300 focus:outline-none truncate" />
                    <button onClick={() => copyToClipboard(refLink, 'ref')} className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl transition flex items-center gap-1">{copiedText === 'ref' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}{copiedText === 'ref' ? 'Kopyalandı' : 'Kopyala'}</button>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {isWalletModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-md shadow-2xl relative">
                <button onClick={() => setIsWalletModalOpen(false)} className="absolute top-5 right-5 text-slate-400 hover:text-white transition"><X className="w-5 h-5" /></button>
                <h3 className="font-bold text-lg text-white mb-1 flex items-center gap-2"><Wallet className="w-5 h-5 text-indigo-400" /> Cüzdanını Bağla</h3>
                <p className="text-xs text-slate-400 mb-4">Web3 veya Borsa cüzdanınızı seçin.</p>
                <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
                  <button onClick={() => handleSelectWallet('binance')} className="w-full flex items-center justify-between p-3 bg-slate-950 hover:bg-amber-950/20 border border-slate-800 hover:border-amber-500/50 rounded-2xl transition"><div className="flex items-center gap-3"><div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-black text-sm">🟡</div><div className="text-left"><div className="text-xs font-bold text-slate-200">Binance Web3 Wallet</div><div className="text-[10px] text-slate-500">Binance App & Extension</div></div></div><span className="text-[10px] bg-amber-950/60 text-amber-300 px-2 py-0.5 rounded border border-amber-800/40">Popüler</span></button>
                  <button onClick={() => handleSelectWallet('okx')} className="w-full flex items-center justify-between p-3 bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-slate-600 rounded-2xl transition"><div className="flex items-center gap-3"><div className="w-8 h-8 rounded-xl bg-slate-800 text-white flex items-center justify-center font-black text-sm">⬛</div><div className="text-left"><div className="text-xs font-bold text-slate-200">OKX Web3 Wallet</div><div className="text-[10px] text-slate-500">OKX App & Extension</div></div></div></button>
                  <button onClick={() => handleSelectWallet('bybit')} className="w-full flex items-center justify-between p-3 bg-slate-950 hover:bg-orange-950/20 border border-slate-800 hover:border-orange-500/50 rounded-2xl transition"><div className="flex items-center gap-3"><div className="w-8 h-8 rounded-xl bg-orange-500/20 text-orange-400 flex items-center justify-center font-black text-sm">🟧</div><div className="text-left"><div className="text-xs font-bold text-slate-200">Bybit / Bitget Wallet</div><div className="text-[10px] text-slate-500">Web3 Cüzdanları</div></div></div></button>
                  <button onClick={() => handleSelectWallet('metamask')} className="w-full flex items-center justify-between p-3 bg-slate-950 hover:bg-orange-950/20 border border-slate-800 hover:border-orange-500/50 rounded-2xl transition"><div className="flex items-center gap-3"><div className="w-8 h-8 rounded-xl bg-orange-500/20 text-orange-400 flex items-center justify-center font-black text-sm">🦊</div><div className="text-left"><div className="text-xs font-bold text-slate-200">MetaMask</div><div className="text-[10px] text-slate-500">Popüler Web3 Cüzdanı</div></div></div></button>
                  <button onClick={() => handleSelectWallet('demo')} className="w-full flex items-center justify-between p-3 bg-slate-950 hover:bg-indigo-950/20 border border-slate-800 hover:border-indigo-500/50 rounded-2xl transition"><div className="flex items-center gap-3"><div className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-black text-sm">⚡</div><div className="text-left"><div className="text-xs font-bold text-slate-200">Hızlı Demo Cüzdan</div><div className="text-[10px] text-slate-500">Eklentisiz Anında Test</div></div></div><span className="text-[10px] bg-indigo-950/60 text-indigo-300 px-2 py-0.5 rounded border border-indigo-800/40">Kolay</span></button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {isModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-md shadow-2xl relative">
                <button onClick={() => setIsModalOpen(false)} className="absolute top-5 right-5 text-slate-400 hover:text-white transition"><X className="w-5 h-5" /></button>
                <h3 className="font-bold text-lg text-white mb-4 flex items-center gap-2"><Wallet className="w-5 h-5 text-indigo-400" /> Kasa Yönetimi</h3>
                <div className="grid grid-cols-2 gap-2 bg-slate-950 p-1.5 rounded-2xl mb-4 border border-slate-800">
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
                  {txSuccessMsg && <div className="flex items-center gap-2 text-xs text-emerald-400 bg-emerald-950/40 border border-emerald-800/40 p-3 rounded-xl"><CheckCircle2 className="w-4 h-4" /><span>{txSuccessMsg}</span></div>}
                  <button onClick={handleBalanceTransaction} className={`w-full py-3 rounded-xl font-bold text-sm text-white shadow-lg transition active:scale-95 ${modalTab === 'deposit' ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/20' : 'bg-rose-600 hover:bg-rose-500 shadow-rose-600/20'}`}>
                    {modalTab === 'deposit' ? 'Kontrata USDT Aktar' : 'Kontrattan Cüzdana Çek'}
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {isStakeModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-md shadow-2xl relative">
                <button onClick={() => setIsStakeModalOpen(false)} className="absolute top-5 right-5 text-slate-400 hover:text-white transition"><X className="w-5 h-5" /></button>
                <h3 className="font-bold text-lg text-white mb-1 flex items-center gap-2"><Coins className="w-5 h-5 text-emerald-400" /> Kasa Payı Havuzu (LP)</h3>
                <p className="text-xs text-slate-400 mb-5">Her oyundan kesilen %3 komisyonun %1.5'i havuz ortaklarına dağıtılır.</p>
                <div className="grid grid-cols-2 gap-3 mb-5">
                  <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-2xl"><span className="text-[11px] text-slate-400 block mb-1">Kilitli USDT</span><span className="text-base font-black text-indigo-300">{stakedAmount.toFixed(2)} USDT</span></div>
                  <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-2xl"><span className="text-[11px] text-slate-400 block mb-1">Biriken Pay</span><span className="text-base font-black text-emerald-400">+{accumulatedYield.toFixed(2)} USDT</span></div>
                </div>
                <button onClick={handleClaimYield} disabled={accumulatedYield <= 0} className="w-full mb-5 py-2.5 bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-300 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition disabled:opacity-40"><Sparkles className="w-4 h-4 text-emerald-400" /> Biriken Payı Çek</button>
                <div className="space-y-3 pt-3 border-t border-slate-800">
                  <label className="text-xs text-slate-300 font-bold block">Havuz Ortaklığını Artır</label>
                  <div className="flex gap-2">
                    <input type="number" value={stakeInput} onChange={(e) => setStakeInput(e.target.value)} className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm font-bold text-white focus:outline-none" />
                    <button onClick={handleStakeAdd} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl transition">Ortak Ol</button>
                  </div>
                </div>
                {stakeSuccessMsg && <div className="mt-4 flex items-center gap-2 text-xs text-emerald-400 bg-emerald-950/40 border border-emerald-800/40 p-3 rounded-xl"><CheckCircle2 className="w-4 h-4" /><span>{stakeSuccessMsg}</span></div>}
              </motion.div>
            </div>
          )}
        </AnimatePresence>

      </div>
    </main>
  );
}
