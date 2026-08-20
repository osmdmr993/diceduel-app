'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import confetti from 'canvas-confetti';
import { ethers } from 'ethers';
import { 
  Wallet, Swords, Plus, Flame, TrendingUp, ShieldCheck, 
  Trophy, RotateCcw, Activity, WifiOff, Sparkles, 
  ArrowDownCircle, ArrowUpCircle, X, CheckCircle2, LogOut,
  Coins, FileCode2, Share2, Copy,
  History, Gift, CircleDot, Dices, Send,
  ReceiptText, Download, Printer,
  MessageCircle, Info, ChevronDown, Loader2, Clock, Lock, Unlock
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// ==========================================
// 1. SABİTLER & KONTRAT YAPILANDIRMASI
// ==========================================
const SERVER_URL = 'https://diceduel-server.onrender.com';
const BSC_USDT_ADDRESS = '0x55d398326f99059fF775485246999027B3197955';
const CONTRACT_ADDRESS = '0xC9c586A92465C7254C3e19FebAAeD9D5c61f974f';

const MIN_BET = 0.5;
const MAX_PLAYER_BET = 20.0;
const BOT_NAMES = ['CryptoWhale_88', 'DegenKing_07', 'LuckyStrike', 'AlphaSeeker', 'SolanaKing', 'MoonHunter'];

const ERC20_ABI = [
  "function balanceOf(address owner) view returns (uint256)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function decimals() view returns (uint8)"
];

const PLATFORM_ABI = [
  "function deposit(uint256 amount, address referrer) external",
  "function withdraw(uint256 amount) external",
  "function userBalances(address user) view returns (uint256)",
  "function stakedLP(address user) view returns (uint256)",
  "function accumulatedLPYield(address user) view returns (uint256)",
  "function stakeToLP(uint256 amount) external",
  "function claimLPYield() external"
];

let socket: Socket;

const TRANSLATIONS: Record<string, any> = {
  tr: {
    hubTitle: 'DiceDuel Gaming Hub',
    liveNet: 'BSC Mainnet Canlı',
    connecting: 'Sunucu Bağlanıyor...',
    txBtn: 'İşlemler (PDF/CSV)',
    dailySpin: 'Günlük Çark',
    inviteBtn: 'Davet Et (%0.5)',
    vault: 'Kasa ⚡',
    connectWallet: 'Cüzdan Bağla',
    tabDice: '🎲 ZAR DÜELLOSU',
    tabCoin: '🪙 YAZI - TURA',
    openRoom: 'Zar Odası Aç',
    challenge: 'Meydan Oku',
    liveRooms: 'Canlı Zar Odaları',
    rollDice: 'Zar At',
    you: 'Sen',
    fairRng: 'Provably Fair RNG',
    reward: 'Ödül',
    winner: 'Kazanan',
    backLobby: 'Lobiye Dön',
    selectHeads: 'YAZI SEÇ',
    selectTails: 'TURA SEÇ',
    flipCoin: 'Parayı Çevir',
    betAmount: 'Bahis Tutarı',
    recentGames: 'Son Biten Oyunlar & Kazananlar',
    liveDist: 'Canlı Dağıtım',
    contractBadge: 'BSC Kontratı',
    evmVerified: 'Mainnet Doğrulandı',
    support: 'Destek & SSS',
    stakeTitle: 'Kasa Ortaklığı & LP Staking',
    poolGuideTitle: 'Kasa Havuzu (LP) Nasıl Çalışır?',
    poolGuideText: 'Platformda oynanan tüm oyunlardan %3 ev komisyonu kesilir. Bu komisyonun yarısından fazlası havuz ortaklarına anlık kâr payı olarak dağıtılır.',
    dailySpinNote: 'Her 24 saatte bir ücretsiz çevirin!',
    spinBtn: 'Ücretsiz Çevir',
    spinWait: 'Yarın Tekrar Gel (24 Saat)',
    spinRolling: 'Çark Dönüyor...',
    waitingPlayer: 'Gerçek Oyuncu Aranıyor...',
    matchFound: 'Eşleşme Sağlandı!',
    refTitle: 'Arkadaşını Davet Et & Kazan',
    refDesc: 'Davet linkinizle gelen kullanıcıların oynadığı her bahisten anında %0.5 nakit komisyon kazanın.',
    copyLink: 'Davet Linkini Kopyala',
    linkCopied: 'Link Kopyalandı!',
  },
  en: {
    hubTitle: 'DiceDuel Gaming Hub',
    liveNet: 'BSC Mainnet Live',
    connecting: 'Connecting...',
    txBtn: 'Statements (PDF/CSV)',
    dailySpin: 'Daily Spin',
    inviteBtn: 'Invite (%0.5)',
    vault: 'Vault ⚡',
    connectWallet: 'Connect Wallet',
    tabDice: '🎲 DICE DUEL',
    tabCoin: '🪙 COIN FLIP',
    openRoom: 'Create Room',
    challenge: 'Challenge',
    liveRooms: 'Live Rooms',
    rollDice: 'Roll',
    you: 'You',
    fairRng: 'Provably Fair RNG',
    reward: 'Reward',
    winner: 'Winner',
    backLobby: 'Lobby',
    selectHeads: 'HEADS',
    selectTails: 'TAILS',
    flipCoin: 'Flip Coin',
    betAmount: 'Bet Amount',
    recentGames: 'Recent Games',
    liveDist: 'Live Payouts',
    contractBadge: 'BSC Contract',
    evmVerified: 'Verified',
    support: 'Support',
    stakeTitle: 'House Bankroll & LP Staking',
    poolGuideTitle: 'How House LP Works?',
    poolGuideText: 'A 3% house edge is collected from all games. More than half is distributed directly to liquidity providers as yield.',
    dailySpinNote: 'Spin for free every 24 hours!',
    spinBtn: 'Free Spin',
    spinWait: 'Come Back in 24h',
    spinRolling: 'Spinning...',
    waitingPlayer: 'Searching for player...',
    matchFound: 'Match Found!',
    refTitle: 'Refer Friends & Earn',
    refDesc: 'Earn 0.5% instant cash commission from every single bet placed by users you invite.',
    copyLink: 'Copy Invite Link',
    linkCopied: 'Link Copied!',
  },
  ru: {
    hubTitle: 'DiceDuel Игровая Арена',
    liveNet: 'BSC Mainnet Онлайн',
    connecting: 'Подключение...',
    txBtn: 'Транзакции (PDF/CSV)',
    dailySpin: 'Колесо Удачи',
    inviteBtn: 'Пригласить (%0.5)',
    vault: 'Касса ⚡',
    connectWallet: 'Кошелек',
    tabDice: '🎲 ДУЭЛЬ КОСТЕЙ',
    tabCoin: '🪙 ОРЕЛ И РЕШКА',
    openRoom: 'Создать',
    challenge: 'Вызов',
    liveRooms: 'Комнаты',
    rollDice: 'Бросить',
    you: 'Вы',
    fairRng: 'Provably Fair RNG',
    reward: 'Награда',
    winner: 'Победитель',
    backLobby: 'В Лобби',
    selectHeads: 'ОРЕЛ',
    selectTails: 'РЕШКА',
    flipCoin: 'Бросить',
    betAmount: 'Ставка',
    recentGames: 'Недавние Игры',
    liveDist: 'Выплаты',
    contractBadge: 'Контракт BSC',
    evmVerified: 'Проверено',
    support: 'Поддержка',
    stakeTitle: 'Пул Ликвидности (LP)',
    poolGuideTitle: 'Как работает Пул (LP)?',
    poolGuideText: 'С каждой игры взимается комиссия 3%. Большая ее часть распределяется между поставщиками ликвидности.',
    dailySpinNote: 'Крутите каждые 24 часа!',
    spinBtn: 'Крутить',
    spinWait: 'Через 24ч',
    spinRolling: 'Крутится...',
    waitingPlayer: 'Поиск игрока...',
    matchFound: 'Матч найден!',
    refTitle: 'Приглашай и Зарабатывай',
    refDesc: 'Получайте 0.5% мгновенной комиссии с каждой ставки ваших рефералов.',
    copyLink: 'Скопировать ссылку',
    linkCopied: 'Ссылка скопирована!',
  }
};

const LANG_OPTIONS = [
  { code: 'tr', label: 'Türkçe', flag: '🇹🇷' },
  { code: 'en', label: 'English', flag: '🇺🇸' },
  { code: 'ru', label: 'Русский', flag: '🇷🇺' }
];

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
  const [lang, setLang] = useState<string>('tr');
  const [isLangMenuOpen, setIsLangMenuOpen] = useState<boolean>(false);
  const t = TRANSLATIONS[lang] || TRANSLATIONS.tr;

  const [activeTab, setActiveTab] = useState<'dice' | 'coinflip'>('dice');
  const [account, setAccount] = useState<string | null>(null);
  const [isDemoWallet, setIsDemoWallet] = useState<boolean>(false);
  const [isWalletModalOpen, setIsWalletModalOpen] = useState<boolean>(false);

  // Bakiye Yönetimi
  const [balance, setBalance] = useState<number>(0.0);
  const [walletUSDT, setWalletUSDT] = useState<number>(0.0);
  const [betInput, setBetInput] = useState<string>('1.0');
  
  // Bot Odaları (Maks 5 USDT)
  const [rooms, setRooms] = useState<Room[]>([
    { id: 'r-1', creator: 'CryptoWhale_88', betAmount: 1.0 },
    { id: 'r-2', creator: 'LuckyStrike', betAmount: 2.0 },
    { id: 'r-3', creator: 'AlphaSeeker', betAmount: 5.0 }
  ]);
  
  const [isServerConnected, setIsServerConnected] = useState<boolean>(false);
  const [isTxPending, setIsTxPending] = useState<boolean>(false);

  // Oyun Durumları
  const [activeGame, setActiveGame] = useState<boolean>(false);
  const [isRolling, setIsRolling] = useState<boolean>(false);
  const [isWaitingMatch, setIsWaitingMatch] = useState<boolean>(false);
  const [matchCountdown, setMatchCountdown] = useState<number>(30);

  const [coinChoice, setCoinChoice] = useState<'YAZI' | 'TURA'>('YAZI');
  const [coinResult, setCoinResult] = useState<'YAZI' | 'TURA' | null>(null);
  const [gameResult, setGameResult] = useState<{
    opponent: string;
    p1Score: any;
    p2Score: any;
    winner: string | null;
  }>({ opponent: 'Kasa', p1Score: null, p2Score: null, winner: null });

  // Çark & Modallar
  const [isSpinModalOpen, setIsSpinModalOpen] = useState<boolean>(false);
  const [isSpinning, setIsSpinning] = useState<boolean>(false);
  const [spinReward, setSpinReward] = useState<number | null>(null);
  const [canSpin, setCanSpin] = useState<boolean>(true);
  
  const [isReferralModalOpen, setIsReferralModalOpen] = useState<boolean>(false);
  const [refCopied, setRefCopied] = useState<boolean>(false);

  const [isSupportModalOpen, setIsSupportModalOpen] = useState<boolean>(false);
  const [isTxModalOpen, setIsTxModalOpen] = useState<boolean>(false);
  const [txFilter, setTxFilter] = useState<'ALL' | 'IN' | 'OUT' | 'WINS'>('ALL');
  const [transactions, setTransactions] = useState<TransactionRecord[]>([]);

  // Canlı Maçlar
  const [matchHistory, setMatchHistory] = useState<MatchHistoryItem[]>([
    { id: 'm-1', winner: 'CryptoWhale_88', loser: 'SolanaKing', game: '🎲 Zar (89-45)', payout: 1.94, time: '1m ago' },
    { id: 'm-2', winner: 'LuckyStrike', loser: 'MoonBuster', game: '🪙 Yazı-Tura', payout: 3.88, time: '2m ago' }
  ]);

  const [isMuted, setIsMuted] = useState<boolean>(false);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const rollSoundIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Kasa / LP Staking
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [modalTab, setModalTab] = useState<'deposit' | 'withdraw'>('deposit');
  const [modalAmount, setModalAmount] = useState<string>('1.0');
  const [txSuccessMsg, setTxSuccessMsg] = useState<string | null>(null);

  const [isStakeModalOpen, setIsStakeModalOpen] = useState<boolean>(false);
  const [stakeDuration, setStakeDuration] = useState<'flex' | '7d' | '30d'>('flex');
  const [stakedAmount, setStakedAmount] = useState<number>(0.0);
  const [accumulatedYield, setAccumulatedYield] = useState<number>(0.0);
  const [stakeInput, setStakeInput] = useState<string>('5.0');
  const [stakeSuccessMsg, setStakeSuccessMsg] = useState<string | null>(null);

  const isRollingRef = useRef<boolean>(false);
  const currentBetRef = useRef<number>(0);

  const triggerTelegramHaptic = (style: 'light' | 'medium' | 'heavy' | 'success') => {
    try {
      const tg = (window as any).Telegram?.WebApp;
      if (tg && tg.HapticFeedback) {
        if (style === 'success') tg.HapticFeedback.notificationOccurred('success');
        else tg.HapticFeedback.impactOccurred(style);
      }
    } catch (e) {}
  };

  // Kalıcı Bakiye Güncelleyici
  const updatePersistentBalance = (newBal: number, userAddr?: string) => {
    const targetAddr = userAddr || account;
    setBalance(newBal);
    if (targetAddr && typeof window !== 'undefined') {
      localStorage.setItem(`dd_bal_${targetAddr.toLowerCase()}`, newBal.toString());
    }
  };

  // Blokzincir Bakiyelerini Çekme
  const syncBlockchainBalances = useCallback(async (userAddress: string) => {
    if (!userAddress || userAddress.length < 10) return;
    try {
      const win = window as any;
      const providerObj = win.ethereum || win.BinanceChain || win.okxwallet;
      if (!providerObj) return;

      const browserProvider = new ethers.BrowserProvider(providerObj);
      
      const usdtContract = new ethers.Contract(BSC_USDT_ADDRESS, ERC20_ABI, browserProvider);
      const rawWalletBal = await usdtContract.balanceOf(userAddress);
      setWalletUSDT(+parseFloat(ethers.formatUnits(rawWalletBal, 18)).toFixed(2));

      // Hafızadaki kazançlı bakiyeyi kontrol et
      const savedBal = localStorage.getItem(`dd_bal_${userAddress.toLowerCase()}`);
      if (savedBal !== null && !isNaN(parseFloat(savedBal))) {
        setBalance(parseFloat(savedBal));
      } else {
        const platformContract = new ethers.Contract(CONTRACT_ADDRESS, PLATFORM_ABI, browserProvider);
        const rawContractBal = await platformContract.userBalances(userAddress);
        const fetchedBal = +parseFloat(ethers.formatUnits(rawContractBal, 18)).toFixed(2);
        updatePersistentBalance(fetchedBal, userAddress);
      }
    } catch (err) {
      console.error('Bakiye senkronizasyon hatası:', err);
    }
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const browserLang = (navigator.language || (navigator as any).userLanguage || '').toLowerCase();
      if (browserLang.startsWith('tr')) setLang('tr');
      else if (browserLang.startsWith('ru')) setLang('ru');
      else setLang('en');

      const tg = (window as any).Telegram?.WebApp;
      if (tg) {
        tg.ready();
        tg.expand();
      }

      const initCheck = async () => {
        const win = window as any;
        const providerObj = win.ethereum || win.BinanceChain || win.okxwallet;
        if (providerObj) {
          try {
            const browserProvider = new ethers.BrowserProvider(providerObj);
            const accounts = await browserProvider.send('eth_accounts', []);
            if (accounts && accounts.length > 0) {
              setAccount(accounts[0]);
              setIsDemoWallet(false);
              syncBlockchainBalances(accounts[0]);
            }
          } catch (e) {}
        }
      };
      initCheck();
    }
  }, [syncBlockchainBalances]);

  // Ses Efektleri
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
    triggerTelegramHaptic('light');
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
    triggerTelegramHaptic('success');
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
    triggerTelegramHaptic('heavy');
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

  const pushMatchRecord = (winner: string, loser: string, gameDesc: string, bet: number) => {
    const payout = +(bet * 2 * 0.97).toFixed(2);
    setMatchHistory((prev) => [
      { id: `m-${Date.now()}`, winner, loser, game: gameDesc, payout, time: 'Just now' },
      ...prev.slice(0, 5),
    ]);
  };

  const addTransaction = (type: TransactionRecord['type'], title: string, amount: number, txHash?: string) => {
    const newTx: TransactionRecord = {
      id: `tx-${Date.now()}`,
      type,
      title,
      amount,
      date: new Date().toLocaleString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
      txHash: txHash || `0x${Array.from({ length: 8 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}...${Array.from({ length: 4 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`,
      status: 'COMPLETED'
    };
    setTransactions((prev) => [newTx, ...prev]);
  };

  // Cüzdan Bağlantısı
  const handleSelectWallet = async (type: string) => {
    initAudio();
    triggerTelegramHaptic('medium');
    setIsWalletModalOpen(false);

    if (type === 'demo') {
      const randomHex = Array.from({ length: 40 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
      const demoAddr = `0x${randomHex}`;
      setAccount(demoAddr);
      setIsDemoWallet(true);
      updatePersistentBalance(100.0, demoAddr);
      return;
    }

    const win = window as any;
    let providerToUse: any = null;

    if (type === 'binance') {
      providerToUse = win.BinanceChain || win.ethereum?.providers?.find((p: any) => p.isBinance) || (win.ethereum?.isBinance ? win.ethereum : null);
    } else if (type === 'metamask') {
      providerToUse = win.ethereum?.providers?.find((p: any) => p.isMetaMask && !p.isBinance) || (win.ethereum?.isMetaMask ? win.ethereum : null);
    } else if (type === 'okx') {
      providerToUse = win.okxwallet || win.ethereum?.providers?.find((p: any) => p.isOkxWallet);
    } else {
      providerToUse = win.ethereum || win.BinanceChain || win.okxwallet;
    }

    if (providerToUse) {
      try {
        const browserProvider = new ethers.BrowserProvider(providerToUse);
        const accounts = await browserProvider.send('eth_requestAccounts', []);
        
        if (accounts && accounts.length > 0) {
          setAccount(accounts[0]);
          setIsDemoWallet(false);
          await syncBlockchainBalances(accounts[0]);
          return;
        }
      } catch (err: any) {
        console.error('Cüzdan bağlantı hatası:', err);
        alert('Cüzdan bağlantısı iptal edildi.');
        return;
      }
    }

    alert('Cüzdan eklentisi bulunamadı. Lütfen eklentinizi açın.');
  };

  // ON-CHAIN USDT YATIRMA VE ÇEKME
  const handleBalanceTransaction = async () => {
    initAudio();
    triggerTelegramHaptic('medium');
    const val = parseFloat(modalAmount);
    if (isNaN(val) || val <= 0) return;
    if (!account) return alert('Lütfen önce cüzdanınızı bağlayın!');

    if (isDemoWallet) {
      if (modalTab === 'deposit') {
        const nBal = +(balance + val).toFixed(2);
        updatePersistentBalance(nBal);
        setTxSuccessMsg(`+${val} USDT Demo Kasaya Eklendi!`);
        addTransaction('DEPOSIT', 'Demo USDT Yatırma', val);
      } else {
        if (val > balance) return alert('Yetersiz bakiye!');
        const nBal = +(balance - val).toFixed(2);
        updatePersistentBalance(nBal);
        setTxSuccessMsg(`-${val} USDT Demo Çekildi!`);
        addTransaction('WITHDRAW', 'Demo USDT Çekme', val);
      }
      setTimeout(() => { setTxSuccessMsg(null); setIsModalOpen(false); }, 1200);
      return;
    }

    try {
      setIsTxPending(true);
      const win = window as any;
      const providerObj = win.ethereum || win.BinanceChain || win.okxwallet;
      const browserProvider = new ethers.BrowserProvider(providerObj);
      const signer = await browserProvider.getSigner();

      const usdtContract = new ethers.Contract(BSC_USDT_ADDRESS, ERC20_ABI, signer);
      const platformContract = new ethers.Contract(CONTRACT_ADDRESS, PLATFORM_ABI, signer);
      const amountWei = ethers.parseUnits(val.toString(), 18);

      if (modalTab === 'deposit') {
        const allowance = await usdtContract.allowance(account, CONTRACT_ADDRESS);
        if (allowance < amountWei) {
          const approveTx = await usdtContract.approve(CONTRACT_ADDRESS, ethers.MaxUint256);
          await approveTx.wait();
        }

        const depositTx = await platformContract.deposit(amountWei, ethers.ZeroAddress);
        await depositTx.wait();

        const nBal = +(balance + val).toFixed(2);
        updatePersistentBalance(nBal);
        await syncBlockchainBalances(account);
        setTxSuccessMsg(`+${val} USDT BSC Kontratına Yatırıldı!`);
        addTransaction('DEPOSIT', 'BSC USDT Yatırma', val, depositTx.hash);
      } else {
        if (val > balance) {
          setIsTxPending(false);
          return alert('Kasada yeterli bakiye yok!');
        }
        const withdrawTx = await platformContract.withdraw(amountWei);
        await withdrawTx.wait();

        const nBal = +(balance - val).toFixed(2);
        updatePersistentBalance(nBal);
        await syncBlockchainBalances(account);
        setTxSuccessMsg(`-${val} USDT Cüzdanınıza Aktarıldı!`);
        addTransaction('WITHDRAW', 'BSC USDT Çekme', val, withdrawTx.hash);
      }

      setIsTxPending(false);
      setTimeout(() => { setTxSuccessMsg(null); setIsModalOpen(false); }, 1500);
    } catch (err: any) {
      setIsTxPending(false);
      console.error(err);
      alert('İşlem cüzdandan reddedildi veya hata oluştu.');
    }
  };

  // %60 KASA / %40 OYUNCU MATEMATİKSEL MOTORU
  const executeDiceDuel = (amount: number, opponentName: string) => {
    setIsWaitingMatch(false);
    setIsRolling(true);
    isRollingRef.current = true;

    if (rollSoundIntervalRef.current) clearInterval(rollSoundIntervalRef.current);
    rollSoundIntervalRef.current = setInterval(playClickSound, 110);

    setGameResult({ opponent: opponentName, p1Score: null, p2Score: null, winner: null });

    setTimeout(() => {
      if (rollSoundIntervalRef.current) clearInterval(rollSoundIntervalRef.current);
      isRollingRef.current = false;
      setIsRolling(false);

      const isPlayerWin = Math.random() < 0.40;

      let p1 = 0;
      let p2 = 0;

      if (isPlayerWin) {
        p1 = Math.floor(Math.random() * 40) + 60;
        p2 = Math.floor(Math.random() * 50) + 1;
      } else {
        p1 = Math.floor(Math.random() * 50) + 1;
        p2 = Math.floor(Math.random() * 40) + 60;
      }

      const winnerDisplayName = isPlayerWin ? (lang === 'tr' ? 'Sen' : 'You') : opponentName;

      setGameResult({ 
        opponent: opponentName, 
        p1Score: p1, 
        p2Score: p2, 
        winner: winnerDisplayName 
      });

      // LP Havuzu Getirisini Büyüt
      setAccumulatedYield((prev) => +(prev + (amount * 0.015)).toFixed(2));

      const winnerPlayer = isPlayerWin ? (account ? `${account.substring(0, 6)}...` : 'You') : opponentName;
      const loserPlayer = isPlayerWin ? opponentName : (account ? `${account.substring(0, 6)}...` : 'You');
      pushMatchRecord(winnerPlayer, loserPlayer, `🎲 Zar (${p1}-${p2})`, amount);

      if (isPlayerWin) {
        const netWin = amount * 2 * 0.97;
        triggerConfetti();
        playWinSound();
        const nBal = +(balance + netWin).toFixed(2);
        updatePersistentBalance(nBal);
        addTransaction('GAME_WIN', `Zar Galibiyeti (${p1} vs ${p2})`, +netWin.toFixed(2));
      } else {
        playLoseSound();
      }
    }, 4000);
  };

  // ODA AÇMA & 30 SANİYE OYUNCU BEKLEME AKIŞI
  const handleOpenRoom = () => {
    const amount = parseFloat(betInput);
    if (isNaN(amount) || amount < MIN_BET) return alert(`Minimum bahis ${MIN_BET} USDT olmalıdır!`);
    if (amount > MAX_PLAYER_BET) return alert(`Maksimum bahis sınırı ${MAX_PLAYER_BET} USDT'dir!`);
    if (amount > balance) return alert('Yetersiz bakiye! Lütfen kasaya USDT yatırın.');

    initAudio();
    triggerTelegramHaptic('heavy');
    currentBetRef.current = amount;
    const nBal = +(balance - amount).toFixed(2);
    updatePersistentBalance(nBal);
    
    setActiveGame(true);
    setIsWaitingMatch(true);
    setMatchCountdown(30);

    let count = 30;
    const interval = setInterval(() => {
      count--;
      setMatchCountdown(count);
      if (count <= 0) {
        clearInterval(interval);
        const randomBot = BOT_NAMES[Math.floor(Math.random() * BOT_NAMES.length)];
        executeDiceDuel(amount, randomBot);
      }
    }, 1000);
  };

  // MEVCUT BOT ODASINA KATILMA
  const handleJoinRoom = (room: Room) => {
    if (room.betAmount > balance) return alert('Yetersiz bakiye! Lütfen kasaya USDT yatırın.');

    initAudio();
    triggerTelegramHaptic('heavy');
    currentBetRef.current = room.betAmount;
    const nBal = +(balance - room.betAmount).toFixed(2);
    updatePersistentBalance(nBal);
    
    setActiveGame(true);
    executeDiceDuel(room.betAmount, room.creator);
  };

  // YAZI - TURA (%60 KASA / %40 OYUNCU)
  const handleStartCoinFlip = (amount: number) => {
    if (isNaN(amount) || amount < MIN_BET) return alert(`Minimum bahis ${MIN_BET} USDT olmalıdır!`);
    if (amount > MAX_PLAYER_BET) return alert(`Maksimum bahis sınırı ${MAX_PLAYER_BET} USDT'dir!`);
    if (amount > balance) return alert('Yetersiz bakiye! Lütfen kasaya USDT yatırın.');

    initAudio();
    triggerTelegramHaptic('heavy');
    currentBetRef.current = amount;
    const nBal = +(balance - amount).toFixed(2);
    updatePersistentBalance(nBal);

    setActiveGame(true);
    setIsRolling(true);
    setCoinResult(null);

    if (rollSoundIntervalRef.current) clearInterval(rollSoundIntervalRef.current);
    rollSoundIntervalRef.current = setInterval(playClickSound, 100);

    const houseName = lang === 'tr' ? 'Kasa' : 'House';
    setGameResult({ opponent: houseName, p1Score: coinChoice, p2Score: null, winner: null });

    setTimeout(() => {
      if (rollSoundIntervalRef.current) clearInterval(rollSoundIntervalRef.current);
      setIsRolling(false);

      const isPlayerWin = Math.random() < 0.40;
      let landed: 'YAZI' | 'TURA';

      if (isPlayerWin) {
        landed = coinChoice;
      } else {
        landed = coinChoice === 'YAZI' ? 'TURA' : 'YAZI';
      }

      setCoinResult(landed);
      const winnerName = isPlayerWin ? (lang === 'tr' ? 'Sen' : 'You') : houseName;
      setGameResult({ opponent: houseName, p1Score: coinChoice, p2Score: landed, winner: winnerName });

      setAccumulatedYield((prev) => +(prev + (amount * 0.015)).toFixed(2));

      const winnerPlayer = isPlayerWin ? (account ? `${account.substring(0, 6)}...` : 'You') : houseName;
      const loserPlayer = isPlayerWin ? houseName : (account ? `${account.substring(0, 6)}...` : 'You');
      pushMatchRecord(winnerPlayer, loserPlayer, `🪙 Yazı-Tura (${landed})`, amount);

      if (isPlayerWin) {
        const netWin = amount * 2 * 0.97;
        triggerConfetti();
        playWinSound();
        const newTotalBal = +(balance + netWin).toFixed(2);
        updatePersistentBalance(newTotalBal);
        addTransaction('GAME_WIN', `Yazı-Tura Galibiyeti (${landed})`, +netWin.toFixed(2));
      } else {
        playLoseSound();
      }
    }, 3500);
  };

  // Günlük Çark
  const handleSpinWheel = () => {
    if (!canSpin || isSpinning) return;
    initAudio();
    triggerTelegramHaptic('medium');
    setIsSpinning(true);

    const rand = Math.random() * 100;
    let chosen = 0.05;
    if (rand < 45) chosen = 0.05;
    else if (rand < 80) chosen = 0.10;
    else if (rand < 95) chosen = 0.25;
    else if (rand < 99) chosen = 0.50;
    else chosen = 1.00;

    let ticks = 0;
    const tickInterval = setInterval(() => {
      playClickSound();
      ticks++;
      if (ticks > 25) clearInterval(tickInterval);
    }, 120);

    setTimeout(() => {
      setIsSpinning(false);
      setSpinReward(chosen);
      const nBal = +(balance + chosen).toFixed(2);
      updatePersistentBalance(nBal);
      setCanSpin(false);
      triggerConfetti();
      playWinSound();
      addTransaction('SPIN', 'Günlük Çark Ödülü', chosen);
    }, 3500);
  };

  // LP Stake Ekleme & Kâr Çekme
  const handleStakeAdd = () => {
    const val = parseFloat(stakeInput);
    if (isNaN(val) || val <= 0 || val > balance) return alert('Yetersiz bakiye!');
    const nBal = +(balance - val).toFixed(2);
    updatePersistentBalance(nBal);
    setStakedAmount((prev) => +(prev + val).toFixed(2));
    setStakeSuccessMsg(`+${val} USDT Havuza Kilitlendi (${stakeDuration.toUpperCase()})!`);
    addTransaction('WITHDRAW', `LP Havuzu Kilidi (${stakeDuration})`, val);
    setTimeout(() => setStakeSuccessMsg(null), 1500);
  };

  const handleClaimYield = () => {
    if (accumulatedYield <= 0) return;
    const nBal = +(balance + accumulatedYield).toFixed(2);
    updatePersistentBalance(nBal);
    setStakeSuccessMsg(`+${accumulatedYield.toFixed(2)} USDT Kasa Payı Çekildi!`);
    addTransaction('REF_COMMISSION', 'Kasa Komisyon Payı', +accumulatedYield.toFixed(2));
    setAccumulatedYield(0);
    setTimeout(() => setStakeSuccessMsg(null), 1500);
  };

  const exportToCSV = () => {
    triggerTelegramHaptic('medium');
    const headers = 'ID,Islem Turu,Detay,Tutar (USDT),Tarih,Islem Hashi,Durum\n';
    const rows = transactions.map(t => `"${t.id}","${t.type}","${t.title}","${t.amount}","${t.date}","${t.txHash}","${t.status}"`).join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `diceduel_statement_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCopyRef = () => {
    const refLink = `https://diceduel.fun?ref=${account || '0x26e2'}`;
    navigator.clipboard.writeText(refLink);
    setRefCopied(true);
    triggerTelegramHaptic('success');
    setTimeout(() => setRefCopied(false), 2000);
  };

  const filteredTransactions = transactions.filter(t => {
    if (txFilter === 'IN') return t.type === 'DEPOSIT';
    if (txFilter === 'OUT') return t.type === 'WITHDRAW';
    if (txFilter === 'WINS') return t.type === 'GAME_WIN' || t.type === 'SPIN';
    return true;
  });

  const currentWinPayout = +(currentBetRef.current * 2 * 0.97).toFixed(2);

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 p-3 md:p-8 font-sans select-none">
      <div className="max-w-4xl mx-auto space-y-5">
        
        {/* Üst Bar */}
        <header className="flex flex-wrap items-center justify-between gap-3 p-3.5 bg-slate-900 border border-slate-800 rounded-2xl shadow-lg">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-indigo-600/20 border border-indigo-500/40 rounded-xl flex items-center justify-center text-indigo-400 font-black text-lg">🎲</div>
            <div>
              <h1 className="font-bold text-sm md:text-base leading-none">{t.hubTitle}</h1>
              <div className={`flex items-center gap-1 mt-1 text-[10px] ${isServerConnected ? 'text-emerald-400' : 'text-rose-400'}`}>
                {isServerConnected ? <Activity className="w-3 h-3 animate-pulse" /> : <WifiOff className="w-3 h-3" />}
                <span>{isServerConnected ? t.liveNet : t.connecting}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Dil Menüsü */}
            <div className="relative">
              <button 
                onClick={() => setIsLangMenuOpen(!isLangMenuOpen)}
                className="flex items-center gap-1.5 px-2.5 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-xs font-bold transition active:scale-95 shadow-sm"
              >
                <span>{LANG_OPTIONS.find(l => l.code === lang)?.flag || '🌐'}</span>
                <span className="uppercase text-[11px] text-slate-200">{lang}</span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              <AnimatePresence>
                {isLangMenuOpen && (
                  <motion.div 
                    initial={{ opacity: 0, y: -5 }} 
                    animate={{ opacity: 1, y: 0 }} 
                    exit={{ opacity: 0, y: -5 }} 
                    className="absolute right-0 top-full mt-1.5 bg-slate-900 border border-slate-800 rounded-2xl p-1.5 shadow-2xl z-50 min-w-[130px] space-y-1"
                  >
                    {LANG_OPTIONS.map(opt => (
                      <button
                        key={opt.code}
                        onClick={() => { setLang(opt.code); setIsLangMenuOpen(false); triggerTelegramHaptic('light'); }}
                        className={`w-full flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium transition ${lang === opt.code ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:bg-slate-800'}`}
                      >
                        <span>{opt.flag}</span>
                        <span>{opt.label}</span>
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Arkadaşını Davet Et (%0.5) */}
            <button 
              onClick={() => { setIsReferralModalOpen(true); triggerTelegramHaptic('medium'); }}
              className="flex items-center gap-1.5 px-2.5 py-2 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 rounded-xl text-xs font-bold text-purple-300 transition active:scale-95 shadow-sm"
            >
              <Share2 className="w-3.5 h-3.5 text-purple-400" />
              <span className="hidden sm:inline">{t.inviteBtn}</span>
            </button>

            {/* Kasa Ortaklığı (LP Staking) */}
            <button 
              onClick={() => { setIsStakeModalOpen(true); triggerTelegramHaptic('medium'); }}
              className="flex items-center gap-1.5 px-2.5 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 rounded-xl text-xs font-bold text-emerald-400 transition active:scale-95 shadow-sm"
            >
              <Coins className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">LP Havuzu</span>
              {accumulatedYield > 0 && <span className="text-[10px] font-black text-amber-400">+{accumulatedYield.toFixed(2)}</span>}
            </button>

            {/* Raporlar */}
            <button 
              onClick={() => { setIsTxModalOpen(true); triggerTelegramHaptic('medium'); }}
              className="flex items-center gap-1.5 px-2.5 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-xs font-bold text-slate-200 transition active:scale-95 shadow-sm"
            >
              <ReceiptText className="w-3.5 h-3.5 text-indigo-400" />
              <span className="hidden sm:inline">{t.txBtn}</span>
            </button>

            {/* Günlük Çark */}
            <button 
              onClick={() => { setIsSpinModalOpen(true); triggerTelegramHaptic('medium'); }}
              className="flex items-center gap-1.5 px-2.5 py-2 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 rounded-xl text-xs font-bold text-amber-400 transition active:scale-95 shadow-sm"
            >
              <Gift className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{t.dailySpin}</span>
              {canSpin && <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span>}
            </button>

            {/* Canlı Destek */}
            <button 
              onClick={() => { setIsSupportModalOpen(true); triggerTelegramHaptic('medium'); }}
              className="p-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-sky-400 transition active:scale-95"
            >
              <MessageCircle className="w-4 h-4" />
            </button>

            {/* Bakiye Göstergesi */}
            <div className="flex items-center bg-slate-800 border border-slate-700 rounded-xl overflow-hidden shadow-inner">
              <div className="flex items-center gap-1 px-2.5 py-2 text-xs font-bold text-amber-400">
                <Wallet className="w-3.5 h-3.5 text-slate-400" />
                <span>{balance.toFixed(2)} USDT</span>
              </div>
              <button 
                onClick={() => { setIsModalOpen(true); triggerTelegramHaptic('medium'); }}
                className="px-2.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-[11px] font-bold text-white border-l border-indigo-500 transition active:scale-95"
              >
                {t.vault}
              </button>
            </div>

            {/* Cüzdan Durumu */}
            {account ? (
              <div className="flex items-center gap-1 px-2.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs font-bold text-slate-200">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>{account.substring(0, 5)}..</span>
                <button onClick={() => { setAccount(null); setIsDemoWallet(false); setBalance(0); }} className="text-slate-400 hover:text-rose-400 ml-1">
                  <LogOut className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <button 
                onClick={() => { setIsWalletModalOpen(true); triggerTelegramHaptic('medium'); }} 
                className="px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl transition active:scale-95 shadow-lg shadow-indigo-600/20"
              >
                {t.connectWallet}
              </button>
            )}
          </div>
        </header>

        {/* Oyun Seçim Sekmeleri */}
        {!activeGame && (
          <div className="flex gap-2 p-1 bg-slate-900 border border-slate-800 rounded-2xl max-w-md mx-auto">
            <button
              onClick={() => { setActiveTab('dice'); triggerTelegramHaptic('light'); }}
              className={`flex-1 py-2.5 rounded-xl text-xs font-black flex items-center justify-center gap-2 transition ${
                activeTab === 'dice' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Dices className="w-4 h-4" /> {t.tabDice}
            </button>
            <button
              onClick={() => { setActiveTab('coinflip'); triggerTelegramHaptic('light'); }}
              className={`flex-1 py-2.5 rounded-xl text-xs font-black flex items-center justify-center gap-2 transition ${
                activeTab === 'coinflip' ? 'bg-amber-600 text-white shadow-lg shadow-amber-600/30' : 'text-slate-400 hover:text-white'
              }`}
            >
              <CircleDot className="w-4 h-4" /> {t.tabCoin}
            </button>
          </div>
        )}

        {/* Oyun Arenası */}
        {activeGame ? (
          <div className="flex flex-col items-center justify-center p-5 bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-xl mx-auto shadow-2xl">
            {isWaitingMatch ? (
              <div className="flex flex-col items-center justify-center py-10 space-y-4 text-center">
                <div className="relative">
                  <div className="w-16 h-16 rounded-full border-4 border-indigo-500 border-t-transparent animate-spin"></div>
                  <Clock className="w-6 h-6 text-indigo-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-white">{t.waitingPlayer}</h3>
                  <p className="text-xs text-slate-400 mt-1">Eşleşme için kalan süre: <span className="text-amber-400 font-bold">{matchCountdown}s</span></p>
                </div>
              </div>
            ) : (
              <>
                <div className="flex justify-between w-full items-center mb-6 px-2">
                  <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium bg-emerald-950/60 border border-emerald-800/50 px-3 py-1 rounded-full">
                    <ShieldCheck className="w-4 h-4" />
                    <span>{t.fairRng}</span>
                  </div>
                  <div className="text-xs font-semibold text-slate-300">{t.reward}: <span className="text-amber-400 font-bold">{currentWinPayout.toFixed(2)} USDT</span></div>
                </div>

                {activeTab === 'dice' ? (
                  <div className="grid grid-cols-2 gap-4 w-full relative mb-6">
                    <div className="flex flex-col items-center p-4 bg-slate-800/60 rounded-2xl border border-slate-700/50">
                      <span className="text-xs text-slate-400 mb-2">{t.you}</span>
                      <motion.div animate={isRolling ? { rotate: [0, 360] } : {}} transition={{ repeat: isRolling ? Infinity : 0, duration: 0.4 }} className="w-20 h-20 md:w-24 md:h-24 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center text-3xl md:text-4xl font-black shadow-lg">
                        {isRolling ? '?' : gameResult.p1Score ?? '-'}
                      </motion.div>
                    </div>
                    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-slate-950 border border-slate-700 text-xs font-black text-slate-400 w-8 h-8 rounded-full flex items-center justify-center">VS</div>
                    <div className="flex flex-col items-center p-4 bg-slate-800/60 rounded-2xl border border-slate-700/50">
                      <span className="text-xs text-slate-400 mb-2 truncate max-w-[100px]">{gameResult.opponent}</span>
                      <motion.div animate={isRolling ? { rotate: [0, -360] } : {}} transition={{ repeat: isRolling ? Infinity : 0, duration: 0.4 }} className="w-20 h-20 md:w-24 md:h-24 bg-gradient-to-br from-rose-500 to-amber-600 rounded-2xl flex items-center justify-center text-3xl md:text-4xl font-black shadow-lg">
                        {isRolling ? '?' : gameResult.p2Score ?? '-'}
                      </motion.div>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center my-4 space-y-3">
                    <span className="text-xs text-slate-400">Seçim: <span className="font-bold text-amber-400">{coinChoice}</span></span>
                    <motion.div 
                      animate={isRolling ? { rotateY: [0, 1800], scale: [1, 1.15, 1] } : {}} 
                      transition={{ repeat: isRolling ? Infinity : 0, duration: 0.8, ease: "linear" }}
                      className="w-24 h-24 md:w-28 md:h-28 rounded-full bg-gradient-to-tr from-amber-600 via-yellow-400 to-amber-500 flex items-center justify-center text-xl md:text-2xl font-black text-slate-950 border-4 border-yellow-300 shadow-2xl shadow-amber-500/30"
                    >
                      {isRolling ? '🪙' : coinResult || coinChoice}
                    </motion.div>
                  </div>
                )}

                {gameResult.winner && !isRolling && (
                  <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center gap-3 w-full">
                    <div className="flex items-center gap-2 text-emerald-400 font-bold text-base md:text-lg">
                      <Trophy className="w-5 h-5 text-amber-400" />
                      <span>{t.winner}: {gameResult.winner}!</span>
                    </div>

                    <button onClick={() => setActiveGame(false)} className="flex items-center gap-2 mt-1 px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl transition border border-slate-700 active:scale-95">
                      <RotateCcw className="w-4 h-4" /> {t.backLobby}
                    </button>
                  </motion.div>
                )}
              </>
            )}
          </div>
        ) : (
          activeTab === 'dice' ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 md:p-5 space-y-3.5 h-fit">
                <div className="flex justify-between items-center">
                  <h2 className="font-bold text-xs uppercase tracking-wider flex items-center gap-2 text-slate-200"><Plus className="w-4 h-4 text-indigo-400" /> {t.openRoom}</h2>
                  <span className="text-[10px] text-slate-400 font-semibold">Min: 0.5 | Max: 20 USDT</span>
                </div>
                
                <div className="relative">
                  <input 
                    type="number" 
                    step="0.5"
                    min="0.5"
                    max="20"
                    value={betInput} 
                    onChange={(e) => setBetInput(e.target.value)} 
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm font-bold text-white focus:outline-none pr-16" 
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-amber-400">USDT</span>
                </div>

                <div className="grid grid-cols-4 gap-1">
                  {['0.5', '1', '5', '10'].map((preset) => (
                    <button key={preset} onClick={() => { setBetInput(preset); triggerTelegramHaptic('light'); }} className="py-1 bg-slate-800 hover:bg-slate-700 text-[10px] font-bold text-slate-300 rounded-lg transition">
                      +{preset} USDT
                    </button>
                  ))}
                </div>

                <button onClick={handleOpenRoom} className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl transition shadow-lg shadow-indigo-600/20 active:scale-95">
                  {t.challenge} ({parseFloat(betInput || '0').toFixed(2)} USDT)
                </button>
              </div>

              <div className="md:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-4 md:p-5 space-y-3.5">
                <div className="flex justify-between items-center">
                  <h2 className="font-bold text-xs uppercase tracking-wider flex items-center gap-2 text-slate-200"><Flame className="w-4 h-4 text-rose-400" /> {t.liveRooms}</h2>
                  <span className="text-[10px] text-indigo-400 flex items-center gap-1"><Sparkles className="w-3 h-3" /> Canlı Zar Lobisi</span>
                </div>
                <div className="space-y-2">
                  {rooms.map((r) => (
                    <div key={r.id} className="flex items-center justify-between p-3 bg-slate-950 border border-slate-800 rounded-xl hover:border-slate-700 transition">
                      <div className="space-y-0.5">
                        <span className="text-xs font-semibold text-slate-200">{r.creator}</span>
                        <div className="text-[9px] text-slate-500">Maksimum Bot Bahsi: 5.00 USDT</div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-bold text-amber-400">{r.betAmount.toFixed(2)} USDT</span>
                        <button onClick={() => handleJoinRoom(r)} className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg flex items-center gap-1 active:scale-95 transition">
                          <Swords className="w-3.5 h-3.5" /> {t.rollDice}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 md:p-6 max-w-lg mx-auto space-y-4 shadow-2xl">
              <div className="text-center space-y-0.5">
                <h2 className="text-base md:text-lg font-black text-white flex items-center justify-center gap-2"><CircleDot className="w-5 h-5 text-amber-400" /> {t.tabCoin}</h2>
                <p className="text-[11px] text-slate-400">1.94x Çarpan • Anlık Sonuç</p>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <button onClick={() => { setCoinChoice('YAZI'); triggerTelegramHaptic('light'); }} className={`py-3 rounded-2xl font-black text-xs md:text-sm border transition flex flex-col items-center gap-1 ${coinChoice === 'YAZI' ? 'bg-amber-500/20 border-amber-500 text-amber-300 shadow-lg shadow-amber-500/20' : 'bg-slate-950 border-slate-800 text-slate-400'}`}><span className="text-lg">🦅</span> {t.selectHeads}</button>
                <button onClick={() => { setCoinChoice('TURA'); triggerTelegramHaptic('light'); }} className={`py-3 rounded-2xl font-black text-xs md:text-sm border transition flex flex-col items-center gap-1 ${coinChoice === 'TURA' ? 'bg-amber-500/20 border-amber-500 text-amber-300 shadow-lg shadow-amber-500/20' : 'bg-slate-950 border-slate-800 text-slate-400'}`}><span className="text-lg">🪙</span> {t.selectTails}</button>
              </div>

              <div>
                <div className="flex justify-between text-[11px] text-slate-400 mb-1 font-medium">
                  <span>{t.betAmount}</span>
                  <span>Min: 0.5 | Max: 20 USDT</span>
                </div>
                <div className="relative">
                  <input 
                    type="number" 
                    step="0.5"
                    min="0.5"
                    max="20"
                    value={betInput} 
                    onChange={(e) => setBetInput(e.target.value)} 
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm font-bold text-white focus:outline-none focus:border-amber-500 pr-16" 
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-amber-400">USDT</span>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-1">
                {['0.5', '1', '5', '10'].map((preset) => (
                  <button key={preset} onClick={() => { setBetInput(preset); triggerTelegramHaptic('light'); }} className="py-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 rounded-lg transition">
                    +{preset} USDT
                  </button>
                ))}
              </div>

              <button onClick={() => handleStartCoinFlip(parseFloat(betInput))} className="w-full py-3 bg-gradient-to-r from-amber-600 to-yellow-500 hover:from-amber-500 hover:to-yellow-400 text-slate-950 font-black text-xs md:text-sm rounded-xl transition shadow-lg shadow-amber-500/20 active:scale-95">
                🪙 {t.flipCoin} ({(parseFloat(betInput || '0') * 1.94).toFixed(2)} USDT)
              </button>
            </div>
          )
        )}

        {/* Canlı Maç Geçmişi */}
        <section className="bg-slate-900 border border-slate-800 rounded-2xl p-4 md:p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <History className="w-4 h-4 text-indigo-400" /> {t.recentGames}
            </h3>
            <span className="text-[10px] text-emerald-400 flex items-center gap-1 font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span> {t.liveDist}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
            <AnimatePresence>
              {matchHistory.map((m) => (
                <motion.div key={m.id} initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="p-2.5 bg-slate-950 border border-slate-800/80 rounded-xl flex items-center justify-between shadow-sm">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1 text-xs font-bold text-slate-200">
                      <Trophy className="w-3.5 h-3.5 text-amber-400" />
                      <span className="truncate max-w-[85px]">{m.winner}</span>
                    </div>
                    <div className="text-[10px] text-slate-500">{m.game}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-black text-emerald-400">+{m.payout} USDT</div>
                    <div className="text-[9px] text-slate-500">{m.time}</div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </section>

        {/* Footer */}
        <footer className="flex flex-wrap items-center justify-between gap-2 p-3 bg-slate-900/60 border border-slate-800/80 rounded-2xl text-[11px] text-slate-400">
          <div className="flex items-center gap-1.5">
            <FileCode2 className="w-3.5 h-3.5 text-indigo-400" />
            <span>{t.contractBadge}:</span>
            <a href={`https://bscscan.com/address/${CONTRACT_ADDRESS}`} target="_blank" rel="noreferrer" className="font-mono text-[10px] text-indigo-300 hover:underline bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800">
              {CONTRACT_ADDRESS.substring(0, 10)}... (BscScan ↗)
            </a>
          </div>
          <div className="flex items-center gap-1.5 text-emerald-400 font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            <span>{t.evmVerified}</span>
          </div>
        </footer>

        {/* 1. Kasa Yönetim Modalı */}
        <AnimatePresence>
          {isModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-slate-900 border border-slate-800 rounded-3xl p-5 w-full max-w-md shadow-2xl relative">
                <button onClick={() => setIsModalOpen(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white transition"><X className="w-5 h-5" /></button>
                <h3 className="font-bold text-base text-white mb-3 flex items-center gap-2"><Wallet className="w-5 h-5 text-indigo-400" /> Kasa Yönetimi</h3>
                
                <div className="grid grid-cols-2 gap-2 bg-slate-950 p-1 rounded-2xl mb-3 border border-slate-800">
                  <button onClick={() => setModalTab('deposit')} className={`flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold transition ${modalTab === 'deposit' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}><ArrowDownCircle className="w-4 h-4" /> USDT Yatır</button>
                  <button onClick={() => setModalTab('withdraw')} className={`flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold transition ${modalTab === 'withdraw' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}><ArrowUpCircle className="w-4 h-4" /> USDT Çek</button>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between text-[11px] text-slate-400 font-medium">
                    <span>Tutar</span>
                    {!isDemoWallet && account && <span>Cüzdan: {walletUSDT} USDT</span>}
                  </div>
                  <div className="relative">
                    <input 
                      type="number" 
                      step="0.5"
                      value={modalAmount} 
                      onChange={(e) => setModalAmount(e.target.value)} 
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm font-bold text-white focus:outline-none pr-16" 
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-amber-400">USDT</span>
                  </div>
                  
                  <div className="grid grid-cols-4 gap-1">
                    {['0.5', '1', '5', '10'].map((preset) => (
                      <button key={preset} onClick={() => setModalAmount(preset)} className="py-1 bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 rounded-lg transition">+{preset} USDT</button>
                    ))}
                  </div>

                  {txSuccessMsg && <div className="flex items-center gap-2 text-xs text-emerald-400 bg-emerald-950/40 border border-emerald-800/40 p-2.5 rounded-xl"><CheckCircle2 className="w-4 h-4" /><span>{txSuccessMsg}</span></div>}

                  <button 
                    onClick={handleBalanceTransaction} 
                    disabled={isTxPending}
                    className={`w-full py-2.5 rounded-xl font-bold text-xs text-white shadow-lg transition active:scale-95 flex items-center justify-center gap-2 ${modalTab === 'deposit' ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/20' : 'bg-rose-600 hover:bg-rose-500 shadow-rose-600/20'} disabled:opacity-50`}
                  >
                    {isTxPending && <Loader2 className="w-4 h-4 animate-spin" />}
                    {isTxPending ? 'Cüzdanda Onay Bekleniyor...' : modalTab === 'deposit' ? 'Kontrata USDT Aktar' : 'Kontrattan Cüzdana Çek'}
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* 2. Gelişmiş LP Staking Modalı */}
        <AnimatePresence>
          {isStakeModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-slate-900 border border-slate-800 rounded-3xl p-5 w-full max-w-md shadow-2xl relative space-y-4">
                <button onClick={() => setIsStakeModalOpen(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white transition"><X className="w-5 h-5" /></button>
                <h3 className="font-bold text-base text-white flex items-center gap-2"><Coins className="w-5 h-5 text-emerald-400" /> {t.stakeTitle}</h3>
                
                <div className="p-3 bg-indigo-950/40 border border-indigo-800/40 rounded-2xl text-xs space-y-1">
                  <div className="font-bold text-indigo-300 flex items-center gap-1.5"><Info className="w-3.5 h-3.5" /> {t.poolGuideTitle}</div>
                  <p className="text-[11px] text-slate-300 leading-relaxed">{t.poolGuideText}</p>
                </div>

                {/* 3 Kademe Seçenekleri */}
                <div className="grid grid-cols-3 gap-2">
                  <button onClick={() => setStakeDuration('flex')} className={`p-2.5 rounded-2xl border text-left transition ${stakeDuration === 'flex' ? 'bg-emerald-950/60 border-emerald-500 text-white shadow-lg' : 'bg-slate-950 border-slate-800 text-slate-400'}`}>
                    <div className="flex items-center gap-1 text-xs font-bold"><Unlock className="w-3 h-3 text-emerald-400" /> Esnek</div>
                    <div className="text-[9px] text-emerald-400 font-bold mt-1">%1.0 Pay</div>
                    <div className="text-[8px] text-slate-500">Anında Çekim</div>
                  </button>

                  <button onClick={() => setStakeDuration('7d')} className={`p-2.5 rounded-2xl border text-left transition ${stakeDuration === '7d' ? 'bg-indigo-950/60 border-indigo-500 text-white shadow-lg' : 'bg-slate-950 border-slate-800 text-slate-400'}`}>
                    <div className="flex items-center gap-1 text-xs font-bold"><Lock className="w-3 h-3 text-indigo-400" /> 7 Gün</div>
                    <div className="text-[9px] text-indigo-400 font-bold mt-1">%1.5 Pay</div>
                    <div className="text-[8px] text-slate-500">+Bonus Kâr</div>
                  </button>

                  <button onClick={() => setStakeDuration('30d')} className={`p-2.5 rounded-2xl border text-left transition ${stakeDuration === '30d' ? 'bg-purple-950/60 border-purple-500 text-white shadow-lg' : 'bg-slate-950 border-slate-800 text-slate-400'}`}>
                    <div className="flex items-center gap-1 text-xs font-bold"><Trophy className="w-3 h-3 text-purple-400" /> 30 Gün</div>
                    <div className="text-[9px] text-purple-400 font-bold mt-1">%2.5 Pay</div>
                    <div className="text-[8px] text-slate-500">Maksimum Kâr</div>
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div className="p-3 bg-slate-950 border border-slate-800 rounded-2xl">
                    <span className="text-[10px] text-slate-400 block mb-0.5">Kilitli Toplam</span>
                    <span className="text-sm font-black text-indigo-300">{stakedAmount.toFixed(2)} USDT</span>
                  </div>
                  <div className="p-3 bg-slate-950 border border-slate-800 rounded-2xl">
                    <span className="text-[10px] text-slate-400 block mb-0.5">Biriken Komisyon</span>
                    <span className="text-sm font-black text-emerald-400">+{accumulatedYield.toFixed(2)} USDT</span>
                  </div>
                </div>

                <button onClick={handleClaimYield} disabled={accumulatedYield <= 0} className="w-full py-2 bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-300 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition disabled:opacity-40">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-400" /> Biriken Komisyon Payını Çek ({accumulatedYield.toFixed(2)} USDT)
                </button>

                <div className="space-y-2 pt-2 border-t border-slate-800">
                  <label className="text-[11px] text-slate-300 font-bold block">Havuza Ortak Ol (USDT Kitle)</label>
                  <div className="flex gap-2">
                    <input type="number" value={stakeInput} onChange={(e) => setStakeInput(e.target.value)} className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs font-bold text-white focus:outline-none" />
                    <button onClick={handleStakeAdd} className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl transition">Ortak Ol</button>
                  </div>
                </div>
                {stakeSuccessMsg && <div className="flex items-center gap-2 text-xs text-emerald-400 bg-emerald-950/40 border border-emerald-800/40 p-2.5 rounded-xl"><CheckCircle2 className="w-4 h-4" /><span>{stakeSuccessMsg}</span></div>}
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* 3. Arkadaşını Davet Et (Referral) Modalı */}
        <AnimatePresence>
          {isReferralModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-slate-900 border border-slate-800 rounded-3xl p-5 w-full max-w-md shadow-2xl relative space-y-4">
                <button onClick={() => setIsReferralModalOpen(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white transition"><X className="w-5 h-5" /></button>
                <h3 className="font-bold text-base text-white flex items-center gap-2"><Share2 className="w-5 h-5 text-purple-400" /> {t.refTitle}</h3>
                
                <p className="text-xs text-slate-300 leading-relaxed">{t.refDesc}</p>

                <div className="p-3 bg-slate-950 border border-slate-800 rounded-2xl space-y-2">
                  <span className="text-[10px] text-slate-500 block font-semibold">Özel Davet Bağlantınız:</span>
                  <div className="flex items-center justify-between bg-slate-900 px-3 py-2 rounded-xl border border-slate-800 text-xs font-mono text-purple-300 truncate">
                    <span className="truncate">https://diceduel.fun?ref={account ? `${account.substring(0, 6)}...` : '0x26e2'}</span>
                  </div>
                  <button onClick={handleCopyRef} className="w-full py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition">
                    <Copy className="w-3.5 h-3.5" /> {refCopied ? t.linkCopied : t.copyLink}
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* 4. Cüzdan Bağlantı Modalı */}
        <AnimatePresence>
          {isWalletModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-slate-900 border border-slate-800 rounded-3xl p-5 w-full max-w-md shadow-2xl relative">
                <button onClick={() => setIsWalletModalOpen(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white transition"><X className="w-5 h-5" /></button>
                <h3 className="font-bold text-base text-white mb-1 flex items-center gap-2"><Wallet className="w-5 h-5 text-indigo-400" /> {t.connectWallet}</h3>
                <p className="text-[11px] text-slate-400 mb-3">BSC Mainnet cüzdanınızı seçin:</p>
                
                <div className="space-y-1.5 max-h-[60vh] overflow-y-auto pr-1">
                  <button onClick={() => handleSelectWallet('binance')} className="w-full flex items-center justify-between p-2.5 bg-slate-950 hover:bg-amber-950/20 border border-slate-800 rounded-2xl transition">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-black text-xs">🟡</div>
                      <div className="text-left">
                        <div className="text-xs font-bold text-slate-200">Binance Web3 Wallet</div>
                        <div className="text-[9px] text-slate-500">Binance App & Extension</div>
                      </div>
                    </div>
                    <span className="text-[9px] bg-amber-950 text-amber-300 px-1.5 py-0.5 rounded border border-amber-800/40">Popüler</span>
                  </button>

                  <button onClick={() => handleSelectWallet('metamask')} className="w-full flex items-center justify-between p-2.5 bg-slate-950 hover:bg-orange-950/20 border border-slate-800 rounded-2xl transition">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-xl bg-orange-500/20 text-orange-400 flex items-center justify-center font-black text-xs">🦊</div>
                      <div className="text-left">
                        <div className="text-xs font-bold text-slate-200">MetaMask</div>
                        <div className="text-[9px] text-slate-500">EVM & Extension</div>
                      </div>
                    </div>
                  </button>

                  <button onClick={() => handleSelectWallet('okx')} className="w-full flex items-center justify-between p-2.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-2xl transition">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-xl bg-white/10 text-white flex items-center justify-center font-black text-xs">⬛</div>
                      <div className="text-left">
                        <div className="text-xs font-bold text-slate-200">OKX Web3 Wallet</div>
                        <div className="text-[9px] text-slate-500">OKX App & Extension</div>
                      </div>
                    </div>
                  </button>

                  <button onClick={() => handleSelectWallet('other')} className="w-full flex items-center justify-between p-2.5 bg-slate-950 hover:bg-purple-950/20 border border-slate-800 rounded-2xl transition">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center font-black text-xs">🌐</div>
                      <div className="text-left">
                        <div className="text-xs font-bold text-slate-200">Tüm Diğer Cüzdanlar</div>
                        <div className="text-[9px] text-slate-500">Rabby, Trust, Bybit, Phantom</div>
                      </div>
                    </div>
                    <span className="text-[9px] bg-purple-950 text-purple-300 px-1.5 py-0.5 rounded border border-purple-800/40">Evrensel</span>
                  </button>

                  <button onClick={() => handleSelectWallet('demo')} className="w-full flex items-center justify-between p-2.5 bg-slate-950 hover:bg-indigo-950/20 border border-slate-800 rounded-2xl transition">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-black text-xs">⚡</div>
                      <div className="text-left">
                        <div className="text-xs font-bold text-slate-200">Hızlı Demo Cüzdan</div>
                        <div className="text-[9px] text-slate-500">Test & Simülasyon</div>
                      </div>
                    </div>
                    <span className="text-[9px] bg-indigo-950 text-indigo-300 px-1.5 py-0.5 rounded border border-indigo-800/40">Deneme</span>
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* 5. Günlük Çark Modalı */}
        <AnimatePresence>
          {isSpinModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-slate-900 border border-slate-800 rounded-3xl p-5 w-full max-w-sm shadow-2xl relative text-center">
                <button onClick={() => setIsSpinModalOpen(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white transition"><X className="w-5 h-5" /></button>
                <h3 className="font-bold text-base text-white mb-0.5 flex items-center justify-center gap-2"><Gift className="w-4 h-4 text-amber-400" /> {t.dailySpin}</h3>
                <p className="text-[11px] text-slate-400 mb-4">{t.dailySpinNote}</p>
                <div className="flex justify-center my-3">
                  <motion.div animate={isSpinning ? { rotate: [0, 1440] } : {}} transition={{ duration: 3.5, ease: "easeOut" }} className="w-32 h-32 rounded-full border-4 border-amber-500 bg-gradient-to-br from-indigo-900 via-purple-900 to-slate-950 flex items-center justify-center text-3xl font-black shadow-2xl relative">
                    🎁
                    <div className="absolute top-0 w-2.5 h-2.5 bg-amber-400 rotate-45 -translate-y-1"></div>
                  </motion.div>
                </div>
                {spinReward && <div className="p-2.5 bg-emerald-950/60 border border-emerald-800/60 rounded-xl my-2 text-emerald-300 font-bold text-xs flex items-center justify-center gap-1.5"><Sparkles className="w-4 h-4 text-amber-400" /> +{spinReward.toFixed(2)} USDT!</div>}
                <button onClick={handleSpinWheel} disabled={!canSpin || isSpinning} className="w-full mt-2 py-2.5 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black text-xs rounded-xl transition shadow-lg disabled:opacity-40">
                  {isSpinning ? t.spinRolling : canSpin ? t.spinBtn : t.spinWait}
                </button>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* 6. Canlı Destek Modalı */}
        <AnimatePresence>
          {isSupportModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-slate-900 border border-slate-800 rounded-3xl p-5 w-full max-w-md shadow-2xl relative space-y-4">
                <button onClick={() => setIsSupportModalOpen(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white transition"><X className="w-5 h-5" /></button>
                <h3 className="font-bold text-base text-white flex items-center gap-2"><MessageCircle className="w-5 h-5 text-sky-400" /> {t.support}</h3>
                
                <div className="space-y-2 text-xs">
                  <a href="https://t.me/diceduel_fun_bot" target="_blank" rel="noreferrer" className="flex items-center justify-between p-3 bg-slate-950 hover:bg-sky-950/30 border border-slate-800 hover:border-sky-500/50 rounded-2xl transition">
                    <div className="flex items-center gap-2.5">
                      <Send className="w-4 h-4 text-sky-400" />
                      <div>
                        <div className="font-bold text-slate-200">Resmi Telegram Destek Botu</div>
                        <div className="text-[10px] text-slate-500">@diceduel_fun_bot</div>
                      </div>
                    </div>
                    <span className="text-[10px] bg-sky-950 text-sky-300 px-2 py-0.5 rounded border border-sky-800/40">7/24 Aktif</span>
                  </a>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* 7. İşlemler Geçmişi (PDF & CSV) */}
        <AnimatePresence>
          {isTxModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-slate-900 border border-slate-800 rounded-3xl p-5 w-full max-w-2xl shadow-2xl relative space-y-3.5 max-h-[85vh] flex flex-col">
                <div className="flex justify-between items-center pb-2 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <ReceiptText className="w-5 h-5 text-indigo-400" />
                    <h3 className="font-bold text-sm md:text-base text-white">{t.txBtn}</h3>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button onClick={exportToCSV} className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-indigo-300 rounded-xl text-[11px] font-bold flex items-center gap-1 border border-slate-700 transition"><Download className="w-3 h-3" /> CSV</button>
                    <button onClick={() => window.print()} className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-[11px] font-bold flex items-center gap-1 border border-slate-700 transition"><Printer className="w-3 h-3" /> PDF</button>
                    <button onClick={() => setIsTxModalOpen(false)} className="text-slate-400 hover:text-white transition ml-1"><X className="w-5 h-5" /></button>
                  </div>
                </div>

                <div className="flex gap-1.5">
                  {[{ id: 'ALL', label: 'Tümü' }, { id: 'IN', label: 'Yatırılanlar' }, { id: 'OUT', label: 'Çekilenler' }, { id: 'WINS', label: 'Kazançlar' }].map(f => (
                    <button key={f.id} onClick={() => setTxFilter(f.id as any)} className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition ${txFilter === f.id ? 'bg-indigo-600 text-white' : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'}`}>{f.label}</button>
                  ))}
                </div>

                <div className="flex-1 overflow-y-auto pr-1 space-y-1.5">
                  {filteredTransactions.map(tx => (
                    <div key={tx.id} className="p-2.5 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs ${tx.type === 'WITHDRAW' ? 'bg-rose-950/60 text-rose-400 border border-rose-800/40' : 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/40'}`}>
                          {tx.type === 'DEPOSIT' && '📥'}{tx.type === 'WITHDRAW' && '📤'}{tx.type === 'GAME_WIN' && '🏆'}{tx.type === 'SPIN' && '🎁'}{tx.type === 'REF_COMMISSION' && '👥'}
                        </div>
                        <div>
                          <div className="text-xs font-bold text-slate-200">{tx.title}</div>
                          <div className="text-[9px] text-slate-500 font-mono">{tx.date} • {tx.txHash}</div>
                        </div>
                      </div>
                      <div className={`text-xs font-black ${tx.type === 'WITHDRAW' ? 'text-rose-400' : 'text-emerald-400'}`}>{tx.type === 'WITHDRAW' ? '-' : '+'}{tx.amount.toFixed(2)} USDT</div>
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

      </div>
    </main>
  );
}
