import { useState, useEffect, memo } from "react";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import axios from "axios";
import { toast } from "sonner";
import Swal from "sweetalert2";
import { FaUserPlus, FaTimes, FaEdit, FaTrash, FaUsers, FaSearch, FaFilter, FaChevronLeft, FaChevronRight, FaEye } from "react-icons/fa";

const ROLES = [
  { id: "accountant", label: "Accountant" },
  { id: "sales", label: "Sales Representative" },
  { id: "calling", label: "Calling Agent" },
  { id: "installation", label: "Installer" },
  { id: "crmuser", label: "CRM User" }
];

const CreateUser = () => {
  const { themeColors } = useTheme();
  const { token } = useAuth();
  
  // Table Data State
  const [users, setUsers] = useState([]);
  const [isFetching, setIsFetching] = useState(true);
  
  // Filters & Pagination
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState(""); 
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const limit = 10;
  
  // Create Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // View Details Modal State
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [viewingUser, setViewingUser] = useState(null);
  const [isFetchingDetails, setIsFetchingDetails] = useState(false);
  
  // Edit Modal State
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [editFormData, setEditFormData] = useState({
    name: "", email: "", phone: "", role: "accountant", password: ""
  });

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "accountant",
    phone: "",
  });

  const fetchUsers = async () => {
    setIsFetching(true);
    try {
      const baseUrl = import.meta.env.VITE_API_BASE_URL;
      const params = {
        page: currentPage,
        limit: limit
      };
      
      if (searchQuery) params.search = searchQuery;
      if (roleFilter) params.role = roleFilter;
      
      const response = await axios.get(`${baseUrl}/users`, {
        params,
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.status === "success") {
        setUsers(response.data.data.users || []);
        setTotalPages(response.data.pages || 1);
        setTotalItems(response.data.total || 0);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch staff list.");
    } finally {
      setIsFetching(false);
    }
  };

  useEffect(() => {
    if (!token) return;
    const delayDebounceFn = setTimeout(() => {
      fetchUsers();
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery, roleFilter, currentPage, token]);

  const handlePageChange = (newPage) => {
    if (newPage > 0 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const openModal = () => {
    setFormData({
      name: "", email: "", password: "", role: "accountant", phone: ""
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email || !formData.password || !formData.role) {
      return toast.error("Please fill in all required fields.");
    }
    
    setIsSubmitting(true);
    
    try {
      const baseUrl = import.meta.env.VITE_API_BASE_URL;
      const response = await axios.post(`${baseUrl}/users`, formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.status === "success") {
        toast.success(`Staff ${response.data.data.user.name} created successfully!`);
        setIsModalOpen(false);
        fetchUsers(); 
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to create staff member.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditModal = (user) => {
    setSelectedUser(user);
    setEditFormData({
      name: user.name || "",
      email: user.email || "",
      phone: user.phone || "",
      role: user.role || "accountant",
      password: ""
    });
    setEditModalOpen(true);
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    if (!editFormData.name || !editFormData.email || !editFormData.role) {
      return toast.error("Please fill in all required fields.");
    }
    
    setIsUpdating(true);
    try {
      const baseUrl = import.meta.env.VITE_API_BASE_URL;
      const response = await axios.put(`${baseUrl}/users/${selectedUser._id}`, editFormData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.status === "success" || response.status === 200) {
        toast.success(`Staff updated successfully!`);
        setEditModalOpen(false);
        fetchUsers(); 
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to update staff member.");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleViewUser = async (id) => {
    setIsFetchingDetails(true);
    try {
      const baseUrl = import.meta.env.VITE_API_BASE_URL;
      const response = await axios.get(`${baseUrl}/users/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.status === "success") {
        setViewingUser(response.data.data.user);
        setViewModalOpen(true);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch staff details.");
    } finally {
      setIsFetchingDetails(false);
    }
  };

  const handleDeleteUser = async (id, name) => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: `Are you sure you want to delete ${name}? This action cannot be undone.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete it!"
    });

    if (result.isConfirmed) {
      try {
        const baseUrl = import.meta.env.VITE_API_BASE_URL;
        const response = await axios.delete(`${baseUrl}/users/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (response.data.status === "success" || response.status === 200 || response.status === 204) {
          toast.success(`${name} has been deleted successfully.`);
          fetchUsers();
        }
      } catch (err) {
        console.error(err);
        toast.error(err.response?.data?.message || "Failed to delete staff member.");
      }
    }
  };

  const handleToggleStatus = async (id) => {
    try {
      const baseUrl = import.meta.env.VITE_API_BASE_URL;
      const response = await axios.put(`${baseUrl}/users/${id}/toggle-status`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.status === "success" || response.status === 200) {
        toast.success(response.data.message || "Status toggled successfully.");
        fetchUsers();
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to toggle status.");
    }
  };

  return (
    <div className="p-6 animate-fade-in relative space-y-6">
      
      {/* Header Area */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-3" style={{ color: themeColors.text }}>
            <div className="p-2 rounded-lg" style={{ backgroundColor: `${themeColors.primary}15`, color: themeColors.primary }}>
              <FaUsers className="text-lg" />
            </div>
            Staff Management
          </h1>
          <p className="text-sm mt-1" style={{ color: themeColors.textSecondary }}>
            Manage your accountants, sales reps, calling agents, installers, and general users.
          </p>
        </div>
        <button
          onClick={openModal}
          className="py-2.5 px-6 rounded-xl font-bold text-sm transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 flex items-center gap-2"
          style={{ backgroundColor: themeColors.primary, color: themeColors.onPrimary }}
        >
          <FaUserPlus />
          Create Staff
        </button>
      </div>

      {/* Filters Bar */}
      <div 
        className="flex flex-col sm:flex-row gap-4 p-4 rounded-xl shadow-sm border items-center justify-between"
        style={{ backgroundColor: themeColors.surface, borderColor: themeColors.border }}
      >
        <div className="flex items-center gap-3 w-full sm:w-1/2">
          <div className="relative w-full">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-sm" style={{ color: themeColors.textSecondary }} />
            <input 
              type="text" 
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1); 
              }}
              className="w-full pl-9 pr-4 py-2.5 rounded-lg border focus:outline-none focus:ring-2 shadow-sm text-sm"
              style={{ backgroundColor: themeColors.background, color: themeColors.text, borderColor: themeColors.border }}
            />
          </div>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <FaFilter className="text-sm" style={{ color: themeColors.textSecondary }} />
          <select 
            value={roleFilter}
            onChange={(e) => {
              setRoleFilter(e.target.value);
              setCurrentPage(1); 
            }}
            className="p-2.5 rounded-lg border focus:outline-none focus:ring-2 shadow-sm text-sm appearance-none min-w-[180px] bg-transparent"
            style={{ backgroundColor: themeColors.background, color: themeColors.text, borderColor: themeColors.border }}
          >
            <option value="">All Roles</option>
            {ROLES.map(role => (
              <option key={role.id} value={role.id}>{role.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Content Table */}
      <div 
        className="rounded-xl shadow-sm border overflow-hidden transition-all duration-300 flex flex-col"
        style={{ backgroundColor: themeColors.surface, borderColor: themeColors.border, minHeight: '400px' }}
      >
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr style={{ backgroundColor: `${themeColors.primary}08`, borderBottom: `1px solid ${themeColors.border}` }}>
                <th className="py-4 px-6 font-semibold text-sm" style={{ color: themeColors.textSecondary }}>Employee</th>
                <th className="py-4 px-6 font-semibold text-sm" style={{ color: themeColors.textSecondary }}>Contact Details</th>
                <th className="py-4 px-6 font-semibold text-sm" style={{ color: themeColors.textSecondary }}>Assigned Role</th>
                <th className="py-4 px-6 font-semibold text-sm" style={{ color: themeColors.textSecondary }}>Status</th>
                <th className="py-4 px-6 font-semibold text-sm text-center" style={{ color: themeColors.textSecondary }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {isFetching ? (
                <tr>
                  <td colSpan="5" className="py-12 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 mx-auto" style={{ borderColor: themeColors.primary }}></div>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan="5" className="py-12 text-center font-medium" style={{ color: themeColors.textSecondary }}>
                    No staff members found matching your filters.
                  </td>
                </tr>
              ) : (
                users.map((user, index) => (
                  <tr 
                    key={user._id} 
                    style={{ borderBottom: index !== users.length - 1 ? `1px solid ${themeColors.border}` : 'none' }}
                    className="hover:bg-black/5 dark:hover:bg-white/5 transition-colors duration-150 group"
                  >
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm"
                          style={{ backgroundColor: `${themeColors.primary}20`, color: themeColors.primary }}
                        >
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <span className="text-sm font-bold block" style={{ color: themeColors.text }}>{user.name}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className="text-sm block font-medium" style={{ color: themeColors.textSecondary }}>{user.email}</span>
                      <span className="text-xs block mt-0.5" style={{ color: themeColors.textSecondary }}>{user.phone || 'No phone'}</span>
                    </td>
                    <td className="py-4 px-6">
                      <span 
                        className="px-2.5 py-1 rounded-md text-xs font-semibold uppercase tracking-wider"
                        style={{ 
                          backgroundColor: `${themeColors.primary}15`, 
                          color: themeColors.primary,
                          border: `1px solid ${themeColors.primary}30`
                        }}
                      >
                        {user.role}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-sm">
                      <button 
                        onClick={() => handleToggleStatus(user._id)}
                        className={`px-3 py-1 rounded-full text-[10px] uppercase font-bold tracking-widest transition-transform hover:scale-105 active:scale-95 ${
                          user.active ? 'bg-green-600 text-white shadow-sm hover:bg-green-700' : 'bg-red-600 text-white shadow-sm hover:bg-red-700'
                        }`}
                        title="Click to toggle status"
                      >
                        {user.active ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <button 
                          onClick={() => handleViewUser(user._id)}
                          className="p-2 rounded-md transition-all hover:scale-110"
                          style={{ color: '#0ea5e9', backgroundColor: 'rgba(14, 165, 233, 0.1)' }}
                          title="View Details"
                        >
                          {isFetchingDetails && viewingUser?._id === user._id ? (
                            <FaUsers className="animate-spin" />
                          ) : (
                            <FaEye />
                          )}
                        </button>
                        <button 
                          onClick={() => openEditModal(user)}
                          className="p-2 rounded-md transition-all hover:scale-110"
                          style={{ color: themeColors.primary, backgroundColor: `${themeColors.primary}10` }}
                          title="Edit User"
                        >
                          <FaEdit />
                        </button>
                        <button 
                          onClick={() => handleDeleteUser(user._id, user.name)}
                          className="p-2 rounded-md transition-all hover:scale-110"
                          style={{ color: '#ef4444', backgroundColor: 'rgba(239, 68, 68, 0.1)' }}
                          title="Delete User"
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination Controls */}
        {!isFetching && users.length > 0 && (
          <div className="p-4 border-t flex justify-between items-center" style={{ borderColor: themeColors.border, backgroundColor: `${themeColors.primary}05` }}>
            <span className="text-xs font-medium" style={{ color: themeColors.textSecondary }}>
              Showing Page {currentPage} of {totalPages} ({totalItems} total users)
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

      {/* Create User Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div 
            className="w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            style={{ backgroundColor: themeColors.surface }}
          >
            {/* Modal Header */}
            <div className="p-5 border-b flex justify-between items-center" style={{ borderColor: themeColors.border }}>
              <h2 className="text-xl font-bold flex items-center gap-2" style={{ color: themeColors.text }}>
                <FaUserPlus style={{ color: themeColors.primary }} />
                Create Staff Member
              </h2>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                style={{ color: themeColors.textSecondary }}
              >
                <FaTimes />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto custom-scrollbar">
              <form id="createUserForm" onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold mb-1" style={{ color: themeColors.text }}>Full Name *</label>
                    <input 
                      type="text" name="name" value={formData.name} onChange={handleChange} required
                      placeholder="e.g. Suresh Accountant"
                      className="w-full p-2.5 rounded-lg border focus:outline-none focus:ring-2 shadow-sm"
                      style={{ backgroundColor: themeColors.background, color: themeColors.text, borderColor: themeColors.border }}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold mb-1" style={{ color: themeColors.text }}>Email Address *</label>
                    <input 
                      type="email" name="email" value={formData.email} onChange={handleChange} required
                      placeholder="account@crm.com"
                      className="w-full p-2.5 rounded-lg border focus:outline-none focus:ring-2 shadow-sm"
                      style={{ backgroundColor: themeColors.background, color: themeColors.text, borderColor: themeColors.border }}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold mb-1" style={{ color: themeColors.text }}>Phone Number</label>
                    <input 
                      type="tel" name="phone" value={formData.phone} onChange={handleChange}
                      placeholder="9988776633"
                      className="w-full p-2.5 rounded-lg border focus:outline-none focus:ring-2 shadow-sm"
                      style={{ backgroundColor: themeColors.background, color: themeColors.text, borderColor: themeColors.border }}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold mb-1" style={{ color: themeColors.text }}>Password *</label>
                    <input 
                      type="password" name="password" value={formData.password} onChange={handleChange} required minLength={6}
                      placeholder="••••••••"
                      className="w-full p-2.5 rounded-lg border focus:outline-none focus:ring-2 shadow-sm"
                      style={{ backgroundColor: themeColors.background, color: themeColors.text, borderColor: themeColors.border }}
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold mb-1" style={{ color: themeColors.text }}>Staff Role *</label>
                    <select 
                      name="role" value={formData.role} onChange={handleChange} required
                      className="w-full p-2.5 rounded-lg border focus:outline-none focus:ring-2 shadow-sm appearance-none"
                      style={{ backgroundColor: themeColors.background, color: themeColors.text, borderColor: themeColors.border }}
                    >
                      {ROLES.map(role => (
                        <option key={role.id} value={role.id}>{role.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </form>
            </div>

            {/* Modal Footer */}
            <div className="p-5 border-t flex justify-end gap-3" style={{ borderColor: themeColors.border, backgroundColor: themeColors.background }}>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="py-2.5 px-5 rounded-xl font-bold text-sm transition-all border hover:bg-black/5 dark:hover:bg-white/5"
                style={{ borderColor: themeColors.border, color: themeColors.text }}
              >
                Cancel
              </button>
              <button
                type="submit"
                form="createUserForm"
                disabled={isSubmitting}
                className="py-2.5 px-6 rounded-xl font-bold text-sm transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2"
                style={{ backgroundColor: themeColors.primary, color: themeColors.onPrimary }}
              >
                {isSubmitting ? 'Creating...' : 'Confirm & Create'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {editModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div 
            className="w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            style={{ backgroundColor: themeColors.surface }}
          >
            <div className="p-5 border-b flex justify-between items-center" style={{ borderColor: themeColors.border }}>
              <h2 className="text-xl font-bold flex items-center gap-2" style={{ color: themeColors.text }}>
                <FaEdit style={{ color: themeColors.primary }} />
                Update Staff Member
              </h2>
              <button 
                onClick={() => setEditModalOpen(false)}
                className="p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                style={{ color: themeColors.textSecondary }}
              >
                <FaTimes />
              </button>
            </div>

            <div className="p-6 overflow-y-auto custom-scrollbar">
              <form id="editUserForm" onSubmit={handleUpdateUser} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold mb-1" style={{ color: themeColors.text }}>Full Name *</label>
                    <input 
                      type="text" value={editFormData.name} onChange={(e) => setEditFormData({...editFormData, name: e.target.value})} required
                      className="w-full p-2.5 rounded-lg border focus:outline-none focus:ring-2 shadow-sm"
                      style={{ backgroundColor: themeColors.background, color: themeColors.text, borderColor: themeColors.border }}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold mb-1" style={{ color: themeColors.text }}>Email Address *</label>
                    <input 
                      type="email" value={editFormData.email} onChange={(e) => setEditFormData({...editFormData, email: e.target.value})} required
                      className="w-full p-2.5 rounded-lg border focus:outline-none focus:ring-2 shadow-sm"
                      style={{ backgroundColor: themeColors.background, color: themeColors.text, borderColor: themeColors.border }}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold mb-1" style={{ color: themeColors.text }}>Phone Number</label>
                    <input 
                      type="tel" value={editFormData.phone} onChange={(e) => setEditFormData({...editFormData, phone: e.target.value})}
                      className="w-full p-2.5 rounded-lg border focus:outline-none focus:ring-2 shadow-sm"
                      style={{ backgroundColor: themeColors.background, color: themeColors.text, borderColor: themeColors.border }}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold mb-1" style={{ color: themeColors.text }}>Role *</label>
                    <div className="relative">
                      <select 
                        value={editFormData.role} onChange={(e) => setEditFormData({...editFormData, role: e.target.value})} required
                        className="w-full p-2.5 rounded-lg border focus:outline-none focus:ring-2 shadow-sm appearance-none"
                        style={{ backgroundColor: themeColors.background, color: themeColors.text, borderColor: themeColors.border }}
                      >
                        {ROLES.map(r => (
                          <option key={r.id} value={r.id}>{r.label}</option>
                        ))}
                      </select>
                      <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none" style={{ color: themeColors.textSecondary }}>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold mb-1" style={{ color: themeColors.text }}>Change Password (Optional)</label>
                    <input 
                      type="text" value={editFormData.password} onChange={(e) => setEditFormData({...editFormData, password: e.target.value})}
                      placeholder="Enter new password" minLength={6}
                      className="w-full p-2.5 rounded-lg border focus:outline-none focus:ring-2 shadow-sm"
                      style={{ backgroundColor: themeColors.background, color: themeColors.text, borderColor: themeColors.border }}
                    />
                  </div>
                </div>
              </form>
            </div>

            <div className="p-5 border-t flex justify-end gap-3" style={{ borderColor: themeColors.border, backgroundColor: themeColors.background }}>
              <button 
                type="button" 
                onClick={() => setEditModalOpen(false)}
                className="py-2.5 px-5 rounded-xl font-bold text-sm transition-colors border hover:bg-black/5 dark:hover:bg-white/5"
                style={{ borderColor: themeColors.border, color: themeColors.text }}
              >
                Cancel
              </button>
              <button 
                type="submit" 
                form="editUserForm"
                disabled={isUpdating}
                className="py-2.5 px-6 rounded-xl font-bold text-sm transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2"
                style={{ backgroundColor: themeColors.primary, color: themeColors.onPrimary }}
              >
                {isUpdating ? 'Updating...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Details Modal */}
      {viewModalOpen && viewingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div 
            className="w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            style={{ backgroundColor: themeColors.surface }}
          >
            {/* Modal Header */}
            <div className="p-5 border-b flex justify-between items-center" style={{ borderColor: themeColors.border }}>
              <h2 className="text-xl font-bold flex items-center gap-2" style={{ color: themeColors.text }}>
                <FaEye style={{ color: themeColors.info || '#0ea5e9' }} />
                Staff Details
              </h2>
              <button 
                onClick={() => setViewModalOpen(false)}
                className="p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                style={{ color: themeColors.textSecondary }}
              >
                <FaTimes />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto custom-scrollbar space-y-4">
              <div className="flex items-center gap-4 mb-6">
                <div 
                  className="w-16 h-16 rounded-full flex items-center justify-center font-bold text-2xl"
                  style={{ backgroundColor: `${themeColors.primary}20`, color: themeColors.primary }}
                >
                  {viewingUser.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-lg font-bold" style={{ color: themeColors.text }}>{viewingUser.name}</h3>
                  <span className="text-xs uppercase font-semibold px-2 py-0.5 rounded-md" style={{ backgroundColor: `${themeColors.primary}15`, color: themeColors.primary }}>
                    {viewingUser.role}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 rounded-lg border" style={{ borderColor: themeColors.border, backgroundColor: themeColors.background }}>
                  <p className="text-xs font-semibold mb-1" style={{ color: themeColors.textSecondary }}>Email Address</p>
                  <p className="text-sm font-medium" style={{ color: themeColors.text }}>{viewingUser.email}</p>
                </div>
                <div className="p-3 rounded-lg border" style={{ borderColor: themeColors.border, backgroundColor: themeColors.background }}>
                  <p className="text-xs font-semibold mb-1" style={{ color: themeColors.textSecondary }}>Phone Number</p>
                  <p className="text-sm font-medium" style={{ color: themeColors.text }}>{viewingUser.phone || 'N/A'}</p>
                </div>
                <div className="p-3 rounded-lg border" style={{ borderColor: themeColors.border, backgroundColor: themeColors.background }}>
                  <p className="text-xs font-semibold mb-1" style={{ color: themeColors.textSecondary }}>Status</p>
                  <p className="text-sm font-medium" style={{ color: viewingUser.active ? '#16a34a' : '#dc2626' }}>
                    {viewingUser.active ? 'Active' : 'Inactive'}
                  </p>
                </div>
                <div className="p-3 rounded-lg border" style={{ borderColor: themeColors.border, backgroundColor: themeColors.background }}>
                  <p className="text-xs font-semibold mb-1" style={{ color: themeColors.textSecondary }}>Joined On</p>
                  <p className="text-sm font-medium" style={{ color: themeColors.text }}>
                    {new Date(viewingUser.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="p-4 rounded-lg border col-span-2" style={{ borderColor: themeColors.border, backgroundColor: `${themeColors.primary}05` }}>
                  <p className="text-sm font-bold mb-3" style={{ color: themeColors.primary }}>Login Credentials</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs font-semibold mb-1" style={{ color: themeColors.textSecondary }}>Login ID (Email)</p>
                      <p className="text-sm font-bold font-mono bg-white dark:bg-black/20 p-2 rounded border" style={{ color: themeColors.text, borderColor: themeColors.border }}>{viewingUser.email}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold mb-1" style={{ color: themeColors.textSecondary }}>Password</p>
                      <p className="text-sm font-bold font-mono bg-white dark:bg-black/20 p-2 rounded border" style={{ color: themeColors.text, borderColor: themeColors.border }}>
                        {viewingUser.password ? (viewingUser.password.startsWith('$2') ? '(Encrypted - Please Reset)' : viewingUser.password) : '******'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

            </div>
            
            {/* Modal Footer */}
            <div className="p-5 border-t flex justify-end gap-3" style={{ borderColor: themeColors.border, backgroundColor: themeColors.background }}>
              <button
                type="button"
                onClick={() => setViewModalOpen(false)}
                className="py-2.5 px-6 rounded-xl font-bold text-sm transition-all border hover:bg-black/5 dark:hover:bg-white/5"
                style={{ borderColor: themeColors.border, color: themeColors.text }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default memo(CreateUser);
