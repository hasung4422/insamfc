import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 💡 터미널이 알려준 대로 experimental 밖으로 꺼냈습니다.
  serverExternalPackages: ["@supabase/supabase-js"],
  
  // 보안 및 외부 접속 허용 설정
  async headers() {
    return [
      {
        source: "/_next/:path*",
        headers: [
          { key: "Access-Control-Allow-Origin", value: "*" },
        ],
      },
    ];
  },
};

export default nextConfig;