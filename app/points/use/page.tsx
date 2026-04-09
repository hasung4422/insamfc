"use client";

import { useState, useEffect } from 'react';
import { 
  ChevronLeft, Coffee, Loader2, Sparkles, Trophy, 
  Pencil, Clock, Flame, Percent, Check, Lock 
} from 'lucide-react';
import Link from 'next/link';
// 상대 경로를 사용하여 경로 에러를 원천 차단합니다.
import { supabase } from '../../../lib/supabase';

export default function VendingMachinePage() {
  const [isRolling, setIsRolling] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [winCode, setWinCode] = useState<string | null>(null);

  // 재고 및 확률 관리 상태
  const [stockCount, setStockCount] = useState(0); 
  const [inputStock, setInputStock] = useState<number>(0); 
  const [probValue, setProbValue] = useState<number>(16); 
  const [inputProb, setInputProb] = useState<number>(16); 
  const [lastUpdatedBy, setLastUpdatedBy] = useState("");
  const [lastUpdatedAt, setLastUpdatedAt] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  const fetchData = async () => {
    try {
      const savedUser = localStorage.getItem('insam_user');
      if (savedUser) {
        const parsedUser = JSON.parse(savedUser);
        
        const { data: userData } = await supabase.from('members').select('*').eq('id', parsedUser.id).single();
        if (userData) setUser(userData);

        const { data: settings } = await supabase.from('shop_settings').select('*');
        if (settings) {
          // 💡 핵심 수정: (item: any) 를 추가하여 TypeScript의 투정을 멈춥니다.
          const sItem = settings.find((item: any) => item.key === 'coffee_limit');
          const pItem = settings.find((item: any) => item.key === 'winning_probability');
          
          if (sItem) {
            setStockCount(sItem.value);
            setInputStock(sItem.value);
            setLastUpdatedBy(sItem.updated_by || "관리자");
            setLastUpdatedAt(sItem.updated_at || "");
          }
          if (pItem) {
            setProbValue(pItem.value);
            setInputProb(pItem.value);
          }
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoaded(true);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const isAdmin = user?.role === 'admin';

  const handleAdminUpdate = async (type: 'stock' | 'prob') => {
    if (!isAdmin || isUpdating || !user) return;
    setIsUpdating(true);
    
    const key = type === 'stock' ? 'coffee_limit' : 'winning_probability';
    const value = type === 'stock' ? inputStock : inputProb;

    const { error } = await supabase.from('shop_settings').update({ 
      value: value, 
      updated_by: user.name || "관리자",
      updated_at: new Date().toISOString()
    }).eq('key', key);

    if (!error) {
      if (type === 'stock') setStockCount(value);
      else setProbValue(value);
      alert("설정이 저장되었습니다.");
    }
    setIsUpdating(false);
  };

  const rollVendingMachine = async () => {
    if (isRolling || !user || (user.points || 0) < 10 || stockCount <= 0) return;

    setIsRolling(true);
    setResult(null);
    setWinCode(null);

    const { error: pError } = await supabase.from('members').update({ points: user.points - 10 }).eq('id', user.id);
    if (pError) {
      alert("포인트 차감 실패!");
      setIsRolling(false);
      return;
    }

    setTimeout(async () => {
      const rand = Math.random() * 100;
      let selectedPrizeName = "꽝 (다음 기회에)";

      if (stockCount > 0 && rand < probValue) {
        selectedPrizeName = "메가/컴포즈 커피";
      }

      setResult(selectedPrizeName);
      
      if (selectedPrizeName !== "꽝 (다음 기회에)") {
        const code = `INSAM-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
        setWinCode(code);
        await supabase.from('point_shop_wins').insert({
          member_id: user.id, member_name: user.name,
          prize_name: selectedPrizeName, win_code: code
        });
        const newStock = stockCount - 1;
        await supabase.from('shop_settings').update({ value: newStock }).eq('key', 'coffee_limit');
        setStockCount(newStock);
        setInputStock(newStock);
      }
      setUser({ ...user, points: user.points - 10 });
      setIsRolling(false);
    }, 2000);
  };

  const formatTime = (dateStr: string) => {
    if (!dateStr || dateStr === "") return "-";
    const d = new Date(dateStr);
    return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours()}:${d.getMinutes().toString().padStart(2, '0')}`;
  };

  if (!isLoaded) return <div className="min-h-screen bg-white flex items-center justify-center"><Loader2 className="animate-spin text-blue-500 w-10 h-10" /></div>;

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-20 text-slate-900">
      <header className="sticky top-0 z-50 bg-white border-b px-6 py-4 flex items-center gap-4 shadow-sm">
        <Link href="/points"><ChevronLeft className="w-6 h-6 text-slate-800" /></Link>
        <h1 className="text-xl font-black italic uppercase tracking-tighter">럭키 <span className="text-[#2d6cef]">자판기</span></h1>
      </header>

      <main className="max-w-md mx-auto p-6 space-y-6">
        <div className={`rounded-3xl p-5 border-4 flex items-center justify-between shadow-lg transition-all ${stockCount > 0 ? 'bg-white border-yellow-400' : 'bg-red-50 border-red-200'}`}>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${stockCount > 0 ? 'bg-yellow-50 text-yellow-600' : 'bg-red-100 text-red-500'}`}>
              <Flame size={20} className={stockCount > 0 ? 'animate-pulse' : ''} />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">현재 운영 현황</p>
              <h3 className={`text-lg font-black leading-none ${stockCount > 0 ? 'text-slate-800' : 'text-red-500'}`}>
                {stockCount > 0 ? `재고 ${stockCount}잔 / 확률 ${probValue}%` : '커피 전량 품절'}
              </h3>
            </div>
          </div>
          <div className="text-right">
             <span className={`text-2xl font-black italic ${stockCount > 0 ? 'text-yellow-500' : 'text-red-300'}`}>{stockCount}</span>
             <span className="text-xs font-bold text-slate-400 ml-1">남음</span>
          </div>
        </div>

        <div className="bg-[#1e293b] rounded-[2.5rem] p-6 text-white shadow-xl flex justify-between items-center relative overflow-hidden border-b-8 border-slate-800">
          <div className="relative z-10">
            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">내 보유 포인트</p>
            <h2 className="text-3xl font-black text-amber-400 italic">{(user?.points || 0).toLocaleString()} <span className="text-sm text-white not-italic ml-1">PTS</span></h2>
          </div>
          <Sparkles className="w-12 h-12 text-white/10 absolute right-4 rotate-12" />
        </div>

        <div className="bg-white rounded-[3.5rem] border-8 border-slate-200 shadow-2xl p-8 text-center space-y-6 relative border-b-[20px]">
          {stockCount <= 0 && !isRolling && (
            <div className="absolute inset-0 z-20 bg-white/60 backdrop-blur-[2px] rounded-[3.5rem] flex items-center justify-center">
               <div className="bg-slate-900 text-white px-6 py-2 rounded-full font-black text-sm rotate-[-5deg] shadow-xl border-2 border-white">전량 매진</div>
            </div>
          )}

          <div className="bg-slate-900 rounded-[2rem] p-10 flex items-center justify-center min-h-[240px] shadow-inner border-4 border-slate-800 relative overflow-hidden">
            <div className="absolute inset-0 bg-yellow-500/5 animate-pulse"></div>
            {isRolling ? (
              <div className="relative z-10 space-y-4">
                <Loader2 className="w-14 h-14 text-yellow-400 animate-spin mx-auto" />
                <p className="text-yellow-400 font-black animate-pulse uppercase tracking-[0.3em] text-[10px]">결과 확인 중...</p>
              </div>
            ) : result ? (
              <div className="relative z-10 animate-in zoom-in duration-500 text-white">
                <div className="flex justify-center mb-4 scale-[1.8] drop-shadow-[0_0_15px_rgba(250,204,21,0.5)]">
                  <Coffee className="w-14 h-14 text-yellow-400" />
                </div>
                <p className="font-black text-2xl italic tracking-tighter mt-6 uppercase text-yellow-400">{result === "메가/컴포즈 커피" ? "당첨되었습니다!" : "다음 기회에!"}</p>
                <p className="text-white/40 font-bold text-sm mt-1">{result}</p>
              </div>
            ) : (
              <div className="relative z-10 space-y-4 opacity-20">
                <Trophy className="w-20 h-20 text-white mx-auto" />
                <p className="text-white font-black text-xs uppercase tracking-[0.4em]">행운을 빌어요</p>
              </div>
            )}
          </div>

          <button onClick={rollVendingMachine} disabled={isRolling || (user?.points || 0) < 10 || stockCount <= 0}
            className={`w-full py-7 rounded-3xl text-2xl font-black uppercase tracking-tighter transition-all shadow-xl active:scale-95 ${
              (user?.points || 0) >= 10 && stockCount > 0 ? 'bg-yellow-400 text-slate-900 border-b-8 border-yellow-700' : 'bg-slate-200 text-slate-400 border-b-8 border-slate-300 shadow-none'
            }`}>
            {stockCount <= 0 ? "재고가 없습니다" : isRolling ? "잠시만요..." : "뽑기 도전 (10 PTS)"}
          </button>
        </div>

        {winCode && (
          <div className="bg-gradient-to-br from-yellow-50 to-orange-50 border-4 border-dashed border-yellow-200 rounded-[2.5rem] p-8 text-center shadow-lg animate-in slide-in-from-top-10 duration-700">
            <div className="bg-yellow-400 text-slate-900 text-[10px] font-black px-4 py-1.5 rounded-full mb-4 inline-block tracking-tighter">당첨 코드</div>
            <p className="text-slate-800 text-sm font-bold mb-2">축하합니다! 관리자에게 코드를 보여주세요.</p>
            <h3 className="text-4xl font-black text-yellow-600 tracking-[0.2em]">{winCode}</h3>
          </div>
        )}

        <hr className="border-slate-200 my-10" />

        <div className={`rounded-[2.5rem] p-6 shadow-2xl space-y-5 border-b-8 transition-all ${isAdmin ? 'bg-slate-900 border-slate-800' : 'bg-slate-100 border-slate-200 opacity-70'}`}>
          <div className="flex items-center justify-between border-b border-black/5 pb-3">
            <span className={`font-black text-[10px] uppercase tracking-[0.2em] flex items-center gap-2 ${isAdmin ? 'text-yellow-400' : 'text-slate-400'}`}>
              {isAdmin ? <Pencil size={14}/> : <Lock size={14}/>} {isAdmin ? '관리자 설정' : '자판기 설정 정보'}
            </span>
            <span className={`text-[9px] font-bold ${isAdmin ? 'text-white/40' : 'text-slate-400'}`}>최종 수정: {formatTime(lastUpdatedAt)}</span>
          </div>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <label className={`text-[10px] font-black uppercase ml-1 ${isAdmin ? 'text-white/60' : 'text-slate-500'}`}>커피 재고 수량</label>
              <div className="flex gap-2">
                <input type="number" value={inputStock} onChange={(e) => setInputStock(Number(e.target.value))} disabled={!isAdmin}
                  className={`flex-grow border rounded-xl px-4 py-3 font-black outline-none transition-all ${isAdmin ? 'bg-white/5 border-white/10 text-white focus:ring-2 focus:ring-yellow-400' : 'bg-slate-200 border-slate-300 text-slate-500 cursor-not-allowed'}`} />
                <button onClick={() => handleAdminUpdate('stock')} disabled={!isAdmin || isUpdating}
                  className={`px-5 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${isAdmin ? 'bg-white/10 text-white active:scale-95' : 'bg-slate-300 text-slate-400 cursor-not-allowed'}`}>
                  {isAdmin ? <Check size={14}/> : <Lock size={14}/>} 수정
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <label className={`text-[10px] font-black uppercase ml-1 ${isAdmin ? 'text-yellow-500/80' : 'text-slate-500'}`}>당첨 확률 (%)</label>
              <div className="flex gap-2">
                <div className="relative flex-grow">
                  <input type="number" value={inputProb} onChange={(e) => setInputProb(Number(e.target.value))} disabled={!isAdmin}
                    className={`w-full border rounded-xl px-4 py-3 font-black outline-none transition-all ${isAdmin ? 'bg-white/5 border-white/10 text-white focus:ring-2 focus:ring-yellow-400' : 'bg-slate-200 border-slate-300 text-slate-500 cursor-not-allowed'}`} />
                  <Percent size={14} className={`absolute right-4 top-1/2 -translate-y-1/2 ${isAdmin ? 'text-white/30' : 'text-slate-400'}`} />
                </div>
                <button onClick={() => handleAdminUpdate('prob')} disabled={!isAdmin || isUpdating}
                  className={`px-5 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${isAdmin ? 'bg-yellow-400 text-slate-900 active:scale-95' : 'bg-slate-300 text-slate-400 cursor-not-allowed'}`}>
                  {isAdmin ? <Check size={14}/> : <Lock size={14}/>} 저장
                </button>
              </div>
            </div>
          </div>
          {!isAdmin && <p className="text-[8px] font-bold text-slate-400 text-center">※ 설정 수정은 관리자만 가능합니다.</p>}
        </div>
      </main>
    </div>
  );
}