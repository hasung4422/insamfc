"use client";

import { useState, useEffect } from 'react';
import { ChevronLeft, TrendingUp, TrendingDown, Search } from 'lucide-react';
import Link from 'next/link';

export default function UsagePage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  // 가짜 데이터 (나중에 DB 연결)
  const transactions = [
    { id: 1, date: "04.09", title: "A구장 대관료", category: "구장료", amount: -120000, balance: 450000 },
    { id: 2, date: "04.08", title: "4월 정기 회비 (20명)", category: "회비", amount: 600000, balance: 570000 },
    { id: 3, date: "04.05", title: "음료수 및 생수", category: "부식비", amount: -25000, balance: -30000 },
  ];

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans pb-10">
      <header className="sticky top-0 z-50 bg-white border-b border-slate-100 px-6 py-4 flex items-center gap-4">
        <Link href="/accounting"><ChevronLeft className="w-6 h-6" /></Link>
        <h1 className="text-xl font-black italic tracking-tighter uppercase text-[#1e293b]">Usage <span className="text-[#2d6cef]">History</span></h1>
      </header>

      <main className="max-w-md mx-auto p-4 space-y-4">
        {/* 검색바 */}
        <div className="bg-slate-50 rounded-2xl px-4 py-3 flex items-center gap-2">
          <Search size={18} className="text-slate-400" />
          <input type="text" placeholder="사용 내역 검색..." className="bg-transparent border-none text-sm font-bold w-full focus:ring-0" />
        </div>

        {/* 내역 리스트 */}
        <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
          {transactions.map((item) => (
            <div key={item.id} className="p-5 border-b border-slate-50 last:border-none flex justify-between items-center">
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${item.amount > 0 ? 'bg-blue-50 text-blue-500' : 'bg-red-50 text-red-500'}`}>
                  {item.amount > 0 ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-300 uppercase leading-none mb-1">{item.date} · {item.category}</p>
                  <p className="text-sm font-black text-slate-800 tracking-tight">{item.title}</p>
                </div>
              </div>
              <div className="text-right">
                <p className={`text-base font-black ${item.amount > 0 ? 'text-blue-600' : 'text-slate-900'}`}>
                  {item.amount > 0 ? `+${item.amount.toLocaleString()}` : item.amount.toLocaleString()}원
                </p>
                <p className="text-[10px] font-bold text-slate-300">잔액 {item.balance.toLocaleString()}원</p>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}