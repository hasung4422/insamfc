import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createHmac } from "node:crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const secret = process.env.SUPABASE_SECRET_KEY;

    if (!url || !secret) {
      return NextResponse.json(
        { error: "서버 환경변수 설정 오류" },
        { status: 500 }
      );
    }

    const { id, pw } = await request.json();

    if (
      typeof id !== "string" ||
      typeof pw !== "string" ||
      !id.trim() ||
      !pw
    ) {
      return NextResponse.json(
        { error: "아이디와 비밀번호를 입력하세요." },
        { status: 400 }
      );
    }

    const supabase = createClient(url, secret, {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      }
    });

    const { data: member, error } = await supabase
      .from("members")
      .select("id, name, role")
      .eq("login_id", id.trim())
      .eq("password", pw)
      .eq("can_login", true)
      .single();

    if (error || !member) {
      return NextResponse.json(
        { error: "아이디 또는 비밀번호가 틀렸습니다." },
        { status: 401 }
      );
    }

    const user = {
      id: member.id,
      name: member.name,
      role: member.role
    };

    const maxAge = 60 * 60 * 24;

    const payload = Buffer.from(
      JSON.stringify({
        id: member.id,
        exp: Math.floor(Date.now() / 1000) + maxAge
      })
    ).toString("base64url");

    const signingKey = createHmac("sha256", secret)
      .update("insam-accounting-session-v1")
      .digest();

    const signature = createHmac("sha256", signingKey)
      .update(payload)
      .digest("base64url");

    const response = NextResponse.json({
      success: true,
      user
    });

    response.cookies.set(
      "insam_session",
      `${payload}.${signature}`,
      {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge
      }
    );

    return response;

  } catch (error) {
    console.error("Login API error:", error);

    return NextResponse.json(
      { error: "로그인 처리 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
