import { memo, useState, useEffect, useMemo } from "react";
import { FaCalendarAlt, FaChevronLeft, FaChevronRight, FaPhoneAlt, FaEnvelope } from "react-icons/fa";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import axios from "axios";
import { toast } from "sonner";

const CalendarView = () => {
  const { themeColors } = useTheme();
  const { token } = useAuth();

  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Derive start and end dates for the current month
  const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0, 23, 59, 59);

  useEffect(() => {
    if (!token) return;
    fetchEvents();
  }, [currentDate, token]);

  const fetchEvents = async () => {
    setIsLoading(true);
    try {
      const baseUrl = import.meta.env.VITE_API_BASE_URL;
      const response = await axios.get(`${baseUrl}/calendar`, {
        params: {
          startDate: startOfMonth.toISOString(),
          endDate: endOfMonth.toISOString(),
        },
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.status === "success") {
        setEvents(response.data.data.events || []);
      }
    } catch (error) {
      console.error("Failed to fetch calendar events", error);
      toast.error("Failed to load calendar events.");
    } finally {
      setIsLoading(false);
    }
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  
  const getDaysInMonth = (year, month) => {
    return new Date(year, month + 1, 0).getDate();
  };
  
  const daysInMonth = getDaysInMonth(currentDate.getFullYear(), currentDate.getMonth());
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();

  // Create an array representing the calendar grid
  const blanks = Array.from({ length: firstDayOfMonth }, (_, i) => null);
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const totalSlots = [...blanks, ...days];

  // Map events to specific days
  const eventsByDay = useMemo(() => {
    const map = {};
    events.forEach(event => {
      if (event.followUpDate) {
        const dateObj = new Date(event.followUpDate);
        if (dateObj.getMonth() === currentDate.getMonth() && dateObj.getFullYear() === currentDate.getFullYear()) {
          const day = dateObj.getDate();
          if (!map[day]) map[day] = [];
          map[day].push(event);
        }
      }
    });
    return map;
  }, [events, currentDate]);

  const getPriorityColor = (priority) => {
    const p = (priority || '').toLowerCase();
    if (p === 'high') return '#ef4444';
    if (p === 'medium') return '#f59e0b';
    if (p === 'low') return '#10b981';
    return themeColors.textSecondary;
  };

  return (
    <div className="p-6 animate-fade-in max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2 rounded-lg" style={{ backgroundColor: `${themeColors.primary}15`, color: themeColors.primary }}>
              <FaCalendarAlt className="text-xl" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight" style={{ color: themeColors.text }}>
              Follow-up Calendar
            </h1>
          </div>
          <p className="text-sm" style={{ color: themeColors.textSecondary }}>
            Track scheduled follow-ups and lead events.
          </p>
        </div>
      </div>

      {/* Calendar Card */}
      <div 
        className="rounded-xl shadow-sm border overflow-hidden"
        style={{ backgroundColor: themeColors.surface, borderColor: themeColors.border }}
      >
        <div className="flex items-center justify-between p-6 border-b" style={{ borderColor: themeColors.border }}>
          <h2 className="text-xl font-bold" style={{ color: themeColors.text }}>
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </h2>
          <div className="flex gap-2">
            <button onClick={prevMonth} className="p-2.5 rounded-lg transition-colors border hover:bg-black/5 dark:hover:bg-white/5 shadow-sm" style={{ borderColor: themeColors.border, color: themeColors.text }}>
              <FaChevronLeft className="text-sm" />
            </button>
            <button onClick={nextMonth} className="p-2.5 rounded-lg transition-colors border hover:bg-black/5 dark:hover:bg-white/5 shadow-sm" style={{ borderColor: themeColors.border, color: themeColors.text }}>
              <FaChevronRight className="text-sm" />
            </button>
          </div>
        </div>
        
        {/* Calendar Grid */}
        <div className="p-6 relative min-h-[500px]">
          {isLoading && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/5 backdrop-blur-[1px] dark:bg-white/5">
              <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2" style={{ borderColor: themeColors.primary }}></div>
            </div>
          )}

          <div className="grid grid-cols-7 gap-px rounded-lg overflow-hidden border" style={{ backgroundColor: themeColors.border, borderColor: themeColors.border }}>
            {/* Days Header */}
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="py-3 text-center font-bold text-xs uppercase tracking-wider" style={{ backgroundColor: themeColors.surface, color: themeColors.textSecondary }}>
                {day}
              </div>
            ))}
            
            {/* Calendar Cells */}
            {totalSlots.map((day, idx) => {
              const isToday = day === new Date().getDate() && currentDate.getMonth() === new Date().getMonth() && currentDate.getFullYear() === new Date().getFullYear();
              
              return (
                <div 
                  key={idx} 
                  className={`min-h-[120px] p-2 transition-colors ${day ? 'hover:bg-black/5 dark:hover:bg-white/5' : ''}`}
                  style={{ backgroundColor: themeColors.surface }}
                >
                  {day && (
                    <div className="flex flex-col h-full">
                      <div className="flex justify-between items-start mb-2">
                        <span 
                          className={`flex items-center justify-center w-7 h-7 rounded-full text-sm font-bold ${isToday ? 'shadow-md' : ''}`}
                          style={{ 
                            backgroundColor: isToday ? themeColors.primary : 'transparent',
                            color: isToday ? themeColors.onPrimary : themeColors.text
                          }}
                        >
                          {day}
                        </span>
                        {eventsByDay[day]?.length > 0 && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ backgroundColor: `${themeColors.primary}20`, color: themeColors.primary }}>
                            {eventsByDay[day].length} events
                          </span>
                        )}
                      </div>
                      
                      {/* Events for this day */}
                      <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 custom-scrollbar">
                        {eventsByDay[day]?.map(evt => (
                          <div 
                            key={evt._id} 
                            className="p-1.5 rounded border text-xs cursor-pointer shadow-sm hover:shadow-md transition-all group"
                            style={{ backgroundColor: themeColors.background, borderColor: themeColors.border }}
                            title={`Follow up with ${evt.name} (${evt.phone})`}
                          >
                            <div className="flex justify-between items-start mb-1">
                              <span className="font-bold truncate" style={{ color: themeColors.text }}>{evt.name}</span>
                              <span className="w-2 h-2 rounded-full flex-shrink-0 mt-0.5" style={{ backgroundColor: getPriorityColor(evt.priority) }}></span>
                            </div>
                            <div className="flex flex-col gap-0.5">
                              <span className="text-[10px] flex items-center gap-1 opacity-70 group-hover:opacity-100" style={{ color: themeColors.textSecondary }}>
                                <FaPhoneAlt size={8} /> {evt.phone}
                              </span>
                              <span className="text-[10px] px-1 py-0.5 mt-0.5 rounded inline-block w-fit uppercase font-semibold" style={{ backgroundColor: `${themeColors.primary}10`, color: themeColors.primary }}>
                                {evt.status}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default memo(CalendarView);
