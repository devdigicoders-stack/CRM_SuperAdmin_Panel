import { memo, useState, useEffect } from "react";
import { FaUserClock, FaSearch, FaHistory, FaCheckCircle, FaExclamationCircle, FaChartLine, FaEye, FaTimes, FaCalendarAlt, FaChevronLeft, FaChevronRight } from "react-icons/fa";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import axios from "axios";
import { toast } from "sonner";

const UserHistory = () => {
  const { themeColors } = useTheme();
  const { token } = useAuth();
  const [performanceData, setPerformanceData] = useState([]);
  const [isFetching, setIsFetching] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  const [userHistoryDetail, setUserHistoryDetail] = useState(null);
  const [activeTab, setActiveTab] = useState("activity");
  const [isFetchingLeads, setIsFetchingLeads] = useState(false);
  const [isLeadsModalOpen, setIsLeadsModalOpen] = useState(false);

  useEffect(() => {
    if (!token) return;
    const fetchPerformance = async () => {
      setIsFetching(true);
      try {
        const baseUrl = import.meta.env.VITE_API_BASE_URL;
        const res = await axios.get(`${baseUrl}/users/tracking/summary`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (res.data.status === "success") {
          setPerformanceData(res.data.data.users || []);
        }
      } catch (err) {
        console.error("Failed to fetch performance data", err);
        toast.error("Failed to load user history");
      } finally {
        setIsFetching(false);
      }
    };

    fetchPerformance();
  }, [token]);

  const fetchUserHistory = async (userId) => {
    setIsLeadsModalOpen(true);
    setIsFetchingLeads(true);
    setUserHistoryDetail(null);
    setActiveTab("activity");
    try {
      const baseUrl = import.meta.env.VITE_API_BASE_URL;
      const res = await axios.get(`${baseUrl}/users/${userId}/history`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.status === "success") {
        setUserHistoryDetail(res.data.data);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to load user history details");
    } finally {
      setIsFetchingLeads(false);
    }
  };

  const filteredData = performanceData.filter(item => {
    const search = searchTerm.toLowerCase();
    return (
      item.name?.toLowerCase().includes(search) || 
      item.email?.toLowerCase().includes(search) ||
      item.role?.toLowerCase().includes(search)
    );
  });

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredData.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);

  return (
    <div className="p-6 animate-fade-in max-w-7xl mx-auto">
      {/* Header Area */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <FaHistory className="text-2xl" style={{ color: themeColors.primary }} />
            <h1 className="text-2xl font-bold tracking-tight" style={{ color: themeColors.text }}>
              User History & Performance
            </h1>
          </div>
          <p className="text-sm" style={{ color: themeColors.textSecondary }}>
            Track assigned leads, work history, remarks, and overall performance for each user.
          </p>
        </div>
      </div>

      {/* Search Bar */}
      <div 
        className="mb-6 p-4 rounded-xl border flex shadow-sm"
        style={{ backgroundColor: themeColors.surface, borderColor: themeColors.border }}
      >
        <div className="relative w-full max-w-md">
          <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2" style={{ color: themeColors.textSecondary }} />
          <input 
            type="text" 
            placeholder="Search users by name, email or role..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border focus:outline-none focus:ring-1 transition-colors text-sm"
            style={{ backgroundColor: themeColors.background, borderColor: themeColors.border, color: themeColors.text }}
          />
        </div>
      </div>

      {/* Analytics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <div 
          className="rounded-xl p-6 shadow-sm border transition-all duration-300 hover:shadow-md hover:-translate-y-1" 
          style={{ backgroundColor: themeColors.surface, borderColor: themeColors.border }}
        >
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium mb-1" style={{ color: themeColors.textSecondary }}>Total Team Members</p>
              <h3 className="text-2xl font-bold" style={{ color: themeColors.text }}>{performanceData.length}</h3>
            </div>
            <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${themeColors.primary}15`, color: themeColors.primary }}>
              <FaUserClock className="text-xl" />
            </div>
          </div>
        </div>
        
        <div 
          className="rounded-xl p-6 shadow-sm border transition-all duration-300 hover:shadow-md hover:-translate-y-1" 
          style={{ backgroundColor: themeColors.surface, borderColor: themeColors.border }}
        >
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium mb-1" style={{ color: themeColors.textSecondary }}>Total Leads Assigned</p>
              <h3 className="text-2xl font-bold" style={{ color: themeColors.text }}>
                {performanceData.reduce((acc, curr) => acc + (curr.statistics?.totalLeads || 0), 0)}
              </h3>
            </div>
            <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${themeColors.primary}15`, color: themeColors.primary }}>
              <FaChartLine className="text-xl" />
            </div>
          </div>
        </div>
        
        <div 
          className="rounded-xl p-6 shadow-sm border transition-all duration-300 hover:shadow-md hover:-translate-y-1" 
          style={{ backgroundColor: themeColors.surface, borderColor: themeColors.border }}
        >
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium mb-1" style={{ color: themeColors.textSecondary }}>Total Leads Converted</p>
              <h3 className="text-2xl font-bold" style={{ color: themeColors.text }}>
                {performanceData.reduce((acc, curr) => acc + (curr.statistics?.convertedLeads || 0), 0)}
              </h3>
            </div>
            <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${themeColors.success}15`, color: themeColors.success }}>
              <FaCheckCircle className="text-xl" />
            </div>
          </div>
        </div>
        
        <div 
          className="rounded-xl p-6 shadow-sm border transition-all duration-300 hover:shadow-md hover:-translate-y-1" 
          style={{ backgroundColor: themeColors.surface, borderColor: themeColors.border }}
        >
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium mb-1" style={{ color: themeColors.textSecondary }}>Total Pending Leads</p>
              <h3 className="text-2xl font-bold" style={{ color: themeColors.text }}>
                {performanceData.reduce((acc, curr) => acc + (curr.statistics?.pendingLeads || 0), 0)}
              </h3>
            </div>
            <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${themeColors.warning}15`, color: themeColors.warning }}>
              <FaExclamationCircle className="text-xl" />
            </div>
          </div>
        </div>
      </div>

      {/* History Table */}
      <div 
        className="rounded-xl shadow-sm border overflow-hidden transition-all duration-300"
        style={{ backgroundColor: themeColors.surface, borderColor: themeColors.border }}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[1000px]">
            <thead>
              <tr style={{ backgroundColor: `${themeColors.primary}08`, borderBottom: `1px solid ${themeColors.border}` }}>
                <th className="py-4 px-5 font-semibold text-sm whitespace-nowrap" style={{ color: themeColors.textSecondary }}>User Details</th>
                <th className="py-4 px-5 font-semibold text-sm whitespace-nowrap" style={{ color: themeColors.textSecondary }}>Total Assigned Leads</th>
                <th className="py-4 px-5 font-semibold text-sm whitespace-nowrap" style={{ color: themeColors.textSecondary }}>Work Done (Remarks Added)</th>
                <th className="py-4 px-5 font-semibold text-sm whitespace-nowrap" style={{ color: themeColors.textSecondary }}>Pending Leads</th>
                <th className="py-4 px-5 font-semibold text-sm whitespace-nowrap" style={{ color: themeColors.textSecondary }}>Converted Leads</th>
                <th className="py-4 px-5 font-semibold text-sm whitespace-nowrap" style={{ color: themeColors.textSecondary }}>Conversion Rate</th>
                <th className="py-4 px-5 font-semibold text-sm whitespace-nowrap" style={{ color: themeColors.textSecondary }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {isFetching ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 mx-auto" style={{ borderColor: themeColors.primary }}></div>
                  </td>
                </tr>
              ) : currentItems.length > 0 ? currentItems.map((item, index) => {
                const totalLeads = item.statistics?.totalLeads || 0;
                const workDone = item.statistics?.totalRemarks || 0;
                const pendingLeads = item.statistics?.pendingLeads || 0;
                const convertedLeads = item.statistics?.convertedLeads || 0;
                const conversionRate = totalLeads > 0 ? (convertedLeads / totalLeads) * 100 : 0;

                return (
                  <tr 
                    key={item._id} 
                    style={{ borderBottom: index !== currentItems.length - 1 ? `1px solid ${themeColors.border}` : 'none' }}
                    className="hover:bg-black/5 dark:hover:bg-white/5 transition-colors duration-150"
                  >
                    <td className="py-4 px-5">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold" style={{ color: themeColors.text }}>{item.name}</span>
                        <span className="text-xs mt-0.5" style={{ color: themeColors.textSecondary }}>{item.email}</span>
                        <span 
                          className="text-[10px] uppercase tracking-wider font-bold mt-1.5 px-2 py-0.5 rounded-md self-start border"
                          style={{ backgroundColor: `${themeColors.primary}10`, color: themeColors.primary, borderColor: `${themeColors.primary}30` }}
                        >
                          {item.role}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-5">
                      <div className="font-bold text-base" style={{ color: themeColors.text }}>
                        {totalLeads}
                      </div>
                    </td>
                    <td className="py-4 px-5">
                      <div className="font-bold text-base" style={{ color: themeColors.text }}>
                        {workDone} <span className="text-xs font-normal" style={{ color: themeColors.textSecondary }}>Remarks</span>
                      </div>
                    </td>
                    <td className="py-4 px-5">
                      <div className="font-bold text-base" style={{ color: pendingLeads > 0 ? themeColors.warning : themeColors.success }}>
                        {pendingLeads} <span className="text-xs font-normal" style={{ color: themeColors.textSecondary }}>Pending</span>
                      </div>
                    </td>
                    <td className="py-4 px-5">
                      <div className="font-bold text-base" style={{ color: themeColors.success }}>
                        {convertedLeads}
                      </div>
                    </td>
                    <td className="py-4 px-5">
                      <div className="w-full max-w-[120px]">
                        <div className="flex justify-between items-end mb-1">
                          <span className="text-xs font-bold" style={{ color: themeColors.text }}>
                            {conversionRate ? conversionRate.toFixed(1) : 0}%
                          </span>
                        </div>
                        <div className="w-full h-2 rounded-full overflow-hidden" style={{ backgroundColor: themeColors.border }}>
                          <div 
                            className="h-full rounded-full transition-all duration-500" 
                            style={{ 
                              width: `${Math.min(conversionRate || 0, 100)}%`,
                              backgroundColor: conversionRate > 20 ? themeColors.success : conversionRate > 5 ? themeColors.warning : themeColors.danger
                            }}
                          ></div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-5">
                      <button 
                        onClick={() => fetchUserHistory(item._id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all hover:shadow-md"
                        style={{ backgroundColor: `${themeColors.primary}15`, color: themeColors.primary }}
                      >
                        <FaEye /> View History
                      </button>
                    </td>
                  </tr>
                );
              }) : (
                <tr>
                  <td colSpan="7" className="py-12 text-center">
                    <p className="font-medium" style={{ color: themeColors.textSecondary }}>No user history data found.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination Controls */}
        {!isFetching && totalPages > 1 && (
          <div className="flex justify-between items-center p-4 border-t" style={{ borderColor: themeColors.border, backgroundColor: themeColors.surface }}>
            <span className="text-sm" style={{ color: themeColors.textSecondary }}>
              Showing <span className="font-bold" style={{ color: themeColors.text }}>{indexOfFirstItem + 1}</span> to <span className="font-bold" style={{ color: themeColors.text }}>{Math.min(indexOfLastItem, filteredData.length)}</span> of <span className="font-bold" style={{ color: themeColors.text }}>{filteredData.length}</span> entries
            </span>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-lg border transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:bg-black/5 dark:hover:bg-white/5"
                style={{ borderColor: themeColors.border, color: themeColors.text }}
              >
                <FaChevronLeft className="text-xs" />
              </button>
              
              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => {
                  if (page === 1 || page === totalPages || (page >= currentPage - 1 && page <= currentPage + 1)) {
                    return (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold transition-all"
                        style={{ 
                          backgroundColor: currentPage === page ? themeColors.primary : 'transparent',
                          color: currentPage === page ? '#fff' : themeColors.text,
                        }}
                      >
                        {page}
                      </button>
                    );
                  } else if (page === currentPage - 2 || page === currentPage + 2) {
                    return <span key={page} style={{ color: themeColors.textSecondary }}>...</span>;
                  }
                  return null;
                })}
              </div>

              <button 
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg border transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:bg-black/5 dark:hover:bg-white/5"
                style={{ borderColor: themeColors.border, color: themeColors.text }}
              >
                <FaChevronRight className="text-xs" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* History Modal */}
      {isLeadsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div 
            className="w-full max-w-5xl rounded-xl shadow-2xl flex flex-col max-h-[90vh]"
            style={{ backgroundColor: themeColors.surface, borderColor: themeColors.border, borderWidth: '1px' }}
          >
            <div className="flex justify-between items-center p-5 border-b shrink-0" style={{ borderColor: themeColors.border }}>
              <div>
                <h2 className="text-lg font-bold" style={{ color: themeColors.text }}>User History & Details</h2>
                {userHistoryDetail?.profile && (
                  <p className="text-xs mt-1" style={{ color: themeColors.textSecondary }}>
                    User: <span className="font-bold text-sm" style={{ color: themeColors.text }}>{userHistoryDetail.profile.name}</span> ({userHistoryDetail.profile.role}) | {userHistoryDetail.profile.email}
                  </p>
                )}
              </div>
              <button onClick={() => setIsLeadsModalOpen(false)} className="p-2 rounded-full hover:bg-black/5" style={{ color: themeColors.textSecondary }}>
                <FaTimes />
              </button>
            </div>
            
            <div className="flex-1 flex flex-col overflow-hidden">
              {isFetchingLeads ? (
                <div className="py-20 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 mx-auto" style={{ borderColor: themeColors.primary }}></div>
                  <p className="text-xs mt-4" style={{ color: themeColors.textSecondary }}>Loading user history...</p>
                </div>
              ) : userHistoryDetail ? (
                <>
                  {/* Tabs */}
                  <div className="flex border-b shrink-0 px-5 pt-3" style={{ borderColor: themeColors.border, backgroundColor: themeColors.surface }}>
                    <button 
                      onClick={() => setActiveTab('activity')}
                      className="px-4 py-2 text-sm font-bold border-b-2 transition-all"
                      style={{ 
                        borderColor: activeTab === 'activity' ? themeColors.primary : 'transparent',
                        color: activeTab === 'activity' ? themeColors.primary : themeColors.textSecondary 
                      }}
                    >
                      Activity Log
                    </button>
                    <button 
                      onClick={() => setActiveTab('leads')}
                      className="px-4 py-2 text-sm font-bold border-b-2 transition-all"
                      style={{ 
                        borderColor: activeTab === 'leads' ? themeColors.primary : 'transparent',
                        color: activeTab === 'leads' ? themeColors.primary : themeColors.textSecondary 
                      }}
                    >
                      Assigned Leads ({userHistoryDetail.statistics?.totalLeads || 0})
                    </button>
                  </div>

                  {/* Tab Content */}
                  <div className="p-0 overflow-y-auto custom-scrollbar flex-1 rounded-b-xl" style={{ backgroundColor: `${themeColors.primary}05` }}>
                    {activeTab === 'activity' && (
                      <div className="p-6">
                        {userHistoryDetail.activityLog?.length > 0 ? (
                          <div className="relative border-l-2 ml-4 space-y-6" style={{ borderColor: `${themeColors.primary}40` }}>
                            {userHistoryDetail.activityLog.map((log, idx) => {
                              const isMeeting = log.note?.startsWith('[Meeting]');
                              const noteText = isMeeting ? log.note.replace('[Meeting]', '').trim() : log.note;

                              return (
                                <div key={idx} className="relative pl-6">
                                  <div className="absolute -left-[9px] top-1 w-4 h-4 rounded-full border-2" style={{ backgroundColor: isMeeting ? themeColors.primary : themeColors.surface, borderColor: themeColors.primary }}></div>
                                  <div className="p-4 rounded-xl shadow-sm border transition-all" style={{ backgroundColor: isMeeting ? `${themeColors.primary}05` : themeColors.surface, borderColor: isMeeting ? `${themeColors.primary}40` : themeColors.border }}>
                                    <div className="flex justify-between items-start mb-2">
                                      <div>
                                        <span className="font-bold text-sm" style={{ color: themeColors.text }}>{log.leadName}</span>
                                        <span className="text-xs ml-2" style={{ color: themeColors.textSecondary }}>{log.leadPhone}</span>
                                      </div>
                                      <span className="text-xs font-semibold" style={{ color: themeColors.textSecondary }}>
                                        {new Date(log.createdAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true })}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-2 mb-2">
                                      <span className="inline-block px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider" style={{ backgroundColor: `${themeColors.primary}15`, color: themeColors.primary }}>
                                        {log.leadStatus?.replace('_', ' ') || 'Remark'}
                                      </span>
                                      {isMeeting && (
                                        <span className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider" style={{ backgroundColor: '#8b5cf615', color: '#8b5cf6', border: '1px solid #8b5cf630' }}>
                                          <FaCalendarAlt /> Meeting Scheduled
                                        </span>
                                      )}
                                    </div>
                                    <p className="text-sm mt-1 flex items-start gap-2" style={{ color: themeColors.text }}>
                                      {isMeeting ? (
                                        <span className="font-medium bg-white/50 dark:bg-black/20 p-2 rounded-lg border w-full block" style={{ borderColor: `${themeColors.primary}20` }}>
                                          {noteText}
                                        </span>
                                      ) : (
                                        noteText
                                      )}
                                    </p>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="text-center py-12">
                            <p className="italic font-medium" style={{ color: themeColors.textSecondary }}>No activity logs found for this user.</p>
                          </div>
                        )}
                      </div>
                    )}

                    {activeTab === 'leads' && (
                      <table className="w-full text-left border-collapse" style={{ backgroundColor: themeColors.surface }}>
                        <thead className="sticky top-0 z-10 shadow-sm" style={{ backgroundColor: themeColors.surface }}>
                          <tr style={{ backgroundColor: `${themeColors.primary}08`, borderBottom: `1px solid ${themeColors.border}` }}>
                            <th className="py-3 px-5 text-xs font-bold" style={{ color: themeColors.textSecondary }}>Lead Info</th>
                            <th className="py-3 px-5 text-xs font-bold" style={{ color: themeColors.textSecondary }}>Status</th>
                            <th className="py-3 px-5 text-xs font-bold" style={{ color: themeColors.textSecondary }}>Priority</th>
                            <th className="py-3 px-5 text-xs font-bold" style={{ color: themeColors.textSecondary }}>Follow-Up Date</th>
                          </tr>
                        </thead>
                        <tbody>
                          {userHistoryDetail.leads?.length > 0 ? userHistoryDetail.leads.map((lead, idx) => (
                            <tr key={lead._id} className="hover:bg-black/5 dark:hover:bg-white/5 transition-colors" style={{ borderBottom: idx !== userHistoryDetail.leads.length - 1 ? `1px solid ${themeColors.border}` : 'none' }}>
                              <td className="py-3 px-5">
                                <span className="block font-bold text-sm" style={{ color: themeColors.text }}>{lead.name}</span>
                                <span className="block text-xs mt-0.5" style={{ color: themeColors.textSecondary }}>{lead.phone}</span>
                              </td>
                              <td className="py-3 px-5">
                                <span className="px-2 py-1 rounded text-[10px] uppercase font-bold tracking-wider" style={{ backgroundColor: `${themeColors.primary}15`, color: themeColors.primary }}>
                                  {lead.status?.replace('_', ' ') || 'New'}
                                </span>
                              </td>
                              <td className="py-3 px-5">
                                <span className={`px-2 py-1 rounded text-[10px] uppercase font-bold tracking-wider ${
                                  lead.priority === 'high' ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400' :
                                  lead.priority === 'medium' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                                  'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                                }`}>
                                  {lead.priority || 'Medium'}
                                </span>
                              </td>
                              <td className="py-3 px-5">
                                {lead.followUpDate ? (
                                  <span className="text-xs font-bold px-2 py-1 rounded-md" style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)', color: '#d97706' }}>
                                    {new Date(lead.followUpDate).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true })}
                                  </span>
                                ) : (
                                  <span className="text-[10px] italic" style={{ color: themeColors.textSecondary }}>None</span>
                                )}
                              </td>
                            </tr>
                          )) : (
                            <tr>
                              <td colSpan="4" className="text-center py-12">
                                <p className="italic font-medium" style={{ color: themeColors.textSecondary }}>No leads assigned to this user.</p>
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    )}
                  </div>
                </>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default memo(UserHistory);
