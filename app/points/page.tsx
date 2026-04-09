"use client";

import { useState, useEffect } from 'react';
import { ChevronLeft, Trophy, Plus, Minus, ShieldCheck, User } from 'lucide-react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase'; // 💡 연결 전화기 가져오기

export default function PointsPage() {
  const [mounted, setMounted] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [members, setMembers] = useState<any[]>([]); // 💡 DB에서 받을 명단

  // 1. DB에서 명단 불러오기
  const fetchMembers = async () => {
    const { data, error } = await supabase
      .from('members')
      .select('*')
      .order('points', { ascending: false }); // 포인트 높은 순

    if (error) console.error("데이터 로딩 실패:", error);
    else setMembers(data || []);
  };

  useEffect(() => {
    setMounted(true);
    fetchMembers();
  }, []);

  // 2. 포인트 업데이트 (DB에 저장)
  const adjustPoint = async (id: string, currentPoints: number, amount: number) => {
    if (!isAdmin) return;

    const { error } = await supabase
      .from('members')
      .update({ points: currentPoints + amount })
      .eq('id', id);

    if (error) alert("업데이트 실패!");
    else fetchMembers(); // 성공하면 다시 불러오기
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans pb-10">
      <header className="sticky top-0 z-50 bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-4">
          <Link href="/"><ChevronLeft className="w-6 h-6 text-slate-800" /></Link>
          <h1 className="text-xl font-black italic tracking-tighter uppercase text-[#1e293b]">Points <span className="text-[#2d6cef]">Ranking</span></h1>
        </div>
        <button onClick={() => setIsAdmin(!isAdmin)} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black transition-all ${isAdmin ? 'bg-[#2d6cef] text-white' : 'bg-slate-100 text-slate-400'}`}>
          {isAdmin ? <ShieldCheck size={12} /> : <User size={12} />} {isAdmin ? "관리자" : "일반"}
        </button>
      </header>

      <main className="max-w-md mx-auto p-4 space-y-6">
        {members.length > 0 && (
          <section className="bg-[#1e293b] p-8 rounded-[2.5rem] shadow-xl text-white relative overflow-hidden text-center">
            <Trophy className="absolute top-[-10px] right-[-10px] w-32 h-32 text-white opacity-5 rotate-12" />
            <div className="relative z-10">
              <p className="text-[10px] text-amber-400 font-black uppercase tracking-[0.3em] mb-2">Current Top Ranker</p>
              <h2 className="text-4xl font-black mb-1 italic">{members[0].name}</h2>
              <p className="text-amber-400 text-xl font-black italic">{members[0].points?.toLocaleString()} PTS</p>
            </div>
          </section>
        )}

        <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
          {members.map((member, index) => (
            <div key={member.id} className="flex items-center justify-between p-5 border-b border-slate-50 last:border-none">
              <div className="flex items-center gap-5">
                <div className={`w-6 text-center font-black italic ${index < 3 ? 'text-[#2d6cef]' : 'text-slate-200'}`}>{index + 1}</div>
                <div>
                  <h3 className="text-sm font-black text-slate-800 leading-none mb-1">{member.name}</h3>
                  <p className="text-[11px] font-bold text-[#2d6cef] italic">{member.points?.toLocaleString()} PTS</p>
                </div>
              </div>

              {isAdmin && (
                <div className="flex items-center gap-1 bg-slate-100 rounded-2xl p-1 shadow-inner">
                  <button onClick={() => adjustPoint(member.id, member.points, -10)} className="w-8 h-8 bg-white rounded-xl flex items-center justify-center text-red-500 shadow-sm active:scale-90"><Minus size={14} strokeWidth={3} /></button>
                  <button onClick={() => adjustPoint(member.id, member.points, 10)} className="w-8 h-8 bg-[#1e293b] rounded-xl flex items-center justify-center text-white shadow-sm active:scale-90"><Plus size={14} strokeWidth={3} /></button>
                </div>
              )}
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}