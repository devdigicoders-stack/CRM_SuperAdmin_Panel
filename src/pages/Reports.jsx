import { memo, useState, useEffect, useMemo } from "react";
import { FaChartBar, FaChartLine, FaCheckCircle, FaExclamationCircle, FaRupeeSign, FaCalendarDay, FaCalendarWeek, FaCalendarAlt, FaHistory, FaFilter, FaWrench, FaClipboardCheck, FaHourglassHalf } from "react-icons/fa";
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

  useEffect(() => {
    if (!token) return;
    const fetchReports = async () => {
      setIsFetching(true);
      try {
        const baseUrl = import.meta.env.VITE_API_BASE_URL;
        const res = await axios.get(`${baseUrl}/reports/analytics`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (res.data.status === "success") {
          setReportsData(res.data.data);
        }
      } catch (err) {
        console.error("Failed to fetch reports data", err);
        toast.error("Failed to load analytics reports");
      } finally {
        setIsFetching(false);
      }
    };

    fetchReports();
  }, [token]);

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

      {/* Timeframe Selector */}
      <div className="mb-8 overflow-x-auto pb-2 custom-scrollbar">
        <div className="flex gap-2 min-w-max p-1 bg-black/5 dark:bg-white/5 rounded-xl border w-max" style={{ borderColor: themeColors.border }}>
          {TIMEFRAMES.map((tf) => {
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

      {isFetching ? (
        <div className="py-20 flex flex-col items-center justify-center">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2" style={{ borderColor: themeColors.primary }}></div>
          <p className="mt-4 font-medium" style={{ color: themeColors.textSecondary }}>Generating reports...</p>
        </div>
      ) : currentData ? (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="rounded-xl p-6 shadow-sm border transition-all duration-300 hover:shadow-md hover:-translate-y-1" style={{ backgroundColor: themeColors.surface, borderColor: themeColors.border }}>
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

            <div className="rounded-xl p-6 shadow-sm border transition-all duration-300 hover:shadow-md hover:-translate-y-1" style={{ backgroundColor: themeColors.surface, borderColor: themeColors.border }}>
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

            <div className="rounded-xl p-6 shadow-sm border transition-all duration-300 hover:shadow-md hover:-translate-y-1" style={{ backgroundColor: themeColors.surface, borderColor: themeColors.border }}>
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

            <div className="rounded-xl p-6 shadow-sm border transition-all duration-300 hover:shadow-md hover:-translate-y-1 relative overflow-hidden" style={{ backgroundColor: themeColors.surface, borderColor: themeColors.border }}>
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-bl-full -mr-10 -mt-10"></div>
              <div className="flex justify-between items-start relative z-10">
                <div>
                  <p className="text-sm font-medium mb-1" style={{ color: themeColors.textSecondary }}>Total Deal Value</p>
                  <h3 className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">
                    ₹{currentData.totalDealValue.toLocaleString('en-IN')}
                  </h3>
                </div>
                <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
                  <FaRupeeSign className="text-2xl" />
                </div>
              </div>
            </div>
          </div>

          {/* Installation KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 mt-6">
            <div className="rounded-xl p-6 shadow-sm border transition-all duration-300 hover:shadow-md hover:-translate-y-1 relative overflow-hidden" style={{ backgroundColor: themeColors.surface, borderColor: themeColors.border }}>
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

            <div className="rounded-xl p-6 shadow-sm border transition-all duration-300 hover:shadow-md hover:-translate-y-1 relative overflow-hidden" style={{ backgroundColor: themeColors.surface, borderColor: themeColors.border }}>
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

            <div className="rounded-xl p-6 shadow-sm border transition-all duration-300 hover:shadow-md hover:-translate-y-1 relative overflow-hidden" style={{ backgroundColor: themeColors.surface, borderColor: themeColors.border }}>
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
    </div>
  );
};

export default memo(Reports);
