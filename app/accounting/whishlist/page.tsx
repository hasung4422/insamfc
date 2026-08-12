"use client";

import { useState, useEffect } from 'react';
import { ChevronLeft, MessageSquare, Heart, Send } from 'lucide-react';
import Link from 'next/link';

export default function WishlistPage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans pb-24">
      <header className="sticky top-0 z-50 bg-white border-b border-slate-100 px-6 py-4 flex items-center gap-4 shadow-sm">
        <Link href="/accounting"><ChevronLeft className="w-6 h-6" /></Link>
        <h1 className="text-xl font-black italic tracking-tighter uppercase text-[#1e293b]">Wish <span className="text-[#2d6cef]">List</span></h1>
      </header>

      <main className="max-w-md mx-auto p-4 space-y-4">
        {/* 게시글 */}
        <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-black text-[#2d6cef] bg-blue-50 px-3 py-1 rounded-full uppercase">Anonymous</span>
            <span className="text-[10px] font-bold text-slate-300">04.09 14:20</span>
          </div>
          <p className="text-sm font-bold text-slate-700 leading-relaxed italic">"팀 조끼가 너무 오래되어서 냄새가 잘 안 빠지네요. 이번 기회에 2세트 새로 구매했으면 좋겠습니다!"</p>
          <div className="flex items-center gap-2 pt-2 text-slate-300">
            <Heart size={16} /> <span className="text-xs font-bold">12</span>
          </div>
        </div>
      </main>

      {/* 입력창 (하단 고정) */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md p-4 bg-white border-t border-slate-100 flex gap-2">
        <input type="text" placeholder="익명으로 제안하기..." className="flex-1 bg-slate-50 border-none rounded-2xl px-4 py-3 text-sm font-bold outline-none" />
        <button className="bg-[#1e293b] text-white p-3 rounded-2xl active:scale-95 transition-all"><Send size={20} /></button>
      </div>
    </div>
  );
}