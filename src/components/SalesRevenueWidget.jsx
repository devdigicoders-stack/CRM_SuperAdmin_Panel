import React, { useState, useMemo } from "react";
import axios from "axios";
import {
  FaRupeeSign,
  FaCalendarDay,
  FaCalendarAlt,
  FaCheckCircle,
  FaMoneyBillWave,
  FaHandHoldingUsd,
  FaClock,
  FaSearch,
  FaEye,
  FaTimes,
  FaSync,
  FaFileInvoiceDollar,
  FaArrowUp,
  FaChartLine,
  FaFilter,
  FaUserTie,
  FaPhoneAlt,
  FaExternalLinkAlt
} from "react-icons/fa";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from "recharts";
import { toast } from "sonner";

const formatINR = (val) => {
  const num = Number(val) || 0;
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0
  }).format(num);
};

export default function SalesRevenueWidget({
  salesData,
  themeColors = {},
  baseUrl,
  token,
  onRefresh
}) {
  const [activeTab, setActiveTab] = useState("day"); // 'day' | 'month'
  const [dayRangeFilter, setDayRangeFilter] = useState("30"); // '7' | '15' | '30' | 'all' | 'custom'
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  const [tableSearch, setTableSearch] = useState("");

  // Drilldown modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState("");
  const [modalLoading, setModalLoading] = useState(false);
  const [modalLeads, setModalLeads] = useState([]);
  const [modalTotal, setModalTotal] = useState(0);
  const [modalPage, setModalPage] = useState(1);
  const [modalTarget, setModalTarget] = useState({ date: null, month: null });

  const summary = salesData?.summary || {};
  const today = summary.today || { count: 0, revenue: 0, amountPaid: 0, pendingAmount: 0 };
  const yesterday = summary.yesterday || { count: 0, revenue: 0, amountPaid: 0, pendingAmount: 0 };
  const thisMonth = summary.thisMonth || { count: 0, revenue: 0, amountPaid: 0, pendingAmount: 0 };
  const lastMonth = summary.lastMonth || { count: 0, revenue: 0, amountPaid: 0, pendingAmount: 0 };
  const total = summary.total || { count: 0, revenue: 0, amountPaid: 0, pendingAmount: 0 };

  const rawDayWise = useMemo(() => salesData?.dayWise || [], [salesData]);
  const rawMonthWise = useMemo(() => salesData?.monthWise || [], [salesData]);

  // Filter day-wise records based on quick filter / custom date
  const filteredDayWise = useMemo(() => {
    let list = [...rawDayWise];

    if (dayRangeFilter === "7") {
      list = list.slice(0, 7);
    } else if (dayRangeFilter === "15") {
      list = list.slice(0, 15);
    } else if (dayRangeFilter === "30") {
      list = list.slice(0, 30);
    } else if (dayRangeFilter === "custom") {
      if (customStartDate) list = list.filter((d) => d.date >= customStartDate);
      if (customEndDate) list = list.filter((d) => d.date <= customEndDate);
    }

    if (tableSearch) {
      const q = tableSearch.toLowerCase().trim();
      list = list.filter(
        (d) =>
          d.date.toLowerCase().includes(q) ||
          d.formattedDate?.toLowerCase().includes(q)
      );
    }

    return list;
  }, [rawDayWise, dayRangeFilter, customStartDate, customEndDate, tableSearch]);

  // Filter month-wise records
  const filteredMonthWise = useMemo(() => {
    let list = [...rawMonthWise];
    if (tableSearch) {
      const q = tableSearch.toLowerCase().trim();
      list = list.filter(
        (m) =>
          m.month.toLowerCase().includes(q) ||
          m.monthLabel?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [rawMonthWise, tableSearch]);

  // Chart data
  const chartData = useMemo(() => {
    if (activeTab === "day") {
      // Reverse to chronological order for charts (oldest to newest)
      return [...filteredDayWise].slice(0, 15).reverse().map((d) => ({
        label: d.formattedDate?.replace(/ \d{4}$/, "") || d.date,
        revenue: d.revenue,
        count: d.count,
        paid: d.amountPaid,
        pending: d.pendingAmount
      }));
    } else {
      return [...filteredMonthWise].slice(0, 12).reverse().map((m) => ({
        label: m.monthLabel || m.month,
        revenue: m.revenue,
        count: m.count,
        paid: m.amountPaid,
        pending: m.pendingAmount
      }));
    }
  }, [activeTab, filteredDayWise, filteredMonthWise]);

  // Drilldown leads fetch
  const handleOpenDrilldown = async (params) => {
    const { date, month, label } = params;
    setModalTarget({ date, month });
    setModalTitle(label || date || month);
    setModalOpen(true);
    setModalPage(1);
    await fetchDrilldownLeads({ date, month, page: 1 });
  };

  const fetchDrilldownLeads = async ({ date, month, page = 1 }) => {
    if (!baseUrl || !token) return;
    setModalLoading(true);
    try {
      const q = new URLSearchParams();
      if (date) q.append("date", date);
      if (month) q.append("month", month);
      q.append("page", page);
      q.append("limit", 15);
      q.append("details", "true");

      const res = await axios.get(`${baseUrl}/dashboard/sales-revenue?${q.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.data.status === "success") {
        setModalLeads(res.data.data.leads?.leads || []);
        setModalTotal(res.data.data.leads?.total || 0);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to load approved sales leads");
    } finally {
      setModalLoading(false);
    }
  };

  const primaryColor = themeColors.primary || "#2563EB";
  const successColor = themeColors.success || "#10B981";
  const warningColor = themeColors.warning || "#F59E0B";
  const surfaceColor = themeColors.surface || "#FFFFFF";
  const borderColor = themeColors.border || "#E2E8F0";
  const textColor = themeColors.text || "#0F172A";
  const textSecondary = themeColors.textSecondary || "#64748B";

  const getMediaUrl = (url) => {
    if (!url) return "";
    if (url.startsWith("http://") || url.startsWith("https://")) return url;
    const srv = baseUrl ? baseUrl.replace(/\/api\/v1\/?$/, "") : "";
    return `${srv}${url.startsWith("/") ? "" : "/"}${url}`;
  };

  return (
    <div
      className="rounded-2xl border shadow-sm p-6 space-y-6 transition-all"
      style={{ backgroundColor: surfaceColor, borderColor }}
    >
      {/* Header section with status pill and refresh */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b" style={{ borderColor }}>
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold tracking-tight" style={{ color: textColor }}>
              Real-Time Sales & Revenue Count
            </h2>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Live Sync
            </span>
          </div>
          <p className="text-xs mt-1 font-medium" style={{ color: textSecondary }}>
            Exact day-wise & month-wise sales count & revenue — counted immediately after{" "}
            <span className="font-semibold text-emerald-600">Accounts Verification</span> &{" "}
            <span className="font-semibold text-blue-600">Super Admin Approval</span> (prior to installation).
          </p>
        </div>

        <div className="flex items-center gap-2">
          {onRefresh && (
            <button
              onClick={onRefresh}
              className="flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold rounded-lg border transition-all hover:bg-black/5 dark:hover:bg-white/5"
              style={{ borderColor, color: textColor }}
            >
              <FaSync className="text-xs" />
              Refresh
            </button>
          )}
        </div>
      </div>

      {/* Top 3 Summary Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Today's Sales Card */}
        <div
          className="relative overflow-hidden rounded-xl border p-5 transition-all duration-200 hover:shadow-md group"
          style={{
            borderColor,
            background: "linear-gradient(135deg, rgba(37,99,235,0.06) 0%, rgba(37,99,235,0.01) 100%)"
          }}
        >
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold uppercase tracking-wider bg-blue-500/15 text-blue-600">
                  Today's Sales
                </span>
                <span className="text-xs font-medium" style={{ color: textSecondary }}>
                  {today.formattedDate || today.date}
                </span>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-3xl font-extrabold" style={{ color: textColor }}>
                  {today.count}
                </span>
                <span className="text-sm font-semibold text-blue-600">Approved Sales</span>
              </div>
              <div className="text-xl font-bold mt-1 text-emerald-600">
                {formatINR(today.revenue)}
              </div>
            </div>

            <div className="w-11 h-11 rounded-xl bg-blue-500/15 text-blue-600 flex items-center justify-center text-lg">
              <FaCalendarDay />
            </div>
          </div>

          <div className="mt-4 pt-3 border-t grid grid-cols-2 gap-2 text-xs" style={{ borderColor }}>
            <div>
              <span className="text-[11px] block" style={{ color: textSecondary }}>
                Amount Received
              </span>
              <span className="font-bold text-emerald-600">{formatINR(today.amountPaid)}</span>
            </div>
            <div>
              <span className="text-[11px] block" style={{ color: textSecondary }}>
                Pending / COD
              </span>
              <span className="font-bold text-amber-600">{formatINR(today.pendingAmount)}</span>
            </div>
          </div>

          {yesterday.count > 0 && (
            <div className="mt-2 text-[11px] font-medium" style={{ color: textSecondary }}>
              Yesterday: <span className="font-semibold text-slate-700 dark:text-slate-300">{yesterday.count} Sales ({formatINR(yesterday.revenue)})</span>
            </div>
          )}
        </div>

        {/* This Month's Sales Card */}
        <div
          className="relative overflow-hidden rounded-xl border p-5 transition-all duration-200 hover:shadow-md group"
          style={{
            borderColor,
            background: "linear-gradient(135deg, rgba(16,185,129,0.06) 0%, rgba(16,185,129,0.01) 100%)"
          }}
        >
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold uppercase tracking-wider bg-emerald-500/15 text-emerald-600">
                  This Month
                </span>
                <span className="text-xs font-medium" style={{ color: textSecondary }}>
                  {thisMonth.monthLabel || thisMonth.month}
                </span>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-3xl font-extrabold" style={{ color: textColor }}>
                  {thisMonth.count}
                </span>
                <span className="text-sm font-semibold text-emerald-600">Approved Sales</span>
              </div>
              <div className="text-xl font-bold mt-1 text-emerald-600">
                {formatINR(thisMonth.revenue)}
              </div>
            </div>

            <div className="w-11 h-11 rounded-xl bg-emerald-500/15 text-emerald-600 flex items-center justify-center text-lg">
              <FaCalendarAlt />
            </div>
          </div>

          <div className="mt-4 pt-3 border-t grid grid-cols-2 gap-2 text-xs" style={{ borderColor }}>
            <div>
              <span className="text-[11px] block" style={{ color: textSecondary }}>
                Amount Received
              </span>
              <span className="font-bold text-emerald-600">{formatINR(thisMonth.amountPaid)}</span>
            </div>
            <div>
              <span className="text-[11px] block" style={{ color: textSecondary }}>
                Pending / COD
              </span>
              <span className="font-bold text-amber-600">{formatINR(thisMonth.pendingAmount)}</span>
            </div>
          </div>

          {lastMonth.count > 0 && (
            <div className="mt-2 text-[11px] font-medium" style={{ color: textSecondary }}>
              Last Month: <span className="font-semibold text-slate-700 dark:text-slate-300">{lastMonth.count} Sales ({formatINR(lastMonth.revenue)})</span>
            </div>
          )}
        </div>

        {/* Total Verified & Approved Sales Card */}
        <div
          className="relative overflow-hidden rounded-xl border p-5 transition-all duration-200 hover:shadow-md group"
          style={{
            borderColor,
            background: "linear-gradient(135deg, rgba(99,102,241,0.06) 0%, rgba(99,102,241,0.01) 100%)"
          }}
        >
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold uppercase tracking-wider bg-indigo-500/15 text-indigo-600">
                  Total Approved Sales
                </span>
                <span className="text-xs font-medium" style={{ color: textSecondary }}>
                  All-Time
                </span>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-3xl font-extrabold" style={{ color: textColor }}>
                  {total.count}
                </span>
                <span className="text-sm font-semibold text-indigo-600">Total Count</span>
              </div>
              <div className="text-xl font-bold mt-1 text-emerald-600">
                {formatINR(total.revenue)}
              </div>
            </div>

            <div className="w-11 h-11 rounded-xl bg-indigo-500/15 text-indigo-600 flex items-center justify-center text-lg">
              <FaRupeeSign />
            </div>
          </div>

          <div className="mt-4 pt-3 border-t grid grid-cols-2 gap-2 text-xs" style={{ borderColor }}>
            <div>
              <span className="text-[11px] block" style={{ color: textSecondary }}>
                Total Received
              </span>
              <span className="font-bold text-emerald-600">{formatINR(total.amountPaid)}</span>
            </div>
            <div>
              <span className="text-[11px] block" style={{ color: textSecondary }}>
                Total Pending / COD
              </span>
              <span className="font-bold text-amber-600">{formatINR(total.pendingAmount)}</span>
            </div>
          </div>

          <div className="mt-2 text-[11px] font-medium" style={{ color: textSecondary }}>
            Verification Rate: <span className="font-semibold text-emerald-600">100% Verified & Approved</span>
          </div>
        </div>
      </div>

      {/* Tabs & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-2">
        {/* Tab switchers: Day-wise vs Month-wise */}
        <div className="flex items-center gap-2 p-1 rounded-xl border bg-black/5 dark:bg-white/5" style={{ borderColor }}>
          <button
            onClick={() => setActiveTab("day")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === "day"
                ? "bg-blue-600 text-white shadow-sm"
                : "hover:bg-black/5 dark:hover:bg-white/5"
            }`}
            style={{ color: activeTab === "day" ? "#fff" : textColor }}
          >
            <FaCalendarDay className="text-xs" />
            Day-Wise Sales & Revenue
          </button>
          <button
            onClick={() => setActiveTab("month")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === "month"
                ? "bg-blue-600 text-white shadow-sm"
                : "hover:bg-black/5 dark:hover:bg-white/5"
            }`}
            style={{ color: activeTab === "month" ? "#fff" : textColor }}
          >
            <FaCalendarAlt className="text-xs" />
            Month-Wise Sales & Revenue
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {activeTab === "day" && (
            <div className="flex items-center gap-1">
              {[
                { id: "7", label: "7 Days" },
                { id: "15", label: "15 Days" },
                { id: "30", label: "30 Days" },
                { id: "all", label: "All" },
                { id: "custom", label: "Custom" }
              ].map((pill) => (
                <button
                  key={pill.id}
                  onClick={() => setDayRangeFilter(pill.id)}
                  className={`px-2.5 py-1 text-xs rounded-md font-semibold transition-all ${
                    dayRangeFilter === pill.id
                      ? "bg-blue-600 text-white shadow-xs"
                      : "border hover:bg-black/5 dark:hover:bg-white/5"
                  }`}
                  style={{
                    borderColor,
                    color: dayRangeFilter === pill.id ? "#fff" : textSecondary
                  }}
                >
                  {pill.label}
                </button>
              ))}
            </div>
          )}

          {activeTab === "day" && dayRangeFilter === "custom" && (
            <div className="flex items-center gap-1 text-xs">
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="p-1 rounded border text-xs"
                style={{ borderColor, color: textColor }}
              />
              <span style={{ color: textSecondary }}>to</span>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="p-1 rounded border text-xs"
                style={{ borderColor, color: textColor }}
              />
            </div>
          )}

          {/* Search box for table */}
          <div className="relative">
            <input
              type="text"
              placeholder={`Search ${activeTab === "day" ? "date (e.g. 2026-10)" : "month"}...`}
              value={tableSearch}
              onChange={(e) => setTableSearch(e.target.value)}
              className="pl-8 pr-3 py-1 text-xs rounded-lg border focus:outline-none focus:ring-1 focus:ring-blue-500 w-44"
              style={{ borderColor, color: textColor }}
            />
            <FaSearch className="absolute left-2.5 top-2 text-[10px]" style={{ color: textSecondary }} />
          </div>
        </div>
      </div>

      {/* Mini Visual Chart for Sales Revenue Trend */}
      {chartData.length > 0 && (
        <div className="rounded-xl border p-4" style={{ borderColor, backgroundColor: "rgba(0,0,0,0.01)" }}>
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider" style={{ color: textSecondary }}>
              {activeTab === "day" ? "Recent Daily Revenue Trend (₹)" : "Monthly Revenue Trend (₹)"}
            </span>
            <span className="text-[11px]" style={{ color: textSecondary }}>
              Bars represent Total Deal Value (₹)
            </span>
          </div>
          <div className="h-44 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 5, right: 10, left: 10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={borderColor} />
                <XAxis
                  dataKey="label"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: textSecondary, fontSize: 11 }}
                  dy={5}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: textSecondary, fontSize: 11 }}
                  tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  cursor={{ fill: "rgba(37,99,235,0.08)" }}
                  formatter={(val, name) => [
                    name === "revenue" ? formatINR(val) : val,
                    name === "revenue" ? "Total Revenue" : "Sales Count"
                  ]}
                  contentStyle={{
                    backgroundColor: surfaceColor,
                    borderColor,
                    borderRadius: "8px",
                    color: textColor,
                    fontSize: "12px",
                    boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)"
                  }}
                />
                <Bar dataKey="revenue" name="Revenue" radius={[4, 4, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={index === chartData.length - 1 ? primaryColor : `${primaryColor}99`}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Detailed Breakdown Table */}
      <div className="rounded-xl border overflow-hidden" style={{ borderColor }}>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr style={{ backgroundColor: "rgba(0,0,0,0.02)", borderBottom: `1px solid ${borderColor}` }}>
                <th className="py-3 px-4 text-xs font-bold uppercase tracking-wider" style={{ color: textSecondary }}>
                  {activeTab === "day" ? "Date" : "Month"}
                </th>
                <th className="py-3 px-4 text-xs font-bold uppercase tracking-wider text-center" style={{ color: textSecondary }}>
                  Approved Sales Count
                </th>
                <th className="py-3 px-4 text-xs font-bold uppercase tracking-wider text-right" style={{ color: textSecondary }}>
                  Total Deal Revenue
                </th>
                <th className="py-3 px-4 text-xs font-bold uppercase tracking-wider text-right" style={{ color: textSecondary }}>
                  Amount Received / Paid
                </th>
                <th className="py-3 px-4 text-xs font-bold uppercase tracking-wider text-right" style={{ color: textSecondary }}>
                  Pending / COD
                </th>
                <th className="py-3 px-4 text-xs font-bold uppercase tracking-wider text-center" style={{ color: textSecondary }}>
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {activeTab === "day" ? (
                filteredDayWise.length > 0 ? (
                  filteredDayWise.map((row, idx) => (
                    <tr
                      key={row.date}
                      className="hover:bg-blue-50/40 dark:hover:bg-blue-900/10 transition-colors"
                      style={{ borderBottom: idx !== filteredDayWise.length - 1 ? `1px solid ${borderColor}` : "none" }}
                    >
                      <td className="py-3.5 px-4">
                        <div className="flex flex-col">
                          <span className="text-sm font-bold" style={{ color: textColor }}>
                            {row.formattedDate || row.date}
                          </span>
                          <span className="text-[11px] font-mono" style={{ color: textSecondary }}>
                            {row.date}
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
                          <FaCheckCircle className="text-[10px]" />
                          {row.count} {row.count === 1 ? "Sale" : "Sales"}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <span className="text-sm font-extrabold text-slate-900 dark:text-slate-100">
                          {formatINR(row.revenue)}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <span className="text-sm font-bold text-emerald-600">
                          {formatINR(row.amountPaid)}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <span className="text-sm font-bold text-amber-600">
                          {formatINR(row.pendingAmount)}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={() =>
                            handleOpenDrilldown({
                              date: row.date,
                              label: `Sales on ${row.formattedDate || row.date}`
                            })
                          }
                          className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white transition-all shadow-xs"
                        >
                          <FaEye className="text-xs" />
                          View Sales ({row.count})
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-xs" style={{ color: textSecondary }}>
                      No sales records found for selected period.
                    </td>
                  </tr>
                )
              ) : filteredMonthWise.length > 0 ? (
                filteredMonthWise.map((row, idx) => (
                  <tr
                    key={row.month}
                    className="hover:bg-blue-50/40 dark:hover:bg-blue-900/10 transition-colors"
                    style={{ borderBottom: idx !== filteredMonthWise.length - 1 ? `1px solid ${borderColor}` : "none" }}
                  >
                    <td className="py-3.5 px-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold" style={{ color: textColor }}>
                          {row.monthLabel || row.month}
                        </span>
                        <span className="text-[11px] font-mono" style={{ color: textSecondary }}>
                          {row.month}
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                        <FaCheckCircle className="text-[10px]" />
                        {row.count} {row.count === 1 ? "Sale" : "Sales"}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <span className="text-sm font-extrabold text-slate-900 dark:text-slate-100">
                        {formatINR(row.revenue)}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <span className="text-sm font-bold text-emerald-600">
                        {formatINR(row.amountPaid)}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <span className="text-sm font-bold text-amber-600">
                        {formatINR(row.pendingAmount)}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <button
                        onClick={() =>
                          handleOpenDrilldown({
                            month: row.month,
                            label: `Sales for ${row.monthLabel || row.month}`
                          })
                        }
                        className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white transition-all shadow-xs"
                      >
                        <FaEye className="text-xs" />
                        View Sales ({row.count})
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-xs" style={{ color: textSecondary }}>
                    No month records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Drilldown Modal: Viewing exact leads for selected Date or Month */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div
            className="w-full max-w-4xl max-h-[85vh] rounded-2xl shadow-2xl border flex flex-col overflow-hidden"
            style={{ backgroundColor: surfaceColor, borderColor }}
          >
            {/* Modal Header */}
            <div className="p-5 border-b flex items-center justify-between" style={{ borderColor }}>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold" style={{ color: textColor }}>
                    {modalTitle}
                  </h3>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-700">
                    {modalTotal} Approved {modalTotal === 1 ? "Sale" : "Sales"}
                  </span>
                </div>
                <p className="text-xs mt-0.5" style={{ color: textSecondary }}>
                  Individual customer deals counted towards real-time revenue.
                </p>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
              >
                <FaTimes size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto flex-1">
              {modalLoading ? (
                <div className="flex flex-col items-center justify-center py-16 gap-3">
                  <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent"></div>
                  <span className="text-xs font-medium" style={{ color: textSecondary }}>
                    Loading approved sales leads...
                  </span>
                </div>
              ) : modalLeads.length > 0 ? (
                <div className="space-y-3">
                  {modalLeads.map((lead) => (
                    <div
                      key={lead._id}
                      className="p-4 rounded-xl border flex flex-col md:flex-row md:items-center justify-between gap-4 hover:shadow-xs transition-shadow"
                      style={{ borderColor }}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm" style={{ color: textColor }}>
                            {lead.name}
                          </span>
                          <span className="text-xs px-2 py-0.5 rounded-md font-semibold bg-emerald-50 text-emerald-600 border border-emerald-200">
                            Verified & Approved
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-3 text-xs" style={{ color: textSecondary }}>
                          <span className="flex items-center gap-1">
                            <FaPhoneAlt className="text-[10px]" /> {lead.phone}
                          </span>
                          {lead.city && <span>• {lead.city}</span>}
                          {lead.salesPersonName && (
                            <span className="flex items-center gap-1 font-medium text-blue-600">
                              <FaUserTie className="text-[10px]" /> Rep: {lead.salesPersonName}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-4 text-right">
                        <div>
                          <div className="text-xs" style={{ color: textSecondary }}>
                            Deal Value
                          </div>
                          <div className="text-base font-extrabold text-slate-900 dark:text-slate-100">
                            {formatINR(lead.dealValue)}
                          </div>
                        </div>

                        <div className="border-l pl-4" style={{ borderColor }}>
                          <div className="text-xs" style={{ color: textSecondary }}>
                            Paid / Pending
                          </div>
                          <div className="text-xs font-bold text-emerald-600">
                            Paid: {formatINR(lead.amountPaid)}
                          </div>
                          <div className="text-xs font-bold text-amber-600">
                            Pending: {formatINR(lead.pendingAmount)}
                          </div>
                        </div>

                        {lead.invoiceUrl && (
                          <a
                            href={getMediaUrl(lead.invoiceUrl)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white transition-all text-xs"
                            title="View Invoice"
                          >
                            <FaFileInvoiceDollar size={16} />
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-xs" style={{ color: textSecondary }}>
                  No lead details found for this period.
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t flex justify-end" style={{ borderColor }}>
              <button
                onClick={() => setModalOpen(false)}
                className="px-5 py-2 text-xs font-bold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
