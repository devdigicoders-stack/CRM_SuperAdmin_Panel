import { memo, useState, useEffect, useMemo } from "react";
import { FaCalendarAlt, FaChevronLeft, FaChevronRight, FaPhoneAlt, FaEnvelope, FaFileAlt } from "react-icons/fa";
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
  const [selectedDayEvents, setSelectedDayEvents] = useState(null);
  const [selectedDay, setSelectedDay] = useState(null);

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
                  onClick={() => {
                    if (day && eventsByDay[day]?.length > 0) {
                      setSelectedDayEvents(eventsByDay[day]);
                      setSelectedDay(day);
                    }
                  }}
                  className={`min-h-[100px] p-2 transition-colors ${day && eventsByDay[day]?.length > 0 ? 'cursor-pointer hover:bg-black/5 dark:hover:bg-white/5' : ''} ${!eventsByDay[day]?.length && day ? 'hover:bg-black/5 dark:hover:bg-white/5' : ''}`}
                  style={{ backgroundColor: themeColors.surface }}
                >
                  {day && (
                    <div className="flex flex-col h-full items-center justify-center gap-2 py-4">
                      <span 
                        className={`flex items-center justify-center w-8 h-8 rounded-full text-base font-bold ${isToday ? 'shadow-md' : ''}`}
                        style={{ 
                          backgroundColor: isToday ? themeColors.primary : 'transparent',
                          color: isToday ? themeColors.onPrimary : themeColors.text
                        }}
                      >
                        {day}
                      </span>
                      {eventsByDay[day]?.length > 0 && (
                        <span className="text-xs font-bold px-2.5 py-1 rounded-full shadow-sm hover:scale-105 transition-transform" style={{ backgroundColor: `${themeColors.primary}20`, color: themeColors.primary }}>
                          {eventsByDay[day].length} Events
                        </span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
      {/* Event Details Modal */}
      {selectedDayEvents && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div 
            className="w-full max-w-lg max-h-[80vh] flex flex-col rounded-xl shadow-2xl overflow-hidden"
            style={{ backgroundColor: themeColors.surface, borderColor: themeColors.border, borderWidth: '1px' }}
          >
            <div className="flex justify-between items-center p-4 border-b shrink-0" style={{ borderColor: themeColors.border }}>
              <h2 className="text-lg font-bold" style={{ color: themeColors.text }}>
                Events for {selectedDay} {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
              </h2>
              <button onClick={() => setSelectedDayEvents(null)} className="p-2 rounded-full hover:bg-black/5" style={{ color: themeColors.textSecondary }}>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="p-4 overflow-y-auto space-y-3 custom-scrollbar flex-1" style={{ backgroundColor: themeColors.background }}>
              {selectedDayEvents.map(evt => (
                <div 
                  key={evt._id} 
                  className="p-4 rounded-xl border text-sm shadow-sm transition-all"
                  style={{ backgroundColor: themeColors.surface, borderColor: themeColors.border }}
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-bold text-base" style={{ color: themeColors.text }}>{evt.name}</span>
                    <span className="px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider text-white" style={{ backgroundColor: getPriorityColor(evt.priority) }}>
                      {evt.priority} Priority
                    </span>
                  </div>
                  <div className="flex flex-col gap-2 mt-2">
                    <span className="flex items-center gap-2 font-medium" style={{ color: themeColors.textSecondary }}>
                      <FaPhoneAlt size={12} /> {evt.phone}
                    </span>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="px-2 py-1 rounded text-xs uppercase font-bold" style={{ backgroundColor: `${themeColors.primary}15`, color: themeColors.primary }}>
                        {evt.status}
                      </span>
                      <span className="text-xs px-2 py-1 rounded bg-black/5 dark:bg-white/5 font-semibold" style={{ color: themeColors.textSecondary }}>
                        Added By: {evt.assignedTo?.name || evt.createdBy?.name || 'User'}
                      </span>
                    </div>
                    {evt.meetingNote && (
                      <div className="mt-2 p-3 rounded-lg border text-xs leading-relaxed" style={{ backgroundColor: themeColors.background, borderColor: themeColors.border, color: themeColors.text }}>
                        <span className="flex items-center gap-1.5 font-bold mb-1" style={{ color: themeColors.primary }}>
                          <FaFileAlt size={12} /> Remark Note
                        </span>
                        {evt.meetingNote}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default memo(CalendarView);
