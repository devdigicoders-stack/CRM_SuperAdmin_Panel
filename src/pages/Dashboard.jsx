import { memo, useMemo, useEffect, useState } from "react";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import axios from "axios";
import { 
  FaUsers, FaChartLine, FaExclamationTriangle, FaBell, FaCircle
} from "react-icons/fa";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie
} from "recharts";
import { useNavigate } from "react-router-dom";

const Dashboard = () => {
  const navigate = useNavigate();
  const { themeColors } = useTheme();
  const { admin, token } = useAuth();
  
  const [data, setData] = useState(null);
  const [performanceData, setPerformanceData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);
        const baseUrl = import.meta.env.VITE_API_BASE_URL;
        
        // Fetch both Stats and Performance in parallel
        const [statsResponse, perfResponse] = await Promise.all([
          axios.get(`${baseUrl}/dashboard/stats`, { headers: { Authorization: `Bearer ${token}` } }),
          axios.get(`${baseUrl}/dashboard/performance`, { headers: { Authorization: `Bearer ${token}` } }).catch(() => ({ data: {} })) // Prevent total failure if perf fails
        ]);
        
        if (statsResponse.data.status === "success") {
          setData(statsResponse.data.data);
        } else {
          setError("Failed to fetch dashboard data");
        }
        
        if (perfResponse.data?.status === "success") {
          setPerformanceData(perfResponse.data.data);
        }
        
      } catch (err) {
        console.error(err);
        setError(err.response?.data?.message || "Error connecting to server");
      } finally {
        setIsLoading(false);
      }
    };
    
    if (token) {
      fetchDashboardData();
    }
  }, [token]);

  const stats = useMemo(() => {
    if (!data) return [];
    return [
      { title: "Total Leads", value: data.totalLeads || 0, icon: FaUsers, isPositive: true },
      { title: "Assigned Leads", value: data.assignedLeads || 0, icon: FaChartLine, isPositive: true },
      { title: "Today's Reminders", value: data.todayReminders || 0, icon: FaBell, isPositive: true },
      { title: "Missed Follow-Ups", value: data.missedFollowUps || 0, icon: FaExclamationTriangle, isPositive: false, path: "/missed-follow-ups" },
    ];
  }, [data]);

  const categoryChartData = useMemo(() => {
    if (!data?.categories) return [];
    return [
      { name: "Pending", value: data.categories.pending || 0 },
      { name: "Closed", value: data.categories.closed || 0 },
      { name: "Negative", value: data.categories.negative || 0 },
      { name: "Missed", value: data.categories.missed || 0 },
    ];
  }, [data]);

  const leadFlowData = useMemo(() => {
    if (!data?.leadFlow) return [];
    return [
      { name: "Calling Team", value: data.leadFlow.callingTeam || 0 },
      { name: "Sales Panel", value: data.leadFlow.salesPanel || 0 },
      { name: "Unassigned", value: data.leadFlow.unassigned || 0 },
    ];
  }, [data]);

  // Combine Performance and Call Activity
  const teamMetrics = useMemo(() => {
    if (!performanceData) return [];
    const perfArray = performanceData.performance || [];
    const callsArray = performanceData.callActivity || [];
    
    return perfArray.map(perf => {
      const callData = callsArray.find(c => c._id === perf._id);
      return {
        ...perf,
        callsCount: callData ? callData.callsCount : 0
      };
    });
  }, [performanceData]);

  const COLORS = [themeColors.primary, themeColors.success, themeColors.danger, themeColors.warning];
  const PIE_COLORS = [themeColors.info, themeColors.accent, themeColors.textSecondary];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2" style={{ borderColor: themeColors.primary }}></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <div className="bg-red-50 text-red-500 px-6 py-4 rounded-xl border border-red-200 shadow-sm font-medium">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 animate-fade-in relative space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: themeColors.text }}>
            Welcome back, {admin?.name || "Admin"}! 👋
          </h1>
          <p className="text-sm mt-1" style={{ color: themeColors.textSecondary }}>
            Here is the latest overview of your CRM metrics.
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <div 
            key={index}
            onClick={() => stat.path ? navigate(stat.path) : null}
            className={`rounded-xl p-6 shadow-sm border transition-all duration-300 hover:shadow-md hover:-translate-y-1 ${stat.path ? 'cursor-pointer' : ''}`}
            style={{ 
              backgroundColor: themeColors.surface,
              borderColor: themeColors.border
            }}
          >
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium mb-1" style={{ color: themeColors.textSecondary }}>
                  {stat.title}
                </p>
                <h3 className="text-2xl font-bold" style={{ color: themeColors.text }}>
                  {stat.value}
                </h3>
              </div>
              <div 
                className="w-10 h-10 rounded-lg flex items-center justify-center"
                style={{ 
                  backgroundColor: stat.isPositive ? `${themeColors.primary}15` : `${themeColors.danger}15`, 
                  color: stat.isPositive ? themeColors.primary : themeColors.danger 
                }}
              >
                <stat.icon className="text-xl" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Chart: Categories Breakdown */}
        <div 
          className="lg:col-span-2 rounded-xl p-6 shadow-sm border flex flex-col"
          style={{ backgroundColor: themeColors.surface, borderColor: themeColors.border }}
        >
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-lg font-bold" style={{ color: themeColors.text }}>Lead Categories Breakdown</h3>
              <p className="text-sm" style={{ color: themeColors.textSecondary }}>Overview of pending, closed, and missed leads</p>
            </div>
          </div>
          <div className="flex-1 min-h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={themeColors.border} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: themeColors.textSecondary, fontSize: 12 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: themeColors.textSecondary, fontSize: 12 }} />
                <Tooltip 
                  cursor={{ fill: `${themeColors.border}50` }}
                  contentStyle={{ 
                    backgroundColor: themeColors.surface, 
                    borderColor: themeColors.border,
                    borderRadius: '8px',
                    color: themeColors.text
                  }}
                  itemStyle={{ color: themeColors.text }}
                />
                <Bar dataKey="value" name="Leads" radius={[4, 4, 0, 0]}>
                  {categoryChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Side Chart: Lead Flow */}
        <div 
          className="rounded-xl shadow-sm border flex flex-col"
          style={{ backgroundColor: themeColors.surface, borderColor: themeColors.border }}
        >
          <div className="p-6 border-b" style={{ borderColor: themeColors.border }}>
            <h3 className="text-lg font-bold" style={{ color: themeColors.text }}>Lead Flow</h3>
            <p className="text-sm" style={{ color: themeColors.textSecondary }}>Distribution of active leads</p>
          </div>
          <div className="p-6 flex-1 flex flex-col items-center justify-center">
            <div className="h-[200px] w-full relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={leadFlowData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                  >
                    {leadFlowData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: themeColors.surface, 
                      borderColor: themeColors.border,
                      borderRadius: '8px',
                      color: themeColors.text
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              {/* Center Text */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-2xl font-bold" style={{ color: themeColors.text }}>
                  {data?.assignedLeads || 0}
                </span>
                <span className="text-xs" style={{ color: themeColors.textSecondary }}>Assigned</span>
              </div>
            </div>
            
            {/* Custom Legend */}
            <div className="mt-6 w-full space-y-3">
              {leadFlowData.map((entry, index) => (
                <div key={entry.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FaCircle className="text-[10px]" style={{ color: PIE_COLORS[index % PIE_COLORS.length] }} />
                    <span className="text-sm font-medium" style={{ color: themeColors.textSecondary }}>{entry.name}</span>
                  </div>
                  <span className="text-sm font-bold" style={{ color: themeColors.text }}>{entry.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Team Performance Table */}
      {teamMetrics.length > 0 && (
        <div 
          className="rounded-xl shadow-sm border overflow-hidden mt-6"
          style={{ backgroundColor: themeColors.surface, borderColor: themeColors.border }}
        >
          <div className="p-6 border-b flex justify-between items-center" style={{ borderColor: themeColors.border }}>
            <div>
              <h3 className="text-lg font-bold" style={{ color: themeColors.text }}>Team Performance</h3>
              <p className="text-sm" style={{ color: themeColors.textSecondary }}>Real-time conversion metrics for your team</p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr style={{ backgroundColor: `${themeColors.primary}08`, borderBottom: `1px solid ${themeColors.border}` }}>
                  <th className="py-4 px-6 font-semibold text-sm" style={{ color: themeColors.textSecondary }}>Team Member</th>
                  <th className="py-4 px-6 font-semibold text-sm" style={{ color: themeColors.textSecondary }}>Role</th>
                  <th className="py-4 px-6 font-semibold text-sm text-center" style={{ color: themeColors.textSecondary }}>Calls Made</th>
                  <th className="py-4 px-6 font-semibold text-sm text-center" style={{ color: themeColors.textSecondary }}>Leads Handled</th>
                  <th className="py-4 px-6 font-semibold text-sm text-center" style={{ color: themeColors.textSecondary }}>Converted</th>
                  <th className="py-4 px-6 font-semibold text-sm text-center" style={{ color: themeColors.textSecondary }}>Missed</th>
                  <th className="py-4 px-6 font-semibold text-sm text-center" style={{ color: themeColors.textSecondary }}>Conversion Rate</th>
                </tr>
              </thead>
              <tbody>
                {teamMetrics.map((member, index) => (
                  <tr 
                    key={member._id || `unassigned-${index}`}
                    className="hover:bg-black/5 dark:hover:bg-white/5 transition-colors duration-150"
                    style={{ borderBottom: index !== teamMetrics.length - 1 ? `1px solid ${themeColors.border}` : 'none' }}
                  >
                    <td className="py-4 px-6 font-bold text-sm" style={{ color: themeColors.text }}>
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs uppercase"
                          style={{ backgroundColor: `${themeColors.primary}20`, color: themeColors.primary }}
                        >
                          {(member.user?.name || 'U').charAt(0)}
                        </div>
                        <div className="flex flex-col">
                          <span>{member.user?.name || (member._id === null ? 'Unassigned Leads' : 'Unknown User')}</span>
                          <span className="text-[10px] font-normal" style={{ color: themeColors.textSecondary }}>{member.user?.email || (member._id === null ? 'System Default' : 'N/A')}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-[10px] uppercase font-bold tracking-wider">
                      <span className="px-2.5 py-1 rounded-md" style={{ backgroundColor: `${themeColors.primary}15`, color: themeColors.primary, border: `1px solid ${themeColors.primary}30` }}>
                        {member.user?.role || (member._id === null ? 'System' : 'Deleted')}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-center font-medium" style={{ color: themeColors.text }}>
                      {member.callsCount}
                    </td>
                    <td className="py-4 px-6 text-center font-medium" style={{ color: themeColors.text }}>
                      {member.totalLeads}
                    </td>
                    <td className="py-4 px-6 text-center font-bold" style={{ color: themeColors.success }}>
                      {member.convertedLeads}
                    </td>
                    <td className="py-4 px-6 text-center font-medium" style={{ color: themeColors.danger }}>
                      {member.missedFollowUps}
                    </td>
                    <td className="py-4 px-6 text-center">
                      <span className="text-xs font-bold px-3 py-1 rounded-full shadow-sm" style={{ 
                        backgroundColor: member.conversionRate > 0 ? themeColors.success : `${themeColors.border}80`,
                        color: member.conversionRate > 0 ? '#fff' : themeColors.textSecondary
                      }}>
                        {member.conversionRate}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default memo(Dashboard);
