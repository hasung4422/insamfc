"use client";

import { useState, useEffect } from 'react';
import { ChevronLeft, Trophy, Plus, Minus, Clock, ShoppingBag, Loader2, Key, Search, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import { supabase } from '../../lib/supabase';

export default function PointsPage() {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [logs, setLogs] = useState<Record<string, any>>({});
  const [searchQuery, setSearchQuery] = useState("");

  const fetchData = async () => {
    const { data: memData } = await supabase.from('members').select('*').order('points', { ascending: false });
    const { data: logData } = await supabase.from('point_logs').select('*').order('created_at', { ascending: false });

    if (memData) {
      setMembers(memData);
      const latestLogs: Record<string, any> = {};
      logData?.forEach((log: any) => {
        if (!latestLogs[log.member_id]) latestLogs[log.member_id] = log;
      });
      setLogs(latestLogs);
    }
    setIsLoaded(true);
  };

  useEffect(() => {
    const savedUser = localStorage.getItem('insam_user');
    if (savedUser) {
      const user = JSON.parse(savedUser);
      setCurrentUser(user);
      setIsAdmin(user.role === 'admin');
    }
    fetchData();
  }, []);

  const adjustPoint = async (targetId: string, currentPoints: number, amount: number) => {
    if (!isAdmin || !currentUser) return;
    try {
      await supabase.from('members').update({ points: currentPoints + amount }).eq('id', targetId);
      await supabase.from('point_logs').insert({
        member_id: targetId,
        admin_name: currentUser.name,
        amount: amount
      });
      fetchData();
    } catch (error) {
      console.error(error);
      alert("오류 발생");
    }
  };

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours()}:${d.getMinutes().toString().padStart(2, '0')}`;
  };

  const filteredMembers = members.filter(m => m.name.includes(searchQuery));

  if (!isLoaded) return <div className="min-h-screen bg-white flex items-center justify-center"><Loader2 className="w-8 h-8 text-[#2d6cef] animate-spin" /></div>;

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 font-sans pb-24">
      {/* 💡 [버튼 강화] 상단 헤더 영역 */}
      <header className="sticky top-0 z-50 bg-white border-b-2 border-slate-100 px-5 py-5 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-3">
          <Link href="/" className="p-1 -ml-1 active:scale-90 transition-transform">
            <ChevronLeft className="w-8 h-8 text-slate-800" strokeWidth={3} />
          </Link>
          <h1 className="text-2xl font-black italic tracking-tighter uppercase text-slate-900 leading-none">
            Points <span className="text-[#2d6cef]">Shop</span>
          </h1>
        </div>
        
        <div className="flex items-center gap-3">
          {/* 💡 관리자 열쇠: 더 크고 확실하게! */}
          {isAdmin && (
            <Link href="/points/000" className="flex items-center justify-center w-12 h-12 bg-red-500 text-white rounded-2xl shadow-lg shadow-red-200 active:scale-90 transition-all">
              <Key size={24} strokeWidth={3} />
            </Link>
          )}
          
          {/* 💡 포인트 사용 버튼: 시원시원한 크기 */}
          <Link href="/points/use" className="flex items-center gap-2 px-6 py-3.5 bg-[#1e293b] text-white rounded-2xl text-sm font-black shadow-xl active:scale-95 transition-all">
            <ShoppingBag size={18} strokeWidth={3} />
            <span>포인트 사용</span>
          </Link>
        </div>
      </header>

      <main className="max-w-md mx-auto p-4 space-y-5">
        {/* 검색바 */}
        <div className="relative">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input 
            type="text" 
            placeholder="멤버 이름 검색..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border-2 border-slate-200 rounded-[1.5rem] py-4.5 pl-14 pr-5 text-base font-bold shadow-sm outline-none focus:border-[#2d6cef] transition-all"
          />
        </div>

        {/* 랭킹 1위 카드 */}
        {searchQuery === "" && members.length > 0 && (
          <section className="bg-gradient-to-br from-[#1e293b] to-[#0f172a] p-8 rounded-[2.5rem] shadow-2xl text-white relative overflow-hidden">
            <Trophy className="absolute right-[-15px] bottom-[-15px] w-32 h-32 text-white opacity-10 rotate-12" />
            <div className="flex justify-between items-center relative z-10">
              <div>
                <div className="bg-amber-400 text-[#1e293b] text-[10px] font-black px-3 py-1 rounded-full uppercase mb-3 inline-block">Current King</div>
                <h2 className="text-4xl font-black italic tracking-tighter leading-tight">{members[0].name}</h2>
              </div>
              <div className="text-right">
                <p className="text-3xl font-black text-amber-400 italic tracking-tighter">{members[0].points?.toLocaleString()}</p>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Total Points</p>
              </div>
            </div>
          </section>
        )}

        {/* 리스트 본문 */}
        <div className="bg-white rounded-[2.5rem] border-2 border-slate-100 shadow-sm overflow-hidden p-2">
          {filteredMembers.length > 0 ? filteredMembers.map((member, index) => {
            const lastLog = logs[member.id];
            const isTop3 = index < 3 && searchQuery === "";
            return (
              <div key={member.id} className="flex items-center justify-between p-5 hover:bg-slate-50 transition-colors rounded-[1.8rem] mb-1 last:mb-0">
                <div className="flex items-center gap-5 flex-1">
                  <div className={`w-10 h-10 flex items-center justify-center font-black italic rounded-2xl text-lg ${isTop3 ? 'bg-blue-50 text-[#2d6cef]' : 'text-slate-200'}`}>
                    {members.findIndex(m => m.id === member.id) + 1}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-black text-slate-800">{member.name}</h3>
                      {member.role === 'admin' && <ShieldCheck className="w-3.5 h-3.5 text-blue-500" />}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <p className="text-sm font-black text-[#2d6cef] italic">{member.points?.toLocaleString()} PTS</p>
                      {lastLog && (
                        <p className={`text-[10px] font-bold ${lastLog.amount > 0 ? 'text-blue-400' : 'text-red-400'}`}>
                          {lastLog.amount > 0 ? `+${lastLog.amount}` : lastLog.amount}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* 💡 [조작 툴 강화] 관리자용 버튼 */}
                {isAdmin && (
                  <div className="flex items-center gap-1.5 bg-slate-100 p-1.5 rounded-2xl border border-slate-200 shadow-inner">
                    <button 
                      onClick={() => adjustPoint(member.id, member.points, -10)} 
                      className="w-10 h-10 bg-white text-red-500 rounded-xl flex items-center justify-center shadow-sm active:scale-90 transition-all"
                    >
                      <Minus size={18} strokeWidth={3} />
                    </button>
                    <button 
                      onClick={() => adjustPoint(member.id, member.points, 10)} 
                      className="w-10 h-10 bg-[#1e293b] text-white rounded-xl flex items-center justify-center shadow-sm active:scale-90 transition-all"
                    >
                      <Plus size={18} strokeWidth={3} />
                    </button>
                  </div>
                )}
              </div>
            );
          }) : (
            <div className="p-16 text-center text-slate-400 font-bold text-sm">찾으시는 멤버가 없습니다.</div>
          )}
        </div>
      </main>
    </div>
  );
}