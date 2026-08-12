"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
      <div className="bg-white p-8 rounded-3xl shadow-xl w-full max-w-sm border-2 border-red-500">
        <div className="text-4xl mb-4">🚨</div>
        <h2 className="text-xl font-black text-slate-800 mb-2">에러 발생!</h2>
        <p className="text-xs text-red-500 bg-red-50 p-3 rounded-xl mb-6 text-left break-words">
          {error.message || "알 수 없는 에러입니다."}
        </p>
        <button
          onClick={() => reset()}
          className="w-full bg-[#1e293b] text-white py-3 rounded-xl font-bold"
        >
          새로고침
        </button>
      </div>
    </div>
  );
}