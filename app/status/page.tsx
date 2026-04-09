"use client";

import { useState, useEffect } from 'react';
import { ChevronLeft, Clock, Trophy, TrendingUp, Loader2, Star, Users } from 'lucide-react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

// 📅 기존 4주치 고정 일정 (디자인 유지)
const FIXED_DATES = [
  { weekTitle: "4월 2주차 현황", days: [{ date: "4월 11일 (토)", isSat: true }, { date: "4월 12일 (일)", isSat: false }] },
  { weekTitle: "4월 3주차 현황", days: [{ date: "4월 18일 (토)", isSat: true }, { date: "4월 19일 (일)", isSat: false }] },
  { weekTitle: "4월 4주차 현황", days: [{ date: "4월 25일 (토)", isSat: true }, { date: "4월 26일 (일)", isSat: false }] },
  { weekTitle: "5월 1주차 현황", days: [{ date: "5월 02일 (토)", isSat: true }, { date: "5월 03일 (일)", isSat: false }] }
];

const TIMES = ["08:00 ~ 10:00", "10:00 ~ 12:00", "12:00 ~ 14:00"];

export default function StatusPage() {
  const [isLoaded, setIsLoaded] = useState(false);
  const [voteData, setVoteData] = useState<any[]>([]);
  const [adminSession, setAdminSession] = useState<any>(null);

  useEffect(() => {
    async function fetchData() {
      // 1. 💡 관리자가 생성한 활성 투표 게시판 정보 가져오기
      const { data: session } = await supabase
        .from('match_sessions')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      
      if (session) setAdminSession(session);

      // 2. 투표 데이터 전체 가져오기 (멤버 이름 포함)
      const { data: votes, error } = await supabase
        .from('votes')
        .select('session_id, match_date, match_time, members ( name )');

      if (!error && votes) setVoteData(votes);
      setIsLoaded(true);
    }
    fetchData();
  }, []);

  if (!isLoaded) return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <Loader2 className="w-8 h-8 text-[#2d6cef] animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans pb-20">
      <header className="sticky top-0 z-50 bg-[#1e293b] text-white px-4 py-3 flex items-center justify-between shadow-md">
        <Link href="/" className="flex items-center gap-1 p-1 active:scale-90 transition-all">
          <ChevronLeft className="w-6 h-6 text-white" />
        </Link>
        <h1 className="text-lg font-black italic tracking-tighter absolute left-1/2 -translate-x-1/2 uppercase">Match Status</h1>
        <div className="w-10"></div>
      </header>

      <main className="max-w-md mx-auto p-3 space-y-12 mt-2">
        
        {/* ⭐ [특별 투표 현황] 활성화된 세션이 있을 때만 노출 */}
        {adminSession && (
          <div className="space-y-4 animate-in fade-in slide-in-from-top-4 duration-700">
            <div className="bg-[#2d6cef] text-white py-4 px-5 rounded-[2rem] shadow-lg relative overflow-hidden ring-4 ring-blue-100">
               <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-1">
                    <Star className="w-4 h-4 fill-white text-white" />
                    <span className="text-[10px] font-black uppercase tracking-widest opacity-80">Special Vote Status</span>
                  </div>
                  <h2 className="text-xl font-black tracking-tight uppercase">{adminSession.title}</h2>
               </div>
               <Users className="absolute right-[-10px] bottom-[-10px] w-24 h-24 text-white/10 rotate-12" />
            </div>

            <div className="grid gap-3 px-1">
              {[...adminSession.match_date?.split(',').map((option: string) => option.trim()).filter(Boolean), '미참석'].map((option: string, idx: number) => {
                const membersInOption = voteData
                  .filter(v => v.session_id === adminSession.id && v.match_date === option)
                  .map(v => v.members?.name)
                  .filter(Boolean);
                
                const count = membersInOption.length;
                const isNoShow = option === '미참석';

                return (
                  <div key={idx} className={`bg-white rounded-2xl border-2 shadow-sm overflow-hidden ${isNoShow ? 'border-red-100' : 'border-blue-50'}`}>
                    <div className="p-4">
                      <div className="flex justify-between items-center mb-3">
                        <span className={`text-sm font-black ${isNoShow ? 'text-red-500' : 'text-slate-700'}`}>{option}</span>
                        <div className="flex items-baseline gap-0.5">
                          <span className={`text-xl font-black ${isNoShow ? 'text-red-500' : 'text-[#2d6cef]'}`}>{count}</span>
                          <span className="text-[10px] font-bold text-slate-400">명</span>
                        </div>
                      </div>
                      
                      <div className="flex flex-wrap gap-1.5">
                        {membersInOption.length > 0 ? (
                          membersInOption.map((name, nIdx) => (
                            <span key={nIdx} className={`text-[11px] font-bold px-3 py-1.5 rounded-lg border ${isNoShow ? 'bg-red-50 text-red-500 border-red-100' : 'bg-blue-50 text-[#2d6cef] border-blue-100'}`}>
                              {name}
                            </span>
                          ))
                        ) : (
                          <span className="text-[11px] text-slate-300 italic px-1">투표 인원 없음</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="h-px bg-slate-200 mx-6 my-4"></div>
          </div>
        )}

        {/* 📅 기존 4주차 현황 (원본 그대로 유지) */}
        {FIXED_DATES.map((week, wIdx) => {
          // 💡 [핵심 변경] "이번 주말(토, 일)" 전체를 통틀어서 가장 높은 득표수를 여기서 미리 구합니다!
          const weekMaxCount = Math.max(
            0,
            ...week.days.flatMap(day => 
              TIMES.map(time => 
                voteData.filter(v => !v.session_id && v.match_date === day.date && v.match_time === time).length
              )
            )
          );

          return (
            <div key={wIdx} className="space-y-4">
              <div className="bg-[#1e293b] text-white py-2 px-4 rounded-xl shadow-sm flex justify-between items-center">
                <h2 className="text-base font-black tracking-tight">{week.weekTitle}</h2>
                <TrendingUp className="w-4 h-4 text-[#10b981]" />
              </div>

              <div className="space-y-8">
                {week.days.map((day, dIdx) => {
                  const dayVotes = voteData.filter(v => !v.session_id && v.match_date === day.date);
                  
                  return (
                    <div key={dIdx} className="space-y-3 px-1">
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-black px-2 py-0.5 rounded-md ${day.isSat ? 'bg-blue-600' : 'bg-red-600'} text-white shadow-sm`}>
                          {day.isSat ? '토요일' : '일요일'}
                        </span>
                        <span className="text-base font-black text-slate-800">{day.date}</span>
                      </div>

                      <div className="grid gap-3">
                        {[...TIMES, '미참석'].map((time, sIdx) => {
                          const membersInSlot = dayVotes
                            .filter(v => v.match_time === time)
                            .map(v => v.members?.name)
                            .filter(Boolean);
                          
                          const count = membersInSlot.length;
                          const isNoShow = time === '미참석';
                          
                          // 💡 [검사 로직] 미참석이 아니고, 1명 이상이며, "주말 전체 최고 득표수(weekMaxCount)"와 같을 때만 유력 표시!
                          const isLikely = !isNoShow && count > 0 && count === weekMaxCount;

                          return (
                            <div 
                              key={sIdx} 
                              className={`rounded-2xl border-2 transition-all duration-300 relative overflow-hidden ${
                                isLikely 
                                  ? 'bg-gradient-to-br from-[#0f172a] to-[#1e293b] border-blue-500/50 shadow-xl shadow-blue-900/20 scale-[1.02] z-10' 
                                  : isNoShow 
                                    ? 'bg-white border-red-100 shadow-sm' 
                                    : 'bg-white border-slate-100 shadow-sm'
                              }`}
                            >
                              {isLikely && <div className="absolute -top-10 -right-10 w-32 h-32 bg-blue-500/20 blur-3xl rounded-full pointer-events-none"></div>}

                              <div className="p-4 relative z-10">
                                <div className="flex justify-between items-center mb-3">
                                  <div className="flex items-center gap-2">
                                    <Clock className={`w-4 h-4 ${isLikely ? 'text-blue-400' : isNoShow ? 'text-red-400' : 'text-slate-300'}`} />
                                    <span className={`text-sm font-black ${isLikely ? 'text-white' : isNoShow ? 'text-red-500' : 'text-slate-500'}`}>{time}</span>
                                    {isLikely && (
                                      <span className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white text-[10px] px-2.5 py-0.5 rounded-full font-black flex items-center gap-1 shadow-md animate-pulse border border-blue-400/30">
                                        <Trophy className="w-3 h-3" /> 매치유력
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex items-baseline gap-0.5">
                                    <span className={`text-xl font-black ${isLikely ? 'text-white' : isNoShow ? 'text-red-500' : 'text-slate-800'}`}>{count}</span>
                                    <span className={`text-xs font-bold uppercase ${isLikely ? 'text-blue-300' : 'text-slate-400'}`}>명</span>
                                  </div>
                                </div>

                                <div className={`w-full h-2 rounded-full overflow-hidden mb-4 ${isLikely ? 'bg-slate-700/50' : 'bg-slate-100'}`}>
                                  <div 
                                    className={`h-full rounded-full transition-all duration-1000 ${
                                      isLikely 
                                        ? 'bg-gradient-to-r from-blue-400 to-indigo-400 shadow-[0_0_10px_rgba(96,165,250,0.5)]' 
                                        : isNoShow 
                                          ? 'bg-red-400 opacity-60' 
                                          : 'bg-[#2d6cef] opacity-40'
                                    }`}
                                    style={{ width: `${Math.min(100, (count / 20) * 100)}%` }}
                                  />
                                </div>

                                <div className="flex flex-wrap gap-2">
                                  {membersInSlot.length > 0 ? (
                                    membersInSlot.map((name, nIdx) => (
                                      <span 
                                        key={nIdx} 
                                        className={`text-xs font-bold px-3 py-1.5 rounded-lg border shadow-sm transition-all ${
                                          isLikely 
                                            ? 'bg-white/10 text-white border-white/20 backdrop-blur-md' 
                                            : isNoShow 
                                              ? 'bg-red-50 text-red-600 border-red-100' 
                                              : 'bg-slate-50 text-slate-800 border-slate-200'
                                        }`}
                                      >
                                        {name}
                                      </span>
                                    ))
                                  ) : (
                                    <span className={`text-xs italic ${isLikely ? 'text-slate-400' : 'text-slate-300'}`}>참가자 없음</span>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </main>
    </div>
  );
}