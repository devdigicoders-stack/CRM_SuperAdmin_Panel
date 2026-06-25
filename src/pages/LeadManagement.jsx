import { memo, useState, useEffect } from "react";
import { 
  FaPlus, FaSearch, FaFilter, FaEye, FaEdit, FaTrash, 
  FaBullhorn, FaUserPlus, FaTimes, FaCalendarPlus, 
  FaWhatsapp, FaPhoneAlt, FaChevronLeft, FaChevronRight,
  FaUpload, FaDownload, FaFileCsv
} from "react-icons/fa";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import axios from "axios";
import { toast } from "sonner";
import Swal from "sweetalert2";

const LeadManagement = () => {
  const { themeColors } = useTheme();
  const { token } = useAuth();

  // Data & Pagination State
  const [leads, setLeads] = useState([]);
  const [isFetching, setIsFetching] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const limit = 10;

  const [searchTerm, setSearchTerm] = useState("");
  const [filterTag, setFilterTag] = useState("");

  // Modals & States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [newLead, setNewLead] = useState({ name: "", phone: "", email: "", source: "", priority: "" });
  const [settings, setSettings] = useState({ leadSources: [], priorities: [] });
  const [phoneConflict, setPhoneConflict] = useState(null);

  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState(null);
  const [staffList, setStaffList] = useState([]);
  const [selectedAssigneeId, setSelectedAssigneeId] = useState("");
  const [isAssigning, setIsAssigning] = useState(false);
  
  const [isFollowupModalOpen, setIsFollowupModalOpen] = useState(false);
  const [followupLead, setFollowupLead] = useState(null);

  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [historyLead, setHistoryLead] = useState(null);

  // Bulk Upload States
  const [isBulkUploadModalOpen, setIsBulkUploadModalOpen] = useState(false);
  const [bulkFile, setBulkFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (!token) return;
    
    // Fetch staff list once for assignment dropdown
    const fetchStaffList = async () => {
      try {
        const baseUrl = import.meta.env.VITE_API_BASE_URL;
        const res = await axios.get(`${baseUrl}/users?active=true&limit=100`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.data.status === "success") {
          setStaffList(res.data.data.users || []);
        }
      } catch (err) {
        console.error("Failed to fetch staff list", err);
      }
    };

    const fetchSettings = async () => {
      try {
        const baseUrl = import.meta.env.VITE_API_BASE_URL;
        const res = await axios.get(`${baseUrl}/settings`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.data.status === "success") {
          setSettings(res.data.data.settings || { leadSources: [], priorities: [] });
        }
      } catch (err) {
        console.error("Failed to fetch settings", err);
      }
    };

    fetchStaffList();
    fetchSettings();
  }, [token]);

  useEffect(() => {
    if (!token) return;
    const delayDebounceFn = setTimeout(() => {
      fetchLeads();
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm, filterTag, currentPage, token]);

  useEffect(() => {
    const phone = newLead.phone?.trim();
    if (!phone) {
      setPhoneConflict(null);
      return;
    }
    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      setPhoneConflict(null);
      return;
    }

    const delayDebounce = setTimeout(() => {
      const baseUrl = import.meta.env.VITE_API_BASE_URL;
      axios.get(`${baseUrl}/leads/check-phone`, {
        params: { phone },
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(res => {
          if (res.data?.exists) {
            const lead = res.data.lead;
            setPhoneConflict({
              exists: true,
              name: lead.name,
              assignedToName: lead.assignedTo?.name || null,
              assignedToRole: lead.assignedTo?.role || null,
            });
          } else {
            setPhoneConflict(null);
          }
        })
        .catch(() => {
          setPhoneConflict(null);
        });
    }, 400);

    return () => clearTimeout(delayDebounce);
  }, [newLead.phone, token]);

  const fetchLeads = async () => {
    setIsFetching(true);
    try {
      const baseUrl = import.meta.env.VITE_API_BASE_URL;
      const params = {
        page: currentPage,
        limit: limit
      };
      
      if (searchTerm) params.search = searchTerm;
      if (filterTag) {
        // Format tag to match backend case (e.g. 'interested' -> 'Interested')
        params.tag = filterTag.charAt(0).toUpperCase() + filterTag.slice(1);
      }

      const response = await axios.get(`${baseUrl}/leads`, {
        params,
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.status === "success") {
        setLeads(response.data.data.leads || []);
        setTotalPages(response.data.pages || 1);
        setTotalItems(response.data.total || 0);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch leads");
    } finally {
      setIsFetching(false);
    }
  };

  const handlePageChange = (newPage) => {
    if (newPage > 0 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const handleAddLead = async (e) => {
    e.preventDefault();
    setIsAdding(true);
    try {
      const baseUrl = import.meta.env.VITE_API_BASE_URL;
      const response = await axios.post(`${baseUrl}/leads`, newLead, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.status === "success") {
        toast.success("Lead created successfully!");
        setIsAddModalOpen(false);
        setNewLead({ name: "", phone: "", email: "", source: "", priority: "" });
        setPhoneConflict(null);
        fetchLeads(); // Refresh leads
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to create lead");
    } finally {
      setIsAdding(false);
    }
  };

  const openAssignModal = (lead) => {
    setSelectedLead(lead);
    setSelectedAssigneeId(lead.assignedTo?._id || "");
    setIsAssignModalOpen(true);
  };

  const handleAssignLead = async () => {
    if (!selectedAssigneeId) {
      toast.error("Please select a team member");
      return;
    }
    setIsAssigning(true);
    try {
      const baseUrl = import.meta.env.VITE_API_BASE_URL;
      const selectedStaff = staffList.find(s => s._id === selectedAssigneeId);
      const isInstaller = selectedStaff?.role === 'installer';

      const url = isInstaller 
        ? `${baseUrl}/installation/leads/${selectedLead._id}/assign-rep`
        : `${baseUrl}/leads/${selectedLead._id}/assign`;
        
      const payload = isInstaller 
        ? { installerId: selectedAssigneeId }
        : { userId: selectedAssigneeId };

      const response = await axios.put(url, payload, { 
        headers: { Authorization: `Bearer ${token}` } 
      });

      if (response.data.status === "success") {
        toast.success("Lead assigned successfully!");
        setIsAssignModalOpen(false);
        fetchLeads(); // Refresh list
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to assign lead");
    } finally {
      setIsAssigning(false);
    }
  };

  const handleStatusChange = async (leadId, newStatus) => {
    try {
      const baseUrl = import.meta.env.VITE_API_BASE_URL;
      const response = await axios.put(`${baseUrl}/leads/${leadId}`, { status: newStatus }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.status === "success") {
        toast.success("Lead status updated successfully");
        setLeads(leads.map(l => l._id === leadId ? { ...l, status: newStatus } : l));
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to update lead status");
    }
  };

  const openFollowupModal = (lead) => {
    setFollowupLead(lead);
    setIsFollowupModalOpen(true);
  };

  const handleDownloadSample = () => {
    const csvContent = "data:text/csv;charset=utf-8,name,email,phone,status,source,priority,assignedTo\nJohn Doe,john@example.com,9876543210,new,Website,high,";
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "sample_leads.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleBulkUploadSubmit = async (e) => {
    e.preventDefault();
    if (!bulkFile) return toast.error("Please select a file to upload");
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", bulkFile);
      const baseUrl = import.meta.env.VITE_API_BASE_URL;
      const res = await axios.post(`${baseUrl}/leads/bulk-upload`, formData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      if (res.data.status === "success") {
        toast.success(res.data.message || "Leads uploaded successfully!");
        setIsBulkUploadModalOpen(false);
        setBulkFile(null);
        fetchLeads(); // refresh the list
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to upload leads");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteLead = async (id) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: "This lead will be permanently deleted.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, delete it!'
    });

    if (result.isConfirmed) {
      try {
        const baseUrl = import.meta.env.VITE_API_BASE_URL;
        const res = await axios.delete(`${baseUrl}/leads/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.data.status === "success") {
          toast.success("Lead deleted successfully");
          fetchLeads();
        }
      } catch (err) {
        console.error(err);
        toast.error(err.response?.data?.message || "Failed to delete lead");
      }
    }
  };

  const getStatusBadge = (status) => {
    const s = (status || '').toLowerCase();
    if (s.includes('new') || s.includes('pending')) return 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400';
    if (s.includes('contacted') || s.includes('assigned')) return 'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400';
    if (s.includes('progress') || s.includes('warm') || s.includes('hot')) return 'bg-indigo-100 text-indigo-700 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-400';
    if (s.includes('convert') || s.includes('won')) return 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400';
    if (s.includes('lost') || s.includes('missed') || s.includes('cold')) return 'bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-900/30 dark:text-rose-400';
    return 'bg-gray-100 text-gray-700 border-gray-200';
  };

  const getPriorityColor = (priority) => {
    const p = (priority || '').toLowerCase();
    if (p === 'high') return '#ef4444';
    if (p === 'medium') return '#f59e0b';
    if (p === 'low') return '#10b981';
    return themeColors.textSecondary;
  };

  return (
    <div className="p-6 animate-fade-in max-w-7xl mx-auto">
      {/* Header Area */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <FaBullhorn className="text-2xl" style={{ color: themeColors.primary }} />
            <h1 className="text-2xl font-bold tracking-tight" style={{ color: themeColors.text }}>
              Lead Management
            </h1>
          </div>
          <p className="text-sm" style={{ color: themeColors.textSecondary }}>
            Super Admin View: Manage and track all leads across every department
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsBulkUploadModalOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 border"
            style={{ borderColor: themeColors.primary, color: themeColors.primary, backgroundColor: `${themeColors.primary}10` }}
          >
            <FaUpload className="text-sm" /> Bulk Upload
          </button>
          
          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5"
            style={{ backgroundColor: themeColors.primary, color: themeColors.onPrimary }}
          >
            <FaPlus className="text-sm" /> Add New Lead
          </button>
        </div>
      </div>

      {/* Filters and Search */}
      <div 
        className="mb-6 p-4 rounded-xl border flex flex-col md:flex-row gap-4 justify-between items-center shadow-sm"
        style={{ backgroundColor: themeColors.surface, borderColor: themeColors.border }}
      >
        <div className="flex w-full md:w-auto gap-4 flex-1 max-w-2xl">
          <div className="relative flex-1">
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2" style={{ color: themeColors.textSecondary }} />
            <input 
              type="text" 
              placeholder="Search leads by name, email or phone..." 
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border focus:outline-none focus:ring-1 transition-colors text-sm"
              style={{ backgroundColor: themeColors.background, borderColor: themeColors.border, color: themeColors.text }}
            />
          </div>
          <div className="relative w-48">
            <FaFilter className="absolute left-3 top-1/2 transform -translate-y-1/2" style={{ color: themeColors.textSecondary }} />
            <select
              value={filterTag}
              onChange={(e) => {
                setFilterTag(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border focus:outline-none focus:ring-1 transition-colors text-sm appearance-none cursor-pointer"
              style={{ backgroundColor: themeColors.background, borderColor: themeColors.border, color: themeColors.text }}
            >
              <option value="">All Tags</option>
              {settings?.leadTags?.map(tag => (
                <option key={tag} value={tag}>{tag}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Leads Table Card */}
      <div 
        className="rounded-xl shadow-sm border overflow-hidden transition-all duration-300 hover:shadow-md flex flex-col min-h-[400px]"
        style={{ backgroundColor: themeColors.surface, borderColor: themeColors.border }}
      >
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left border-collapse min-w-[1100px]">
            <thead>
              <tr style={{ backgroundColor: `${themeColors.primary}08`, borderBottom: `1px solid ${themeColors.border}` }}>
                <th className="py-4 px-5 font-semibold text-sm whitespace-nowrap" style={{ color: themeColors.textSecondary }}>Lead Details</th>
                <th className="py-4 px-5 font-semibold text-sm whitespace-nowrap" style={{ color: themeColors.textSecondary }}>Contact & Comm.</th>
                <th className="py-4 px-5 font-semibold text-sm whitespace-nowrap" style={{ color: themeColors.textSecondary }}>Assigned To</th>
                <th className="py-4 px-5 font-semibold text-sm whitespace-nowrap" style={{ color: themeColors.textSecondary }}>Source & Priority</th>
                <th className="py-4 px-5 font-semibold text-sm whitespace-nowrap" style={{ color: themeColors.textSecondary }}>Status</th>
                <th className="py-4 px-5 font-semibold text-sm min-w-[200px]" style={{ color: themeColors.textSecondary }}>Remarks & Follow-Up</th>
                <th className="py-4 px-5 font-semibold text-sm whitespace-nowrap" style={{ color: themeColors.textSecondary }}>Added On</th>
                <th className="py-4 px-5 font-semibold text-sm whitespace-nowrap" style={{ color: themeColors.textSecondary }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {isFetching ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 mx-auto" style={{ borderColor: themeColors.primary }}></div>
                  </td>
                </tr>
              ) : leads.length > 0 ? leads.map((lead, index) => (
                <tr 
                  key={lead._id} 
                  style={{ borderBottom: index !== leads.length - 1 ? `1px solid ${themeColors.border}` : 'none' }}
                  className="hover:bg-black/5 dark:hover:bg-white/5 transition-colors duration-150 group"
                >
                  <td className="py-4 px-5">
                    <div className="flex flex-col">
                      <span className="text-sm font-bold" style={{ color: themeColors.text }}>{lead.name}</span>
                      <span className="text-[11px] font-semibold mt-1 uppercase" style={{ color: getPriorityColor(lead.priority) }}>
                        {lead.priority || 'Normal'} Priority
                      </span>
                    </div>
                  </td>
                  <td className="py-4 px-5">
                    <div className="flex flex-col">
                      <span className="text-xs font-medium" style={{ color: themeColors.textSecondary }}>{lead.email}</span>
                      <span className="text-xs mt-0.5" style={{ color: themeColors.text }}>{lead.phone}</span>
                      {/* Integrations (WhatsApp / Call) */}
                      {lead.integrations && (
                        <div className="flex gap-2 mt-2">
                          {lead.integrations.whatsappLink && (
                            <a href={lead.integrations.whatsappLink} target="_blank" rel="noreferrer" 
                               className="text-[#25D366] hover:scale-110 transition-transform p-1 rounded-full bg-[#25D366]/10"
                               title="Chat on WhatsApp">
                              <FaWhatsapp />
                            </a>
                          )}
                          {lead.integrations.callUri && (
                            <a href={lead.integrations.callUri} 
                               className="text-blue-500 hover:scale-110 transition-transform p-1 rounded-full bg-blue-500/10"
                               title="Make a Call">
                              <FaPhoneAlt />
                            </a>
                          )}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="py-4 px-5">
                    {lead.assignedTo ? (
                      <div className="flex flex-col">
                        <span className="text-sm font-medium" style={{ color: themeColors.text }}>{lead.assignedTo.name}</span>
                        <span 
                          className="text-[10px] uppercase tracking-wider font-bold mt-1 px-2 py-0.5 rounded-md self-start inline-block border"
                          style={{ backgroundColor: `${themeColors.primary}10`, color: themeColors.primary, borderColor: `${themeColors.primary}30` }}
                        >
                          {lead.assignedTo.role}
                        </span>
                      </div>
                    ) : (
                      <span className="text-xs italic" style={{ color: themeColors.textSecondary }}>Unassigned</span>
                    )}
                  </td>
                  <td className="py-4 px-5 text-sm">
                    <span className="font-semibold block" style={{ color: themeColors.text }}>{lead.source || 'Unknown'}</span>
                    {lead.tags && lead.tags.length > 0 && (
                      <div className="flex gap-1 mt-1 flex-wrap">
                        {lead.tags.slice(0, 2).map((tag, i) => (
                          <span key={i} className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </td>
                  <td className="py-4 px-5 text-sm">
                    <select
                      value={lead.status || 'new'}
                      onChange={(e) => handleStatusChange(lead._id, e.target.value)}
                      className={`px-2 py-1.5 rounded-md text-[11px] uppercase font-bold border tracking-wider shadow-sm cursor-pointer outline-none transition-colors min-w-[120px] max-w-[150px] ${getStatusBadge(lead.status)}`}
                    >
                      {['new', 'assigned', 'interested', 'in_process', 'not_interested', 'converted', 'closed'].map(st => (
                        <option key={st} value={st} className="text-gray-900 bg-white dark:bg-gray-800 dark:text-white uppercase font-semibold">
                          {st.replace('_', ' ')}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="py-4 px-5">
                    <div className="flex flex-col gap-2.5 min-w-[220px] max-w-[280px]">
                      {/* Latest Remark Section */}
                      {lead.remarks && lead.remarks.length > 0 ? (
                        <div 
                          onClick={() => { setHistoryLead(lead); setIsHistoryModalOpen(true); }}
                          className="p-2.5 rounded-lg border shadow-sm transition-all hover:shadow-md cursor-pointer group hover:bg-black/5 dark:hover:bg-white/5" 
                          style={{ backgroundColor: themeColors.surface, borderColor: themeColors.border }}
                        >
                          <div className="flex items-center justify-between mb-1.5">
                            <div className="flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: themeColors.primary }}></span>
                              <span className="font-bold text-[10px] uppercase tracking-wider" style={{ color: themeColors.primary }}>Latest Remark</span>
                            </div>
                            <span className="text-[10px] font-bold opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: themeColors.primary }}>View History</span>
                          </div>
                          <p className="text-xs leading-relaxed line-clamp-2" style={{ color: themeColors.text }} title={lead.remarks[lead.remarks.length - 1].note}>
                            {lead.remarks[lead.remarks.length - 1].note}
                          </p>
                        </div>
                      ) : (
                        <div className="p-2 rounded-lg border border-dashed flex items-center justify-center" style={{ borderColor: themeColors.border, backgroundColor: 'rgba(0,0,0,0.02)' }}>
                          <span className="text-xs italic" style={{ color: themeColors.textSecondary }}>No remarks yet</span>
                        </div>
                      )}
                      
                      {/* Follow-Up Section */}
                      {lead.followUpDate ? (
                        <div className="flex items-center gap-2 p-2 rounded-lg border" style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)', borderColor: 'rgba(245, 158, 11, 0.2)' }}>
                          <div className="p-1.5 rounded-md" style={{ backgroundColor: 'rgba(245, 158, 11, 0.2)', color: '#d97706' }}>
                            <FaCalendarPlus className="text-xs" />
                          </div>
                          <div className="flex flex-col">
                            <span className="text-[9px] font-bold uppercase tracking-wider" style={{ color: '#b45309' }}>Next Follow-Up</span>
                            <span className="text-xs font-bold" style={{ color: '#92400e' }}>
                              {new Date(lead.followUpDate).toLocaleString('en-IN', { 
                                day: '2-digit', month: 'short', year: 'numeric', 
                                hour: '2-digit', minute: '2-digit', hour12: true 
                              })}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <span className="text-[10px] font-medium italic px-1" style={{ color: themeColors.textSecondary }}>
                          No follow-up scheduled
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-4 px-5 text-xs font-medium whitespace-nowrap" style={{ color: themeColors.textSecondary }}>
                    {new Date(lead.createdAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}
                  </td>
                  <td className="py-4 px-5">
                    <div className="flex justify-start items-center gap-2 flex-wrap min-w-[160px]">
                      <button 
                        onClick={() => openAssignModal(lead)}
                        className="p-2 rounded-md transition-all hover:scale-110"
                        style={{ color: '#8b5cf6', backgroundColor: 'rgba(139, 92, 246, 0.1)' }}
                        title="Assign Lead"
                      >
                        <FaUserPlus />
                      </button>
                      
                      <button 
                        onClick={() => handleDeleteLead(lead._id)}
                        className="p-2 rounded-md transition-all hover:scale-110"
                        style={{ color: '#ef4444', backgroundColor: 'rgba(239, 68, 68, 0.1)' }}
                        title="Delete Lead"
                      >
                        <FaTrash />
                      </button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="8" className="py-12 text-center">
                    <p className="font-medium" style={{ color: themeColors.textSecondary }}>No leads found matching your criteria.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination Controls */}
        {!isFetching && leads.length > 0 && (
          <div className="p-4 border-t flex justify-between items-center" style={{ borderColor: themeColors.border, backgroundColor: `${themeColors.primary}05` }}>
            <span className="text-xs font-medium" style={{ color: themeColors.textSecondary }}>
              Showing Page {currentPage} of {totalPages} ({totalItems} total leads)
            </span>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="p-2 rounded-md border transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:bg-black/5 dark:hover:bg-white/5"
                style={{ borderColor: themeColors.border, color: themeColors.text }}
              >
                <FaChevronLeft className="text-xs" />
              </button>
              
              <div className="flex gap-1">
                {[...Array(totalPages)].map((_, i) => (
                  <button
                    key={i + 1}
                    onClick={() => handlePageChange(i + 1)}
                    className={`w-8 h-8 rounded-md text-xs font-bold transition-all ${currentPage === i + 1 ? 'shadow-sm' : 'border'}`}
                    style={{ 
                      backgroundColor: currentPage === i + 1 ? themeColors.primary : 'transparent',
                      color: currentPage === i + 1 ? themeColors.onPrimary : themeColors.text,
                      borderColor: currentPage === i + 1 ? themeColors.primary : themeColors.border
                    }}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>

              <button 
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="p-2 rounded-md border transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:bg-black/5 dark:hover:bg-white/5"
                style={{ borderColor: themeColors.border, color: themeColors.text }}
              >
                <FaChevronRight className="text-xs" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add Lead Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div 
            className="w-full max-w-lg rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            style={{ backgroundColor: themeColors.surface, borderColor: themeColors.border, borderWidth: '1px' }}
          >
            <div className="flex justify-between items-center p-5 border-b shrink-0" style={{ borderColor: themeColors.border }}>
              <h2 className="text-xl font-bold" style={{ color: themeColors.text }}>Create New Lead</h2>
              <button onClick={() => setIsAddModalOpen(false)} className="p-2 rounded-full hover:bg-black/5 transition-colors" style={{ color: themeColors.textSecondary }}>
                <FaTimes />
              </button>
            </div>
            
            <form onSubmit={handleAddLead} className="flex flex-col overflow-hidden">
              <div className="p-6 overflow-y-auto custom-scrollbar space-y-4 flex-1">
                <div>
                  <label className="block text-sm font-bold mb-1.5" style={{ color: themeColors.text }}>Full Name *</label>
                  <input 
                    required type="text" placeholder="e.g. Ramesh Lead"
                    value={newLead.name} onChange={(e) => setNewLead({...newLead, name: e.target.value})}
                    className="w-full p-2.5 rounded-lg border focus:ring-2 focus:outline-none transition-colors"
                    style={{ backgroundColor: themeColors.background, borderColor: themeColors.border, color: themeColors.text }}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold mb-1.5" style={{ color: themeColors.text }}>Phone *</label>
                    <input 
                      required type="text" placeholder="e.g. 9876543210"
                      value={newLead.phone} onChange={(e) => setNewLead({...newLead, phone: e.target.value})}
                      className="w-full p-2.5 rounded-lg border focus:ring-2 focus:outline-none transition-colors"
                      style={{ backgroundColor: themeColors.background, borderColor: themeColors.border, color: themeColors.text }}
                    />
                    {phoneConflict && (
                      <div className="mt-1.5 p-2 rounded-lg border text-[11px] font-bold"
                        style={{ backgroundColor: '#fee2e2', borderColor: '#fca5a5', color: '#b91c1c' }}>
                        <span>⚠️ Mobile number pehle se hi added hai: <b>{phoneConflict.name}</b>.</span>
                        {phoneConflict.assignedToName ? (
                          <span> Assigned: <b className="capitalize">{phoneConflict.assignedToName}</b> ({phoneConflict.assignedToRole || 'sales'})</span>
                        ) : (
                          <span> (Not assigned)</span>
                        )}
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-bold mb-1.5" style={{ color: themeColors.text }}>Email</label>
                    <input 
                      type="email" placeholder="e.g. email@example.com"
                      value={newLead.email} onChange={(e) => setNewLead({...newLead, email: e.target.value})}
                      className="w-full p-2.5 rounded-lg border focus:ring-2 focus:outline-none transition-colors"
                      style={{ backgroundColor: themeColors.background, borderColor: themeColors.border, color: themeColors.text }}
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold mb-1.5" style={{ color: themeColors.text }}>Lead Source</label>
                    <div className="relative">
                      <select 
                        value={newLead.source} onChange={(e) => setNewLead({...newLead, source: e.target.value})}
                        className="w-full p-2.5 rounded-lg border focus:ring-2 focus:outline-none transition-colors appearance-none"
                        style={{ backgroundColor: themeColors.background, borderColor: themeColors.border, color: themeColors.text }}
                      >
                        <option value="">Select Source...</option>
                        {settings.leadSources?.map(src => <option key={src} value={src}>{src}</option>)}
                      </select>
                      <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none" style={{ color: themeColors.textSecondary }}>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-bold mb-1.5" style={{ color: themeColors.text }}>Priority</label>
                    <div className="relative">
                      <select 
                        value={newLead.priority} onChange={(e) => setNewLead({...newLead, priority: e.target.value})}
                        className="w-full p-2.5 rounded-lg border focus:ring-2 focus:outline-none transition-colors appearance-none"
                        style={{ backgroundColor: themeColors.background, borderColor: themeColors.border, color: themeColors.text }}
                      >
                        <option value="">Select Priority...</option>
                        {settings.priorities?.map(p => <option key={p} value={p}>{p.toUpperCase()}</option>)}
                      </select>
                      <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none" style={{ color: themeColors.textSecondary }}>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 p-5 border-t shrink-0" style={{ borderColor: themeColors.border, backgroundColor: themeColors.surface }}>
                <button 
                  type="button" onClick={() => setIsAddModalOpen(false)}
                  className="px-5 py-2.5 rounded-lg font-medium transition-colors border hover:bg-black/5 dark:hover:bg-white/5"
                  style={{ color: themeColors.text, borderColor: themeColors.border }}
                >
                  Cancel
                </button>
                <button 
                  type="submit" disabled={isAdding}
                  className="px-5 py-2.5 rounded-lg font-medium transition-transform active:scale-95 disabled:opacity-70 flex items-center gap-2 shadow-md hover:shadow-lg"
                  style={{ backgroundColor: themeColors.primary, color: themeColors.onPrimary }}
                >
                  {isAdding ? <div className="w-4 h-4 rounded-full border-2 border-t-transparent animate-spin"></div> : <FaPlus />}
                  {isAdding ? 'Saving...' : 'Save Lead'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assign Lead Modal */}
      {isAssignModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div 
            className="w-full max-w-md rounded-xl shadow-2xl overflow-hidden"
            style={{ backgroundColor: themeColors.surface, borderColor: themeColors.border, borderWidth: '1px' }}
          >
            <div className="flex justify-between items-center p-4 border-b" style={{ borderColor: themeColors.border }}>
              <h2 className="text-lg font-semibold" style={{ color: themeColors.text }}>Assign Lead</h2>
              <button onClick={() => setIsAssignModalOpen(false)} className="p-2 rounded-full hover:bg-black/5" style={{ color: themeColors.textSecondary }}>
                <FaTimes />
              </button>
            </div>
            <div className="p-6 space-y-5">
              <div>
                <p style={{ color: themeColors.text }} className="font-medium">
                  Select a team member for <span className="font-bold">{selectedLead?.name}</span>
                </p>
                <p className="text-xs mt-1" style={{ color: themeColors.textSecondary }}>
                  This will transfer the lead to the selected user's panel.
                </p>
              </div>

              <div>
                <label className="block text-sm font-bold mb-2" style={{ color: themeColors.text }}>Team Member</label>
                <div className="relative">
                  <select 
                    className="w-full p-3 rounded-lg border focus:outline-none focus:ring-2 shadow-sm transition-colors font-medium appearance-none"
                    style={{ backgroundColor: themeColors.background, borderColor: themeColors.border, color: themeColors.text }}
                    value={selectedAssigneeId}
                    onChange={(e) => setSelectedAssigneeId(e.target.value)}
                  >
                    <option value="" disabled>Choose a user...</option>
                    {staffList.map(staff => (
                      <option key={staff._id} value={staff._id}>
                        {staff.name} ({staff.role.toUpperCase()})
                      </option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none" style={{ color: themeColors.textSecondary }}>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 p-4 border-t bg-black/5 dark:bg-white/5" style={{ borderColor: themeColors.border }}>
              <button 
                onClick={() => setIsAssignModalOpen(false)}
                className="px-4 py-2 rounded-lg font-medium transition-colors border hover:bg-black/5 dark:hover:bg-white/5"
                style={{ color: themeColors.text, borderColor: themeColors.border }}
              >
                Cancel
              </button>
              <button 
                onClick={handleAssignLead}
                disabled={isAssigning}
                className="px-4 py-2 rounded-lg font-medium transition-transform active:scale-95 disabled:opacity-70 flex items-center gap-2"
                style={{ backgroundColor: themeColors.primary, color: themeColors.onPrimary }}
              >
                {isAssigning ? <div className="w-4 h-4 rounded-full border-2 border-t-transparent animate-spin"></div> : null}
                {isAssigning ? 'Assigning...' : 'Assign'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Remarks History Modal */}
      {isHistoryModalOpen && historyLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div 
            className="w-full max-w-2xl rounded-xl shadow-2xl flex flex-col max-h-[85vh]"
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
                  {/* Reverse remarks array to show latest first */}
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

      {/* Bulk Upload Modal */}
      {isBulkUploadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div 
            className="w-full max-w-md rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-slide-up"
            style={{ backgroundColor: themeColors.surface, border: `1px solid ${themeColors.border}` }}
          >
            <div className="flex justify-between items-center p-5 border-b" style={{ borderColor: themeColors.border }}>
              <div>
                <h2 className="text-lg font-bold flex items-center gap-2" style={{ color: themeColors.text }}>
                  <FaUpload style={{ color: themeColors.primary }} /> Bulk Upload Leads
                </h2>
                <p className="text-xs mt-1" style={{ color: themeColors.textSecondary }}>Upload leads via CSV file</p>
              </div>
              <button onClick={() => { setIsBulkUploadModalOpen(false); setBulkFile(null); }} className="p-2 rounded-full hover:bg-black/5" style={{ color: themeColors.textSecondary }}>
                <FaTimes />
              </button>
            </div>
            
            <form onSubmit={handleBulkUploadSubmit} className="p-6">
              <div className="mb-6">
                <div 
                  className="border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors hover:bg-black/5 dark:hover:bg-white/5"
                  style={{ borderColor: themeColors.border }}
                  onClick={() => document.getElementById('csvUploadInput').click()}
                >
                  <input 
                    id="csvUploadInput"
                    type="file" 
                    accept=".csv" 
                    className="hidden" 
                    onChange={(e) => setBulkFile(e.target.files[0])}
                  />
                  <FaFileCsv className="text-4xl mx-auto mb-3" style={{ color: themeColors.primary }} />
                  <p className="font-medium mb-1" style={{ color: themeColors.text }}>
                    {bulkFile ? bulkFile.name : "Click to select a CSV file"}
                  </p>
                  <p className="text-xs" style={{ color: themeColors.textSecondary }}>
                    {bulkFile ? `${(bulkFile.size / 1024).toFixed(2)} KB` : "Only .csv files are supported"}
                  </p>
                </div>
              </div>

              <div className="mb-6 flex justify-between items-center bg-black/5 dark:bg-white/5 p-4 rounded-xl">
                <div>
                  <p className="font-semibold text-sm" style={{ color: themeColors.text }}>Need a template?</p>
                  <p className="text-xs mt-0.5" style={{ color: themeColors.textSecondary }}>Download sample CSV format</p>
                </div>
                <button 
                  type="button"
                  onClick={handleDownloadSample}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
                  style={{ backgroundColor: themeColors.surface, color: themeColors.primary, border: `1px solid ${themeColors.border}` }}
                >
                  <FaDownload /> Download
                </button>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t" style={{ borderColor: themeColors.border }}>
                <button 
                  type="button"
                  onClick={() => { setIsBulkUploadModalOpen(false); setBulkFile(null); }}
                  className="px-4 py-2 rounded-lg font-medium transition-colors hover:bg-black/5 dark:hover:bg-white/5"
                  style={{ color: themeColors.text }}
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={isUploading || !bulkFile}
                  className="px-6 py-2 rounded-lg font-medium transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 hover:shadow-lg"
                  style={{ backgroundColor: themeColors.primary, color: themeColors.onPrimary }}
                >
                  {isUploading ? (
                    <><div className="w-4 h-4 rounded-full border-2 border-t-transparent animate-spin"></div> Uploading...</>
                  ) : (
                    <><FaUpload /> Upload Leads</>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default memo(LeadManagement);
