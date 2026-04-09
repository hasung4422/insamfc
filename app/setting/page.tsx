"use client";

import { useState, useEffect } from 'react';
import { ChevronLeft, UserPlus, Trash2, Settings2, ShieldCheck, Key, User } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

// DB에서 가져올 멤버 데이터 타입
interface Member {
  id: string;
  name: string;
  login_id: string;
  password: string;
  points: number;
  can_login: boolean;
  role: string;
}

export default function SettingPage() {
  const router = useRouter();
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    async function initSettings() {
      // 1. 관리자 권한 체크
      const savedUser = localStorage.getItem('insam_user');
      if (!savedUser) {
        router.replace('/login');
        return;
      }

      const userData = JSON.parse(savedUser);
      if (userData.role !== 'admin') {
        alert("관리자만 접근 가능한 페이지입니다.");
        router.replace('/');
        return;
      }

      // 2. DB에서 진짜 멤버 명단 가져오기
      const { data, error } = await supabase
        .from('members')
        .select('*')
        .order('name', { ascending: true });

      if (!error && data) {
        setMembers(data);
      }
      
      setLoading(false);
      setIsLoaded(true);
    }

    initSettings();
  }, [router]);

  // 회원 삭제 함수 (실제로 작동하게 하려면 추가 로직 필요)
  const handleDelete = async (id: string, name: string) => {
    if (confirm(`${name} 멤버를 삭제하시겠습니까?`)) {
      const { error } = await supabase.from('members').delete().eq('id', id);
      if (!error) {
        setMembers(members.filter(m => m.id !== id));
      }
    }
  };

  if (!isLoaded || loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-slate-300 font-bold animate-pulse text-sm">보안 구역 확인 중...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans pb-20">
      {/* 1. 상단 헤더 */}
      <header className="sticky top-0 z-50 bg-white border-b border-slate-100 px-4 py-3 flex items-center justify-between shadow-sm">
        <Link href="/" className="flex items-center gap-1 -ml-1 p-2 active:scale-90 transition-all">
          <ChevronLeft className="w-6 h-6 text-slate-800" />
          <span className="text-xs font-bold text-slate-800">홈</span>
        </Link>
        <h1 className="text-sm font-black italic tracking-tighter absolute left-1/2 -translate-x-1/2 uppercase text-[#0f172a]">
          Admin Setting
        </h1>
        <div className="w-10"></div>
      </header>

      <main className="max-w-md mx-auto p-4 space-y-6">
        {/* 2. 관리 대시보드 요약 */}
        <section className="bg-[#1e293b] p-6 rounded-[2rem] shadow-xl text-white relative overflow-hidden">
          <div className="relative z-10 flex justify-between items-center">
            <div>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Security Level: Admin</p>
              <h2 className="text-2xl font-black italic flex items-center gap-2">멤버 관리 ⚙️</h2>
            </div>
            <div className="text-right">
              <p className="text-2xl font-black text-[#10b981]">{members.length}</p>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Registered Players</p>
            </div>
          </div>
          <ShieldCheck className="absolute right-[-10px] bottom-[-10px] w-24 h-24 text-white/5 -rotate-12" />
        </section>

        {/* 3. 회원 추가 버튼 영역 */}
        <div className="px-1 flex justify-between items-center">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
            <Settings2 className="w-3.5 h-3.5" /> 3열 그리드 명단 (ID/PW)
          </h3>
          <button className="flex items-center gap-1 text-[#2d6cef] font-black text-xs bg-blue-50 px-3 py-1.5 rounded-full active:scale-95 transition-all">
            <UserPlus className="w-3.5 h-3.5" /> 추가
          </button>
        </div>

        {/* 4. ⭐ 진짜 데이터가 들어가는 3열 그리드 */}
        <section className="grid grid-cols-3 gap-3">
          {members.map((member, idx) => (
            <div 
              key={member.id} 
              className="relative bg-slate-50 rounded-2xl border border-slate-100 p-3 flex flex-col items-center justify-center group active:scale-95 transition-all min-h-[120px]"
            >
              {/* 삭제 버튼 (상단 우측) */}
              <button 
                onClick={() => handleDelete(member.id, member.name)}
                className="absolute top-2 right-2 text-slate-200 hover:text-red-500 transition-colors"
              >
                <Trash2 className="w-3 h-3" />
              </button>
              
              {/* 번호 표시 */}
              <div className="absolute top-2 left-2">
                <span className="text-[8px] font-black text-slate-300">{idx + 1}</span>
              </div>
              
              {/* 이름 (실명) */}
              <span className="text-sm font-black text-slate-800 tracking-tighter mb-2 mt-2">
                {member.name}
              </span>

              {/* ID / PW 정보 (작게 표시) */}
              <div className="w-full space-y-1 mt-1 border-t border-slate-100 pt-2">
                <div className="flex items-center gap-1 justify-center">
                  <User className="w-2 h-2 text-slate-400" />
                  <span className="text-[9px] font-bold text-slate-500 truncate max-w-[50px]">{member.login_id || 'N/A'}</span>
                </div>
                <div className="flex items-center gap-1 justify-center">
                  <Key className="w-2 h-2 text-amber-400" />
                  <span className="text-[9px] font-bold text-slate-400">{member.password || '****'}</span>
                </div>
              </div>

              {/* 로그인 권한 상태 표시 점 */}
              <div className={`absolute bottom-2 right-2 w-1.5 h-1.5 rounded-full ${member.can_login ? 'bg-emerald-500' : 'bg-slate-200'}`} />
            </div>
          ))}
        </section>
      </main>
    </div>
  );
}