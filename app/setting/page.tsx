"use client";

import { useState, useEffect } from 'react';
import { ChevronLeft, UserPlus, Trash2, Settings2, ShieldCheck, Key, User, ShieldAlert } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

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
  const [myId, setMyId] = useState("");

  useEffect(() => {
    async function initSettings() {
      const savedUser = localStorage.getItem('insam_user');
      if (!savedUser) {
        router.replace('/login');
        return;
      }

      const userData = JSON.parse(savedUser);
      setMyId(userData.id);

      if (userData.role !== 'admin') {
        alert("관리자만 접근 가능한 페이지입니다.");
        router.replace('/');
        return;
      }

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

  // 💡 권한 변경 함수 (관리자 <-> 일반 유저)
  const toggleAdminRole = async (memberId: string, currentRole: string, name: string) => {
    // 본인 권한을 스스로 해제하는 것 방지
    if (memberId === myId) {
      alert("본인의 관리자 권한은 스스로 해제할 수 없습니다.");
      return;
    }

    const newRole = currentRole === 'admin' ? 'user' : 'admin';
    const confirmMsg = newRole === 'admin' 
      ? `[${name}] 님에게 관리자 권한을 부여하시겠습니까?` 
      : `[${name}] 님의 관리자 권한을 해제하시겠습니까?`;

    if (confirm(confirmMsg)) {
      const { error } = await supabase
        .from('members')
        .update({ role: newRole })
        .eq('id', memberId);

      if (!error) {
        setMembers(members.map(m => m.id === memberId ? { ...m, role: newRole } : m));
        alert("권한이 정상적으로 변경되었습니다.");
      } else {
        alert("권한 변경 중 오류 발생");
      }
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (id === myId) {
      alert("본인 계정은 삭제할 수 없습니다.");
      return;
    }
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
        <section className="bg-[#1e293b] p-6 rounded-[2rem] shadow-xl text-white relative overflow-hidden border-b-8 border-slate-800">
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

        <div className="px-1 flex justify-between items-center">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
            <Settings2 className="w-3.5 h-3.5" /> 3열 그리드 명단 (ID/PW)
          </h3>
          <button className="flex items-center gap-1 text-[#2d6cef] font-black text-xs bg-blue-50 px-3 py-1.5 rounded-full active:scale-95 transition-all">
            <UserPlus className="w-3.5 h-3.5" /> 추가
          </button>
        </div>

        <section className="grid grid-cols-3 gap-3">
          {members.map((member, idx) => (
            <div 
              key={member.id} 
              className={`relative rounded-2xl border p-3 flex flex-col items-center justify-center transition-all min-h-[130px] ${
                member.role === 'admin' ? 'bg-blue-50 border-blue-100 shadow-sm' : 'bg-slate-50 border-slate-100'
              }`}
            >
              {/* 삭제 버튼 */}
              <button 
                onClick={() => handleDelete(member.id, member.name)}
                className="absolute top-2 right-2 text-slate-300 hover:text-red-500 transition-colors"
              >
                <Trash2 className="w-3 h-3" />
              </button>
              
              {/* 💡 관리자 부여/해제 버튼 (방패 아이콘) */}
              <button 
                onClick={() => toggleAdminRole(member.id, member.role, member.name)}
                className={`absolute top-2 left-2 transition-all active:scale-90 ${
                  member.role === 'admin' ? 'text-[#2d6cef]' : 'text-slate-200'
                }`}
              >
                {member.role === 'admin' ? <ShieldCheck className="w-3.5 h-3.5" /> : <ShieldAlert className="w-3.5 h-3.5" />}
              </button>
              
              {/* 이름 (실명) */}
              <span className={`text-sm font-black tracking-tighter mb-2 mt-4 ${
                member.role === 'admin' ? 'text-[#2d6cef]' : 'text-slate-800'
              }`}>
                {member.name}
              </span>

              {/* ID / PW 정보 */}
              <div className="w-full space-y-1 mt-1 border-t border-slate-100 pt-2 opacity-60">
                <div className="flex items-center gap-1 justify-center">
                  <User className="w-2 h-2 text-slate-400" />
                  <span className="text-[8px] font-bold text-slate-500 truncate max-w-[50px]">{member.login_id}</span>
                </div>
                <div className="flex items-center gap-1 justify-center">
                  <Key className="w-2 h-2 text-amber-400" />
                  <span className="text-[8px] font-bold text-slate-400">{member.password}</span>
                </div>
              </div>

              {/* 관리자 뱃지 표시 */}
              {member.role === 'admin' && (
                <div className="absolute -top-1 -right-1">
                   <div className="bg-[#2d6cef] text-white text-[6px] font-black px-1.5 py-0.5 rounded-full uppercase shadow-sm">Admin</div>
                </div>
              )}
            </div>
          ))}
        </section>
      </main>
    </div>
  );
}