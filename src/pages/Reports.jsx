import { memo, useState, useEffect, useMemo } from "react";
import { FaChartBar, FaChartLine, FaCheckCircle, FaExclamationCircle, FaRupeeSign, FaCalendarDay, FaCalendarWeek, FaCalendarAlt, FaHistory, FaFilter, FaWrench, FaClipboardCheck, FaHourglassHalf, FaTimes } from "react-icons/fa";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import axios from "axios";
import { toast } from "sonner";
import Highcharts from "highcharts";
import HighchartsReact from "highcharts-react-official";

const TIMEFRAMES = [
  { id: "today", label: "Today", icon: FaCalendarDay },
  { id: "thisWeek", label: "This Week", icon: FaCalendarWeek },
  { id: "thisMonth", label: "This Month", icon: FaCalendarAlt },
  { id: "thisYear", label: "This Year", icon: FaCalendarAlt },
  { id: "allTime", label: "All Time", icon: FaHistory },
];

const Reports = () => {
  const { themeColors } = useTheme();
  const { token } = useAuth();
  
  const [reportsData, setReportsData] = useState(null);
  const [isFetching, setIsFetching] = useState(true);
  const [activeTimeframe, setActiveTimeframe] = useState("thisMonth");

  const [filterStartDate, setFilterStartDate] = useState("");
  const [filterEndDate, setFilterEndDate] = useState("");

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [isDownloading, setIsDownloading] = useState(false);

  // Sales users state
  const [salesUsers, setSalesUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState("");

  // Modal states for KPI details
  const [kpiModalOpen, setKpiModalOpen] = useState(false);
  const [selectedKpi, setSelectedKpi] = useState({ type: "", label: "" });
  const [kpiDetailsData, setKpiDetailsData] = useState([]);
  const [kpiDetailsLoading, setKpiDetailsLoading] = useState(false);
  
  // History Modal states
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [historyLead, setHistoryLead] = useState(null);

  // Fetch Sales Users List
  useEffect(() => {
    const fetchSalesUsers = async () => {
      try {
        const baseUrl = import.meta.env.VITE_API_BASE_URL;
        const res = await axios.get(`${baseUrl}/users/sales-list`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.data.status === "success") {
          setSalesUsers(res.data.data.users || []);
        }
      } catch (err) {
        console.error("Failed to fetch sales users", err);
        toast.error("Failed to load sales employees list");
      }
    };
    if (token) {
      fetchSalesUsers();
    }
  }, [token]);

  const handleKpiClick = async (type, label) => {
    setSelectedKpi({ type, label });
    setKpiModalOpen(true);
    setKpiDetailsLoading(true);
    setKpiDetailsData([]);

    try {
      const baseUrl = import.meta.env.VITE_API_BASE_URL;
      const params = new URLSearchParams();
      params.append("type", type);
      if (selectedUser) {
        params.append("assignedTo", selectedUser);
      }
      
      if (activeTimeframe === "custom") {
        if (filterStartDate) params.append("startDate", filterStartDate);
        if (filterEndDate) params.append("endDate", filterEndDate);
      } else {
        params.append("timeframe", activeTimeframe);
      }

      const res = await axios.get(`${baseUrl}/reports/kpi-details?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.data.status === "success") {
        setKpiDetailsData(res.data.data);
      }
    } catch (err) {
      console.error("Failed to fetch KPI details", err);
      toast.error("Failed to load details");
    } finally {
      setKpiDetailsLoading(false);
    }
  };

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      const baseUrl = import.meta.env.VITE_API_BASE_URL;
      const params = new URLSearchParams();
      if (startDate) params.append("startDate", startDate);
      if (endDate) params.append("endDate", endDate);
      if (statusFilter) params.append("status", statusFilter);

      const res = await axios.get(`${baseUrl}/reports/export/excel?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob'
      });

      const blob = new Blob([res.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `leads_backup_${startDate || 'all'}_to_${endDate || 'all'}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success("Leads backup downloaded successfully!");
    } catch (err) {
      console.error("Download failed", err);
      toast.error("Failed to download leads backup");
    } finally {
      setIsDownloading(false);
    }
  };

  const fetchReports = async () => {
    setIsFetching(true);
    try {
      const baseUrl = import.meta.env.VITE_API_BASE_URL;
      const params = new URLSearchParams();
      if (filterStartDate) params.append("startDate", filterStartDate);
      if (filterEndDate) params.append("endDate", filterEndDate);
      if (selectedUser) params.append("assignedTo", selectedUser);

      const res = await axios.get(`${baseUrl}/reports/analytics?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (res.data.status === "success") {
        setReportsData(res.data.data);
        if (filterStartDate || filterEndDate) {
          setActiveTimeframe("custom");
        }
      }
    } catch (err) {
      console.error("Failed to fetch reports data", err);
      toast.error("Failed to load analytics reports");
    } finally {
      setIsFetching(false);
    }
  };

  useEffect(() => {
    if (!token) return;
    fetchReports();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, selectedUser]);

  const availableTimeframes = useMemo(() => {
    if (reportsData && reportsData.custom) {
      return [...TIMEFRAMES, { id: "custom", label: "Custom Range", icon: FaFilter }];
    }
    return TIMEFRAMES;
  }, [reportsData]);

  const currentData = useMemo(() => {
    if (!reportsData) return null;
    return reportsData[activeTimeframe];
  }, [reportsData, activeTimeframe]);

  const getPieChartOptions = (data, title) => {
    if (!data) return {};
    const chartData = Object.entries(data).map(([name, y]) => ({ name: name.replace(/_/g, ' ').toUpperCase(), y }));
    return {
      chart: { type: 'pie', backgroundColor: 'transparent', height: 300 },
      title: { text: '' },
      tooltip: { pointFormat: '{series.name}: <b>{point.percentage:.1f}%</b>' },
      plotOptions: {
        pie: {
          allowPointSelect: true,
          cursor: 'pointer',
          dataLabels: { enabled: false },
          showInLegend: true,
          borderWidth: 0
        }
      },
      legend: { itemStyle: { color: themeColors.text } },
      series: [{ name: 'Share', colorByPoint: true, data: chartData }],
      credits: { enabled: false }
    };
  };

  const getBarChartOptions = (data, title) => {
    if (!data) return {};
    const categories = Object.keys(data).map(k => k.replace(/_/g, ' ').toUpperCase());
    const chartData = Object.values(data);
    return {
      chart: { type: 'bar', backgroundColor: 'transparent', height: 300 },
      title: { text: '' },
      xAxis: { categories, labels: { style: { color: themeColors.text } } },
      yAxis: { title: { text: '' }, labels: { style: { color: themeColors.textSecondary } }, gridLineColor: themeColors.border },
      plotOptions: { bar: { borderRadius: 4, color: themeColors.primary, colorByPoint: true } },
      legend: { enabled: false },
      series: [{ name: 'Count', data: chartData }],
      credits: { enabled: false }
    };
  };

  const getDoughnutChartOptions = (data, title) => {
    if (!data) return {};
    const chartData = Object.entries(data).map(([name, y]) => ({ name: name.replace(/_/g, ' ').toUpperCase(), y }));
    return {
      chart: { type: 'pie', backgroundColor: 'transparent', height: 300 },
      title: { text: '' },
      tooltip: { pointFormat: '{series.name}: <b>{point.percentage:.1f}%</b>' },
      plotOptions: {
        pie: {
          innerSize: '60%',
          allowPointSelect: true,
          cursor: 'pointer',
          dataLabels: { enabled: false },
          showInLegend: true,
          borderWidth: 0
        }
      },
      legend: { itemStyle: { color: themeColors.text } },
      series: [{ name: 'Share', colorByPoint: true, data: chartData }],
      credits: { enabled: false }
    };
  };

  const renderProgressBars = (data, barColor) => {
    if (!data || Object.keys(data).length === 0) return null;
    const total = Object.values(data).reduce((acc, curr) => acc + curr, 0);
    const sorted = Object.entries(data).sort((a, b) => b[1] - a[1]);

    return (
      <div className="mt-6 space-y-4 pt-6 border-t" style={{ borderColor: themeColors.border }}>
        {sorted.map(([key, count]) => {
          const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
          return (
            <div key={key}>
              <div className="flex justify-between items-end mb-1.5">
                <span className="text-sm font-semibold capitalize" style={{ color: themeColors.text }}>
                  {key.replace(/_/g, ' ')}
                </span>
                <div className="text-right">
                  <span className="text-sm font-bold" style={{ color: themeColors.text }}>{count}</span>
                  <span className="text-xs ml-1" style={{ color: themeColors.textSecondary }}>({percentage}%)</span>
                </div>
              </div>
              <div className="w-full h-2 rounded-full overflow-hidden" style={{ backgroundColor: themeColors.border }}>
                <div 
                  className="h-full rounded-full transition-all duration-1000 ease-out"
                  style={{ width: `${percentage}%`, backgroundColor: barColor || themeColors.primary }}
                ></div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="p-6 animate-fade-in max-w-7xl mx-auto">
      {/* Header Area */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <FaChartBar className="text-2xl" style={{ color: themeColors.primary }} />
            <h1 className="text-2xl font-bold tracking-tight" style={{ color: themeColors.text }}>
              Reports & Analytics
            </h1>
          </div>
          <p className="text-sm" style={{ color: themeColors.textSecondary }}>
            Comprehensive overview of lead generation, conversions, and team performance.
          </p>
        </div>
      </div>

      {/* Selector Box for Sales Executive */}
      <div className="mb-8 p-6 rounded-xl border shadow-sm" style={{ backgroundColor: themeColors.surface, borderColor: themeColors.border }}>
        <div className="flex flex-col md:flex-row items-end gap-4">
          <div className="flex-1 w-full">
            <label className="block text-xs font-bold mb-1.5 uppercase tracking-wider" style={{ color: themeColors.textSecondary }}>
              Filter by Sales Executive
            </label>
            <select
              value={selectedUser}
              onChange={(e) => setSelectedUser(e.target.value)}
              className="w-full p-3 rounded-lg border outline-none text-sm font-medium"
              style={{ backgroundColor: themeColors.background, borderColor: themeColors.border, color: themeColors.text }}
            >
              <option value="">All Sales Executives</option>
              {salesUsers.map((u) => (
                <option key={u._id} value={u._id}>
                  {u.name} ({u.email})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Leads Backup & Export Panel */}
      <div className="mb-8 p-6 rounded-xl border shadow-sm animate-fade-in" style={{ backgroundColor: themeColors.surface, borderColor: themeColors.border }}>
        <h3 className="text-lg font-bold mb-2 flex items-center gap-2" style={{ color: themeColors.text }}>
          <FaClipboardCheck style={{ color: themeColors.primary }} /> Leads Backup & Export
        </h3>
        <p className="text-xs mb-4" style={{ color: themeColors.textSecondary }}>
          Filter leads by registration date range and status to download a backup Excel spreadsheet.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-xs font-bold mb-1.5 uppercase tracking-wider" style={{ color: themeColors.textSecondary }}>Start Date</label>
            <input 
              type="date" 
              value={startDate} 
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full p-2.5 rounded-lg border outline-none text-sm"
              style={{ backgroundColor: themeColors.background, borderColor: themeColors.border, color: themeColors.text }}
            />
          </div>
          <div>
            <label className="block text-xs font-bold mb-1.5 uppercase tracking-wider" style={{ color: themeColors.textSecondary }}>End Date</label>
            <input 
              type="date" 
              value={endDate} 
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full p-2.5 rounded-lg border outline-none text-sm"
              style={{ backgroundColor: themeColors.background, borderColor: themeColors.border, color: themeColors.text }}
            />
          </div>
          <div>
            <label className="block text-xs font-bold mb-1.5 uppercase tracking-wider" style={{ color: themeColors.textSecondary }}>Status</label>
            <select 
              value={statusFilter} 
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full p-2.5 rounded-lg border outline-none text-sm capitalize"
              style={{ backgroundColor: themeColors.background, borderColor: themeColors.border, color: themeColors.text }}
            >
              <option value="">All Statuses</option>
              <option value="new">New</option>
              <option value="assigned">Assigned</option>
              <option value="interested">Interested</option>
              <option value="in_process">In Process</option>
              <option value="converted">Converted</option>
              <option value="closed">Closed</option>
              <option value="not_interested">Not Interested</option>
            </select>
          </div>
        </div>
        <button
          onClick={handleDownload}
          disabled={isDownloading}
          className="px-5 py-2.5 rounded-lg font-bold text-sm transition-all hover:opacity-90 disabled:opacity-50 text-white"
          style={{ backgroundColor: themeColors.primary }}
        >
          {isDownloading ? "Downloading..." : "Download Backup (Excel)"}
        </button>
      </div>

      {/* Timeframe Selector & Custom Filter */}
      <div className="mb-8 flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center">
        <div className="overflow-x-auto pb-2 custom-scrollbar">
          <div className="flex gap-2 min-w-max p-1 bg-black/5 dark:bg-white/5 rounded-xl border w-max" style={{ borderColor: themeColors.border }}>
            {availableTimeframes.map((tf) => {
              const isActive = activeTimeframe === tf.id;
              return (
                <button
                  key={tf.id}
                  onClick={() => setActiveTimeframe(tf.id)}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bold transition-all"
                  style={{
                    backgroundColor: isActive ? themeColors.surface : 'transparent',
                    color: isActive ? themeColors.primary : themeColors.textSecondary,
                    boxShadow: isActive ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                  }}
                >
                  <tf.icon className={isActive ? "text-primary" : "opacity-70"} />
                  {tf.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 p-1 rounded-xl border" style={{ borderColor: themeColors.border, backgroundColor: themeColors.surface }}>
          <input 
            type="date" 
            value={filterStartDate} 
            onChange={(e) => setFilterStartDate(e.target.value)}
            className="p-2 text-sm rounded-lg border outline-none"
            style={{ backgroundColor: themeColors.background, borderColor: themeColors.border, color: themeColors.text }}
            title="Start Date"
          />
          <span className="text-xs font-bold" style={{ color: themeColors.textSecondary }}>to</span>
          <input 
            type="date" 
            value={filterEndDate} 
            onChange={(e) => setFilterEndDate(e.target.value)}
            className="p-2 text-sm rounded-lg border outline-none"
            style={{ backgroundColor: themeColors.background, borderColor: themeColors.border, color: themeColors.text }}
            title="End Date"
          />
          <button
            onClick={fetchReports}
            className="px-4 py-2 rounded-lg text-sm font-bold transition-all hover:opacity-90"
            style={{ backgroundColor: themeColors.primary, color: "#fff" }}
          >
            Apply Filter
          </button>
        </div>
      </div>

      {isFetching ? (
        <div className="py-20 flex flex-col items-center justify-center">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2" style={{ borderColor: themeColors.primary }}></div>
          <p className="mt-4 font-medium" style={{ color: themeColors.textSecondary }}>Generating reports...</p>
        </div>
      ) : currentData ? (
        <>
          {/* Lead KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div 
              onClick={() => handleKpiClick('totalLeads', 'Total Leads')}
              className="rounded-xl p-6 shadow-sm border transition-all duration-300 hover:shadow-md hover:-translate-y-1 cursor-pointer" 
              style={{ backgroundColor: themeColors.surface, borderColor: themeColors.border }}
            >
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium mb-1" style={{ color: themeColors.textSecondary }}>Total Leads</p>
                  <h3 className="text-3xl font-bold" style={{ color: themeColors.text }}>{currentData.totalLeads.toLocaleString()}</h3>
                </div>
                <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${themeColors.primary}15`, color: themeColors.primary }}>
                  <FaChartLine className="text-2xl" />
                </div>
              </div>
            </div>

            <div 
              onClick={() => handleKpiClick('convertedLeads', 'Converted Leads')}
              className="rounded-xl p-6 shadow-sm border transition-all duration-300 hover:shadow-md hover:-translate-y-1 cursor-pointer" 
              style={{ backgroundColor: themeColors.surface, borderColor: themeColors.border }}
            >
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium mb-1" style={{ color: themeColors.textSecondary }}>Converted Leads</p>
                  <h3 className="text-3xl font-bold" style={{ color: themeColors.success }}>{currentData.convertedLeads.toLocaleString()}</h3>
                </div>
                <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${themeColors.success}15`, color: themeColors.success }}>
                  <FaCheckCircle className="text-2xl" />
                </div>
              </div>
            </div>

            <div 
              onClick={() => handleKpiClick('pendingLeads', 'Pending Leads')}
              className="rounded-xl p-6 shadow-sm border transition-all duration-300 hover:shadow-md hover:-translate-y-1 cursor-pointer" 
              style={{ backgroundColor: themeColors.surface, borderColor: themeColors.border }}
            >
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium mb-1" style={{ color: themeColors.textSecondary }}>Pending Leads</p>
                  <h3 className="text-3xl font-bold" style={{ color: themeColors.warning }}>{currentData.pendingLeads.toLocaleString()}</h3>
                </div>
                <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${themeColors.warning}15`, color: themeColors.warning }}>
                  <FaExclamationCircle className="text-2xl" />
                </div>
              </div>
            </div>

          </div>

          {/* Financial KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div 
              onClick={() => handleKpiClick('totalDealValue', 'Total Deal Value')}
              className="rounded-xl p-6 shadow-sm border transition-all duration-300 hover:shadow-md hover:-translate-y-1 relative overflow-hidden cursor-pointer" 
              style={{ backgroundColor: themeColors.surface, borderColor: themeColors.border }}
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-bl-full -mr-10 -mt-10"></div>
              <div className="flex justify-between items-start relative z-10">
                <div>
                  <p className="text-sm font-medium mb-1" style={{ color: themeColors.textSecondary }}>Total Deal Value</p>
                  <h3 className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">
                    ₹{currentData.totalDealValue?.toLocaleString('en-IN') || 0}
                  </h3>
                </div>
                <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
                  <FaRupeeSign className="text-2xl" />
                </div>
              </div>
            </div>

            <div 
              onClick={() => handleKpiClick('amountPaid', 'Amount Paid')}
              className="rounded-xl p-6 shadow-sm border transition-all duration-300 hover:shadow-md hover:-translate-y-1 relative overflow-hidden cursor-pointer" 
              style={{ backgroundColor: themeColors.surface, borderColor: themeColors.border }}
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/10 rounded-bl-full -mr-10 -mt-10"></div>
              <div className="flex justify-between items-start relative z-10">
                <div>
                  <p className="text-sm font-medium mb-1" style={{ color: themeColors.textSecondary }}>Amount Paid</p>
                  <h3 className="text-3xl font-bold text-green-600 dark:text-green-400">
                    ₹{currentData.totalAmountPaid?.toLocaleString('en-IN') || 0}
                  </h3>
                </div>
                <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-green-50 text-green-600 dark:bg-green-900/30 dark:text-green-400">
                  <FaRupeeSign className="text-2xl" />
                </div>
              </div>
            </div>

            <div 
              onClick={() => handleKpiClick('amountPending', 'Amount Pending')}
              className="rounded-xl p-6 shadow-sm border transition-all duration-300 hover:shadow-md hover:-translate-y-1 relative overflow-hidden cursor-pointer" 
              style={{ backgroundColor: themeColors.surface, borderColor: themeColors.border }}
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/10 rounded-bl-full -mr-10 -mt-10"></div>
              <div className="flex justify-between items-start relative z-10">
                <div>
                  <p className="text-sm font-medium mb-1" style={{ color: themeColors.textSecondary }}>Amount Pending</p>
                  <h3 className="text-3xl font-bold text-rose-600 dark:text-rose-400">
                    ₹{currentData.totalAmountPending?.toLocaleString('en-IN') || 0}
                  </h3>
                </div>
                <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-rose-50 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400">
                  <FaRupeeSign className="text-2xl" />
                </div>
              </div>
            </div>
          </div>

          {/* Installation KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div 
              onClick={() => handleKpiClick('totalInstallations', 'Total Installations')}
              className="rounded-xl p-6 shadow-sm border transition-all duration-300 hover:shadow-md hover:-translate-y-1 relative overflow-hidden cursor-pointer" 
              style={{ backgroundColor: themeColors.surface, borderColor: themeColors.border }}
            >
               <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-bl-full -mr-10 -mt-10"></div>
              <div className="flex justify-between items-start relative z-10">
                <div>
                  <p className="text-sm font-medium mb-1" style={{ color: themeColors.textSecondary }}>Total Installations</p>
                  <h3 className="text-3xl font-bold text-blue-600 dark:text-blue-400">{currentData.totalInstallations?.toLocaleString() || 0}</h3>
                </div>
                <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                  <FaWrench className="text-2xl" />
                </div>
              </div>
            </div>

            <div 
              onClick={() => handleKpiClick('completedInstallations', 'Completed Installations')}
              className="rounded-xl p-6 shadow-sm border transition-all duration-300 hover:shadow-md hover:-translate-y-1 relative overflow-hidden cursor-pointer" 
              style={{ backgroundColor: themeColors.surface, borderColor: themeColors.border }}
            >
               <div className="absolute top-0 right-0 w-32 h-32 bg-teal-500/10 rounded-bl-full -mr-10 -mt-10"></div>
              <div className="flex justify-between items-start relative z-10">
                <div>
                  <p className="text-sm font-medium mb-1" style={{ color: themeColors.textSecondary }}>Completed Installations</p>
                  <h3 className="text-3xl font-bold text-teal-600 dark:text-teal-400">{currentData.completedInstallations?.toLocaleString() || 0}</h3>
                </div>
                <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-teal-50 text-teal-600 dark:bg-teal-900/30 dark:text-teal-400">
                  <FaClipboardCheck className="text-2xl" />
                </div>
              </div>
            </div>

            <div 
              onClick={() => handleKpiClick('pendingInstallations', 'Pending Installations')}
              className="rounded-xl p-6 shadow-sm border transition-all duration-300 hover:shadow-md hover:-translate-y-1 relative overflow-hidden cursor-pointer" 
              style={{ backgroundColor: themeColors.surface, borderColor: themeColors.border }}
            >
               <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 rounded-bl-full -mr-10 -mt-10"></div>
              <div className="flex justify-between items-start relative z-10">
                <div>
                  <p className="text-sm font-medium mb-1" style={{ color: themeColors.textSecondary }}>Pending Installations</p>
                  <h3 className="text-3xl font-bold text-orange-600 dark:text-orange-400">{currentData.pendingInstallations?.toLocaleString() || 0}</h3>
                </div>
                <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-orange-50 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400">
                  <FaHourglassHalf className="text-2xl" />
                </div>
              </div>
            </div>
          </div>

          {/* Breakdowns Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6 mb-6">
            <div className="rounded-xl p-6 shadow-sm border h-full" style={{ backgroundColor: themeColors.surface, borderColor: themeColors.border }}>
              <h3 className="text-lg font-bold mb-2 flex items-center gap-2" style={{ color: themeColors.text }}>Status Breakdown</h3>
              {Object.keys(currentData.statusBreakdown || {}).length > 0 ? (
                <>
                  <HighchartsReact highcharts={Highcharts} options={getDoughnutChartOptions(currentData.statusBreakdown)} />
                  {renderProgressBars(currentData.statusBreakdown, themeColors.primary)}
                </>
              ) : (
                <div className="text-center py-12 text-sm italic" style={{ color: themeColors.textSecondary }}>No data available.</div>
              )}
            </div>

            <div className="rounded-xl p-6 shadow-sm border h-full" style={{ backgroundColor: themeColors.surface, borderColor: themeColors.border }}>
              <h3 className="text-lg font-bold mb-2 flex items-center gap-2" style={{ color: themeColors.text }}>Lead Source</h3>
              {Object.keys(currentData.sourceBreakdown || {}).length > 0 ? (
                <>
                  <HighchartsReact highcharts={Highcharts} options={getBarChartOptions(currentData.sourceBreakdown)} />
                  {renderProgressBars(currentData.sourceBreakdown, "#8b5cf6")}
                </>
              ) : (
                <div className="text-center py-12 text-sm italic" style={{ color: themeColors.textSecondary }}>No data available.</div>
              )}
            </div>

            <div className="rounded-xl p-6 shadow-sm border h-full" style={{ backgroundColor: themeColors.surface, borderColor: themeColors.border }}>
              <h3 className="text-lg font-bold mb-2 flex items-center gap-2" style={{ color: themeColors.text }}>Priority Distribution</h3>
              {Object.keys(currentData.priorityBreakdown || {}).length > 0 ? (
                <>
                  <HighchartsReact highcharts={Highcharts} options={getPieChartOptions(currentData.priorityBreakdown)} />
                  {renderProgressBars(currentData.priorityBreakdown, themeColors.warning)}
                </>
              ) : (
                <div className="text-center py-12 text-sm italic" style={{ color: themeColors.textSecondary }}>No data available.</div>
              )}
            </div>

            <div className="rounded-xl p-6 shadow-sm border h-full" style={{ backgroundColor: themeColors.surface, borderColor: themeColors.border }}>
              <h3 className="text-lg font-bold mb-2 flex items-center gap-2" style={{ color: themeColors.text }}>Installation Overview</h3>
              {currentData.totalInstallations > 0 ? (
                <>
                  <HighchartsReact highcharts={Highcharts} options={getDoughnutChartOptions({ Completed: currentData.completedInstallations || 0, Pending: currentData.pendingInstallations || 0 })} />
                  {renderProgressBars({ Completed: currentData.completedInstallations || 0, Pending: currentData.pendingInstallations || 0 }, "#3b82f6")}
                </>
              ) : (
                <div className="text-center py-12 text-sm italic" style={{ color: themeColors.textSecondary }}>No data available.</div>
              )}
            </div>
          </div>
        </>
      ) : (
        <div className="text-center py-20 rounded-xl border border-dashed" style={{ borderColor: themeColors.border }}>
          <p className="text-lg font-medium" style={{ color: themeColors.textSecondary }}>No data available to generate reports.</p>
        </div>
      )}

      {/* KPI Details Modal */}
      {kpiModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
          <div 
            className="w-full max-w-5xl max-h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden"
            style={{ backgroundColor: themeColors.surface, border: `1px solid ${themeColors.border}` }}
          >
            <div className="p-5 flex justify-between items-center border-b" style={{ borderColor: themeColors.border }}>
              <h2 className="text-xl font-bold flex items-center gap-2" style={{ color: themeColors.text }}>
                {selectedKpi.label} Details
              </h2>
              <button 
                onClick={() => setKpiModalOpen(false)}
                className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                style={{ color: themeColors.textSecondary }}
              >
                <FaTimes />
              </button>
            </div>
            
            <div className="p-5 overflow-y-auto flex-1 custom-scrollbar">
              {kpiDetailsLoading ? (
                <div className="py-20 flex flex-col items-center justify-center">
                  <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2" style={{ borderColor: themeColors.primary }}></div>
                  <p className="mt-4 text-sm font-medium" style={{ color: themeColors.textSecondary }}>Loading details...</p>
                </div>
              ) : kpiDetailsData.length === 0 ? (
                <div className="py-12 text-center text-sm italic" style={{ color: themeColors.textSecondary }}>
                  No records found for this period.
                </div>
              ) : (
                <div className="overflow-x-auto rounded-lg border" style={{ borderColor: themeColors.border }}>
                  <table className="w-full text-left text-sm whitespace-nowrap">
                    <thead style={{ backgroundColor: themeColors.background, color: themeColors.textSecondary }}>
                      <tr>
                        <th className="px-4 py-3 font-semibold border-b" style={{ borderColor: themeColors.border }}>Name</th>
                        <th className="px-4 py-3 font-semibold border-b" style={{ borderColor: themeColors.border }}>Phone</th>
                        <th className="px-4 py-3 font-semibold border-b" style={{ borderColor: themeColors.border }}>Status</th>
                        <th className="px-4 py-3 font-semibold border-b" style={{ borderColor: themeColors.border }}>Deal Value</th>
                        <th className="px-4 py-3 font-semibold border-b" style={{ borderColor: themeColors.border }}>Amount Paid</th>
                        <th className="px-4 py-3 font-semibold border-b" style={{ borderColor: themeColors.border }}>Pending</th>
                        <th className="px-4 py-3 font-semibold border-b" style={{ borderColor: themeColors.border }}>Assigned To</th>
                        <th className="px-4 py-3 font-semibold border-b" style={{ borderColor: themeColors.border }}>Installation Proof</th>
                      </tr>
                    </thead>
                    <tbody>
                      {kpiDetailsData.map((lead, idx) => (
                        <tr key={lead._id || idx} className="hover:bg-black/5 dark:hover:bg-white/5 transition-colors border-b last:border-b-0" style={{ borderColor: themeColors.border }}>
                          <td className="px-4 py-3 font-medium cursor-pointer text-blue-600 hover:underline" onClick={() => { setHistoryLead(lead); setIsHistoryModalOpen(true); }}>{lead.name}</td>
                          <td className="px-4 py-3" style={{ color: themeColors.textSecondary }}>{lead.phone}</td>
                          <td className="px-4 py-3">
                            <span className="px-2 py-1 rounded-full text-xs font-semibold capitalize" style={{ backgroundColor: `${themeColors.primary}20`, color: themeColors.primary }}>
                              {lead.status?.replace('_', ' ')}
                            </span>
                          </td>
                          <td className="px-4 py-3 font-medium text-emerald-600 dark:text-emerald-400">₹{lead.dealValue?.toLocaleString() || 0}</td>
                          <td className="px-4 py-3 font-medium text-green-600 dark:text-green-400">₹{lead.amountPaid?.toLocaleString() || 0}</td>
                          <td className="px-4 py-3 font-medium text-rose-600 dark:text-rose-400">₹{lead.pendingAmount?.toLocaleString() || 0}</td>
                          <td className="px-4 py-3" style={{ color: themeColors.textSecondary }}>{lead.assignedTo?.name || 'Unassigned'}</td>
                          <td className="px-4 py-3">
                            {lead.installationProofUrl ? (
                              <a 
                                href={`${import.meta.env.VITE_API_BASE_URL.replace('/api/v1', '')}${lead.installationProofUrl}`} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="inline-block"
                              >
                                <img 
                                  src={`${import.meta.env.VITE_API_BASE_URL.replace('/api/v1', '')}${lead.installationProofUrl}`} 
                                  alt="Proof" 
                                  className="w-10 h-10 object-cover rounded border hover:scale-110 transition-transform cursor-pointer"
                                  onError={(e) => { e.target.style.display = 'none'; }}
                                />
                                <span className="text-xs text-blue-500 underline ml-1">View Image</span>
                              </a>
                            ) : (
                              <span className="text-xs text-gray-400 italic">No Proof Uploaded</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
            
            <div className="p-4 border-t flex justify-end" style={{ borderColor: themeColors.border, backgroundColor: themeColors.background }}>
              <button
                onClick={() => setKpiModalOpen(false)}
                className="px-6 py-2 rounded-lg text-sm font-bold transition-all hover:opacity-90 text-white"
                style={{ backgroundColor: themeColors.primary }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Remarks History Modal */}
      {isHistoryModalOpen && historyLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div 
            className="w-full max-w-2xl rounded-xl shadow-2xl flex flex-col max-h-[85vh] z-50"
            style={{ backgroundColor: themeColors.surface, borderColor: themeColors.border, borderWidth: '1px' }}
          >
            <div className="flex justify-between items-center p-5 border-b shrink-0" style={{ borderColor: themeColors.border }}>
              <div>
                <h2 className="text-lg font-bold" style={{ color: themeColors.text }}>Remarks History</h2>
                <p className="text-xs mt-1" style={{ color: themeColors.textSecondary }}>
                  Lead: <span className="font-bold">{historyLead.name}</span>
                </p>
              </div>
              <button onClick={() => setIsHistoryModalOpen(false)} className="p-2 rounded-full hover:bg-black/5" style={{ color: themeColors.textSecondary }}>
                <FaTimes />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
              {historyLead.remarks && historyLead.remarks.length > 0 ? (
                <div className="space-y-4">
                  {[...historyLead.remarks].reverse().map((remark, idx) => (
                    <div key={idx} className="relative pl-6 pb-2 border-l-2 last:border-l-0 last:pb-0" style={{ borderColor: themeColors.border }}>
                      <div className="absolute -left-[5px] top-0 w-2 h-2 rounded-full ring-4" style={{ backgroundColor: themeColors.primary, ringColor: themeColors.surface }}></div>
                      <div className="p-3 rounded-lg border shadow-sm" style={{ backgroundColor: themeColors.background, borderColor: themeColors.border }}>
                        <div className="flex justify-between items-start gap-4 mb-2">
                          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full" style={{ backgroundColor: `${themeColors.primary}15`, color: themeColors.primary }}>
                            {remark.createdAt ? new Date(remark.createdAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true }) : 'Unknown Date'}
                          </span>
                        </div>
                        <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: themeColors.text }}>
                          {remark.note}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="italic" style={{ color: themeColors.textSecondary }}>No remarks history available for this lead.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default memo(Reports);
