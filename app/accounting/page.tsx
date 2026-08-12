"use client";

import { useState, useEffect } from 'react';
import { ChevronLeft, CheckCircle2, Receipt, BarChart3, MessageSquare, Wallet, Loader2, Lock, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function AccountingHub() {
  const router = useRouter();
  const [isLoaded, setIsLoaded] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const savedUser = localStorage.getItem('insam_user');
    
    if (!savedUser) {
      router.replace('/login');
      return;
    }

    const userData = JSON.parse(savedUser);
    
    // 관리자 여부 체크
    if (userData.role === 'admin') {
      setIsAdmin(true);
    }

    setIsLoaded(true);
  }, [router]);

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#2d6cef] animate-spin" />
      </div>
    );
  }

  // 1. [일반 유저용] 준비 중 화면
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-white text-slate-900 font-sans">
        <header className="p-6 flex items-center gap-4">
          <Link href="/" className="active:scale-90 transition-all">
            <ChevronLeft className="w-6 h-6 text-slate-800" />
          </Link>
          <h1 className="text-xl font-black italic tracking-tighter uppercase text-[#1e293b]">Accounting</h1>
        </header>

        <main className="max-w-md mx-auto p-8 flex flex-col items-center justify-center pt-20 text-center">
          <div className="w-24 h-24 bg-slate-50 rounded-[2.5rem] flex items-center justify-center mb-6 shadow-inner">
            <Lock className="w-10 h-10 text-slate-200" />
          </div>
          <h2 className="text-2xl font-black text-slate-800 mb-2 italic">COMING SOON</h2>
          <p className="text-sm text-slate-400 font-bold leading-relaxed break-keep">
            회계 시스템은 현재 고도화 작업 중입니다.<br />
            정식 오픈 전까지는 관리자만 열람 가능합니다.
          </p>
          
          <Link href="/" className="mt-10 bg-slate-900 text-white px-8 py-4 rounded-2xl font-black text-sm active:scale-95 transition-all">
            홈으로 돌아가기
          </Link>
        </main>
      </div>
    );
  }

  // 2. [관리자용] 실제 회계 허브 화면 메뉴 구성
  const menus = [
    { title: "회비 납부 현황", desc: "이번 달 회비 내신 분 확인", icon: <CheckCircle2 size={28} />, href: "/accounting/status", color: "text-blue-500", bg: "bg-blue-50" },
    { title: "회비 사용 내역", desc: "지출된 모든 상세 내역", icon: <Receipt size={28} />, href: "/accounting/usage", color: "text-emerald-500", bg: "bg-emerald-50" },
    { title: "회비 결산 보고", desc: "월별/기수별 최종 결산", icon: <BarChart3 size={28} />, href: "/accounting/settlement", color: "text-amber-500", bg: "bg-amber-50" },
    { title: "구매희망 게시판", desc: "필요한 비품 익명 제안", icon: <MessageSquare size={28} />, href: "/accounting/wishlist", color: "text-purple-500", bg: "bg-purple-50" }
  ];

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans pb-20">
      <header className="sticky top-0 z-50 bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-4">
          <Link href="/" className="active:scale-90 transition-all">
            <ChevronLeft className="w-6 h-6 text-slate-800" />
          </Link>
          <h1 className="text-xl font-black italic tracking-tighter uppercase text-[#1e293b]">
            Accounting <span className="text-[#2d6cef]">Hub</span>
          </h1>
        </div>
        <div className="flex items-center gap-1.5 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-100">
          <ShieldCheck size={14} className="text-emerald-600" />
          <span className="text-[10px] font-black text-emerald-600 uppercase">Authorized</span>
        </div>
      </header>

      <main className="max-w-md mx-auto p-4 space-y-6">
        <section className="bg-[#1e293b] p-8 rounded-[2.5rem] shadow-xl text-white relative overflow-hidden">
          <span className="absolute right-[-5%] bottom-[-10%] text-6xl font-black opacity-10 italic pointer-events-none">TOTAL</span>
          <div className="relative z-10">
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">현재 잔액</p>
            <h2 className="text-3xl font-black italic mb-2 tracking-tighter">
              450,000 <span className="text-lg font-bold not-italic text-slate-400">원</span>
            </h2>
            <div className="flex items-center gap-2 mt-4 text-[11px] font-bold text-[#10b981] bg-white/5 w-fit px-3 py-1.5 rounded-full">
              <Wallet size={12} />
              실시간 데이터 연동 중
            </div>
          </div>
        </section>

        <div className="grid grid-cols-1 gap-4">
          {menus.map((menu, idx) => (
            <Link href={menu.href} key={idx} className="block active:scale-[0.97] transition-all">
              <section className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-50 flex justify-between items-center">
                <div className="flex items-center gap-5">
                  <div className={`w-14 h-14 ${menu.bg} ${menu.color} rounded-3xl flex items-center justify-center shadow-sm`}>
                    {menu.icon}
                  </div>
                  <div>
                    <h3 className="text-lg font-black tracking-tight text-[#1e293b] leading-none mb-1.5">{menu.title}</h3>
                    <p className="text-xs text-slate-400 font-medium">{menu.desc}</p>
                  </div>
                </div>
              </section>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}