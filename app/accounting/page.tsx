"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ChevronLeft, ChevronRight, Settings,
  Wallet, Users, Receipt, Calculator,
  Utensils, MessageSquare, Upload,
  Loader2, X
} from "lucide-react";

type Transaction = {
  row: number;
  date: string;
  category: string;
  name: string;
  detail: string;
  event: string;
  amount: number;
  month: string;
};

type Due = {
  name: string;
  payments: Record<string, number>;
};

type Report = {
  reportDate: string;
  balance: number;
  last: Transaction;
  summary: { category: string; amount: number }[];
  transactions: Transaction[];
  dues: Due[];
  months: string[];
};

type Member = {
  id: string;
  name: string;
};

type User = Member & {
  admin: boolean;
};

type Preview = {
  balance: number;
  reportDate: string;
  count: number;
  warnings: string[];
};

type Tab =
  | "home"
  | "status"
  | "usage"
  | "settlement"
  | "friendly"
  | "events"
  | "admin";

const won = (n: number) =>
  n.toLocaleString("ko-KR") + "원";

const total = (items: Transaction[]) =>
  items.reduce((s, t) => s + t.amount, 0);

const income = (items: Transaction[]) =>
  total(items.filter(t => t.amount > 0));

const expense = (items: Transaction[]) =>
  Math.abs(total(items.filter(t => t.amount < 0)));

const titles: Record<Tab, string> = {
  home: "회계현황",
  status: "정기회비 현황",
  usage: "회비 사용내역",
  settlement: "전체 결산",
  friendly: "번개축구 정산",
  events: "회식 및 여행 정산",
  admin: "회계자료 관리"
};

export default function AccountingPage() {
  const router = useRouter();

  const [tab, setTab] = useState<Tab>("home");
  const [report, setReport] = useState<Report | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [approved, setApproved] = useState(false);
  const [busy, setBusy] = useState(false);

  const [month, setMonth] = useState("");
  const [filter, setFilter] = useState("current");
  const [annual, setAnnual] = useState(false);
  const [selected, setSelected] = useState("");

  const load = useCallback(async () => {
    try {
      const saved = localStorage.getItem("insam_user");

      if (!saved) {
        router.replace("/login");
        return;
      }

      const localUser = JSON.parse(saved);

      const res = await fetch("/accounting/api", {
        cache: "no-store",
        credentials: "same-origin"
      });

      const data = await res.json();

      if (res.status === 401) {
        setUser(null);
        setReport(null);
        router.replace("/login");
        return;
      }

      if (!res.ok) {
        throw new Error(data.error || "조회 실패");
      }

      if (data.user?.id !== localUser.id) {
        setUser(null);
        setReport(null);
        router.replace("/login");
        return;
      }

      setUser(data.user);
      setMembers(data.members || []);
      setReport(data.report);

      if (data.report) {
        setMonth(data.report.reportDate.slice(0, 7));
      }

    } catch (e) {
      setError(e instanceof Error ? e.message : "조회 실패");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    function sync() {
      const hash = window.location.hash.slice(1);

      setTab(
        Object.prototype.hasOwnProperty.call(titles, hash)
          ? hash as Tab
          : "home"
      );
    }

    sync();
    window.addEventListener("hashchange", sync);

    return () =>
      window.removeEventListener("hashchange", sync);
  }, []);

  function move(next: Tab) {
    setTab(next);
    setSelected("");
    setError("");
    window.location.hash = next === "home" ? "" : next;
    window.scrollTo(0, 0);
  }

  async function upload(action: "preview" | "publish") {
    if (!file || !user?.admin || busy) return;

    setBusy(true);
    setError("");

    if (action === "preview") {
      setPreview(null);
      setApproved(false);
    }

    try {
      const form = new FormData();

      form.append("file", file);
      form.append("action", action);
      form.append("acceptWarnings", String(approved));

      const res = await fetch("/accounting/api", {
        method: "POST",
        body: form
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "처리 실패");
      }

      if (action === "preview") {
        setPreview(data);
        setApproved(false);
      } else {
        setFile(null);
        setPreview(null);
        setApproved(false);
        await load();
        move("home");
        alert("결산 공개 완료");
      }

    } catch (e) {
      setError(e instanceof Error ? e.message : "업로드 실패");
    } finally {
      setBusy(false);
    }
  }

  const tx = report?.transactions || [];

  const spending = tx.filter(t => t.amount < 0);

  const friendly = tx.filter(t =>
    ["번개입금", "번개지출"].includes(t.category)
  );

  const events = tx.filter(t =>
    t.category.includes("회식") ||
    t.category.includes("여행")
  );

  const currentNames = new Set(members.map(m => m.name));

  const dues = [...(report?.dues || [])];

  for (const name of currentNames) {
    if (!dues.some(d => d.name === name)) {
      dues.push({ name, payments: {} });
    }
  }

  const currentMonth = report?.reportDate.slice(0, 7) || "";

  const monthlyTotal = dues.reduce(
    (s, d) => s + (d.payments[currentMonth] || 0),
    0
  );

  const paidMembers = dues
    .filter(d => (d.payments[currentMonth] || 0) > 0)
    .sort((a, b) => a.name.localeCompare(b.name, "ko"));

const unpaidMembers = dues
    .filter(d =>
      currentNames.has(d.name) &&
      (d.payments[currentMonth] || 0) === 0
    )
    .sort((a, b) => a.name.localeCompare(b.name, "ko"));

const paidCount = dues.filter(d =>
    currentNames.has(d.name) &&
    (d.payments[currentMonth] || 0) > 0
  ).length;

  const visibleDues = dues.filter(d =>
    filter === "all" ||
    (filter === "current"
      ? currentNames.has(d.name)
      : !currentNames.has(d.name))
  ).sort((a, b) => a.name.localeCompare(b.name, "ko"));

  const months = Array.from(
    new Set([
      ...(report?.months || []),
      ...(currentMonth ? [currentMonth] : [])
    ])
  ).sort().reverse();

  function menuCard(
    title: string,
    subtitle: string,
    amount: number,
    icon: React.ReactNode,
    next: Tab,
    color: string,
    extra?: string
  ) {
    return (
      <button
        onClick={() => move(next)}
        className="bg-white border border-slate-200 rounded-2xl p-4 text-left min-w-0 shadow-sm active:scale-[0.98] transition-all"
      >
        <div className="flex justify-between items-center">
          <div className={color}>{icon}</div>
          <ChevronRight size={16} className="text-slate-300" />
        </div>

        <p className="font-bold text-sm mt-4">{title}</p>

        <p className="text-xs text-slate-400 mt-3">
          {subtitle}
        </p>

        <p className={`font-black text-lg mt-1 break-words ${
          amount < 0 ? "text-rose-500" : color
        }`}>
          {report ? won(amount) : "—"}
        </p>

        {extra && report && (
          <p className="text-xs text-slate-500 mt-2">
            {extra}
          </p>
        )}
      </button>
    );
  }

  function summary(items: Transaction[]) {
    return (
      <section className="bg-[#1e293b] text-white rounded-3xl p-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-slate-400">수입</p>
            <p className="font-black text-lg text-emerald-400 mt-2">
              {won(income(items))}
            </p>
          </div>

          <div>
            <p className="text-xs text-slate-400">지출</p>
            <p className="font-black text-lg text-rose-400 mt-2">
              {won(expense(items))}
            </p>
          </div>
        </div>

        <div className="border-t border-white/10 mt-5 pt-4">
          <p className="text-xs text-slate-400">정산 차액</p>
          <p className="text-2xl font-black mt-2">
            {won(total(items))}
          </p>
        </div>
      </section>
    );
  }

  function transactionList(items: Transaction[]) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl px-4 divide-y divide-slate-100">

        {[...items].reverse().map(t => (
          <div key={t.row} className="py-4 flex justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs text-slate-400">
                {t.date.slice(0, 10)} · {t.category}
              </p>

              <p className="font-bold text-sm mt-1">
                {t.name || t.category}
              </p>

              <p className="text-xs text-slate-500 mt-1 break-words">
                {[
                  t.detail,
                  t.event,
                  t.month ? "적용 시작월 " + t.month : ""
                ].filter(Boolean).join(" · ")}
              </p>
            </div>

            <p className={`font-black text-sm shrink-0 ${
              t.amount < 0
                ? "text-rose-500"
                : "text-[#2d6cef]"
            }`}>
              {won(t.amount)}
            </p>
          </div>
        ))}

        {!items.length && (
          <p className="text-center text-sm text-slate-400 py-8">
            거래내역이 없습니다.
          </p>
        )}

      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 pb-20">

      {/* 상단 메뉴 */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">

        <div className="max-w-md mx-auto p-4 flex items-center gap-3">

          {tab === "home" ? (
            <Link href="/">
              <ChevronLeft size={24} />
            </Link>
          ) : (
            <button onClick={() => move("home")}>
              <ChevronLeft size={24} />
            </button>
          )}

          <h1 className="font-black text-xl flex-1">
            {titles[tab]}
          </h1>

          {user?.admin && tab === "home" && (
            <button
              onClick={() => move("admin")}
              className="bg-slate-100 rounded-xl p-2"
              aria-label="회계자료 관리"
            >
              <Settings size={22} />
            </button>
          )}

        </div>

      </header>

      <main className="max-w-md mx-auto p-4 space-y-4">

        {loading && (
          <Loader2 className="animate-spin mx-auto mt-16 text-blue-600" />
        )}

        {error && (
          <div className="bg-rose-50 text-rose-600 rounded-2xl p-4 text-sm">
            {error}
          </div>
        )}

        {!loading && !user && (
          <Link
            href="/login"
            className="block bg-[#1e293b] text-white rounded-2xl p-4 text-center"
          >
            다시 로그인하기
          </Link>
        )}

        {/* 메인 화면 */}
        {user && tab === "home" && (
          <>

            <section className="bg-[#1e293b] text-white rounded-3xl p-6 shadow-lg">

              <div className="flex items-center gap-2 text-slate-400 text-sm">
                <Wallet size={16} />
                현재 결산 잔액
              </div>

              <p className="text-3xl font-black mt-3">
                {report ? won(report.balance) : "—"}
              </p>

              {report?.last && (
                <div className="border-t border-white/10 mt-5 pt-4">
                  <p className="text-xs text-emerald-400 font-bold">
                    마지막 거래
                  </p>

                  <p className="text-xs text-slate-400 mt-2">
                    {report.last.date}
                  </p>

                  <div className="flex justify-between mt-2 text-sm font-bold">
                    <span>{report.last.name || report.last.category}</span>
                    <span>{won(report.last.amount)}</span>
                  </div>
                </div>
              )}

            </section>

            {/* 정기회비 요약 */}
            <button
              onClick={() => move("status")}
              className="w-full bg-white border border-slate-200 rounded-2xl p-5 text-left shadow-sm"
            >
              <div className="flex items-center gap-2">
                <Users size={20} className="text-blue-600" />
                <span className="font-black flex-1">정기회비 현황</span>
                <ChevronRight size={18} className="text-slate-400" />
              </div>

              <p className="text-xs text-slate-400 mt-4">
                {currentMonth} 배정 회비
              </p>

              <p className="text-2xl font-black text-blue-600 mt-1">
                {report ? won(monthlyTotal) : "—"}
              </p>

              <div className="flex justify-between border-t border-slate-100 mt-4 pt-3 text-xs">
                <span className="text-slate-500">현재 회원 납부 기록</span>
                <span className="font-bold">
                  {report ? `${paidCount} / ${currentNames.size}명` : "—"}
                </span>
              </div>
            <div className="mt-4 pt-4 border-t border-slate-100">
  <div className="flex justify-between mb-3">
    <span className="text-sm font-black">납부 회원</span>
    <span className="text-sm font-bold text-blue-600">
      {paidMembers.length}명
    </span>
  </div>

  <div className="grid grid-cols-2 gap-2">
    {paidMembers.map(d => (
      <div
        key={d.name}
        className="bg-blue-50 rounded-xl p-3"
      >
        <p className="text-xs font-bold">{d.name}</p>
        <p className="text-sm font-black text-blue-600 mt-1">
          {won(d.payments[currentMonth])}
        </p>
      </div>
    ))}
  </div>

  {paidMembers.length === 0 && (
    <p className="text-xs text-slate-400">
      납부 기록이 없습니다.
    </p>
  )}
</div>
<div className="mt-5 pt-4 border-t border-slate-100">

  <div className="flex justify-between mb-3">
    <span className="text-sm font-black">
      미납부 회원
    </span>

    <span className="text-sm font-bold text-rose-500">
      {unpaidMembers.length}명
    </span>
  </div>

  <div className="grid grid-cols-2 gap-2">

    {unpaidMembers.map(d => (
      <div
        key={d.name}
        className="bg-rose-50 rounded-xl p-3"
      >
        <p className="text-xs font-bold text-rose-600">
          {d.name}
        </p>

        <p className="text-[11px] text-rose-400 mt-1">
          납부 기록 없음
        </p>
      </div>
    ))}

  </div>

  {unpaidMembers.length === 0 && (
    <p className="text-xs text-slate-400">
      해당 회원이 없습니다.
    </p>
  )}

  <p className="text-[10px] text-slate-400 mt-3">
    납부 기록이 없다는 것이 미납 확정을 의미하지는 않습니다.
  </p>

</div>
</button>

            {/* 회계 메뉴 및 금액 */}
            <div className="grid grid-cols-2 gap-3">

              {menuCard(
                "회비 사용내역",
                "누적 지출",
                expense(spending),
                <Receipt size={23} />,
                "usage",
                "text-rose-500"
              )}

              {menuCard(
                "전체 결산",
                "누적 수입",
                income(tx),
                <Calculator size={23} />,
                "settlement",
                "text-blue-600",
                "지출 " + won(expense(tx))
              )}

              {menuCard(
                "번개축구 정산",
                "정산 차액",
                total(friendly),
                <Users size={23} />,
                "friendly",
                "text-blue-600",
                "지출 " + won(expense(friendly))
              )}

              {menuCard(
                "회식 및 여행",
                "정산 차액",
                total(events),
                <Utensils size={23} />,
                "events",
                "text-amber-600",
                "지출 " + won(expense(events))
              )}

            </div>

            <Link
              href="/accounting/wishlist"
              className="bg-white border border-slate-200 rounded-2xl p-5 flex items-center gap-3 shadow-sm"
            >
              <MessageSquare className="text-violet-500" size={23} />

              <span className="font-bold flex-1">
                구매희망 게시판
              </span>

              <ChevronRight size={18} className="text-slate-400" />
            </Link>

          </>
        )}

        {/* 관리자 */}
        {user?.admin && tab === "admin" && (
          <section className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4">

            <h2 className="font-black">결산자료 업로드</h2>

            <label className="block border-2 border-dashed border-slate-200 rounded-2xl p-6 text-center cursor-pointer">

              <Upload className="mx-auto text-blue-600 mb-3" />

              <p className="text-sm font-bold break-all">
                {file ? file.name : "엑셀 파일 선택"}
              </p>

              <input
                type="file"
                accept=".xlsx"
                className="hidden"
                disabled={busy}
                onChange={e => {
                  setFile(e.target.files?.[0] || null);
                  setPreview(null);
                  setApproved(false);
                }}
              />

            </label>

            <button
              disabled={!file || busy}
              onClick={() => upload("preview")}
              className="bg-blue-600 text-white rounded-xl p-4 w-full font-bold disabled:opacity-40"
            >
              {busy ? "처리 중..." : "엑셀 검증하기"}
            </button>

            {preview && (
              <div className="bg-slate-50 rounded-xl p-4 space-y-3 text-sm">

                <p>결산일 : {preview.reportDate}</p>
                <p>거래 건수 : {preview.count}건</p>
                <p className="font-black">
                  잔액 : {won(preview.balance)}
                </p>

                {preview.warnings.map((w, i) => (
                  <p key={i} className="text-xs text-rose-600">{w}</p>
                ))}

                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={approved}
                    onChange={e => setApproved(e.target.checked)}
                  />
                  검증 결과를 확인했습니다.
                </label>

                <button
                  disabled={!approved || busy}
                  onClick={() => upload("publish")}
                  className="bg-[#1e293b] text-white rounded-xl p-4 w-full font-bold disabled:opacity-40"
                >
                  결산 공개
                </button>

              </div>
            )}

          </section>
        )}

        {user && !user.admin && tab === "admin" && (
          <p className="p-6 text-center">관리자 전용 메뉴입니다.</p>
        )}

        {/* 정기회비 상세 */}
        {user && report && tab === "status" && (
          <>

            <div className="flex gap-2">

              <select
                value={month}
                onChange={e => {
                  setMonth(e.target.value);
                  setSelected("");
                }}
                className="flex-1 bg-white border border-slate-200 rounded-xl p-3 font-bold"
              >
                {months.map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>

              <button
                onClick={() => setAnnual(!annual)}
                className="bg-[#1e293b] text-white px-4 rounded-xl text-sm"
              >
                {annual ? "월별 보기" : "연간 보기"}
              </button>

            </div>

            <div className="bg-[#1e293b] text-white p-5 rounded-2xl">

              <p className="text-xs text-slate-400">배정 회비 합계</p>

              <p className="text-2xl font-black mt-2">
                {won(visibleDues.reduce((s, d) =>
                  s + (
                    annual
                      ? Object.entries(d.payments)
                          .filter(([m]) => m.startsWith(month.slice(0, 4)))
                          .reduce((a, [, n]) => a + n, 0)
                      : d.payments[month] || 0
                  ), 0))}
              </p>

            </div>

            <div className="grid grid-cols-3 gap-1 bg-slate-200 rounded-xl p-1">

              {[
                ["current", "현재 회원"],
                ["past", "과거·미연결"],
                ["all", "전체"]
              ].map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => {
                    setFilter(key);
                    setSelected("");
                  }}
                  className={`rounded-lg py-3 text-xs font-bold ${
                    filter === key
                      ? "bg-[#1e293b] text-white"
                      : "text-slate-500"
                  }`}
                >
                  {label}
                </button>
              ))}

            </div>

            {annual ? (

              <div className="overflow-x-auto bg-white rounded-xl border border-slate-200">

                <table className="text-xs whitespace-nowrap w-full">

                  <thead className="bg-slate-100">
                    <tr>
                      <th className="sticky left-0 bg-slate-100 z-10 p-3">회원명</th>

                      {Array.from({ length: 12 }, (_, i) => (
                        <th key={i} className="p-3">{i + 1}월</th>
                      ))}

                      <th className="p-3">합계</th>
                    </tr>
                  </thead>

                  <tbody>

                    {visibleDues.map(d => (
                      <tr key={d.name} className="border-t border-slate-100">

                        <td className="sticky left-0 bg-white z-10 p-3 font-bold">
                          <button onClick={() => setSelected(d.name)}>
                            {d.name}
                          </button>
                        </td>

                        {Array.from({ length: 12 }, (_, i) => {
                          const key =
                            month.slice(0, 4) + "-" +
                            String(i + 1).padStart(2, "0");

                          const amount = d.payments[key] || 0;

                          return (
                            <td
                              key={i}
                              className={`p-3 text-center ${
                                amount > 0 ? "text-blue-600" :
                                amount < 0 ? "text-rose-500" :
                                "text-slate-300"
                              }`}
                            >
                              {amount ? amount.toLocaleString("ko-KR") : "—"}
                            </td>
                          );
                        })}

                        <td className="p-3 font-bold">
                          {Object.entries(d.payments)
                            .filter(([m]) => m.startsWith(month.slice(0, 4)))
                            .reduce((s, [, n]) => s + n, 0)
                            .toLocaleString("ko-KR")}
                        </td>

                      </tr>
                    ))}

                  </tbody>

                </table>

              </div>

            ) : (

              <div className="bg-white rounded-xl border border-slate-200 px-4 divide-y divide-slate-100">

                {visibleDues.map(d => (
                  <button
                    key={d.name}
                    onClick={() => setSelected(
                      selected === d.name ? "" : d.name
                    )}
                    className="w-full flex items-center gap-3 py-4 text-sm"
                  >
                    <span className="flex-1 font-bold text-left">
                      {d.name}
                    </span>

                    <span className={
                      (d.payments[month] || 0) > 0
                        ? "text-blue-600 font-bold"
                        : (d.payments[month] || 0) < 0
                          ? "text-rose-500 font-bold"
                          : "text-slate-400"
                    }>
                      {d.payments[month]
                        ? won(d.payments[month])
                        : "기록 없음"}
                    </span>

                    <ChevronRight size={15} className="text-slate-300" />
                  </button>
                ))}

              </div>

            )}

            <p className="text-xs text-slate-400">
              기록 없음은 미납 확정을 의미하지 않습니다.
              현재 회원은 로그인 가능 회원 기준입니다.
            </p>

            {selected && (
              <div className="space-y-3">

                <div className="flex justify-between items-center">
                  <h3 className="font-black">{selected} 납부내역</h3>

                  <button onClick={() => setSelected("")}>
                    <X size={20} />
                  </button>
                </div>

                {transactionList(tx.filter(t =>
                  t.name === selected &&
                  t.category === "정기회비"
                ))}

              </div>
            )}

          </>
        )}

        {/* 회비 사용내역 */}
        {user && report && tab === "usage" && (
          <>

            <div className="bg-[#1e293b] rounded-3xl p-6 text-white">
              <p className="text-sm text-slate-400">누적 지출액</p>
              <p className="text-3xl font-black mt-2">
                {won(expense(spending))}
              </p>
            </div>

            {transactionList(spending)}

          </>
        )}

        {/* 전체 결산 */}
        {user && report && tab === "settlement" && (
          <>

            {summary(tx)}

            <div className="bg-white rounded-2xl border border-slate-200 p-4 divide-y divide-slate-100">

              {report.summary.map(s => (
                <div key={s.category} className="flex justify-between py-4 text-sm">
                  <span>{s.category}</span>
                  <span className={`font-bold ${
                    s.amount < 0 ? "text-rose-500" : "text-blue-600"
                  }`}>
                    {won(s.amount)}
                  </span>
                </div>
              ))}

            </div>

          </>
        )}

        {/* 번개축구 */}
        {user && report && tab === "friendly" && (
          <>
            {summary(friendly)}
            {transactionList(friendly)}
          </>
        )}

        {/* 회식 및 여행 */}
        {user && report && tab === "events" && (
          <>
            {summary(events)}
            {transactionList(events)}
          </>
        )}

        {user && !report && tab !== "home" && tab !== "admin" && (
          <p className="bg-white p-8 rounded-2xl text-center text-slate-400">
            등록된 결산자료가 없습니다.
          </p>
        )}

      </main>
    </div>
  );
}


