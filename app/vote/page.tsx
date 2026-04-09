"use client";

import { useState, useEffect } from 'react';
import { ChevronLeft, Clock, Save, Edit3, Check, Loader2, Star, Trash2, FileText } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function VotePage() {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [votes, setVotes] = useState<Record<string, boolean>>({});           // 기존 4주치 투표 상태
  const [adminVotes, setAdminVotes] = useState<Record<string, boolean>>({}); // 💡 관리자 특별 투표 상태
  const [schedules, setSchedules] = useState<{sat: string, sun: string}[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  
  // 💡 관리자가 올린 특별 투표 세션 저장용
  const [adminSession, setAdminSession] = useState<any>(null);

  const timeSlots = ["08:00 ~ 10:00", "10:00 ~ 12:00", "12:00 ~ 14:00"];

  useEffect(() => {
    async function initVotePage() {
      const savedUser = localStorage.getItem('insam_user');
      if (!savedUser) {
        router.replace('/login');
        return;
      }
      const userData = JSON.parse(savedUser);
      setUser(userData);

      // 1. 관리자 특별 투표(활성화된 것) 가져오기
      const { data: sessionData } = await supabase
        .from('match_sessions')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      
      if (sessionData) setAdminSession(sessionData);

      // 2. 날짜 생성 (기존 4주치)
      const weeks = [];
      const today = new Date();
      const firstSat = new Date(today);
      firstSat.setDate(today.getDate() + (6 - today.getDay() + 7) % 7);
      for (let i = 0; i < 4; i++) {
        const sat = new Date(firstSat);
        sat.setDate(firstSat.getDate() + i * 7);
        const sun = new Date(sat);
        sun.setDate(sat.getDate() + 1);
        weeks.push({
          sat: `${sat.getMonth() + 1}월 ${sat.getDate()}일 (토)`,
          sun: `${sun.getMonth() + 1}월 ${sun.getDate()}일 (일)`,
        });
      }
      setSchedules(weeks);

      // 3. 내 투표 기록 싹 다 가져오기
      const { data: myVotes, error } = await supabase
        .from('votes')
        .select('*')
        .eq('member_id', userData.id);

      if (!error && myVotes) {
        const regMap: Record<string, boolean> = {};
        const admMap: Record<string, boolean> = {};
        
        myVotes.forEach((v: any) => {
          // 관리자 투표에 한 것이라면
          if (sessionData && v.session_id === sessionData.id) {
            admMap[v.match_date] = true; 
          } else {
            // 기존 4주치 일정에 한 것이라면 (구분자를 || 로 변경하여 안전성 확보)
            regMap[`${v.match_date}||${v.match_time}`] = true;
          }
        });
        setVotes(regMap);
        setAdminVotes(admMap);
      }
      setIsLoaded(true);
    }
    initVotePage();
  }, [router]);

  // 💡 투표 토글 (기존 일정용)
  const handleToggle = (date: string, slot: string) => {
    if (!isEditing) return;
    const key = `${date}||${slot}`;
    setVotes(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // 💡 투표 토글 (관리자 특별 투표용)
  const handleAdminToggle = (option: string) => {
    if (!isEditing) return;
    setAdminVotes(prev => ({ ...prev, [option]: !prev[option] }));
  };

  // 💡 관리자 투표 마감/삭제 버튼 기능
  const handleDeleteAdminSession = async () => {
    if (!confirm("이 특별 투표를 마감(삭제)하시겠습니까? 현황판에서도 내려갑니다.")) return;
    
    // is_active를 false로 바꿔서 안 보이게 처리 (데이터는 보존)
    await supabase.from('match_sessions').update({ is_active: false }).eq('id', adminSession.id);
    
    // 메인 공지도 리셋 (선택사항)
    await supabase.from('notices').update({ content: "📢 이번 주 투표가 마감되었습니다." }).eq('id', 1);
    
    setAdminSession(null);
    alert("투표가 마감되었습니다.");
  };

  // 💡 DB에 저장
  const handleSave = async () => {
    setLoading(true);
    try {
      // 1. 내 투표 기록 싹 지우기
      await supabase.from('votes').delete().eq('member_id', user.id);

      const insertData: any[] = [];

      // 2. 기존 일정 투표 추가
      Object.entries(votes).filter(([_, checked]) => checked).forEach(([key, _]) => {
        const [match_date, match_time] = key.split('||');
        insertData.push({ member_id: user.id, match_date, match_time });
      });

      // 3. 관리자 특별 투표 추가
      if (adminSession) {
        Object.entries(adminVotes).filter(([_, checked]) => checked).forEach(([option, _]) => {
          insertData.push({ 
            member_id: user.id, 
            session_id: adminSession.id, 
            match_date: option, 
            match_time: '-' // 시간대가 없는 자유 항목이므로 '-' 로 통일
          });
        });
      }

      // 4. 새 데이터 넣기
      if (insertData.length > 0) {
        const { error } = await supabase.from('votes').insert(insertData);
        if (error) throw error;
      }

      alert("투표가 안전하게 저장되었습니다! ⚽");
      setIsEditing(false);
    } catch (error) {
      console.error(error);
      alert("저장 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  if (!isLoaded) return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <Loader2 className="w-8 h-8 text-[#2d6cef] animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans pb-32">
      <header className="sticky top-0 z-50 bg-white border-b border-slate-100 p-3 flex items-center justify-between shadow-sm">
        <Link href="/" className="p-2 hover:bg-slate-50 rounded-full transition">
          <ChevronLeft className="w-6 h-6 text-slate-800" />
        </Link>
        <h1 className="text-lg font-black tracking-tighter italic text-[#0f172a]">MATCH VOTE</h1>
        <div className="w-10"></div>
      </header>

      <main className="max-w-md mx-auto p-4 space-y-8">
        <section className="bg-[#1e293b] p-4 rounded-xl shadow-lg text-white mt-2 relative overflow-hidden">
          <div className="relative z-10 text-center">
            <h2 className="text-lg font-black tracking-tight italic">
              {user?.name}님, <span className="text-[#2d6cef]">참가 여부를 체크</span>해주세요
            </h2>
          </div>
        </section>

        {/* ⭐ [NEW] 관리자 특별 투표가 있으면 맨 위에 가장 먼저 노출! */}
        {adminSession && (
          <section className="bg-blue-50 border-2 border-blue-200 p-5 rounded-2xl shadow-sm relative animate-in fade-in slide-in-from-top-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Star className="w-5 h-5 text-[#2d6cef] fill-[#2d6cef]" />
                <h3 className="text-xl font-black text-[#1e293b]">{adminSession.title}</h3>
              </div>
              {/* 회장님(관리자)에게만 보이는 삭제 버튼 */}
              {user?.role === 'admin' && (
                <button onClick={handleDeleteAdminSession} className="p-2 bg-white rounded-lg shadow-sm text-red-500 border border-red-100 active:scale-90 transition">
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>

            {adminSession.content && (
              <div className="bg-white/60 p-3 rounded-xl mb-4 text-sm font-bold text-slate-600 flex items-start gap-2">
                <FileText className="w-4 h-4 mt-0.5 text-[#2d6cef] shrink-0" />
                <p className="whitespace-pre-wrap">{adminSession.content}</p>
              </div>
            )}

            <div className="grid gap-2">
              {/* 저장된 옵션(콤마 구분)들을 버튼으로 뿌려줌 */}
              {adminSession.match_date.split(',').map((option: string) => option.trim()).filter(Boolean).map((option: string, idx: number) => {
                const isSelected = adminVotes[option];
                return (
                  <button
                    key={idx}
                    onClick={() => handleAdminToggle(option)}
                    disabled={!isEditing || loading}
                    className={`
                      relative overflow-hidden rounded-xl py-3.5 px-4 text-left transition-all duration-200 border-2
                      ${isSelected ? 'bg-[#2d6cef] border-[#2d6cef] shadow-md' : 'bg-white border-blue-100 shadow-sm'}
                      ${!isEditing && 'opacity-80 cursor-default'}
                    `}
                  >
                    <div className="flex justify-between items-center relative z-10">
                      <p className={`text-base font-black tracking-tight ${isSelected ? 'text-white' : 'text-slate-700'}`}>
                        {option}
                      </p>
                      <div className={`
                        w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all duration-300
                        ${isSelected ? 'bg-white border-white' : 'bg-transparent border-slate-200'}
                      `}>
                        {isSelected && <Check className="w-4 h-4 text-[#2d6cef]" strokeWidth={4} />}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
            <p className="text-[10px] font-bold text-blue-400 mt-4 text-center">* 위 투표는 특별 공지입니다. 완료 후 하단의 저장하기를 꼭 눌러주세요!</p>
          </section>
        )}

        {/* 📅 기존 4주차 고정 일정 (건드리지 않고 100% 유지) */}
        {schedules.map((week, weekIndex) => (
          <div key={weekIndex} className="space-y-8">
            {[ 
              { date: week.sat, color: 'text-blue-600' }, 
              { date: week.sun, color: 'text-red-600' } 
            ].map((day) => (
              <div key={day.date} className="space-y-3 px-1">
                <h3 className={`text-2xl font-black tracking-tighter ${day.color}`}>
                  {day.date}
                </h3>

                <div className="grid gap-2">
                  {timeSlots.map((slot) => {
                    const isSelected = votes[`${day.date}||${slot}`]; // 안전한 키값 || 사용
                    return (
                      <button
                        key={slot}
                        onClick={() => handleToggle(day.date, slot)}
                        disabled={!isEditing || loading}
                        className={`
                          relative overflow-hidden rounded-xl py-3.5 px-4 text-left transition-all duration-200 border-2
                          ${isSelected ? 'bg-[#1e293b] border-[#2d6cef] shadow-md' : 'bg-white border-slate-100 shadow-sm'}
                          ${!isEditing && 'opacity-80 cursor-default'}
                        `}
                      >
                        <div className="flex justify-between items-center relative z-10">
                          <div className="flex items-center gap-3">
                            <Clock className={`w-4 h-4 ${isSelected ? 'text-[#2d6cef]' : 'text-slate-300'}`} />
                            <div>
                              <p className={`text-base font-bold tracking-tight ${isSelected ? 'text-white' : 'text-slate-700'}`}>
                                {slot}
                              </p>
                            </div>
                          </div>
                          
                          <div className={`
                            w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all duration-300
                            ${isSelected ? 'bg-[#2d6cef] border-[#2d6cef]' : 'bg-transparent border-slate-200'}
                          `}>
                            {isSelected && <Check className="w-4 h-4 text-white" strokeWidth={4} />}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        ))}
      </main>

      {/* 하단 저장 플로팅 버튼 (기존 동일) */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-white via-white to-transparent z-50">
        <div className="max-w-md mx-auto">
          {isEditing ? (
            <button 
              onClick={handleSave}
              disabled={loading}
              className="w-full py-4 bg-[#2d6cef] text-white rounded-xl font-black text-base shadow-xl flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50"
            >
              {loading ? <Loader2 className="animate-spin" /> : <><Save className="w-5 h-5" /> 저장하기</>}
            </button>
          ) : (
            <button 
              onClick={() => setIsEditing(true)}
              className="w-full py-4 bg-[#0f172a] text-white rounded-xl font-black text-base shadow-xl flex items-center justify-center gap-2 transition-all active:scale-95"
            >
              <Edit3 className="w-5 h-5 text-[#2d6cef]" /> 내 투표 수정하기
            </button>
          )}
        </div>
      </div>
    </div>
  );
}