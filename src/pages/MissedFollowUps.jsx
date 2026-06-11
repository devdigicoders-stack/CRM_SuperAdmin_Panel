import { memo, useState, useEffect } from "react";
import { FaExclamationTriangle, FaSpinner, FaPhone, FaEnvelope, FaCalendarAlt } from "react-icons/fa";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import axios from "axios";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

const MissedFollowUps = () => {
  const { themeColors } = useTheme();
  const { token } = useAuth();
  const navigate = useNavigate();
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const baseUrl = import.meta.env.VITE_API_BASE_URL;

  useEffect(() => {
    fetchMissedFollowUps();
  }, [token]);

  const fetchMissedFollowUps = async () => {
    try {
      const response = await axios.get(`${baseUrl}/dashboard/reminders/missed`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.status === "success") {
        setLeads(response.data.data.leads || []);
      }
    } catch (error) {
      console.error("Error fetching missed follow-ups", error);
      toast.error("Failed to load missed follow-ups");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className="p-6 animate-fade-in space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border" style={{ borderColor: themeColors.border, backgroundColor: themeColors.surface }}>
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-3" style={{ color: themeColors.danger }}>
            <FaExclamationTriangle />
            Missed Follow-Ups
          </h1>
          <p className="text-sm mt-1" style={{ color: themeColors.textSecondary }}>
            Leads that have passed their scheduled follow-up time.
          </p>
        </div>
        <button 
          onClick={() => navigate('/dashboard')}
          className="px-4 py-2 rounded-lg font-medium border transition-colors hover:bg-black/5 dark:hover:bg-white/5"
          style={{ borderColor: themeColors.border, color: themeColors.text }}
        >
          Back to Dashboard
        </button>
      </div>

      {/* Leads Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border overflow-hidden" style={{ borderColor: themeColors.border, backgroundColor: themeColors.surface }}>
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <FaSpinner className="animate-spin text-3xl" style={{ color: themeColors.primary }} />
          </div>
        ) : leads.length === 0 ? (
          <div className="flex flex-col justify-center items-center h-64 text-center">
            <FaExclamationTriangle className="text-5xl mb-4 opacity-20" style={{ color: themeColors.text }} />
            <p className="text-lg font-medium" style={{ color: themeColors.text }}>No missed follow-ups!</p>
            <p className="text-sm" style={{ color: themeColors.textSecondary }}>Your team is all caught up.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr style={{ backgroundColor: `${themeColors.primary}08`, borderBottom: `1px solid ${themeColors.border}` }}>
                  <th className="py-4 px-6 font-semibold text-sm" style={{ color: themeColors.textSecondary }}>Lead Name</th>
                  <th className="py-4 px-6 font-semibold text-sm" style={{ color: themeColors.textSecondary }}>Contact Info</th>
                  <th className="py-4 px-6 font-semibold text-sm" style={{ color: themeColors.textSecondary }}>Source & Priority</th>
                  <th className="py-4 px-6 font-semibold text-sm" style={{ color: themeColors.textSecondary }}>Scheduled For</th>
                  <th className="py-4 px-6 font-semibold text-sm text-center" style={{ color: themeColors.textSecondary }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {leads.map((lead, index) => (
                  <tr 
                    key={lead._id}
                    className="hover:bg-black/5 dark:hover:bg-white/5 transition-colors duration-150"
                    style={{ borderBottom: index !== leads.length - 1 ? `1px solid ${themeColors.border}` : 'none' }}
                  >
                    <td className="py-4 px-6">
                      <div className="font-bold text-sm" style={{ color: themeColors.text }}>{lead.name}</div>
                      <div className="text-xs uppercase font-semibold mt-1 px-2 py-0.5 rounded inline-block" style={{ backgroundColor: `${themeColors.danger}15`, color: themeColors.danger }}>
                        {lead.status}
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex flex-col gap-1 text-sm" style={{ color: themeColors.text }}>
                        <span className="flex items-center gap-2"><FaPhone className="text-xs opacity-70" /> {lead.phone}</span>
                        {lead.email && <span className="flex items-center gap-2"><FaEnvelope className="text-xs opacity-70" /> {lead.email}</span>}
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex flex-col gap-1 text-sm">
                        <span style={{ color: themeColors.text }}>{lead.source}</span>
                        <span className={`text-xs capitalize font-medium ${
                          lead.priority === 'high' ? 'text-red-500' :
                          lead.priority === 'medium' ? 'text-yellow-500' : 'text-blue-500'
                        }`}>
                          {lead.priority} Priority
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2 text-sm font-medium" style={{ color: themeColors.danger }}>
                        <FaCalendarAlt />
                        {formatDate(lead.followUpDate)}
                      </div>
                    </td>
                    <td className="py-4 px-6 text-center">
                      <button 
                        onClick={() => navigate('/lead-management')}
                        className="px-4 py-2 rounded-lg text-sm font-medium transition-colors hover:opacity-90"
                        style={{ backgroundColor: themeColors.primary, color: themeColors.onPrimary }}
                      >
                        View Lead
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default memo(MissedFollowUps);
