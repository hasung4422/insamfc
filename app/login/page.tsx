"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Lock,
  User,
  ChevronRight,
  CheckCircle2,
  Loader2
} from "lucide-react";

export default function LoginPage() {
  const [id, setId] = useState("");
  const [pw, setPw] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (loading) return;

    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        credentials: "same-origin",
        body: JSON.stringify({
          id: id.trim(),
          pw
        })
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.error || "로그인에 실패했습니다."
        );
      }

      localStorage.setItem(
        "insam_user",
        JSON.stringify({
          id: result.user.id,
          name: result.user.name,
          role: result.user.role
        })
      );

      router.replace("/");
      router.refresh();

    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "로그인 처리 중 오류가 발생했습니다."
      );

    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      lang="ko"
      className="min-h-screen bg-white text-slate-900 font-sans flex flex-col justify-center p-6"
    >
      <div className="max-w-md mx-auto w-full space-y-12">

        {/* 상단 로고 */}
        <header className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-[#1e293b] rounded-[2.5rem] shadow-2xl mb-2">
            <CheckCircle2
              className="text-[#10b981] w-10 h-10"
              strokeWidth={3}
            />
          </div>

          <h1 className="text-4xl font-black italic tracking-tighter uppercase leading-none text-slate-900">
            INSAM{" "}
            <span className="text-[#2d6cef]">
              FC
            </span>
          </h1>

          <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em]">
            Club Management System
          </p>
        </header>

        {/* 로그인 양식 */}
        <form
          onSubmit={handleLogin}
          className="space-y-5"
        >

          {/* 아이디 */}
          <div className="space-y-2">
            <label
              htmlFor="login-id"
              className="text-[10px] font-black text-slate-400 uppercase ml-5 tracking-widest"
            >
              User ID
            </label>

            <div className="relative group">
              <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[#2d6cef] transition-colors">
                <User size={18} />
              </div>

              <input
                id="login-id"
                name="username"
                type="text"
                lang="ko"
                inputMode="text"
                autoComplete="username"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                placeholder="아이디를 입력하세요"
                value={id}
                onChange={(e) => setId(e.target.value)}
                className="w-full bg-slate-50 border-none rounded-[1.8rem] py-5 pl-14 pr-6 text-sm font-bold focus:ring-2 focus:ring-[#2d6cef]/20 transition-all outline-none"
                required
              />
            </div>
          </div>

          {/* 비밀번호 */}
          <div className="space-y-2">
            <label
              htmlFor="login-password"
              className="text-[10px] font-black text-slate-400 uppercase ml-5 tracking-widest"
            >
              Password
            </label>

            <div className="relative group">
              <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[#2d6cef] transition-colors">
                <Lock size={18} />
              </div>

              <input
                id="login-password"
                name="password"
                type="password"
                autoComplete="current-password"
                placeholder="비밀번호를 입력하세요"
                value={pw}
                onChange={(e) => setPw(e.target.value)}
                className="w-full bg-slate-50 border-none rounded-[1.8rem] py-5 pl-14 pr-6 text-sm font-bold focus:ring-2 focus:ring-[#2d6cef]/20 transition-all outline-none"
                required
              />
            </div>
          </div>

          {/* 오류 메시지 */}
          {error && (
            <div
              role="alert"
              className="bg-rose-50 text-rose-600 rounded-2xl p-4 text-xs font-bold text-center"
            >
              {error}
            </div>
          )}

          {/* 로그인 버튼 */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#1e293b] text-white py-5 rounded-[2rem] font-black text-base shadow-xl active:scale-[0.98] transition-all flex items-center justify-center gap-2 mt-6 disabled:opacity-50"
          >
            {loading ? (
              <Loader2
                className="animate-spin"
                size={20}
              />
            ) : (
              <>
                로그인하기
                <ChevronRight
                  size={20}
                  strokeWidth={3}
                />
              </>
            )}
          </button>
        </form>

        {/* 하단 */}
        <footer className="text-center pt-8">
          <p className="text-[10px] text-slate-300 font-bold uppercase tracking-wider">
            © 2026 INSAM FC. Team Management
          </p>
        </footer>

      </div>
    </div>
  );
}