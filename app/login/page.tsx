"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, User, ChevronRight, CheckCircle2, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase'; // 💡 수퍼베이스 불러오기

export default function LoginPage() {
  const [id, setId] = useState('');
  const [pw, setPw] = useState('');
  const [loading, setLoading] = useState(false); // 💡 로딩 상태 추가
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 💡 1. DB에서 아이디, 비번, 로그인 권한이 있는지 확인
      const { data: member, error } = await supabase
        .from('members')
        .select('*')
        .eq('login_id', id)
        .eq('password', pw)
        .eq('can_login', true)
        .single();

      if (error || !member) {
        alert("아이디 또는 비밀번호가 틀렸거나, 접속 권한이 없습니다.");
      } else {
        // 💡 2. [중요] 브라우저에 '이름표'를 달아줍니다. 이게 없으면 메인에서 쫓겨나요!
        localStorage.setItem('insam_user', JSON.stringify({
          id: member.id,
          name: member.name,
          role: member.role
        }));

        // 💡 3. 이제 당당하게 메인으로 입장!
        router.replace('/');
      }
    } catch (err) {
      console.error(err);
      alert("로그인 처리 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans flex flex-col justify-center p-6">
      <div className="max-w-md mx-auto w-full space-y-12">
        
        {/* 1. 상단 로고 영역 */}
        <header className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-[#1e293b] rounded-[2.5rem] shadow-2xl mb-2">
            <CheckCircle2 className="text-[#10b981] w-10 h-10" strokeWidth={3} />
          </div>
          <h1 className="text-4xl font-black italic tracking-tighter uppercase leading-none text-slate-900">
            INSAM <span className="text-[#2d6cef]">FC</span>
          </h1>
          <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em]">
            Club Management System
          </p>
        </header>

        {/* 2. 로그인 폼 */}
        <form onSubmit={handleLogin} className="space-y-5">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase ml-5 tracking-widest">
              User ID
            </label>
            <div className="relative group">
              <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[#2d6cef] transition-colors">
                <User size={18} />
              </div>
              <input
                type="text"
                placeholder="아이디를 입력하세요"
                value={id}
                onChange={(e) => setId(e.target.value)}
                className="w-full bg-slate-50 border-none rounded-[1.8rem] py-5 pl-14 pr-6 text-sm font-bold focus:ring-2 focus:ring-[#2d6cef]/20 transition-all outline-none"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase ml-5 tracking-widest">
              Password
            </label>
            <div className="relative group">
              <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[#2d6cef] transition-colors">
                <Lock size={18} />
              </div>
              <input
                type="password"
                placeholder="비밀번호를 입력하세요"
                value={pw}
                onChange={(e) => setPw(e.target.value)}
                className="w-full bg-slate-50 border-none rounded-[1.8rem] py-5 pl-14 pr-6 text-sm font-bold focus:ring-2 focus:ring-[#2d6cef]/20 transition-all outline-none"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#1e293b] text-white py-5 rounded-[2rem] font-black text-base shadow-xl active:scale-[0.98] transition-all flex items-center justify-center gap-2 mt-6"
          >
            {loading ? (
              <Loader2 className="animate-spin" size={20} />
            ) : (
              <>
                로그인하기
                <ChevronRight size={20} strokeWidth={3} />
              </>
            )}
          </button>
        </form>

        {/* 3. 하단 저작권 표시 */}
        <footer className="text-center pt-8">
          <p className="text-[10px] text-slate-300 font-bold uppercase tracking-wider">
            © 2026 INSAM FC. Team Management
          </p>
        </footer>
      </div>
    </div>
  );
}