"use client";

import { useState, useEffect } from 'react';
import { ChevronLeft, PieChart } from 'lucide-react';
import Link from 'next/link';

export default function SettlementPage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans pb-10">
      <header className="px-6 py-6 flex items-center gap-4 border-b border-slate-50">
        <Link href="/accounting"><ChevronLeft className="w-6 h-6" /></Link>
        <h1 className="text-xl font-black italic tracking-tighter uppercase text-[#1e293b]">Monthly <span className="text-[#2d6cef]">Report</span></h1>
      </header>

      <main className="max-w-md mx-auto p-4 space-y-6">
        <section className="bg-slate-50 p-8 rounded-[2.5rem] border border-slate-100 space-y-6">
          <div className="text-center">
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">2026년 4월 결산</p>
            <h2 className="text-3xl font-black text-[#1e293b]">최종 보고서 📋</h2>
          </div>
          
          <div className="space-y-4">
            <div className="flex justify-between items-center py-2 border-b border-slate-200">
              <span className="text-sm font-bold text-slate-500">이월 금액</span>
              <span className="text-sm font-black italic">250,000원</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-slate-200">
              <span className="text-sm font-bold text-slate-500">총 수입 (+)</span>
              <span className="text-sm font-black italic text-blue-600">600,000원</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-slate-200">
              <span className="text-sm font-bold text-slate-500">총 지출 (-)</span>
              <span className="text-sm font-black italic text-red-500">400,000원</span>
            </div>
            <div className="flex justify-between items-center pt-4">
              <span className="text-base font-black text-[#1e293b]">현재 잔액</span>
              <span className="text-2xl font-black italic text-[#2d6cef]">450,000원</span>
            </div>
          </div>
        </section>

        <div className="bg-blue-50 p-6 rounded-[2rem] flex items-center gap-4">
          <PieChart className="text-[#2d6cef]" size={32} />
          <p className="text-xs font-bold text-slate-600 leading-relaxed">
            이번 달은 구장 대관료가 전체 지출의 <span className="font-black">80%</span>를 차지했습니다.
          </p>
        </div>
      </main>
    </div>
  );
}