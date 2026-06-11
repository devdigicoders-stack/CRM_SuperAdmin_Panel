import { memo, useState, useEffect } from "react";
import { FaBell, FaCheckDouble, FaUserPlus, FaFileInvoiceDollar, FaExclamationTriangle, FaInfoCircle, FaSpinner, FaCalendarTimes } from "react-icons/fa";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import axios from "axios";
import { toast } from "sonner";

const Notifications = () => {
  const { themeColors } = useTheme();
  const { token } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const baseUrl = import.meta.env.VITE_API_BASE_URL;

  useEffect(() => {
    fetchNotifications();
  }, [token]);

  const fetchNotifications = async () => {
    try {
      const response = await axios.get(`${baseUrl}/notifications`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.status === "success") {
        setNotifications(response.data.data.notifications || []);
      }
    } catch (error) {
      console.error("Error fetching notifications", error);
      toast.error("Failed to load notifications");
    } finally {
      setLoading(false);
    }
  };

  const markAllAsRead = async () => {
    const unreadNotifs = notifications.filter(n => !n.read);
    if (unreadNotifs.length === 0) return;

    try {
      await Promise.all(
        unreadNotifs.map(n => 
          axios.put(`${baseUrl}/notifications/${n._id}/read`, {}, {
            headers: { Authorization: `Bearer ${token}` }
          })
        )
      );
      setNotifications(notifications.map(n => ({ ...n, read: true })));
      toast.success("All notifications marked as read");
      window.dispatchEvent(new Event("notifications-read"));
    } catch (error) {
      console.error(error);
      toast.error("Failed to mark all as read");
    }
  };

  const markAsRead = async (id) => {
    const notif = notifications.find(n => n._id === id);
    if (notif && notif.read) return;

    try {
      setNotifications(notifications.map(n => n._id === id ? { ...n, read: true } : n));
      await axios.put(`${baseUrl}/notifications/${id}/read`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      window.dispatchEvent(new Event("notifications-read"));
    } catch (error) {
      console.error(error);
      setNotifications(notifications.map(n => n._id === id ? { ...n, read: false } : n));
    }
  };

  const formatTime = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const getIcon = (type) => {
    switch(type) {
      case 'missed_followup': return <FaExclamationTriangle className="text-rose-500 dark:text-rose-400" />;
      case 'missed_meeting': return <FaCalendarTimes className="text-rose-500 dark:text-rose-400" />;
      case 'general': return <FaInfoCircle className="text-indigo-500 dark:text-indigo-400" />;
      case 'user': return <FaUserPlus className="text-blue-500 dark:text-blue-400" />;
      case 'alert': return <FaExclamationTriangle className="text-rose-500 dark:text-rose-400" />;
      case 'finance': return <FaFileInvoiceDollar className="text-emerald-500 dark:text-emerald-400" />;
      case 'info': return <FaInfoCircle className="text-indigo-500 dark:text-indigo-400" />;
      default: return <FaBell className="text-gray-500 dark:text-gray-400" />;
    }
  };

  // Calculate unread count to show in header or mark all button logic
  const unreadCount = notifications.filter(n => !n.read).length;

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center h-full min-h-[400px]">
        <FaSpinner className="animate-spin text-3xl" style={{ color: themeColors.primary }} />
      </div>
    );
  }

  return (
    <div className="p-6 animate-fade-in max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="relative">
              <FaBell className="text-2xl" style={{ color: themeColors.primary }} />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500 border border-white dark:border-gray-900"></span>
                </span>
              )}
            </div>
            <h1 className="text-2xl font-bold tracking-tight" style={{ color: themeColors.text }}>
              Notifications
            </h1>
          </div>
          <p className="text-sm" style={{ color: themeColors.textSecondary }}>
            Stay updated with the latest system alerts and activities
          </p>
        </div>
        
        <button 
          onClick={markAllAsRead}
          disabled={unreadCount === 0}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-300 border ${
            unreadCount === 0 ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-sm hover:bg-black/5 dark:hover:bg-white/5'
          }`}
          style={{ 
            backgroundColor: themeColors.surface, 
            color: themeColors.text,
            borderColor: themeColors.border
          }}
        >
          <FaCheckDouble className="text-sm" style={{ color: unreadCount === 0 ? themeColors.textSecondary : themeColors.primary }} /> 
          Mark all as read
        </button>
      </div>

      {/* Notifications List */}
      <div 
        className="rounded-xl shadow-sm border overflow-hidden"
        style={{ backgroundColor: themeColors.surface, borderColor: themeColors.border }}
      >
        {notifications.length > 0 ? (
          <div className="divide-y" style={{ borderColor: themeColors.border }}>
            {notifications.map((notif) => (
              <div 
                key={notif._id}
                onClick={() => markAsRead(notif._id)}
                className={`p-5 flex gap-4 transition-colors cursor-pointer group ${
                  !notif.read 
                    ? 'hover:bg-black/5 dark:hover:bg-white/5' 
                    : 'hover:bg-black/5 dark:hover:bg-white/5'
                }`}
                style={{
                  backgroundColor: !notif.read ? `${themeColors.primary}08` : 'transparent'
                }}
              >
                <div 
                  className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 border shadow-sm transition-transform group-hover:scale-110"
                  style={{ 
                    backgroundColor: themeColors.background,
                    borderColor: themeColors.border
                  }}
                >
                  {getIcon(notif.type)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start mb-1">
                    <h3 
                      className={`text-sm truncate pr-4 ${!notif.read ? 'font-bold' : 'font-medium'}`}
                      style={{ color: themeColors.text }}
                    >
                      {notif.title}
                    </h3>
                    <span className="text-xs whitespace-nowrap shrink-0 font-medium" style={{ color: themeColors.textSecondary }}>
                      {formatTime(notif.createdAt)}
                    </span>
                  </div>
                  <p className="text-sm" style={{ color: themeColors.textSecondary }}>
                    {notif.message}
                  </p>
                </div>
                
                {/* Unread Indicator Dot */}
                <div className="flex items-center shrink-0 pl-2 w-4">
                  {!notif.read && (
                    <div className="w-2.5 h-2.5 rounded-full shadow-sm" style={{ backgroundColor: themeColors.primary }}></div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-16 text-center">
            <FaBell className="mx-auto text-5xl mb-4 opacity-20" style={{ color: themeColors.text }} />
            <h3 className="text-xl font-semibold" style={{ color: themeColors.text }}>All Caught Up!</h3>
            <p className="text-sm mt-2" style={{ color: themeColors.textSecondary }}>You have no new notifications right now.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default memo(Notifications);
