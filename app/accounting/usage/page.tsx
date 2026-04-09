"use client";

import { useState, useEffect } from 'react';
import { ChevronLeft, CheckCircle2, Circle } from 'lucide-react';
import Link from 'next/link';

export default function StatusPage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  // 💡 이름을 1부터 9까지의 숫자로 변경
  const members = [
    { name: "1", paid: true }, { name: "2", paid: true }, { name: "3", paid: false },
    { name: "4", paid: true }, { name: "5", paid: false }, { name: "6", paid: true },
    { name: "7", paid: true }, { name: "8", paid: true }, { name: "9", paid: false },
  ];

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans pb-10">
      <header className="sticky top-0 z-50 bg-white border-b border-slate-100 px-6 py-4 flex items-center gap-4">
        <Link href="/accounting"><ChevronLeft className="w-6 h-6" /></Link>
        <h1 className="text-xl font-black italic tracking-tighter uppercase text-[#1e293b]">Payment <span className="text-[#2d6cef]">Status</span></h1>
      </header>

      <main className="max-w-md mx-auto p-4 space-y-6">
        <div className="bg-[#1e293b] p-6 rounded-[2rem] text-white flex justify-between items-center">
          <div>
            <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">4월 정기 회비</p>
            <h2 className="text-xl font-black italic">16 / 20 <span className="text-sm font-bold text-slate-400 not-italic">명 납부</span></h2>
          </div>
          <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center text-[#10b981]"><CheckCircle2 size={24} /></div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {members.map((m, i) => (
            <div key={i} className={`p-4 rounded-2xl border flex flex-col items-center justify-center gap-2 ${m.paid ? 'bg-white border-slate-100' : 'bg-red-50 border-red-100'}`}>
              <span className={`text-[10px] font-black ${m.paid ? 'text-[#10b981]' : 'text-red-400'}`}>
                {m.paid ? "완료" : "미납"}
              </span>
              <span className="text-sm font-black text-slate-800">{m.name}</span>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}