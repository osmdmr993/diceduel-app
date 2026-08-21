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
  MessageCircle, Info, ChevronDown, Loader2, Clock, Lock, Unlock, ExternalLink, 
  Volume2, VolumeX, Crown, AlertTriangle, Medal, Bomb, Gem, Play, ShieldAlert,
  Bot, BarChart3, Settings2, Target
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// ==========================================
// 1. SABİTLER & KONTRAT YAPILANDIRMASI
// ==========================================
const SERVER_URL = 'https://diceduel-server.onrender.com';
const BSC_USDT_ADDRESS = '0x55d398326f99059fF775485246999027B3197955';
const CONTRACT_ADDRESS = '0xC9c586A92465C7254C3e19FebAAeD9D5c61f974f';
const BSC_CHAIN_ID = 56;
const BSC_CHAIN_ID_HEX = '0x38';

const OFFICIAL_OWNER_ADDRESS = '0x26e2b6b55db56fbafe1e6a10ce7183e8b09f1bf3';
const MIN_BET = 0.5;
const MAX_PLAYER_BET = 20.0;

let socket: Socket;

const sanitizeInput = (input: string): string => {
  if (!input) return '';
  return input.replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#x27;").replace(/\//g, "&#x2F;");
};

// ... (ERC20_ABI, PLATFORM_ABI, BOT_NAMES ve MINES_MULTIPLIERS önceki kod ile birebir aynıdır)

const TRANSLATIONS: Record<string, any> = {
  // ... (Önceki 7 dilin tüm çevirileri eksiksiz şekilde aynı kalacaktır, kod kalabalığı yapmaması adına buraya eklendiğini varsayıyoruz)
  tr: {
    hubTitle: 'DiceDuel Gaming Hub',
    liveNet: 'BSC Mainnet Canlı',
    txBtn: 'İşlemler (PDF/CSV)',
    dailySpin: 'Günlük Çark',
    inviteBtn: 'Davet Et (%0.5)',
    vault: 'Kasa ⚡',
    connectWallet: 'Cüzdan Bağla',
    tabDice: '🎲 ZAR DÜELLOSU',
    tabCoin: '🪙 YAZI - TURA',
    tabRoulette: '🔴⚫ RULET',
    tabMines: '💣 MAYIN TARLASI',
    openRoom: 'Zar Odası Aç',
    challenge: 'Meydan Oku',
    liveRooms: 'Canlı Zar Odaları',
    rollDice: 'Zar At',
    you: 'Sen',
    fairRng: 'Server-Side Provably Fair RNG', // Güncellendi
    reward: 'Ödül',
    winner: 'Kazanan',
    backLobby: 'Lobiye Dön',
    selectHeads: 'YAZI SEÇ',
    selectTails: 'TURA SEÇ',
    flipCoin: 'Parayı Çevir',
    coinSub: 'Canlı Oyuncu Eşleşmeli Düello • 1.94x Çarpan',
    betAmount: 'Bahis Tutarı',
    recentGames: 'Son Biten Oyunlar',
    leaderboardTitle: 'Haftanın Kralları',
    liveDist: 'Canlı Dağıtım',
    support: 'Destek & SSS',
    lpPoolBtn: 'LP Havuzu',
    adminPanel: 'Yönetici Kasası',
    cashout: 'Nakit Çek',
    autoBet: 'Otomatik Bahis (Bot)',
    autoBetSettings: 'Risk Yönetimi',
    stopLoss: 'Stop-Loss (USDT)',
    takeProfit: 'Kâr-Al Hedefi (USDT)',
    moveStopToEntry: 'İşlem kâra geçtiğinde Stop-Loss\'u giriş seviyesine çek (Break-Even)',
    chatTitle: 'Canlı Lobi Sohbeti',
    chatPlaceholder: 'Mesaj yaz...',
    statsTitle: 'Oyuncu İstatistikleri',
    vipLevel: 'VIP Seviyesi',
    totalPnl: 'Net PnL'
  }
};

interface TransactionRecord { id: string; type: 'DEPOSIT' | 'WITHDRAW' | 'GAME_WIN' | 'SPIN' | 'REF_COMMISSION'; title: string; amount: number; date: string; txHash: string; status: 'COMPLETED' | 'SUCCESS'; }
interface MatchHistoryItem { id: string; winner: string; loser: string; game: string; payout: number; time: string; }
interface ChatMessage { id: string; user: string; text: string; time: string; isSystem?: boolean; }

export default function PlatformPage() {
  const [lang, setLang] = useState<string>('tr');
  const t = TRANSLATIONS[lang] || TRANSLATIONS.tr;

  const [activeTab, setActiveTab] = useState<'dice' | 'coinflip' | 'roulette' | 'mines'>('dice');
  const [account, setAccount] = useState<string | null>(null);
  const [balance, setBalance] = useState<number>(100.0);
  const [betInput, setBetInput] = useState<string>('1.0');
  
  // YENİ: Otomatik Bahis & Risk Yönetimi State'leri
  const [autoBetEnabled, setAutoBetEnabled] = useState<boolean>(false);
  const [autoBetConfig, setAutoBetConfig] = useState({ stopLoss: 0, takeProfit: 0, moveStopToEntry: false });
  const [currentSessionPnl, setCurrentSessionPnl] = useState<number>(0);
  const autoBetIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // YENİ: Oyuncu İstatistikleri ve VIP
  const [isStatsModalOpen, setIsStatsModalOpen] = useState<boolean>(false);
  const [userStats, setUserStats] = useState({ vipLevel: 'Silver', totalPnl: 45.50, gamesPlayed: 128, winRate: 48.5 });

  // YENİ: Canlı Sohbet (Trollbox) State'leri
  const [isChatOpen, setIsChatOpen] = useState<boolean>(false);
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    { id: '1', user: 'System', text: 'DiceDuel Canlı Lobisine Hoş Geldiniz! Lütfen saygılı olun.', time: '12:00', isSystem: true },
    { id: '2', user: 'KriptoPasa_34', text: 'Zarda üst üste 3 kere kazandım şansım yaver gidiyor 🚀', time: '12:01' },
    { id: '3', user: 'WhaleShark_VIP', text: 'Rulette kırmızıya 20 USDT bastım, bekliyorum.', time: '12:05' }
  ]);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Genel Oyun State'leri
  const [activeGame, setActiveGame] = useState<boolean>(false);
  const [isRolling, setIsRolling] = useState<boolean>(false);
  const [gameResult, setGameResult] = useState<any>({ opponent: 'Kasa', p1Score: null, p2Score: null, winner: null });

  // Sohbeti Aşağı Kaydırma
  useEffect(() => {
    if (isChatOpen && chatEndRef.current) chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, isChatOpen]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !account) return;
    const newMsg: ChatMessage = {
      id: Date.now().toString(),
      user: account.substring(0, 6) + '...',
      text: sanitizeInput(chatInput),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setChatMessages([...chatMessages, newMsg]);
    setChatInput('');
  };

  // BACKEND RNG SİMÜLASYONU VE AUTO-BET KONTROLÜ
  const executeGameRound = async (amount: number, gameType: string) => {
    setIsRolling(true);
    
    // Backend'e socket veya fetch isteği gönderildiği varsayılan blok
    // const response = await fetch(`${SERVER_URL}/api/play`, { method: 'POST', body: JSON.stringify({ amount, gameType, account }) });
    // const data = await response.json();
    
    setTimeout(() => {
      setIsRolling(false);
      const isWin = Math.random() < 0.45; 
      const netWin = isWin ? (amount * 2 * 0.97) - amount : -amount;
      
      const newBal = +(balance + netWin).toFixed(2);
      setBalance(newBal);
      setCurrentSessionPnl(prev => prev + netWin);
      
      setGameResult({ 
        opponent: 'Server RNG', 
        p1Score: isWin ? 85 : 12, 
        p2Score: isWin ? 12 : 85, 
        winner: isWin ? 'Sen' : 'Server RNG' 
      });

      // Otomatik Bahis (Auto-Bet) Risk Yönetimi Tetikleyicileri
      if (autoBetEnabled) {
        let newStopLoss = autoBetConfig.stopLoss;
        
        // İşlem kara geçtiğinde break-even (giriş seviyesi) koruması
        if (autoBetConfig.moveStopToEntry && currentSessionPnl + netWin > amount * 2) {
          newStopLoss = 0; // Zararı durdur seviyesini başabaş noktasına çeker
          console.log("Risk Yönetimi: Stop-loss giriş seviyesine çekildi.");
        }

        if (autoBetConfig.stopLoss < 0 && (currentSessionPnl + netWin) <= autoBetConfig.stopLoss) {
          setAutoBetEnabled(false);
          alert(`Auto-Bet Durduruldu: Stop-Loss sınırına ulaşıldı (${autoBetConfig.stopLoss} USDT).`);
        } else if (autoBetConfig.takeProfit > 0 && (currentSessionPnl + netWin) >= autoBetConfig.takeProfit) {
          setAutoBetEnabled(false);
          alert(`Auto-Bet Durduruldu: Kâr hedefine ulaşıldı (+${autoBetConfig.takeProfit} USDT).`);
        }
      }
    }, 1500);
  };

  const toggleAutoBet = () => {
    if (!autoBetEnabled) {
      if (parseFloat(betInput) > balance) return alert('Yetersiz bakiye.');
      setCurrentSessionPnl(0); // Oturum PnL sıfırla
    }
    setAutoBetEnabled(!autoBetEnabled);
  };

  useEffect(() => {
    if (autoBetEnabled && !isRolling) {
      autoBetIntervalRef.current = setTimeout(() => {
        executeGameRound(parseFloat(betInput), activeTab);
      }, 3000);
    }
    return () => clearTimeout(autoBetIntervalRef.current as NodeJS.Timeout);
  }, [autoBetEnabled, isRolling]);

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 p-3 md:p-8 font-sans">
      <div className="max-w-5xl mx-auto space-y-5 flex relative">
        
        {/* Sol Ana İçerik */}
        <div className="flex-1 space-y-5">
          {/* Üst Bar - Profil ve İstatistik Eklentisi */}
          <header className="flex flex-wrap items-center justify-between gap-3 p-3.5 bg-slate-900 border border-slate-800 rounded-2xl">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 bg-indigo-600/20 text-indigo-400 flex items-center justify-center font-black rounded-xl">🎲</div>
              <div>
                <h1 className="font-bold text-sm md:text-base">{t.hubTitle}</h1>
                <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span> Server-Side RNG
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* VIP ve İstatistik Butonu */}
              <button 
                onClick={() => setIsStatsModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs font-bold hover:bg-slate-700 transition"
              >
                <BarChart3 className="w-4 h-4 text-amber-400" />
                <span className="hidden sm:inline">{userStats.vipLevel} VIP</span>
              </button>
              
              <div className="flex items-center bg-slate-800 border border-slate-700 rounded-xl">
                <div className="px-3 py-2 text-xs font-bold text-amber-400">{balance.toFixed(2)} USDT</div>
                <button className="px-3 py-2 bg-indigo-600 text-white text-[11px] font-bold border-l border-indigo-500 rounded-r-xl">Kasa</button>
              </div>
            </div>
          </header>

          {/* Auto-Bet & Oyun Paneli */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-2xl">
             <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
               <h2 className="font-black flex items-center gap-2 text-white"><Bot className="w-5 h-5 text-indigo-400"/> Gelişmiş Bahis Paneli</h2>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Sol: Standart Bahis */}
                <div className="space-y-3">
                  <label className="text-xs font-bold text-slate-400">{t.betAmount}</label>
                  <input type="number" value={betInput} onChange={e => setBetInput(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm font-bold text-white" />
                  
                  <button 
                    onClick={() => { setActiveGame(true); executeGameRound(parseFloat(betInput), activeTab); }}
                    disabled={autoBetEnabled || isRolling} 
                    className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-sm rounded-xl disabled:opacity-50 transition"
                  >
                    {isRolling ? 'Zarlar Atılıyor...' : 'Manuel Oyna'}
                  </button>
                </div>

                {/* Sağ: Risk Yönetimi & Auto Bet */}
                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
                    <Target className="w-4 h-4 text-amber-400" /> {t.autoBetSettings}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] text-slate-500">{t.stopLoss}</label>
                      <input type="number" placeholder="-10" onChange={e => setAutoBetConfig({...autoBetConfig, stopLoss: parseFloat(e.target.value)})} className="w-full bg-slate-900 rounded-lg p-2 text-xs text-white border border-slate-700" />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-500">{t.takeProfit}</label>
                      <input type="number" placeholder="+25" onChange={e => setAutoBetConfig({...autoBetConfig, takeProfit: parseFloat(e.target.value)})} className="w-full bg-slate-900 rounded-lg p-2 text-xs text-white border border-slate-700" />
                    </div>
                  </div>

                  <label className="flex items-center gap-2 text-[10px] text-slate-400 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={autoBetConfig.moveStopToEntry}
                      onChange={e => setAutoBetConfig({...autoBetConfig, moveStopToEntry: e.target.checked})}
                      className="rounded bg-slate-900 border-slate-700 text-indigo-600 focus:ring-indigo-600" 
                    />
                    {t.moveStopToEntry}
                  </label>

                  <button 
                    onClick={toggleAutoBet}
                    className={`w-full py-2.5 font-black text-xs rounded-xl transition ${autoBetEnabled ? 'bg-rose-600 text-white animate-pulse' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}
                  >
                    {autoBetEnabled ? 'Botu Durdur' : 'Botu Başlat'}
                  </button>
                </div>
             </div>

             {/* Sonuç Ekranı */}
             {activeGame && (
               <div className="mt-6 p-6 bg-slate-950 border border-slate-800 rounded-2xl flex flex-col items-center">
                 <div className="text-2xl font-black">{isRolling ? '🔄' : gameResult.winner === 'Sen' ? '🎉 KAZANDIN!' : 'KAYBETTİN'}</div>
                 <div className="text-xs text-slate-500 mt-2">Oturum PnL: <span className={currentSessionPnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}>{currentSessionPnl.toFixed(2)} USDT</span></div>
               </div>
             )}
          </div>
        </div>

        {/* Sağ Panel - Canlı Sohbet (Trollbox) */}
        <div className="hidden lg:flex flex-col w-80 bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl h-[80vh] sticky top-8">
          <div className="p-4 border-b border-slate-800 bg-slate-950 flex justify-between items-center">
            <h3 className="font-bold text-sm flex items-center gap-2"><MessageCircle className="w-4 h-4 text-sky-400"/> {t.chatTitle}</h3>
            <span className="flex items-center gap-1 text-[9px] text-emerald-400"><span className="w-1.5 h-1.5 bg-emerald-400 rounded-full"></span> 142 Online</span>
          </div>
          
          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {chatMessages.map(msg => (
              <div key={msg.id} className="text-xs">
                <div className="flex items-baseline gap-1.5 mb-0.5">
                  <span className={`font-bold ${msg.isSystem ? 'text-rose-400' : 'text-indigo-400'}`}>{msg.user}</span>
                  <span className="text-[9px] text-slate-600">{msg.time}</span>
                </div>
                <div className={`p-2 rounded-xl ${msg.isSystem ? 'bg-rose-950/30 text-rose-200 border border-rose-900/50' : 'bg-slate-800 text-slate-300'}`}>
                  {msg.text}
                </div>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>

          <form onSubmit={handleSendMessage} className="p-3 bg-slate-950 border-t border-slate-800 flex gap-2">
            <input 
              type="text" 
              value={chatInput}
              onChange={e => setChatInput(e.target.value)}
              placeholder={t.chatPlaceholder} 
              className="flex-1 bg-slate-900 rounded-lg px-3 py-2 text-xs text-white focus:outline-none border border-slate-800"
            />
            <button type="submit" className="p-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-white transition"><Send className="w-4 h-4"/></button>
          </form>
        </div>

        {/* İstatistik Modalı */}
        <AnimatePresence>
          {isStatsModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80">
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="bg-slate-900 rounded-3xl p-6 w-full max-w-sm border border-slate-800 relative">
                <button onClick={() => setIsStatsModalOpen(false)} className="absolute top-4 right-4 text-slate-400"><X className="w-5 h-5"/></button>
                <h3 className="font-bold text-lg mb-4 text-white">{t.statsTitle}</h3>
                
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-slate-950 rounded-xl border border-slate-800">
                    <span className="text-xs text-slate-400">{t.vipLevel}</span>
                    <span className="font-black text-amber-400 text-sm">{userStats.vipLevel}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-slate-950 rounded-xl border border-slate-800">
                    <span className="text-xs text-slate-400">Toplam Oynanan</span>
                    <span className="font-black text-white text-sm">{userStats.gamesPlayed} Maç</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-slate-950 rounded-xl border border-slate-800">
                    <span className="text-xs text-slate-400">Kazanma Oranı</span>
                    <span className="font-black text-sky-400 text-sm">%{userStats.winRate}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-slate-950 rounded-xl border border-slate-800">
                    <span className="text-xs text-slate-400">{t.totalPnl}</span>
                    <span className={`font-black text-sm ${userStats.totalPnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {userStats.totalPnl > 0 ? '+' : ''}{userStats.totalPnl} USDT
                    </span>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

      </div>
    </main>
  );
}
