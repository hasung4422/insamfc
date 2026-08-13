"use client";

import { useState, useEffect } from 'react';
import { CheckSquare, Users, Wallet, SlidersHorizontal, LogOut, BellRing, Edit3, PlusCircle, Loader2, ListPlus, Trash2, FileText } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function Home() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [matchInfo, setMatchInfo] = useState<{ weekSummary: string } | null>(null);
  const [user, setUser] = useState<{id: string, name: string, role: string} | null>(null);
  
  const [notice, setNotice] = useState("공지사항을 불러오는 중...");
  const [isEditingNotice, setIsEditingNotice] = useState(false);
  const [tempNotice, setTempNotice] = useState("");
  
  const [newMatchTitle, setNewMatchTitle] = useState("");
  const [selectedDates, setSelectedDates] = useState<string[]>([]);
  const [itemInput, setItemInput] = useState("");
  const [matchContent, setMatchContent] = useState("");
  const [isCreatingMatch, setIsCreatingMatch] = useState(false);

  useEffect(() => {
    async function init() {
      const savedUser = localStorage.getItem('insam_user');
      if (!savedUser) {
        router.replace('/login');
        return;
      }
      const userData = JSON.parse(savedUser);
      setUser(userData);

      const { data } = await supabase.from('notices').select('content').eq('id', 1).single();
      if (data) setNotice(data.content);

      try {
        const today = new Date();
        const firstSat = new Date(today);
        firstSat.setDate(today.getDate() + (6 - today.getDay() + 7) % 7);
        const weekStrings = [];
        for (let i = 0; i < 4; i++) {
          const targetSat = new Date(firstSat);
          targetSat.setDate(firstSat.getDate() + i * 7);
          weekStrings.push(`${targetSat.getMonth() + 1}월 ${Math.ceil(targetSat.getDate() / 7)}주`);
        }
        setMatchInfo({ weekSummary: `${weekStrings[0]} ~ ${weekStrings[3]}` });
      } catch (e) { console.error(e); }

      setMounted(true);
    }
    init();
  }, [router]);

  const addItem = () => {
    if (!itemInput) return;
    if (!selectedDates.includes(itemInput)) {
      setSelectedDates([...selectedDates, itemInput]);
    }
    setItemInput("");
  };

  const removeItem = (item: string) => {
    setSelectedDates(selectedDates.filter(d => d !== item));
  };

  const saveNotice = async () => {
    const { error } = await supabase.from('notices').update({ content: tempNotice }).eq('id', 1);
    if (!error) {
      setNotice(tempNotice);
      setIsEditingNotice(false);
    }
  };

  const handleCreateNewMatch = async () => {
    if (!newMatchTitle || selectedDates.length === 0) return alert("투표 제목과 선택 항목을 입력해주세요!");
    setIsCreatingMatch(true);

    try {
      await supabase.from('match_sessions').update({ is_active: false }).eq('is_active', true);
      const { error: sessionError } = await supabase
        .from('match_sessions')
        .insert([{ 
          title: newMatchTitle, 
          match_date: selectedDates.join(', '), 
          content: matchContent, 
          is_active: true 
        }]);

      if (sessionError) throw sessionError;

      const autoNotice = `📢 [신규투표] ${newMatchTitle} 시작! (항목: ${selectedDates.join(', ')})`;
      await supabase.from('notices').update({ content: autoNotice }).eq('id', 1);
      
      setNotice(autoNotice);
      setNewMatchTitle("");
      setSelectedDates([]);
      setMatchContent("");
      alert("새로운 투표가 게시되었습니다! ⚽");
    } catch (e) {
      console.error(e);
      alert("생성 실패: 데이터베이스 설정을 확인해주세요.");
    } finally {
      setIsCreatingMatch(false);
    }
  };

  const handleLogout = () => {
    if (confirm("로그아웃 하시겠습니까?")) {
      localStorage.removeItem('insam_user');
      router.replace('/login');
    }
  };

  if (!mounted) return <div className="min-h-screen bg-white flex items-center justify-center"><p className="text-slate-300 font-bold animate-pulse">인증 확인 중...</p></div>;

  return (
    <div className="min-h-screen bg-white text-slate-950 font-sans antialiased pb-20">
      <header className="flex items-center justify-between p-6 mt-2 max-w-md mx-auto">
        <div className="flex items-center gap-3.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0"></span>
          <div>
            <h1 className="text-3xl font-black tracking-tighter leading-tight italic text-slate-900">INSAM <span className="text-[#2d6cef]">FC</span></h1>
          </div>
        </div>
        <div className="text-right flex flex-col items-end">
          <div className="flex items-center gap-1.5 mb-1">
            <span className="text-sm font-black text-slate-800">{user?.name}</span>
            <span className="text-[10px] font-bold text-slate-400">님</span>
            <button onClick={handleLogout} className="w-8 h-8 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center ml-1 text-slate-400 hover:text-red-500"><LogOut size={14} /></button>
          </div>
        </div>
      </header>

      <main className="max-w-md mx-auto p-4 pt-0 space-y-6">
        {/* 공지사항 섹션 */}
        <section className="bg-blue-50/50 border border-blue-100/50 p-5 rounded-[2rem] relative overflow-hidden">
          <div className="flex items-start gap-3">
            <div className="bg-white p-2.5 rounded-2xl shadow-sm">
              <BellRing className="w-5 h-5 text-[#2d6cef] animate-bounce" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-black text-[#2d6cef] uppercase tracking-widest">회장님 공지사항</span>
                {user?.role === 'admin' && !isEditingNotice && (
                  <button onClick={() => { setIsEditingNotice(true); setTempNotice(notice); }} className="text-slate-400"><Edit3 size={12} /></button>
                )}
              </div>
              {isEditingNotice ? (
                <div className="space-y-2 mt-2">
                  <textarea value={tempNotice} onChange={(e) => setTempNotice(e.target.value)} className="w-full p-3 rounded-xl border-none bg-white text-sm font-bold outline-none ring-2 ring-blue-100" rows={2} />
                  <div className="flex gap-2">
                    <button onClick={saveNotice} className="flex-1 bg-[#2d6cef] text-white py-2 rounded-xl text-xs font-black">저장</button>
                    <button onClick={() => setIsEditingNotice(false)} className="flex-1 bg-slate-200 text-slate-500 py-2 rounded-xl text-xs font-black">취소</button>
                  </div>
                </div>
              ) : ( <p className="text-sm font-bold text-slate-700 break-keep">"{notice}"</p> )}
            </div>
          </div>
        </section>

        {/* 4개 탭 모두 동일한 크기(2열 그리드: 0 0 / 0 0)로 배치 */}
        <div className="grid grid-cols-2 gap-4">
          {[
            { title: "투표하기", icon: <CheckSquare size={30} className="text-[#10b981]" />, href: "/vote" },
            { title: "투표 현황 확인", icon: <Users size={30} className="text-[#2d6cef]" />, href: "/status" },
            { title: "팀 회계 장부", icon: <Wallet size={30} className="text-emerald-500" />, href: "/accounting" },
            { title: "설정 및 명단관리", icon: <SlidersHorizontal size={30} className="text-slate-400" />, href: "/setting" }
          ].map((item, idx) => (
            <Link key={idx} href={item.href} className="block active:scale-[0.97] transition-all">
              <section className="relative overflow-hidden p-5 rounded-[2.2rem] shadow-sm border flex flex-col items-center justify-center text-center h-full transition-all bg-white border-slate-100 text-[#1e293b]">
                <div className="w-16 h-14 flex items-center justify-center rounded-[1.2rem] relative z-10 shadow-sm bg-slate-50 mb-3">
                  {item.icon}
                </div>
                <div className="relative z-10">
                  <h2 className="text-lg font-black tracking-tighter italic text-[#1e293b] leading-tight">
                    {item.title}
                  </h2>
                </div>
              </section>
            </Link>
          ))}
        </div>

        {/* 관리자용 투표 생성기 (바탕 흰색) */}
        {user?.role === 'admin' && (
          <section className="bg-white p-5 rounded-[2rem] shadow-sm relative border border-slate-100">
            <div className="flex items-center gap-2 mb-4">
              <div className="bg-[#10b981]/10 p-1.5 rounded-lg"><PlusCircle className="w-4 h-4 text-[#10b981]" /></div>
              <h3 className="text-slate-900 text-sm font-black italic tracking-tight uppercase">관리자용 투표 생성기</h3>
            </div>
            <div className="space-y-3">
              <input type="text" placeholder="투표 제목" value={newMatchTitle} onChange={(e) => setNewMatchTitle(e.target.value)} className="w-full bg-slate-50 border border-slate-100 rounded-xl py-3 px-4 text-xs font-bold text-slate-900 outline-none focus:ring-1 focus:ring-[#10b981]" />
              <div className="flex gap-2">
                <div className="flex-1 flex items-center bg-slate-50 rounded-xl px-3 border border-slate-100">
                  <ListPlus className="w-4 h-4 text-slate-400 mr-2" />
                  <input type="text" placeholder="선택 항목 추가" value={itemInput} onChange={(e) => setItemInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addItem()} className="bg-transparent border-none py-3 text-xs font-bold text-slate-900 outline-none w-full" />
                </div>
                <button onClick={addItem} className="bg-slate-100 text-slate-600 px-3 rounded-xl font-black text-xs hover:bg-slate-200">추가</button>
              </div>
              <div className="flex flex-wrap gap-2 min-h-[28px]">
                {selectedDates.map(item => (
                  <div key={item} className="bg-[#10b981]/10 border border-[#10b981]/20 text-[#10b981] px-2.5 py-1.5 rounded-lg text-[10px] font-black flex items-center gap-1.5">
                    {item}
                    <button onClick={() => removeItem(item)}><Trash2 size={12} /></button>
                  </div>
                ))}
              </div>
              <div className="flex items-start bg-slate-50 rounded-xl px-3 border border-slate-100">
                <FileText className="w-4 h-4 text-slate-400 mt-3 mr-2" />
                <textarea placeholder="상세 설명" value={matchContent} onChange={(e) => setMatchContent(e.target.value)} className="bg-transparent border-none py-3 text-xs font-bold text-slate-900 outline-none w-full min-h-[60px]" />
              </div>
              <button onClick={handleCreateNewMatch} disabled={isCreatingMatch} className="w-full bg-[#10b981] text-white py-3.5 rounded-xl font-black text-sm active:scale-95 transition-all flex items-center justify-center gap-2">
                {isCreatingMatch ? <Loader2 className="animate-spin w-4 h-4" /> : "새 투표 게시판 만들기 ⚽"}
              </button>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}