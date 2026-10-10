import { memo, useState, useEffect, useMemo, useCallback } from "react";
import {
  FaHeadset,
  FaPhoneAlt,
  FaCheckCircle,
  FaRupeeSign,
  FaCalendarDay,
  FaCalendarWeek,
  FaCalendarAlt,
  FaHistory,
  FaFilter,
  FaDownload,
  FaSearch,
  FaUser,
  FaCodeBranch,
  FaArrowRight,
  FaWhatsapp,
  FaEye,
  FaTimes,
  FaSyncAlt,
  FaExclamationTriangle,
  FaChartPie,
  FaChartBar,
  FaPhoneVolume,
  FaAward,
  FaMapMarkerAlt,
  FaClock,
  FaFileExport,
  FaGlobeAmericas,
  FaCity
} from "react-icons/fa";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import axios from "axios";
import { toast } from "sonner";
import Highcharts from "highcharts";
import HighchartsReact from "highcharts-react-official";
import SearchableSelect from "../components/SearchableSelect";

const TIMEFRAMES = [
  { id: "today", label: "Today", icon: FaCalendarDay },
  { id: "thisWeek", label: "This Week", icon: FaCalendarWeek },
  { id: "thisMonth", label: "This Month", icon: FaCalendarAlt },
  { id: "thisYear", label: "This Year", icon: FaCalendarAlt },
  { id: "allTime", label: "All Time", icon: FaHistory },
];

const STATUS_CONFIG = {
  new: { label: "New", color: "#2563eb", bg: "bg-blue-100 text-blue-900 border border-blue-200" },
  unscreened: { label: "Unscreened", color: "#4f46e5", bg: "bg-indigo-100 text-indigo-900 border border-indigo-200" },
  screening_in_progress: { label: "Screening In Progress", color: "#7c3aed", bg: "bg-purple-100 text-purple-900 border border-purple-200" },
  interested: { label: "Interested", color: "#0284c7", bg: "bg-sky-100 text-sky-900 border border-sky-300" },
  callback: { label: "Callback", color: "#d97706", bg: "bg-amber-100 text-amber-900 border border-amber-300" },
  qualified: { label: "Qualified", color: "#059669", bg: "bg-emerald-100 text-emerald-900 border border-emerald-300" },
  assigned_to_branch: { label: "Handed Over to Branch", color: "#0d9488", bg: "bg-teal-100 text-teal-900 border border-teal-300" },
  converted: { label: "Converted to Sale", color: "#16a34a", bg: "bg-green-100 text-green-900 border border-green-300" },
  closed: { label: "Closed", color: "#047857", bg: "bg-emerald-100 text-emerald-900 border border-emerald-300" },
  not_interested: { label: "Not Interested", color: "#475569", bg: "bg-slate-200 text-slate-800 border border-slate-300" },
  invalid_number: { label: "Invalid Number", color: "#dc2626", bg: "bg-red-100 text-red-900 border border-red-300" },
  disqualified: { label: "Disqualified", color: "#e11d48", bg: "bg-rose-100 text-rose-900 border border-rose-300" },
  call_done: { label: "Call Done", color: "#334155", bg: "bg-slate-200 text-slate-800 border border-slate-300" },
  other: { label: "Other", color: "#4b5563", bg: "bg-gray-200 text-gray-800 border border-gray-300" }
};

const TelecallerReports = () => {
  const { themeColors } = useTheme();
  const { token } = useAuth();

  // Primary Filters
  const [telecallers, setTelecallers] = useState([]);
  const [branches, setBranches] = useState([]);
  const [selectedTelecaller, setSelectedTelecaller] = useState("all");
  const [selectedBranch, setSelectedBranch] = useState("");
  const [activeTimeframe, setActiveTimeframe] = useState("thisMonth");
  const [filterStartDate, setFilterStartDate] = useState("");
  const [filterEndDate, setFilterEndDate] = useState("");

  // Location-wise Filters
  const [selectedState, setSelectedState] = useState("");
  const [selectedCity, setSelectedCity] = useState("");
  const [selectedPinCode, setSelectedPinCode] = useState("");

  // Report Data
  const [analyticsData, setAnalyticsData] = useState(null);
  const [isFetching, setIsFetching] = useState(false);

  // Drilldown Modal State
  const [drilldownOpen, setDrilldownOpen] = useState(false);
  const [drilldownLoading, setDrilldownLoading] = useState(false);
  const [drilldownData, setDrilldownData] = useState([]);
  const [drilldownTitle, setDrilldownTitle] = useState("");
  const [drilldownSubtitle, setDrilldownSubtitle] = useState("");
  const [drilldownMetric, setDrilldownMetric] = useState("totalLeads");
  const [drilldownStatusValue, setDrilldownStatusValue] = useState("");
  const [drilldownTargetTelecaller, setDrilldownTargetTelecaller] = useState("all");
  const [drilldownSearch, setDrilldownSearch] = useState("");
  const [drilldownStatusFilter, setDrilldownStatusFilter] = useState("");

  // Lead Timeline Modal State
  const [timelineModalOpen, setTimelineModalOpen] = useState(false);
  const [selectedLeadForTimeline, setSelectedLeadForTimeline] = useState(null);

  // Fetch initial telecallers & branches
  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        const baseUrl = import.meta.env.VITE_API_BASE_URL;
        const [telRes, branchRes] = await Promise.all([
          axios.get(`${baseUrl}/users/telecaller-list`, { headers: { Authorization: `Bearer ${token}` } }),
          axios.get(`${baseUrl}/branches`, { headers: { Authorization: `Bearer ${token}` } }).catch(() => ({ data: { data: { branches: [] } } }))
        ]);

        if (telRes.data.status === "success") {
          setTelecallers(telRes.data.data.users || []);
        }

        const bList = branchRes.data?.data?.branches || branchRes.data?.branches || [];
        setBranches(bList);
      } catch (err) {
        console.error("Failed to load telecaller metadata:", err);
        toast.error("Failed to load telecallers list");
      }
    };

    if (token) {
      fetchMetadata();
    }
  }, [token]);

  // Fetch Report Analytics (with Location parameters)
  const fetchAnalytics = useCallback(async () => {
    setIsFetching(true);
    try {
      const baseUrl = import.meta.env.VITE_API_BASE_URL;
      const params = new URLSearchParams();

      if (selectedTelecaller && selectedTelecaller !== "all") {
        params.append("telecallerId", selectedTelecaller);
      }
      if (selectedBranch) {
        params.append("branchId", selectedBranch);
      }
      if (selectedState) {
        params.append("state", selectedState);
      }
      if (selectedCity) {
        params.append("city", selectedCity);
      }
      if (selectedPinCode) {
        params.append("pinCode", selectedPinCode.trim());
      }

      if (activeTimeframe === "custom") {
        if (filterStartDate) params.append("startDate", filterStartDate);
        if (filterEndDate) params.append("endDate", filterEndDate);
      } else {
        params.append("timeframe", activeTimeframe);
      }

      const res = await axios.get(`${baseUrl}/reports/telecaller-analytics?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.data.status === "success") {
        setAnalyticsData(res.data.data);
      }
    } catch (err) {
      console.error("Failed to fetch telecaller analytics:", err);
      toast.error("Failed to load telecaller report");
    } finally {
      setIsFetching(false);
    }
  }, [
    selectedTelecaller,
    selectedBranch,
    selectedState,
    selectedCity,
    selectedPinCode,
    activeTimeframe,
    filterStartDate,
    filterEndDate,
    token
  ]);

  useEffect(() => {
    if (token) {
      fetchAnalytics();
    }
  }, [fetchAnalytics, token]);

  // Open Drilldown View
  const handleOpenDrilldown = async ({
    metricType = "totalLeads",
    title = "Drilldown Leads",
    subtitle = "",
    statusValue = "",
    targetTelecaller = selectedTelecaller,
    targetCity = selectedCity,
    targetState = selectedState
  }) => {
    setDrilldownTitle(title);
    setDrilldownSubtitle(subtitle);
    setDrilldownMetric(metricType);
    setDrilldownStatusValue(statusValue);
    setDrilldownTargetTelecaller(targetTelecaller);
    setDrilldownSearch("");
    setDrilldownStatusFilter(statusValue || "");
    setDrilldownOpen(true);
    setDrilldownLoading(true);
    setDrilldownData([]);

    try {
      const baseUrl = import.meta.env.VITE_API_BASE_URL;
      const params = new URLSearchParams();

      if (targetTelecaller && targetTelecaller !== "all") {
        params.append("telecallerId", targetTelecaller);
      }
      if (metricType) {
        params.append("metricType", metricType);
      }
      if (statusValue) {
        params.append("statusValue", statusValue);
      }
      if (selectedBranch) {
        params.append("branchId", selectedBranch);
      }
      if (targetState) {
        params.append("state", targetState);
      }
      if (targetCity) {
        params.append("city", targetCity);
      }
      if (selectedPinCode) {
        params.append("pinCode", selectedPinCode.trim());
      }

      if (activeTimeframe === "custom") {
        if (filterStartDate) params.append("startDate", filterStartDate);
        if (filterEndDate) params.append("endDate", filterEndDate);
      } else {
        params.append("timeframe", activeTimeframe);
      }

      const res = await axios.get(`${baseUrl}/reports/telecaller-drilldown?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.data.status === "success") {
        setDrilldownData(res.data.data || []);
      }
    } catch (err) {
      console.error("Failed to fetch drilldown leads:", err);
      toast.error("Failed to load drilldown details");
    } finally {
      setDrilldownLoading(false);
    }
  };

  // Filter Drilldown Table
  const filteredDrilldownLeads = useMemo(() => {
    return drilldownData.filter((lead) => {
      const matchesSearch =
        !drilldownSearch ||
        (lead.name && lead.name.toLowerCase().includes(drilldownSearch.toLowerCase())) ||
        (lead.phone && lead.phone.includes(drilldownSearch)) ||
        (lead.city && lead.city.toLowerCase().includes(drilldownSearch.toLowerCase())) ||
        (lead.state && lead.state.toLowerCase().includes(drilldownSearch.toLowerCase())) ||
        (lead.pinCode && lead.pinCode.includes(drilldownSearch)) ||
        (lead.assignedBranch?.name && lead.assignedBranch.name.toLowerCase().includes(drilldownSearch.toLowerCase()));

      const matchesStatus =
        !drilldownStatusFilter || lead.status === drilldownStatusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [drilldownData, drilldownSearch, drilldownStatusFilter]);

  // Export Drilldown to CSV
  const handleExportDrilldownCSV = () => {
    if (!filteredDrilldownLeads.length) {
      toast.info("No leads available to export");
      return;
    }

    const headers = [
      "Customer Name",
      "Phone",
      "Email",
      "City",
      "State",
      "PinCode",
      "Status",
      "Origin Telecaller",
      "Assigned Branch",
      "Follow-up Date",
      "Deal Value (INR)",
      "Amount Paid (INR)",
      "Telecaller Incentive (INR)",
      "Latest Remark",
      "Created At"
    ];

    const rows = filteredDrilldownLeads.map((l) => [
      `"${l.name || 'N/A'}"`,
      `"${l.phone || 'N/A'}"`,
      `"${l.email || 'N/A'}"`,
      `"${l.city || 'N/A'}"`,
      `"${l.state || 'N/A'}"`,
      `"${l.pinCode || 'N/A'}"`,
      `"${(l.status || 'N/A').toUpperCase()}"`,
      `"${l.originTelecaller?.name || 'N/A'}"`,
      `"${l.assignedBranch?.name || 'Unassigned'}"`,
      `"${l.followUpDate ? new Date(l.followUpDate).toLocaleDateString() : 'None'}"`,
      l.dealValue || 0,
      l.amountPaid || 0,
      l.telecallerIncentive || 0,
      `"${(l.remarks?.[l.remarks.length - 1]?.note || '').replace(/"/g, '""')}"`,
      `"${new Date(l.createdAt).toLocaleDateString()}"`
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `telecaller_drilldown_${drilldownMetric}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Drilldown report exported successfully!");
  };

  // Clear all location filters
  const handleClearLocationFilters = () => {
    setSelectedState("");
    setSelectedCity("");
    setSelectedPinCode("");
  };

  const hasLocationFilter = Boolean(selectedState || selectedCity || selectedPinCode);

  // Highcharts Configs
  const statusPieOptions = useMemo(() => {
    if (!analyticsData?.statusBreakdown) return null;
    const chartData = Object.entries(analyticsData.statusBreakdown)
      .filter(([, count]) => count > 0)
      .map(([statusKey, count]) => {
        const conf = STATUS_CONFIG[statusKey] || STATUS_CONFIG.other;
        return {
          name: conf.label,
          y: count,
          color: conf.color,
          statusKey: statusKey
        };
      });

    return {
      chart: { type: "pie", backgroundColor: "transparent", height: 320 },
      title: { text: "" },
      tooltip: {
        pointFormat: "<b>{point.y} Leads</b> ({point.percentage:.1f}%)"
      },
      plotOptions: {
        pie: {
          innerSize: "60%",
          allowPointSelect: true,
          cursor: "pointer",
          dataLabels: { enabled: false },
          showInLegend: true,
          point: {
            events: {
              click: function () {
                handleOpenDrilldown({
                  metricType: "status",
                  statusValue: this.statusKey,
                  title: `${this.name} Leads`,
                  subtitle: `Showing all leads currently in "${this.name}" state`
                });
              }
            }
          }
        }
      },
      legend: {
        itemStyle: { color: themeColors.text, fontSize: "11px", fontWeight: "600" },
        layout: "horizontal",
        align: "center",
        verticalAlign: "bottom"
      },
      series: [{ name: "Status", data: chartData }],
      credits: { enabled: false }
    };
  }, [analyticsData, themeColors]);

  const activityChartOptions = useMemo(() => {
    if (!analyticsData?.dailyActivity) return null;
    const categories = analyticsData.dailyActivity.map((d) => `${d.day} (${d.date.slice(5)})`);
    const callsData = analyticsData.dailyActivity.map((d) => d.calls);
    const qualifiedData = analyticsData.dailyActivity.map((d) => d.qualified);
    const convertedData = analyticsData.dailyActivity.map((d) => d.converted);

    return {
      chart: { type: "column", backgroundColor: "transparent", height: 320 },
      title: { text: "" },
      xAxis: {
        categories,
        labels: { style: { color: themeColors.textSecondary, fontSize: "11px" } },
        lineColor: themeColors.border
      },
      yAxis: {
        title: { text: "Count", style: { color: themeColors.textSecondary } },
        labels: { style: { color: themeColors.textSecondary } },
        gridLineColor: `${themeColors.border}40`,
        allowDecimals: false
      },
      tooltip: { shared: true },
      plotOptions: {
        column: {
          borderRadius: 4,
          borderWidth: 0
        }
      },
      legend: {
        itemStyle: { color: themeColors.text, fontSize: "12px", fontWeight: "600" }
      },
      series: [
        { name: "Calls / Remarks", data: callsData, color: "#3b82f6" },
        { name: "Handed Over", data: qualifiedData, color: "#14b8a6" },
        { name: "Converted Sales", data: convertedData, color: "#10b981" }
      ],
      credits: { enabled: false }
    };
  }, [analyticsData, themeColors]);

  const branchBarOptions = useMemo(() => {
    if (!analyticsData?.branchBreakdown || Object.keys(analyticsData.branchBreakdown).length === 0) return null;
    const entries = Object.entries(analyticsData.branchBreakdown).sort((a, b) => b[1] - a[1]);
    const categories = entries.map(([name]) => name);
    const data = entries.map(([, count]) => count);

    return {
      chart: { type: "bar", backgroundColor: "transparent", height: 280 },
      title: { text: "" },
      xAxis: {
        categories,
        labels: { style: { color: themeColors.text, fontSize: "11px", fontWeight: "500" } },
        lineColor: themeColors.border
      },
      yAxis: {
        title: { text: "Leads Routed", style: { color: themeColors.textSecondary } },
        labels: { style: { color: themeColors.textSecondary } },
        gridLineColor: `${themeColors.border}40`,
        allowDecimals: false
      },
      plotOptions: {
        bar: {
          borderRadius: 4,
          color: themeColors.primary,
          colorByPoint: true,
          point: {
            events: {
              click: function () {
                const branchObj = branches.find((b) => b.name === this.category);
                if (branchObj) {
                  setSelectedBranch(branchObj._id);
                }
              }
            }
          }
        }
      },
      legend: { enabled: false },
      series: [{ name: "Handed Over", data }],
      credits: { enabled: false }
    };
  }, [analyticsData, themeColors, branches]);

  // Location (Top Cities) Bar Options
  const cityBarOptions = useMemo(() => {
    if (!analyticsData?.cityBreakdown || Object.keys(analyticsData.cityBreakdown).length === 0) return null;
    const entries = Object.entries(analyticsData.cityBreakdown).sort((a, b) => b[1] - a[1]).slice(0, 8);
    const categories = entries.map(([name]) => name);
    const data = entries.map(([, count]) => count);

    return {
      chart: { type: "bar", backgroundColor: "transparent", height: 280 },
      title: { text: "" },
      xAxis: {
        categories,
        labels: { style: { color: themeColors.text, fontSize: "11px", fontWeight: "500" } },
        lineColor: themeColors.border
      },
      yAxis: {
        title: { text: "Leads Count", style: { color: themeColors.textSecondary } },
        labels: { style: { color: themeColors.textSecondary } },
        gridLineColor: `${themeColors.border}40`,
        allowDecimals: false
      },
      plotOptions: {
        bar: {
          borderRadius: 4,
          color: "#f59e0b",
          colorByPoint: true,
          point: {
            events: {
              click: function () {
                setSelectedCity(this.category);
              }
            }
          }
        }
      },
      legend: { enabled: false },
      series: [{ name: "Leads", data }],
      credits: { enabled: false }
    };
  }, [analyticsData, themeColors]);

  const summary = analyticsData?.summary || {
    totalLeads: 0,
    totalCalls: 0,
    qualifiedCount: 0,
    convertedCount: 0,
    conversionRate: "0.0%",
    qualificationRate: "0.0%",
    totalDealValue: 0,
    totalIncentive: 0,
    pendingFollowups: 0,
    todayFollowups: 0,
    overdueFollowups: 0,
    upcomingFollowups: 0,
  };

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6 animate-fade-in">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gradient-to-r from-blue-900/10 via-indigo-900/10 to-teal-900/10 p-5 rounded-2xl border" style={{ borderColor: themeColors.border }}>
        <div>
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-blue-600 text-white shadow-lg shadow-blue-500/20">
              <FaHeadset className="text-2xl" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-black tracking-tight" style={{ color: themeColors.text }}>
                Telecaller Performance & Reports
              </h1>
              <p className="text-xs md:text-sm font-medium mt-0.5" style={{ color: themeColors.textSecondary }}>
                Live call tracking audit, geographic location filtering, branch handover logs & full interactive drilldown.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 self-stretch md:self-auto">
          <button
            onClick={fetchAnalytics}
            disabled={isFetching}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition shadow-sm border hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer"
            style={{ backgroundColor: themeColors.surface, borderColor: themeColors.border, color: themeColors.text }}
          >
            <FaSyncAlt className={isFetching ? "animate-spin text-blue-500" : ""} />
            {isFetching ? "Refreshing..." : "Refresh"}
          </button>
          <button
            onClick={() => handleOpenDrilldown({
              metricType: "totalLeads",
              title: "Complete Telecaller Leads Data",
              subtitle: "Export or drilldown across all screened and assigned leads"
            })}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white transition shadow-md hover:opacity-90 cursor-pointer"
            style={{ backgroundColor: themeColors.primary }}
          >
            <FaFileExport />
            Drilldown All Leads
          </button>
        </div>
      </div>

      {/* Filter Toolbar (Telecaller, Branch, Date Range, Location Filtering) */}
      <div className="p-5 rounded-2xl border shadow-sm space-y-4" style={{ backgroundColor: themeColors.surface, borderColor: themeColors.border }}>
        {/* Row 1: Telecaller, Branch & Date */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Select Telecaller */}
          <div>
            <label className="block text-xs font-extrabold uppercase tracking-wider mb-1.5" style={{ color: themeColors.textSecondary }}>
              Telecaller Staff
            </label>
            <SearchableSelect
              options={[
                { value: "all", label: "All Telecallers (Team Overview & Leaderboard)" },
                ...telecallers.map((t) => ({
                  value: t._id,
                  label: `${t.name} (${t.email})${!t.active ? ' [Inactive]' : ''}`,
                })),
              ]}
              value={selectedTelecaller}
              onChange={(val) => setSelectedTelecaller(val || "all")}
              placeholder="Search telecaller by name or email..."
              defaultLabel="All Telecallers"
              icon={FaHeadset}
              themeColors={themeColors}
              className="w-full"
            />
          </div>

          {/* Select Target Branch */}
          <div>
            <label className="block text-xs font-extrabold uppercase tracking-wider mb-1.5" style={{ color: themeColors.textSecondary }}>
              Destination Branch
            </label>
            <SearchableSelect
              options={[
                { value: "", label: "All Branches (Global Routing)" },
                ...branches.map((b) => ({
                  value: b._id,
                  label: `${b.name} (${b.city || "Branch"})`,
                })),
              ]}
              value={selectedBranch}
              onChange={(val) => setSelectedBranch(val || "")}
              placeholder="Filter by target branch..."
              defaultLabel="All Branches"
              icon={FaCodeBranch}
              themeColors={themeColors}
              className="w-full"
            />
          </div>

          {/* Custom Date Range */}
          <div>
            <label className="block text-xs font-extrabold uppercase tracking-wider mb-1.5" style={{ color: themeColors.textSecondary }}>
              Date Range
            </label>
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={filterStartDate}
                onChange={(e) => {
                  setFilterStartDate(e.target.value);
                  setActiveTimeframe("custom");
                }}
                className="w-full p-2 text-xs font-bold rounded-xl border outline-none"
                style={{ backgroundColor: themeColors.background, borderColor: themeColors.border, color: themeColors.text }}
                title="Start Date"
              />
              <span className="text-xs font-bold" style={{ color: themeColors.textSecondary }}>-</span>
              <input
                type="date"
                value={filterEndDate}
                onChange={(e) => {
                  setFilterEndDate(e.target.value);
                  setActiveTimeframe("custom");
                }}
                className="w-full p-2 text-xs font-bold rounded-xl border outline-none"
                style={{ backgroundColor: themeColors.background, borderColor: themeColors.border, color: themeColors.text }}
                title="End Date"
              />
            </div>
          </div>
        </div>

        {/* Row 2: Location-wise Filtering (State, City, Pin Code) */}
        <div className="p-4 rounded-xl border bg-black/5 dark:bg-white/5 space-y-3" style={{ borderColor: themeColors.border }}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-wider flex items-center gap-2" style={{ color: themeColors.text }}>
              <FaMapMarkerAlt className="text-rose-500" /> Location-wise Filtering (State, City & Pincode)
            </span>
            {hasLocationFilter && (
              <button
                onClick={handleClearLocationFilters}
                className="text-xs font-bold text-rose-600 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <FaTimes /> Clear Location Filters
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* State Filter */}
            <div>
              <SearchableSelect
                options={[
                  { value: "", label: "All States / Regions" },
                  ...(analyticsData?.availableLocations?.states || []).map((s) => ({
                    value: s,
                    label: s,
                  })),
                ]}
                value={selectedState}
                onChange={(val) => setSelectedState(val || "")}
                placeholder="Select or search state..."
                defaultLabel="All States"
                icon={FaGlobeAmericas}
                themeColors={themeColors}
                className="w-full"
              />
            </div>

            {/* City Filter */}
            <div>
              <SearchableSelect
                options={[
                  { value: "", label: "All Cities" },
                  ...(analyticsData?.availableLocations?.cities || []).map((c) => ({
                    value: c,
                    label: c,
                  })),
                ]}
                value={selectedCity}
                onChange={(val) => setSelectedCity(val || "")}
                placeholder="Select or search city..."
                defaultLabel="All Cities"
                icon={FaCity}
                themeColors={themeColors}
                className="w-full"
              />
            </div>

            {/* Pin Code Filter */}
            <div className="relative">
              <FaMapMarkerAlt className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs" />
              <input
                type="text"
                placeholder="Filter by PIN Code (e.g. 226001)..."
                value={selectedPinCode}
                onChange={(e) => setSelectedPinCode(e.target.value)}
                className="w-full pl-9 pr-8 py-2 text-xs font-bold rounded-xl border outline-none"
                style={{ backgroundColor: themeColors.background, borderColor: themeColors.border, color: themeColors.text }}
              />
              {selectedPinCode && (
                <button
                  onClick={() => setSelectedPinCode("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
                >
                  <FaTimes />
                </button>
              )}
            </div>
          </div>

          {/* Active Location Filter Badges */}
          {hasLocationFilter && (
            <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
              <span className="font-bold text-slate-400">Active Location Filters:</span>
              {selectedState && (
                <span className="px-2.5 py-1 rounded-lg bg-blue-500/10 text-blue-600 font-bold flex items-center gap-1">
                  State: {selectedState}
                  <FaTimes className="cursor-pointer ml-1" onClick={() => setSelectedState("")} />
                </span>
              )}
              {selectedCity && (
                <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-600 font-bold flex items-center gap-1">
                  City: {selectedCity}
                  <FaTimes className="cursor-pointer ml-1" onClick={() => setSelectedCity("")} />
                </span>
              )}
              {selectedPinCode && (
                <span className="px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-600 font-bold flex items-center gap-1">
                  PIN: {selectedPinCode}
                  <FaTimes className="cursor-pointer ml-1" onClick={() => setSelectedPinCode("")} />
                </span>
              )}
            </div>
          )}
        </div>

        {/* Timeframe Chips */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t" style={{ borderColor: themeColors.border }}>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold mr-1" style={{ color: themeColors.textSecondary }}>Timeframe:</span>
            {TIMEFRAMES.map((tf) => {
              const isActive = activeTimeframe === tf.id;
              return (
                <button
                  key={tf.id}
                  onClick={() => {
                    setActiveTimeframe(tf.id);
                    setFilterStartDate("");
                    setFilterEndDate("");
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                    isActive ? "shadow-sm" : "hover:bg-black/5 dark:hover:bg-white/5 opacity-80"
                  }`}
                  style={{
                    backgroundColor: isActive ? themeColors.primary : "transparent",
                    color: isActive ? "#ffffff" : themeColors.text,
                    border: `1px solid ${isActive ? themeColors.primary : themeColors.border}`
                  }}
                >
                  <tf.icon className="text-xs" />
                  {tf.label}
                </button>
              );
            })}
            {activeTimeframe === "custom" && (
              <span className="px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-500/10 text-amber-600 border border-amber-500/20 flex items-center gap-1">
                <FaFilter className="text-[10px]" />
                Custom Range Active
              </span>
            )}
          </div>

          <div className="text-xs font-medium" style={{ color: themeColors.textSecondary }}>
            {selectedTelecaller !== "all" ? (
              <span className="font-bold text-blue-600 dark:text-blue-400">
                Staff: {telecallers.find((t) => t._id === selectedTelecaller)?.name || "Telecaller"}
              </span>
            ) : (
              <span>Viewing all {telecallers.length} telecallers</span>
            )}
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Leads */}
        <div
          onClick={() => handleOpenDrilldown({
            metricType: "totalLeads",
            title: `Total Leads Handled ${selectedCity ? `(${selectedCity})` : ''}`,
            subtitle: "All customer leads assigned to or screened by telecaller"
          })}
          className="p-5 rounded-2xl border shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-md cursor-pointer group relative overflow-hidden"
          style={{ backgroundColor: themeColors.surface, borderColor: themeColors.border }}
        >
          <div className="flex justify-between items-start mb-3">
            <span className="text-xs font-bold uppercase tracking-wider" style={{ color: themeColors.textSecondary }}>
              Total Leads Handled
            </span>
            <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-600 group-hover:scale-110 transition-transform">
              <FaPhoneAlt className="text-lg" />
            </div>
          </div>
          <div className="text-3xl font-black tracking-tight" style={{ color: themeColors.text }}>
            {summary.totalLeads.toLocaleString()}
          </div>
          <div className="mt-3 flex items-center justify-between text-xs font-semibold">
            <span className="text-blue-600 dark:text-blue-400 flex items-center gap-1">
              Click to drilldown <FaArrowRight className="text-[10px] group-hover:translate-x-1 transition-transform" />
            </span>
            <span className="text-slate-400">Qual Rate: {summary.qualificationRate}</span>
          </div>
        </div>

        {/* Calls / Remarks Logged */}
        <div
          onClick={() => handleOpenDrilldown({
            metricType: "callsLogged",
            title: "Calls & Screenings Logged",
            subtitle: "All audit call remarks submitted by telecallers"
          })}
          className="p-5 rounded-2xl border shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-md cursor-pointer group relative overflow-hidden"
          style={{ backgroundColor: themeColors.surface, borderColor: themeColors.border }}
        >
          <div className="flex justify-between items-start mb-3">
            <span className="text-xs font-bold uppercase tracking-wider" style={{ color: themeColors.textSecondary }}>
              Calls & Remarks Logged
            </span>
            <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-600 group-hover:scale-110 transition-transform">
              <FaPhoneVolume className="text-lg" />
            </div>
          </div>
          <div className="text-3xl font-black tracking-tight" style={{ color: themeColors.text }}>
            {summary.totalCalls.toLocaleString()}
          </div>
          <div className="mt-3 flex items-center justify-between text-xs font-semibold">
            <span className="text-purple-600 dark:text-purple-400 flex items-center gap-1">
              Audit logs <FaArrowRight className="text-[10px] group-hover:translate-x-1 transition-transform" />
            </span>
            <span className="text-slate-400">
              Avg {summary.totalLeads > 0 ? (summary.totalCalls / summary.totalLeads).toFixed(1) : 0} calls/lead
            </span>
          </div>
        </div>

        {/* Handed Over to Branch */}
        <div
          onClick={() => handleOpenDrilldown({
            metricType: "qualified",
            title: "Qualified & Handed Over to Branch",
            subtitle: "Leads verified and assigned to regional branches"
          })}
          className="p-5 rounded-2xl border shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-md cursor-pointer group relative overflow-hidden"
          style={{ backgroundColor: themeColors.surface, borderColor: themeColors.border }}
        >
          <div className="flex justify-between items-start mb-3">
            <span className="text-xs font-bold uppercase tracking-wider" style={{ color: themeColors.textSecondary }}>
              Handed Over to Branch
            </span>
            <div className="p-2.5 rounded-xl bg-teal-500/10 text-teal-600 group-hover:scale-110 transition-transform">
              <FaCodeBranch className="text-lg" />
            </div>
          </div>
          <div className="text-3xl font-black text-teal-600 dark:text-teal-400 tracking-tight">
            {summary.qualifiedCount.toLocaleString()}
          </div>
          <div className="mt-3 flex items-center justify-between text-xs font-semibold">
            <span className="text-teal-600 dark:text-teal-400 flex items-center gap-1">
              Branch handovers <FaArrowRight className="text-[10px] group-hover:translate-x-1 transition-transform" />
            </span>
            <span className="text-teal-600 font-bold bg-teal-500/10 px-2 py-0.5 rounded-full">
              {summary.qualificationRate}
            </span>
          </div>
        </div>

        {/* Converted into Sales */}
        <div
          onClick={() => handleOpenDrilldown({
            metricType: "converted",
            title: "Converted Branch Sales (Won)",
            subtitle: "Qualified leads that successfully converted into won orders"
          })}
          className="p-5 rounded-2xl border shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-md cursor-pointer group relative overflow-hidden"
          style={{ backgroundColor: themeColors.surface, borderColor: themeColors.border }}
        >
          <div className="flex justify-between items-start mb-3">
            <span className="text-xs font-bold uppercase tracking-wider" style={{ color: themeColors.textSecondary }}>
              Converted to Sales (Won)
            </span>
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 group-hover:scale-110 transition-transform">
              <FaCheckCircle className="text-lg" />
            </div>
          </div>
          <div className="text-3xl font-black text-emerald-600 dark:text-emerald-400 tracking-tight">
            {summary.convertedCount.toLocaleString()}
          </div>
          <div className="mt-3 flex items-center justify-between text-xs font-semibold">
            <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
              Conversion Rate: <span className="font-extrabold">{summary.conversionRate}</span>
            </span>
            <span className="text-emerald-600 font-bold">
              ₹{Number(summary.totalDealValue).toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* Follow-up & Financial Secondary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Follow-up Tracking */}
        <div className="p-5 rounded-2xl border shadow-sm flex flex-col justify-between" style={{ backgroundColor: themeColors.surface, borderColor: themeColors.border }}>
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5" style={{ color: themeColors.textSecondary }}>
                <FaClock className="text-amber-500" /> Follow-up Pipeline
              </span>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600">
                {summary.pendingFollowups} Pending
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2 mt-3 text-center">
              <div
                onClick={() => handleOpenDrilldown({
                  metricType: "todayFollowups",
                  title: "Today's Follow-up Leads",
                  subtitle: "Scheduled for calling today"
                })}
                className="p-2.5 rounded-xl bg-blue-50 hover:bg-blue-100 transition cursor-pointer border border-blue-200"
              >
                <div className="text-xs text-blue-700 font-extrabold">Today</div>
                <div className="text-xl font-black text-blue-900 mt-1">{summary.todayFollowups}</div>
              </div>
              <div
                onClick={() => handleOpenDrilldown({
                  metricType: "overdueFollowups",
                  title: "Overdue / Missed Follow-ups",
                  subtitle: "Follow-up dates in the past needing immediate attention"
                })}
                className="p-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 transition cursor-pointer border border-rose-200"
              >
                <div className="text-xs text-rose-700 font-extrabold">Overdue</div>
                <div className="text-xl font-black text-rose-900 mt-1">{summary.overdueFollowups}</div>
              </div>
              <div
                onClick={() => handleOpenDrilldown({
                  metricType: "pendingFollowups",
                  title: "Upcoming Scheduled Follow-ups",
                  subtitle: "All pending follow-ups in queue"
                })}
                className="p-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 transition cursor-pointer border border-emerald-200"
              >
                <div className="text-xs text-emerald-700 font-extrabold">Upcoming</div>
                <div className="text-xl font-black text-emerald-900 mt-1">{summary.upcomingFollowups}</div>
              </div>
            </div>
          </div>
          <button
            onClick={() => handleOpenDrilldown({
              metricType: "overdueFollowups",
              title: "Overdue Follow-ups Calling Queue",
              subtitle: "Immediate priority leads with passed follow-up dates"
            })}
            className="mt-4 text-xs font-bold text-rose-700 flex items-center justify-center gap-1 hover:underline cursor-pointer"
          >
            <FaExclamationTriangle /> View {summary.overdueFollowups} Overdue Follow-ups in Drilldown
          </button>
        </div>

        {/* Telecaller Incentive Split */}
        <div className="p-5 rounded-2xl border shadow-sm flex flex-col justify-between" style={{ backgroundColor: themeColors.surface, borderColor: themeColors.border }}>
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5" style={{ color: themeColors.textSecondary }}>
                <FaAward className="text-purple-600" /> Accrued Telecaller Incentive
              </span>
              <span className="text-xs font-extrabold px-2 py-0.5 rounded-full bg-purple-100 text-purple-900 border border-purple-200">
                Performance Pay
              </span>
            </div>
            <div className="text-3xl font-black text-purple-700 mt-2">
              ₹{Number(summary.totalIncentive).toLocaleString()}
            </div>
            <p className="text-xs mt-1 font-medium text-slate-700" style={{ color: themeColors.textSecondary }}>
              Calculated automatically from {summary.convertedCount} converted sales generated through qualified telecaller routing.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t flex justify-between items-center text-xs font-bold" style={{ borderColor: themeColors.border }}>
            <span style={{ color: themeColors.textSecondary }}>Total Pipeline Revenue:</span>
            <span className="text-emerald-700 font-extrabold">₹{Number(summary.totalDealValue).toLocaleString()}</span>
          </div>
        </div>

        {/* Branch Routing Quick Status */}
        <div className="p-5 rounded-2xl border shadow-sm flex flex-col justify-between" style={{ backgroundColor: themeColors.surface, borderColor: themeColors.border }}>
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5" style={{ color: themeColors.textSecondary }}>
                <FaCodeBranch className="text-teal-600" /> Branch Routing Health
              </span>
              <span className="text-xs font-extrabold px-2 py-0.5 rounded-full bg-teal-100 text-teal-900 border border-teal-200">
                {Object.keys(analyticsData?.branchBreakdown || {}).length} Branches Active
              </span>
            </div>
            <div className="text-3xl font-black text-teal-800 mt-2">
              {summary.qualifiedCount} Leads Routed
            </div>
            <p className="text-xs mt-1" style={{ color: themeColors.textSecondary }}>
              {summary.totalLeads > 0
                ? `${((summary.qualifiedCount / summary.totalLeads) * 100).toFixed(1)}% of total leads passed initial telecaller screening and reached branches.`
                : "No leads routed in this period."}
            </p>
          </div>
          <div className="mt-4 pt-3 border-t flex justify-between items-center text-xs font-bold" style={{ borderColor: themeColors.border }}>
            <span style={{ color: themeColors.textSecondary }}>Won After Routing:</span>
            <span className="text-emerald-600 font-extrabold">
              {summary.qualifiedCount > 0 ? ((summary.convertedCount / summary.qualifiedCount) * 100).toFixed(1) : 0}% Conversion
            </span>
          </div>
        </div>
      </div>

      {/* Visual Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Pipeline Breakdown */}
        <div className="p-5 rounded-2xl border shadow-sm" style={{ backgroundColor: themeColors.surface, borderColor: themeColors.border }}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-extrabold flex items-center gap-2" style={{ color: themeColors.text }}>
                <FaChartPie className="text-blue-500" /> Lead Screening Pipeline
              </h2>
              <p className="text-xs" style={{ color: themeColors.textSecondary }}>
                Click any slice to view drilldown leads for that status
              </p>
            </div>
          </div>

          {statusPieOptions ? (
            <HighchartsReact highcharts={Highcharts} options={statusPieOptions} />
          ) : (
            <div className="py-24 text-center text-xs italic" style={{ color: themeColors.textSecondary }}>
              No status records found for this period.
            </div>
          )}

          {/* Quick Status Chips */}
          <div className="mt-4 pt-3 border-t flex flex-wrap gap-1.5" style={{ borderColor: themeColors.border }}>
            {Object.entries(analyticsData?.statusBreakdown || {})
              .filter(([, count]) => count > 0)
              .map(([key, count]) => {
                const conf = STATUS_CONFIG[key] || STATUS_CONFIG.other;
                return (
                  <button
                    key={key}
                    onClick={() => handleOpenDrilldown({
                      metricType: "status",
                      statusValue: key,
                      title: `${conf.label} Leads`,
                      subtitle: `Filtering leads with status: ${conf.label}`
                    })}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition cursor-pointer flex items-center gap-1.5 ${conf.bg}`}
                    style={{ borderColor: `${conf.color}40` }}
                  >
                    <span>{conf.label}</span>
                    <span className="bg-white/80 dark:bg-black/40 px-1.5 py-0.2 rounded-full text-[11px] font-black">
                      {count}
                    </span>
                  </button>
                );
              })}
          </div>
        </div>

        {/* 7-Day Activity Trend */}
        <div className="p-5 rounded-2xl border shadow-sm" style={{ backgroundColor: themeColors.surface, borderColor: themeColors.border }}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-extrabold flex items-center gap-2" style={{ color: themeColors.text }}>
                <FaChartBar className="text-indigo-500" /> Daily Calling & Screening Activity (7 Days)
              </h2>
              <p className="text-xs" style={{ color: themeColors.textSecondary }}>
                Volume of call remarks logged vs leads qualified & converted per day
              </p>
            </div>
          </div>

          {activityChartOptions ? (
            <HighchartsReact highcharts={Highcharts} options={activityChartOptions} />
          ) : (
            <div className="py-24 text-center text-xs italic" style={{ color: themeColors.textSecondary }}>
              No calling activity recorded in the past 7 days.
            </div>
          )}
        </div>
      </div>

      {/* Row: Location (Cities) Breakdown & Regional Branch Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Geographic City Distribution */}
        <div className="p-5 rounded-2xl border shadow-sm" style={{ backgroundColor: themeColors.surface, borderColor: themeColors.border }}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-extrabold flex items-center gap-2" style={{ color: themeColors.text }}>
                <FaCity className="text-amber-500" /> Geographic Location Breakdown (Top Cities)
              </h2>
              <p className="text-xs" style={{ color: themeColors.textSecondary }}>
                Click any city bar to filter report and drilldown directly by that city
              </p>
            </div>
          </div>

          {cityBarOptions ? (
            <HighchartsReact highcharts={Highcharts} options={cityBarOptions} />
          ) : (
            <div className="py-24 text-center text-xs italic" style={{ color: themeColors.textSecondary }}>
              No city records found for current filter.
            </div>
          )}

          {/* Top Cities Quick Badges */}
          {analyticsData?.cityBreakdown && Object.keys(analyticsData.cityBreakdown).length > 0 && (
            <div className="mt-4 pt-3 border-t flex flex-wrap gap-1.5" style={{ borderColor: themeColors.border }}>
              {Object.entries(analyticsData.cityBreakdown)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 10)
                .map(([cityName, count]) => (
                  <button
                    key={cityName}
                    onClick={() => {
                      setSelectedCity(cityName);
                      handleOpenDrilldown({
                        metricType: "totalLeads",
                        targetCity: cityName,
                        title: `Leads in ${cityName}`,
                        subtitle: `Geographic location drilldown for ${cityName}`
                      });
                    }}
                    className="px-2.5 py-1 rounded-lg text-xs font-bold border transition cursor-pointer flex items-center gap-1.5 bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30 hover:bg-amber-500/20"
                  >
                    <FaMapMarkerAlt className="text-[10px]" />
                    <span>{cityName}</span>
                    <span className="bg-white/80 dark:bg-black/40 px-1.5 py-0.2 rounded-full text-[11px] font-black">
                      {count}
                    </span>
                  </button>
                ))}
            </div>
          )}
        </div>

        {/* Destination Branch Routing Distribution */}
        <div className="p-5 rounded-2xl border shadow-sm" style={{ backgroundColor: themeColors.surface, borderColor: themeColors.border }}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-extrabold flex items-center gap-2" style={{ color: themeColors.text }}>
                <FaCodeBranch className="text-teal-500" /> Regional Branch Routing Distribution
              </h2>
              <p className="text-xs" style={{ color: themeColors.textSecondary }}>
                Number of qualified leads handed over to each regional branch
              </p>
            </div>
          </div>

          {branchBarOptions ? (
            <HighchartsReact highcharts={Highcharts} options={branchBarOptions} />
          ) : (
            <div className="py-24 text-center text-xs italic" style={{ color: themeColors.textSecondary }}>
              No branch handovers recorded for this period.
            </div>
          )}
        </div>
      </div>

      {/* Telecaller Comparison Leaderboard */}
      <div className="p-5 rounded-2xl border shadow-sm space-y-4" style={{ backgroundColor: themeColors.surface, borderColor: themeColors.border }}>
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
          <div>
            <h2 className="text-lg font-black flex items-center gap-2" style={{ color: themeColors.text }}>
              <FaAward className="text-amber-500" /> Telecaller Staff Leaderboard & Drilldown
            </h2>
            <p className="text-xs font-medium" style={{ color: themeColors.textSecondary }}>
              Compare calling efficiency, qualification rate, conversion rate, and pending follow-ups for each telecaller.
            </p>
          </div>
          <span className="text-xs font-bold px-3 py-1 rounded-full bg-blue-500/10 text-blue-600 self-start sm:self-auto">
            {analyticsData?.leaderboard?.length || 0} Staff Members
          </span>
        </div>

        <div className="overflow-x-auto rounded-xl border" style={{ borderColor: themeColors.border }}>
          <table className="w-full text-left text-xs whitespace-nowrap">
            <thead style={{ backgroundColor: themeColors.background, color: themeColors.textSecondary }}>
              <tr className="border-b" style={{ borderColor: themeColors.border }}>
                <th className="px-4 py-3.5 font-extrabold">Telecaller Name</th>
                <th className="px-4 py-3.5 font-extrabold text-center">Total Leads</th>
                <th className="px-4 py-3.5 font-extrabold text-center">Calls Logged</th>
                <th className="px-4 py-3.5 font-extrabold text-center">Handed Over</th>
                <th className="px-4 py-3.5 font-extrabold text-center">Converted</th>
                <th className="px-4 py-3.5 font-extrabold text-center">Conversion Rate</th>
                <th className="px-4 py-3.5 font-extrabold text-right">Deal Value</th>
                <th className="px-4 py-3.5 font-extrabold text-center">Follow-ups</th>
                <th className="px-4 py-3.5 font-extrabold text-center">Action</th>
              </tr>
            </thead>
            <tbody>
              {analyticsData?.leaderboard?.length ? (
                analyticsData.leaderboard.map((item, idx) => (
                  <tr
                    key={item._id || idx}
                    className="hover:bg-black/5 dark:hover:bg-white/5 transition-colors border-b last:border-b-0"
                    style={{ borderColor: themeColors.border }}
                  >
                    <td className="px-4 py-3.5 font-medium">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-black flex items-center justify-center text-xs shadow-sm">
                          {item.name ? item.name.charAt(0).toUpperCase() : "T"}
                        </div>
                        <div>
                          <div className="font-bold flex items-center gap-1.5" style={{ color: themeColors.text }}>
                            {item.name}
                            {!item.active && (
                              <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-200 text-slate-700 font-semibold">
                                Inactive
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] font-medium" style={{ color: themeColors.textSecondary }}>
                            {item.email} {item.phone ? `• ${item.phone}` : ""}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-center font-bold" style={{ color: themeColors.text }}>
                      {item.totalLeads}
                    </td>
                    <td className="px-4 py-3.5 text-center font-bold text-purple-600 dark:text-purple-400">
                      {item.totalCalls}
                    </td>
                    <td className="px-4 py-3.5 text-center font-bold text-teal-600 dark:text-teal-400">
                      {item.qualified}
                    </td>
                    <td className="px-4 py-3.5 text-center font-bold text-emerald-600 dark:text-emerald-400">
                      {item.converted}
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <div className="inline-flex items-center gap-1.5">
                        <div className="w-16 h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                          <div
                            className="h-full bg-emerald-500 rounded-full"
                            style={{ width: `${Math.min(parseFloat(item.conversionRate) || 0, 100)}%` }}
                          />
                        </div>
                        <span className="font-bold text-[11px]" style={{ color: themeColors.text }}>
                          {item.conversionRate}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-right font-bold text-emerald-600 dark:text-emerald-400">
                      ₹{item.dealValue.toLocaleString()}
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <span className="font-bold text-slate-700 dark:text-slate-300">
                        {item.pendingFollowups}
                      </span>
                      {item.overdueFollowups > 0 && (
                        <span className="ml-1 text-[10px] font-black px-1.5 py-0.5 rounded-full bg-rose-500/10 text-rose-600">
                          {item.overdueFollowups} overdue
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <button
                        onClick={() => handleOpenDrilldown({
                          metricType: "totalLeads",
                          targetTelecaller: item._id,
                          title: `${item.name}'s Leads Drilldown`,
                          subtitle: `All leads handled and screened by ${item.name}`
                        })}
                        className="px-3 py-1.5 rounded-lg text-xs font-bold text-white transition shadow-sm hover:opacity-90 cursor-pointer flex items-center gap-1 mx-auto"
                        style={{ backgroundColor: themeColors.primary }}
                      >
                        <FaEye className="text-[10px]" /> View Leads
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-xs italic" style={{ color: themeColors.textSecondary }}>
                    No telecaller performance records found for this period.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* DRILLDOWN MODAL */}
      {drilldownOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-3 md:p-6 animate-fade-in">
          <div
            className="w-full max-w-6xl max-h-[92vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden border"
            style={{ backgroundColor: themeColors.surface, borderColor: themeColors.border }}
          >
            {/* Drilldown Header */}
            <div className="p-5 border-b flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3" style={{ borderColor: themeColors.border }}>
              <div>
                <div className="flex items-center gap-2">
                  <span className="p-2 rounded-xl bg-blue-500/10 text-blue-600">
                    <FaHeadset className="text-base" />
                  </span>
                  <h2 className="text-xl font-black tracking-tight" style={{ color: themeColors.text }}>
                    {drilldownTitle}
                  </h2>
                </div>
                {drilldownSubtitle && (
                  <p className="text-xs font-medium mt-0.5" style={{ color: themeColors.textSecondary }}>
                    {drilldownSubtitle}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <button
                  onClick={handleExportDrilldownCSV}
                  disabled={!filteredDrilldownLeads.length}
                  className="px-3.5 py-2 rounded-xl text-xs font-bold text-emerald-700 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <FaDownload /> Export CSV ({filteredDrilldownLeads.length})
                </button>
                <button
                  onClick={() => setDrilldownOpen(false)}
                  className="p-2.5 rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition cursor-pointer"
                  style={{ color: themeColors.textSecondary }}
                >
                  <FaTimes className="text-base" />
                </button>
              </div>
            </div>

            {/* Drilldown Filter Bar */}
            <div className="p-4 border-b flex flex-col sm:flex-row gap-3 bg-black/5 dark:bg-white/5" style={{ borderColor: themeColors.border }}>
              <div className="relative flex-1">
                <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs" />
                <input
                  type="text"
                  placeholder="Search by customer name, phone, city, state, pincode, branch..."
                  value={drilldownSearch}
                  onChange={(e) => setDrilldownSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border outline-none font-medium"
                  style={{ backgroundColor: themeColors.background, borderColor: themeColors.border, color: themeColors.text }}
                />
              </div>

              <select
                value={drilldownStatusFilter}
                onChange={(e) => setDrilldownStatusFilter(e.target.value)}
                className="px-3 py-2 text-xs font-bold rounded-xl border outline-none cursor-pointer"
                style={{ backgroundColor: themeColors.background, borderColor: themeColors.border, color: themeColors.text }}
              >
                <option value="">All Statuses ({drilldownData.length})</option>
                {Object.entries(STATUS_CONFIG).map(([key, conf]) => (
                  <option key={key} value={key}>
                    {conf.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Drilldown Content Table */}
            <div className="p-4 overflow-y-auto flex-1 custom-scrollbar">
              {drilldownLoading ? (
                <div className="py-24 flex flex-col items-center justify-center">
                  <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2" style={{ borderColor: themeColors.primary }}></div>
                  <p className="mt-4 text-xs font-bold" style={{ color: themeColors.textSecondary }}>
                    Loading drilldown leads data...
                  </p>
                </div>
              ) : filteredDrilldownLeads.length === 0 ? (
                <div className="py-24 text-center text-xs italic" style={{ color: themeColors.textSecondary }}>
                  No leads found matching current drilldown criteria.
                </div>
              ) : (
                <div className="overflow-x-auto rounded-xl border" style={{ borderColor: themeColors.border }}>
                  <table className="w-full text-left text-xs whitespace-nowrap">
                    <thead style={{ backgroundColor: themeColors.background, color: themeColors.textSecondary }}>
                      <tr className="border-b" style={{ borderColor: themeColors.border }}>
                        <th className="px-4 py-3 font-extrabold">Customer Name & Contact</th>
                        <th className="px-4 py-3 font-extrabold">Location (City, State, Pin)</th>
                        <th className="px-4 py-3 font-extrabold">Status</th>
                        <th className="px-4 py-3 font-extrabold">Origin Telecaller</th>
                        <th className="px-4 py-3 font-extrabold">Assigned Branch</th>
                        <th className="px-4 py-3 font-extrabold">Follow-up Date</th>
                        <th className="px-4 py-3 font-extrabold">Latest Call Remark</th>
                        <th className="px-4 py-3 font-extrabold text-right">Deal Value</th>
                        <th className="px-4 py-3 font-extrabold text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredDrilldownLeads.map((lead, idx) => {
                        const statusConf = STATUS_CONFIG[lead.status] || STATUS_CONFIG.other;
                        const latestRemark = Array.isArray(lead.remarks) && lead.remarks.length > 0
                          ? lead.remarks[lead.remarks.length - 1]
                          : null;

                        const isFollowupOverdue = lead.followUpDate && new Date(lead.followUpDate) < new Date(new Date().setHours(0, 0, 0, 0));
                        const isFollowupToday = lead.followUpDate && new Date(lead.followUpDate).toDateString() === new Date().toDateString();

                        return (
                          <tr
                            key={lead._id || idx}
                            className="hover:bg-slate-100/70 transition-colors border-b last:border-b-0"
                            style={{ borderColor: themeColors.border }}
                          >
                            <td className="px-4 py-3">
                              <div className="font-extrabold text-slate-900 text-sm" style={{ color: themeColors.text }}>
                                {lead.name || "Unnamed"}
                              </div>
                              <div className="text-xs font-bold text-blue-700 flex items-center gap-1.5 mt-0.5">
                                <FaPhoneAlt className="text-[10px]" /> {lead.phone}
                              </div>
                            </td>

                            <td className="px-4 py-3">
                              <div className="flex items-center gap-1.5">
                                <FaMapMarkerAlt className="text-rose-500 text-xs shrink-0" />
                                <span className="font-bold text-slate-800 text-xs" style={{ color: themeColors.text }}>
                                  {lead.city || lead.state ? (
                                    <>
                                      {lead.city && <span>{lead.city}</span>}
                                      {lead.state && <span className="text-slate-600 font-semibold ml-1">({lead.state})</span>}
                                      {lead.pinCode && <span className="text-slate-600 font-semibold ml-1">• {lead.pinCode}</span>}
                                    </>
                                  ) : (
                                    <span className="text-slate-400 font-medium italic">N/A</span>
                                  )}
                                </span>
                              </div>
                            </td>

                            <td className="px-4 py-3">
                              <span className={`px-2.5 py-1 rounded-full text-xs font-black capitalize inline-block shadow-xs ${statusConf.bg}`}>
                                {statusConf.label}
                              </span>
                            </td>

                            <td className="px-4 py-3 font-bold text-slate-800 text-xs" style={{ color: themeColors.text }}>
                              {lead.originTelecaller?.name || lead.assignedTo?.name || "Unassigned"}
                            </td>

                            <td className="px-4 py-3 font-extrabold text-teal-800 text-xs">
                              {lead.assignedBranch?.name || "Pending Routing"}
                            </td>

                            <td className="px-4 py-3">
                              {lead.followUpDate ? (
                                <div>
                                  <div className="font-bold text-slate-900 text-xs" style={{ color: themeColors.text }}>
                                    {new Date(lead.followUpDate).toLocaleDateString()}
                                  </div>
                                  {isFollowupOverdue && (
                                    <span className="text-[10px] font-black text-rose-800 bg-rose-100 border border-rose-300 px-1.5 py-0.5 rounded-full inline-block mt-0.5">
                                      Overdue
                                    </span>
                                  )}
                                  {isFollowupToday && (
                                    <span className="text-[10px] font-black text-amber-800 bg-amber-100 border border-amber-300 px-1.5 py-0.5 rounded-full inline-block mt-0.5">
                                      Today
                                    </span>
                                  )}
                                </div>
                              ) : (
                                <span className="text-slate-400 font-medium italic text-xs">None</span>
                              )}
                            </td>

                            <td className="px-4 py-3 max-w-xs">
                              {latestRemark ? (
                                <div className="truncate text-xs font-medium text-slate-800" title={latestRemark.note} style={{ color: themeColors.text }}>
                                  <span className="font-bold text-slate-600">[{new Date(latestRemark.createdAt).toLocaleDateString()}]:</span> {latestRemark.note}
                                </div>
                              ) : (
                                <span className="text-slate-400 italic text-xs">No remarks logged</span>
                              )}
                            </td>

                            <td className="px-4 py-3 text-right font-black text-emerald-700 text-sm">
                              ₹{Number(lead.dealValue || 0).toLocaleString()}
                            </td>

                            <td className="px-4 py-3 text-center">
                              <div className="flex items-center justify-center gap-1.5">
                                <button
                                  onClick={() => {
                                    setSelectedLeadForTimeline(lead);
                                    setTimelineModalOpen(true);
                                  }}
                                  className="p-1.5 rounded-lg text-xs font-bold text-blue-600 bg-blue-500/10 hover:bg-blue-500/20 transition cursor-pointer"
                                  title="View Calling Timeline"
                                >
                                  <FaEye />
                                </button>
                                {lead.phone && (
                                  <a
                                    href={`tel:${lead.phone}`}
                                    className="p-1.5 rounded-lg text-xs font-bold text-emerald-600 bg-emerald-500/10 hover:bg-emerald-500/20 transition"
                                    title="Call Customer"
                                  >
                                    <FaPhoneAlt />
                                  </a>
                                )}
                                {lead.phone && (
                                  <a
                                    href={`https://wa.me/91${lead.phone.replace(/\D/g, '').slice(-10)}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="p-1.5 rounded-lg text-xs font-bold text-green-600 bg-green-500/10 hover:bg-green-500/20 transition"
                                    title="WhatsApp Customer"
                                  >
                                    <FaWhatsapp />
                                  </a>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Drilldown Footer */}
            <div className="p-4 border-t flex flex-col sm:flex-row justify-between items-center gap-2 bg-black/5 dark:bg-white/5" style={{ borderColor: themeColors.border }}>
              <span className="text-xs font-bold" style={{ color: themeColors.textSecondary }}>
                Showing {filteredDrilldownLeads.length} of {drilldownData.length} records in drilldown
              </span>
              <button
                onClick={() => setDrilldownOpen(false)}
                className="px-6 py-2 rounded-xl text-xs font-bold text-white transition shadow-sm hover:opacity-90 cursor-pointer"
                style={{ backgroundColor: themeColors.primary }}
              >
                Close Drilldown
              </button>
            </div>
          </div>
        </div>
      )}

      {/* LEAD CALLING & REMARKS TIMELINE MODAL */}
      {timelineModalOpen && selectedLeadForTimeline && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div
            className="w-full max-w-2xl max-h-[85vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden border"
            style={{ backgroundColor: themeColors.surface, borderColor: themeColors.border }}
          >
            {/* Header */}
            <div className="p-5 border-b flex justify-between items-center" style={{ borderColor: themeColors.border }}>
              <div>
                <h3 className="text-lg font-black" style={{ color: themeColors.text }}>
                  {selectedLeadForTimeline.name || "Customer Lead"} Call History
                </h3>
                <p className="text-xs font-medium" style={{ color: themeColors.textSecondary }}>
                  Phone: {selectedLeadForTimeline.phone} • City: {selectedLeadForTimeline.city || "N/A"} • Branch: {selectedLeadForTimeline.assignedBranch?.name || "Unassigned"}
                </p>
              </div>
              <button
                onClick={() => setTimelineModalOpen(false)}
                className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition cursor-pointer"
                style={{ color: themeColors.textSecondary }}
              >
                <FaTimes />
              </button>
            </div>

            {/* Timeline Content */}
            <div className="p-6 overflow-y-auto flex-1 custom-scrollbar space-y-4">
              {Array.isArray(selectedLeadForTimeline.remarks) && selectedLeadForTimeline.remarks.length > 0 ? (
                <div className="relative border-l-2 ml-3 space-y-6" style={{ borderColor: themeColors.border }}>
                  {selectedLeadForTimeline.remarks.slice().reverse().map((r, i) => (
                    <div key={r._id || i} className="relative pl-6">
                      <div
                        className="absolute -left-[9px] top-1 w-4 h-4 rounded-full border-2 bg-white dark:bg-slate-900"
                        style={{ borderColor: themeColors.primary }}
                      />
                      <div className="p-4 rounded-2xl border bg-black/5 dark:bg-white/5 space-y-1.5" style={{ borderColor: themeColors.border }}>
                        <div className="flex justify-between items-center text-[11px] font-bold">
                          <span style={{ color: themeColors.primary }}>
                            {r.addedBy?.name || "Telecaller"} {r.addedBy?.role ? `(${r.addedBy.role})` : ''}
                          </span>
                          <span style={{ color: themeColors.textSecondary }}>
                            {new Date(r.createdAt).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-xs font-medium text-slate-800 dark:text-slate-200">
                          {r.note}
                        </p>
                        {r.followUpDate && (
                          <div className="text-[11px] font-bold text-amber-600 flex items-center gap-1 mt-1">
                            <FaClock className="text-[9px]" /> Next Follow-up: {new Date(r.followUpDate).toLocaleString()}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-12 text-center text-xs italic" style={{ color: themeColors.textSecondary }}>
                  No call remarks or handover logs recorded for this lead.
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t flex justify-end" style={{ borderColor: themeColors.border }}>
              <button
                onClick={() => setTimelineModalOpen(false)}
                className="px-5 py-2 rounded-xl text-xs font-bold text-white transition hover:opacity-90 cursor-pointer"
                style={{ backgroundColor: themeColors.primary }}
              >
                Close Timeline
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default memo(TelecallerReports);
