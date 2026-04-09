"use client";

import { useState, useEffect } from 'react';
import { ChevronLeft, CheckCircle, Trash2, Loader2, Gift, User, Key } from 'lucide-react';
import Link from 'next/link';
import { supabase } from '../../../lib/supabase';

export default function AdminPointsPage() {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [winList, setWinList] = useState<any[]>([]);

  // 💡 당첨자 명단 불러오기
  const fetchWins = async () => {
    const { data, error } = await supabase
      .from('point_shop_wins')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setWinList(data);
    }
  };

  useEffect(() => {
    const savedUser = localStorage.getItem('insam_user');
    if (savedUser) {
      const user = JSON.parse(savedUser);
      if (user.role === 'admin') {
        setIsAdmin(true);
        fetchWins();
      }
    }
    setIsLoaded(true);
  }, []);

  // 💡 지급 완료 후 삭제 처리
  const deleteWinRecord = async (id: string) => {
    if (!confirm("상품 지급을 완료하고 목록에서 삭제하시겠습니까?")) return;

    const { error } = await supabase
      .from('point_shop_wins')
      .delete()
      .eq('id', id);

    if (error) {
      alert("삭제 실패!");
    } else {
      setWinList(winList.filter(item => item.id !== id));
    }
  };

  if (!isLoaded) return <div className="min-h-screen bg-white flex items-center justify-center"><Loader2 className="animate-spin text-blue-500" /></div>;

  // 관리자 아닐 때 차단 화면
  if (!isAdmin) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-6 text-center">
      <div className="bg-white p-8 rounded-[2rem] shadow-xl">
        <Key className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h2 className="text-xl font-black text-slate-800 mb-2">접근 권한 없음</h2>
        <p className="text-sm text-slate-500 mb-6">회장님(관리자) 계정으로<br/>로그인 후에 이용 가능합니다.</p>
        <Link href="/" className="px-6 py-3 bg-[#1e293b] text-white rounded-xl text-xs font-bold">홈으로 돌아가기</Link>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-20">
      <header className="sticky top-0 z-50 bg-white border-b px-6 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-4">
          <Link href="/points"><ChevronLeft className="w-6 h-6 text-slate-800" /></Link>
          <h1 className="text-xl font-black italic uppercase tracking-tighter">Winner <span className="text-red-500">Admin</span></h1>
        </div>
        <div className="bg-red-50 text-red-500 text-[10px] font-black px-3 py-1 rounded-full border border-red-100 uppercase">Secret Mode</div>
      </header>

      <main className="max-w-md mx-auto p-4 space-y-4 mt-4">
        <div className="px-2">
          <h2 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-1">Exchange Pending</h2>
          <p className="text-xs text-slate-500 font-medium">지급 완료 후 삭제 버튼을 눌러주세요.</p>
        </div>

        {winList.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border-2 border-dashed border-slate-200">
            <Gift className="w-12 h-12 text-slate-200 mx-auto mb-3" />
            <p className="text-slate-400 font-bold text-sm">대기 중인 당첨자가 없습니다.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {winList.map((win) => (
              <div key={win.id} className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100 flex flex-col gap-4">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-500">
                      <User size={20} />
                    </div>
                    <div>
                      <h3 className="text-base font-black text-slate-800 leading-none">{win.member_name}</h3>
                      <p className="text-[10px] text-slate-400 font-bold mt-1 uppercase tracking-tighter italic">{new Date(win.created_at).toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="bg-amber-100 text-amber-700 text-[10px] font-black px-2 py-1 rounded-md">
                    {win.prize_name}
                  </div>
                </div>

                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Winner Code</p>
                    <p className="text-lg font-black text-[#1e293b] tracking-widest">{win.win_code}</p>
                  </div>
                  <button 
                    onClick={() => deleteWinRecord(win.id)}
                    className="flex items-center gap-1.5 px-4 py-3 bg-red-500 text-white rounded-xl text-xs font-black shadow-lg shadow-red-100 active:scale-90 transition-all"
                  >
                    <CheckCircle size={14} /> 지급완료
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}