import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createHmac, createHash, timingSafeEqual } from "node:crypto";
import ExcelJS from "exceljs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const COOKIE = "insam_session";
const CATEGORIES = [
  "정기회비", "정기지출", "번개입금", "번개지출",
  "번개회식입금", "번개회식지출", "여행입금",
  "여행지출", "여행입금2", "여행지출2", "기타"
];

function db() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) throw new Error("서버 환경변수 확인 필요");
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false }
  });
}

function equal(a: string, b: string) {
  return timingSafeEqual(
    createHash("sha256").update(a).digest(),
    createHash("sha256").update(b).digest()
  );
}

function sign(value: string) {
  const secret = process.env.SUPABASE_SECRET_KEY;

  if (!secret) {
    throw new Error("Server configuration error");
  }

  const signingKey = createHmac("sha256", secret)
    .update("insam-accounting-session-v1")
    .digest();

  return createHmac("sha256", signingKey)
    .update(value)
    .digest("base64url");
}

async function session(req: NextRequest) {
  try {
    const token = req.cookies.get(COOKIE)?.value;

    if (!token) return null;

    const parts = token.split(".");

    if (parts.length !== 2) return null;

    const [payload, signature] = parts;

    if (
      !payload ||
      !signature ||
      !equal(sign(payload), signature)
    ) {
      return null;
    }

    const data = JSON.parse(
      Buffer.from(payload, "base64url").toString("utf8")
    );

    if (
      typeof data.id !== "string" ||
      !Number.isSafeInteger(data.exp) ||
      data.exp <= Math.floor(Date.now() / 1000)
    ) {
      return null;
    }

    const { data: member, error } = await db()
      .from("members")
      .select("id,name,role,can_login")
      .eq("id", data.id)
      .maybeSingle();

    if (error || !member?.can_login) {
      return null;
    }

    return {
      id: member.id,
      name: member.name,
      admin: member.role === "admin"
    };

  } catch {
    return null;
  }
}

function json(data: unknown, status = 200) {
  return NextResponse.json(data, {
    status,
    headers: { "Cache-Control": "no-store" }
  });
}

function value(cell: ExcelJS.Cell): unknown {
  const v = cell.value;

  if (v && typeof v === "object" && !(v instanceof Date)) {
    const o = v as unknown as Record<string, unknown>;

    if ("formula" in o || "sharedFormula" in o) {
      if (o.result === undefined || o.result === null) {
        throw new Error(`${cell.address}: 수식 계산 후 저장 필요`);
      }

      if (typeof o.result === "object") {
        throw new Error(`${cell.address}: 수식 오류 확인 필요`);
      }

      return o.result;
    }

    if ("error" in o) {
      throw new Error(`${cell.address}: 엑셀 오류`);
    }

    if ("text" in o) return o.text;

    if (Array.isArray(o.richText)) {
      return o.richText.map(
        (x: { text: string }) => x.text
      ).join("");
    }
  }

  return v;
}

function str(v: unknown) {
  return v === null || v === undefined ? "" : String(v).trim();
}

function money(v: unknown) {
  const s = str(v).replace(/[,원\s]/g, "").replace(/−/g, "-");

  if (!s || !/^[+-]?\d+$/.test(s)) {
    throw new Error("금액 형식 오류: " + str(v));
  }

  const n = Number(s);
  if (!Number.isSafeInteger(n)) throw new Error("금액 범위 오류");
  return n;
}

function month(v: unknown) {
  if (v instanceof Date) {
    return v.toISOString().slice(0, 7);
  }

  const s = str(v);
  const m = s.match(/^(\d{2}|\d{4})[.\-/\s]?(\d{2})$/);

  if (!m) return "";

  const year = m[1].length === 2 ? "20" + m[1] : m[1];
  const num = Number(m[2]);

  if (num < 1 || num > 12) return "";
  return `${year}-${m[2]}`;
}

function date(v: unknown) {
  if (v instanceof Date) {
    return v.toISOString().slice(0, 19).replace("T", " ");
  }

  const s = str(v).replace(/\./g, "-");

  if (!/^\d{4}-\d{2}-\d{2}/.test(s)) {
    throw new Error("거래 날짜 형식 확인: " + s);
  }

  return s;
}

async function parseWorkbook(file: File) {
  if (!file.name.toLowerCase().endsWith(".xlsx")) {
    throw new Error("xlsx 파일만 업로드 가능합니다.");
  }

  if (file.size > 3500000) {
    throw new Error("파일 용량이 너무 큽니다.");
  }

  const wb = new ExcelJS.Workbook();

  await wb.xlsx.load(
    Buffer.from(await file.arrayBuffer()) as unknown as
    Parameters<typeof wb.xlsx.load>[0]
  );

  const ledger = wb.getWorksheet("거래원장");
  const duesSheet = wb.getWorksheet("정기회비");

  if (!ledger || !duesSheet) {
    throw new Error("거래원장 또는 정기회비 시트가 없습니다.");
  }

  const transactions: { row: number; date: string; category: string; name: string; detail: string; event: string; amount: number; month: string; }[] = [];
  const warnings: string[] = [];

  let balance = 0;

  for (let r = 4; r <= ledger.rowCount; r++) {
    const row = ledger.getRow(r);
    const rawDate = row.getCell(1).value;

    if (rawDate === null || rawDate === undefined || rawDate === "") {
      continue;
    }

    const category = str(value(row.getCell(8)));
    const name = str(value(row.getCell(9)));

    if (!CATEGORIES.includes(category)) {
      throw new Error(`거래원장 ${r}행 계정과목 확인 필요`);
    }

    if (category === "정기회비" && !name) {
      throw new Error(`거래원장 ${r}행 회원명 누락`);
    }

    const amount = money(value(row.getCell(14)));
    balance = money(value(row.getCell(4)));

    const paymentMonth = category === "정기회비"
      ? month(value(row.getCell(12))) ||
        month(value(row.getCell(15)))
      : "";

    const status = str(value(row.getCell(16)));

    if (status.includes("확인 필요")) {
      warnings.push(`${r}행: ${name} ${category}`);
    }

    transactions.push({
      row: r,
      date: date(value(row.getCell(1))),
      category,
      name,
      detail: str(value(row.getCell(10))),
      event: str(value(row.getCell(11))),
      amount,
      month: paymentMonth
    });
  }

  if (!transactions.length) {
    throw new Error("거래내역이 없습니다.");
  }

  const total = transactions.reduce((s, t) => s + t.amount, 0);

  if (total !== balance) {
    throw new Error(`장부와 은행 잔액 차이: ${total - balance}원`);
  }

  const monthColumns: { col: number; month: string }[] = [];

  duesSheet.getRow(3).eachCell((cell, col) => {
    if (col < 2) return;
    const m = month(value(cell));
    if (m) monthColumns.push({ col, month: m });
  });

  if (!monthColumns.length) {
    throw new Error("정기회비 시트의 월 제목을 확인하세요.");
  }

  const dues = [];
  const seen = new Set<string>();

  for (let r = 4; r <= duesSheet.rowCount; r++) {
    const row = duesSheet.getRow(r);
    const name = str(value(row.getCell(1)));

    if (!name || /^(합계|총합계|총계|소계|계)$/.test(name)) {
      continue;
    }

    if (seen.has(name)) {
      throw new Error("정기회비 시트 회원명 중복: " + name);
    }
    seen.add(name);

    const payments: Record<string, number> = {};

    for (const item of monthColumns) {
      const cell = row.getCell(item.col);
const raw = cell.value;

const emptyFormula =
  raw !== null &&
  typeof raw === "object" &&
  ("formula" in raw || "sharedFormula" in raw) &&
  (raw.result === undefined || raw.result === null);

if (emptyFormula) {
  const warning = "정기회비 수식 결과가 비어 있는 셀이 있습니다. 원본 확인 필요";
  if (!warnings.includes(warning)) {
    warnings.push(warning);
  }
}

const v = emptyFormula ? "" : value(cell);
      payments[item.month] = str(v) === "" ? 0 : money(v);
    }

    dues.push({ name, payments });
  }

  const ledgerDues = transactions
    .filter(t => t.category === "정기회비")
    .reduce((s, t) => s + t.amount, 0);

  const sheetDues = dues.reduce(
    (s, d) => s + Object.values(d.payments).reduce(
      (a, b) => a + b, 0
    ), 0
  );

  if (ledgerDues !== sheetDues) {
    throw new Error(
      `정기회비 합계 불일치: ${ledgerDues - sheetDues}원`
    );
  }

  const summary = CATEGORIES.map(category => ({
    category,
    amount: transactions
      .filter(t => t.category === category)
      .reduce((s, t) => s + t.amount, 0)
  }));

  const last = transactions[transactions.length - 1];

  return {
    reportDate: last.date.slice(0, 10),
    balance,
    last,
    summary,
    transactions,
    dues,
    months: monthColumns.map(m => m.month),
    warnings
  };
}

export async function GET(req: NextRequest) {
  const user = await session(req);

  if (!user) return json({ error: "회계 접근 확인 필요" }, 401);

  const supabase = db();

  const { data: report, error } = await supabase
    .from("accounting_reports")
    .select("data,created_at")
    .eq("is_published", true)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) return json({ error: "회계자료 조회 실패" }, 500);

  const { data: members, error: memberError } = await supabase
    .from("members")
    .select("id,name")
    .eq("can_login", true);

  if (memberError) {
    return json({ error: "회원 조회 실패" }, 500);
  }

  return json({
    user,
    report: report?.data ?? null,
    members: members ?? []
  });
}

export async function POST(req: NextRequest) {
  try {
    const origin = req.headers.get("origin");

    if (origin && origin !== new URL(req.url).origin) {
      return json({ error: "잘못된 요청" }, 403);
    }

    if (req.headers.get("content-type")?.includes("application/json")) {
      const body = await req.json();

      if (body.action === "lock") {
        const response = json({ success: true });

        response.cookies.set(COOKIE, "", {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          path: "/",
          maxAge: 0
        });

        response.cookies.set("insam_accounting", "", {
          path: "/accounting",
          maxAge: 0
        });

        return response;
      }

      return json({ error: "Invalid request" }, 400);
    }

    const user = await session(req);

    if (!user?.admin) {
      return json({ error: "관리자 전용 기능입니다." }, 403);
    }

    const form = await req.formData();
    const file = form.get("file");
    const action = form.get("action");

    if (!(file instanceof File)) {
      return json({ error: "엑셀 파일을 선택하세요." }, 400);
    }

    if (action !== "preview" && action !== "publish") {
      return json({ error: "잘못된 작업" }, 400);
    }

    const report = await parseWorkbook(file);

    if (action === "preview") {
      return json({
        success: true,
        balance: report.balance,
        reportDate: report.reportDate,
        count: report.transactions.length,
        warnings: report.warnings
      });
    }

    if (
      report.warnings.length &&
      form.get("acceptWarnings") !== "true"
    ) {
      return json({ error: "확인 필요 거래를 검토하세요." }, 400);
    }

    const supabase = db();

    const { data: previous, error: previousError } = await supabase
      .from("accounting_reports")
      .select("report_date")
      .eq("is_published", true)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (previousError) throw new Error("기존 결산 조회 실패");

    if (previous && previous.report_date > report.reportDate) {
      throw new Error("현재 공개 자료보다 오래된 결산입니다.");
    }

    const { error } = await supabase
      .from("accounting_reports")
      .insert({
        report_date: report.reportDate,
        balance: report.balance,
        data: report,
        uploaded_by: user.id,
        is_published: true
      });

    if (error) throw new Error("결산 저장 실패");

    return json({ success: true });

  } catch (e) {
    return json({
      error: e instanceof Error ? e.message : "처리 오류"
    }, 400);
  }
}



