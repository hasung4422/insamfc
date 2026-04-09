"use client";

import { useState, useEffect } from 'react';
import { Mail, Megaphone, Banknote, ChevronRight, Settings, Trophy, User, LogOut, BellRing, Edit3, Check, X, PlusCircle, Loader2, ListPlus, Trash2, FileText, ShoppingBag, Coffee, Sparkles } from 'lucide-react';
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
        <div className="flex items-start gap-3.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500 mt-2.5 flex-shrink-0"></span>
          <div>
            <h1 className="text-3xl font-black tracking-tighter leading-tight italic text-slate-900">INSAM <span className="text-[#2d6cef]">FC</span></h1>
            <p className="text-[11px] text-slate-400 font-medium tracking-wide uppercase">Club Management System</p>
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

        {/* 관리자용 투표 생성기 */}
        {user?.role === 'admin' && (
          <section className="bg-slate-900 p-5 rounded-[2rem] shadow-xl relative border border-slate-800">
            <div className="flex items-center gap-2 mb-4">
              <div className="bg-[#10b981] p-1.5 rounded-lg"><PlusCircle className="w-4 h-4 text-white" /></div>
              <h3 className="text-white text-sm font-black italic tracking-tight uppercase">관리자용 투표 생성기</h3>
            </div>
            <div className="space-y-3">
              <input type="text" placeholder="투표 제목" value={newMatchTitle} onChange={(e) => setNewMatchTitle(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-xs font-bold text-white outline-none focus:ring-1 focus:ring-[#10b981]" />
              <div className="flex gap-2">
                <div className="flex-1 flex items-center bg-white/5 rounded-xl px-3 border border-white/10">
                  <ListPlus className="w-4 h-4 text-slate-500 mr-2" />
                  <input type="text" placeholder="선택 항목 추가" value={itemInput} onChange={(e) => setItemInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addItem()} className="bg-transparent border-none py-3 text-xs font-bold text-white outline-none w-full" />
                </div>
                <button onClick={addItem} className="bg-white/10 text-white px-3 rounded-xl font-black text-xs hover:bg-white/20">추가</button>
              </div>
              <div className="flex flex-wrap gap-2 min-h-[28px]">
                {selectedDates.map(item => (
                  <div key={item} className="bg-[#10b981]/20 border border-[#10b981]/30 text-[#10b981] px-2.5 py-1.5 rounded-lg text-[10px] font-black flex items-center gap-1.5">
                    {item}
                    <button onClick={() => removeItem(item)}><Trash2 size={12} /></button>
                  </div>
                ))}
              </div>
              <div className="flex items-start bg-white/5 rounded-xl px-3 border border-white/10">
                <FileText className="w-4 h-4 text-slate-500 mt-3 mr-2" />
                <textarea placeholder="상세 설명" value={matchContent} onChange={(e) => setMatchContent(e.target.value)} className="bg-transparent border-none py-3 text-xs font-bold text-white outline-none w-full min-h-[60px]" />
              </div>
              <button onClick={handleCreateNewMatch} disabled={isCreatingMatch} className="w-full bg-[#10b981] text-white py-3.5 rounded-xl font-black text-sm active:scale-95 transition-all flex items-center justify-center gap-2">
                {isCreatingMatch ? <Loader2 className="animate-spin w-4 h-4" /> : "새 투표 게시판 만들기 ⚽"}
              </button>
            </div>
          </section>
        )}

        <Link href="/vote" className="block active:scale-[0.97] transition-all">
          <section className="bg-[#1e293b] p-8 rounded-[2rem] shadow-xl relative overflow-hidden text-slate-100">
            <span className="absolute right-[-5%] bottom-[-10%] text-[100px] font-black text-white opacity-5 italic pointer-events-none">VOTE</span>
            <div className="relative z-10 space-y-2">
              <p className="text-[11px] text-slate-400 font-bold tracking-wider uppercase">투표하기</p>
              <h2 className="text-2xl font-black tracking-tight italic opacity-80">Next Match & Event</h2>
              <p className="text-3xl font-black text-[#10b981] tracking-tighter leading-none">{matchInfo?.weekSummary}</p>
              <div className="flex items-center justify-between pt-4">
                <p className="text-base font-bold flex items-center gap-2">지금 투표하러 가기 ⚽</p>
                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center"><ChevronRight size={24} strokeWidth={3} /></div>
              </div>
            </div>
          </section>
        </Link>

        {/* 🛠️ [디자인 수정] 포인트 SHOP 섹션만 심플하고 묵직하게 변경 */}
        <div className="grid gap-4">
          {[
            { title: "투표 현황 확인", sub: "누가 나오는지 확인하세요 📊", icon: <Mail className="text-[#2d6cef]" />, href: "/status" },
            { 
              title: "포인트 SHOP", 
              sub: "후원중인 커피 받아가기 ☕", 
              icon: <Coffee className="text-amber-500" />, // 아이콘 색상만 포인트
              href: "/points", 
              isSpecial: true // 💡 여전히 특수 처리
            },
            { title: "팀 회계 장부", sub: "투명한 회비 정산 내역 💰", icon: <Banknote className="text-emerald-500" />, href: "/accounting" },
            { title: "설정 및 명단관리", sub: "멤버 관리 및 권한 설정 ⚙️", icon: <Settings className="text-slate-400" />, href: "/setting" }
          ].map((item, idx) => (
            <Link key={idx} href={item.href} className="block active:scale-[0.97] transition-all">
              <section className={`relative overflow-hidden p-6 rounded-[2.5rem] shadow-sm border flex justify-between items-center transition-all ${
                item.isSpecial 
                ? "bg-[#1e293b] border-slate-700 text-white" // 💡 유치한 노란색 삭제, 고급스러운 딥 네이비톤
                : "bg-white border-slate-50 text-[#1e293b]"
              }`}>
                
                <div className="relative z-10">
                  <h2 className={`text-2xl font-black tracking-tighter italic ${item.isSpecial ? "text-amber-400" : "text-[#1e293b]"}`}>
                    {item.title}
                  </h2>
                  <p className={`text-sm font-bold ${item.isSpecial ? "text-slate-400" : "text-slate-400"}`}>
                    {item.sub}
                  </p>
                </div>

                <div className={`w-14 h-14 flex items-center justify-center rounded-[1.5rem] relative z-10 shadow-sm ${
                  item.isSpecial 
                  ? 'bg-slate-800 border border-slate-700' 
                  : 'bg-slate-50'
                }`}>
                  {item.icon}
                </div>
                
                {/* 💡 배경 커피 아이콘: 크기를 줄이고 투명도를 확 낮춰서 은은하게만 표시 */}
                {item.isSpecial && (
                  <div className="absolute right-[-5px] bottom-[-10px] opacity-[0.03] -rotate-12 pointer-events-none">
                    <Coffee size={100} />
                  </div>
                )}
              </section>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}