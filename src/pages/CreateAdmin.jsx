import { useState, useEffect, memo } from "react";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import axios from "axios";
import { toast } from "sonner";
import Swal from "sweetalert2";
import { FaUserPlus, FaCheck, FaShieldAlt, FaTimes, FaEdit, FaTrash, FaUserShield, FaEye } from "react-icons/fa";

import routes from "../route/SidebarRaoute";

const PERMISSIONS_LIST = routes
  .filter(r => r.permission) // Only include routes that require a specific permission
  .map(r => ({
    id: r.permission,
    label: r.name
  }));

const CreateAdmin = () => {
  const { themeColors } = useTheme();
  const { token } = useAuth();
  
  const [admins, setAdmins] = useState([]);
  const [isFetching, setIsFetching] = useState(true);
  
  // Create Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Edit Modal State
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState(null);
  const [editPermissions, setEditPermissions] = useState([]);
  const [isUpdating, setIsUpdating] = useState(false);
  const [editFormData, setEditFormData] = useState({
    name: "", email: "", phone: "", password: ""
  });

  // View Modal State
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [viewingUser, setViewingUser] = useState(null);
  const [isFetchingDetails, setIsFetchingDetails] = useState(false);
  
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "admin", // strictly admin
    phone: "",
    permissions: []
  });

  const fetchAdmins = async () => {
    setIsFetching(true);
    try {
      const baseUrl = import.meta.env.VITE_API_BASE_URL;
      const response = await axios.get(`${baseUrl}/users?role=admin`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      if (response.data.status === "success") {
        setAdmins(response.data.data.users || []);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch admin list.");
    } finally {
      setIsFetching(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchAdmins();
    }
  }, [token]);

  // --- Handlers for Creation ---
  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handlePermissionToggle = (permId) => {
    setFormData(prev => {
      const hasPerm = prev.permissions.includes(permId);
      if (hasPerm) {
        return { ...prev, permissions: prev.permissions.filter(p => p !== permId) };
      } else {
        return { ...prev, permissions: [...prev.permissions, permId] };
      }
    });
  };

  const selectAllPermissions = (e) => {
    e.preventDefault();
    setFormData(prev => ({ ...prev, permissions: PERMISSIONS_LIST.map(p => p.id) }));
  };

  const clearAllPermissions = (e) => {
    e.preventDefault();
    setFormData(prev => ({ ...prev, permissions: [] }));
  };

  const openModal = () => {
    setFormData({
      name: "", email: "", password: "", role: "admin", phone: "", permissions: []
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email || !formData.password) {
      return toast.error("Please fill in all required fields.");
    }
    
    setIsSubmitting(true);
    
    const expandedPermissions = [...formData.permissions];
    if (formData.permissions.includes('create-staff') || formData.permissions.includes('user-history')) {
      if (!expandedPermissions.includes('users')) expandedPermissions.push('users');
    }
    if (formData.permissions.includes('lead-management')) {
      if (!expandedPermissions.includes('leads')) expandedPermissions.push('leads');
    }
    if (formData.permissions.includes('global-settings')) {
      if (!expandedPermissions.includes('settings')) expandedPermissions.push('settings');
    }

    try {
      const baseUrl = import.meta.env.VITE_API_BASE_URL;
      const response = await axios.post(`${baseUrl}/users`, {
        ...formData,
        permissions: expandedPermissions
      }, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      if (response.data.status === "success") {
        toast.success(`Admin ${response.data.data.user.name} created successfully!`);
        setIsModalOpen(false);
        fetchAdmins(); 
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to create admin.");
    } finally {
      setIsSubmitting(false);
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
      toast.error("Failed to fetch user details.");
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
          fetchAdmins();
        }
      } catch (err) {
        console.error(err);
        toast.error(err.response?.data?.message || "Failed to delete user.");
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
        fetchAdmins();
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to toggle status.");
    }
  };

  // --- Handlers for Editing Admin ---
  const openEditModal = (admin) => {
    setSelectedAdmin(admin);
    setEditPermissions(admin.permissions || []);
    setEditFormData({
      name: admin.name || "",
      email: admin.email || "",
      phone: admin.phone || "",
      password: ""
    });
    setEditModalOpen(true);
  };

  const handleEditPermissionToggle = (permId) => {
    setEditPermissions(prev => {
      if (prev.includes(permId)) {
        return prev.filter(p => p !== permId);
      } else {
        return [...prev, permId];
      }
    });
  };

  const selectAllEditPermissions = (e) => {
    e.preventDefault();
    setEditPermissions(PERMISSIONS_LIST.map(p => p.id));
  };

  const clearAllEditPermissions = (e) => {
    e.preventDefault();
    setEditPermissions([]);
  };

  const handleUpdateAdmin = async (e) => {
    e.preventDefault();
    if (!selectedAdmin) return;
    if (!editFormData.name || !editFormData.email) {
      return toast.error("Please fill in required fields.");
    }
    
    setIsUpdating(true);
    
    const expandedPermissions = [...editPermissions];
    if (editPermissions.includes('create-staff') || editPermissions.includes('user-history')) {
      if (!expandedPermissions.includes('users')) expandedPermissions.push('users');
    }
    if (editPermissions.includes('lead-management')) {
      if (!expandedPermissions.includes('leads')) expandedPermissions.push('leads');
    }
    if (editPermissions.includes('global-settings')) {
      if (!expandedPermissions.includes('settings')) expandedPermissions.push('settings');
    }

    try {
      const baseUrl = import.meta.env.VITE_API_BASE_URL;
      const payload = {
        ...editFormData,
        role: "admin",
        permissions: expandedPermissions
      };
      const response = await axios.put(`${baseUrl}/users/${selectedAdmin._id}`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.status === "success" || response.status === 200) {
        toast.success(`Admin details updated successfully!`);
        setEditModalOpen(false);
        fetchAdmins(); 
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to update admin.");
    } finally {
      setIsUpdating(false);
    }
  };


  return (
    <div className="p-6 animate-fade-in relative space-y-6">
      
      {/* Header Area */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-3" style={{ color: themeColors.text }}>
            <div className="p-2 rounded-lg" style={{ backgroundColor: `${themeColors.primary}15`, color: themeColors.primary }}>
              <FaUserShield className="text-lg" />
            </div>
            Admin Management
          </h1>
          <p className="text-sm mt-1" style={{ color: themeColors.textSecondary }}>
            Manage all administrators and their explicit panel permissions.
          </p>
        </div>
        <button
          onClick={openModal}
          className="py-2.5 px-6 rounded-xl font-bold text-sm transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 flex items-center gap-2"
          style={{ backgroundColor: themeColors.primary, color: themeColors.onPrimary }}
        >
          <FaUserPlus />
          Create Admin
        </button>
      </div>

      {/* Main Content Table */}
      <div 
        className="rounded-xl shadow-sm border overflow-hidden transition-all duration-300"
        style={{ backgroundColor: themeColors.surface, borderColor: themeColors.border }}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[900px]">
            <thead>
              <tr style={{ backgroundColor: `${themeColors.primary}08`, borderBottom: `1px solid ${themeColors.border}` }}>
                <th className="py-4 px-6 font-semibold text-sm" style={{ color: themeColors.textSecondary }}>Admin</th>
                <th className="py-4 px-6 font-semibold text-sm" style={{ color: themeColors.textSecondary }}>Contact</th>
                <th className="py-4 px-6 font-semibold text-sm" style={{ color: themeColors.textSecondary }}>Status</th>
                <th className="py-4 px-6 font-semibold text-sm" style={{ color: themeColors.textSecondary }}>Granted Permissions</th>
                <th className="py-4 px-6 font-semibold text-sm text-center" style={{ color: themeColors.textSecondary }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {isFetching ? (
                <tr>
                  <td colSpan="5" className="py-8 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 mx-auto" style={{ borderColor: themeColors.primary }}></div>
                  </td>
                </tr>
              ) : admins.length === 0 ? (
                <tr>
                  <td colSpan="5" className="py-8 text-center font-medium" style={{ color: themeColors.textSecondary }}>
                    No admins found. Click 'Create Admin' to add one.
                  </td>
                </tr>
              ) : (
                admins.map((admin, index) => (
                  <tr 
                    key={admin._id} 
                    style={{ borderBottom: index !== admins.length - 1 ? `1px solid ${themeColors.border}` : 'none' }}
                    className="hover:bg-black/5 dark:hover:bg-white/5 transition-colors duration-150 group"
                  >
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm"
                          style={{ backgroundColor: `${themeColors.primary}20`, color: themeColors.primary }}
                        >
                          {admin.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <span className="text-sm font-bold block" style={{ color: themeColors.text }}>{admin.name}</span>
                          <span className="text-xs uppercase font-semibold" style={{ color: themeColors.primary }}>{admin.role}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className="text-sm block font-medium" style={{ color: themeColors.textSecondary }}>{admin.email}</span>
                      <span className="text-xs block" style={{ color: themeColors.textSecondary }}>{admin.phone || 'N/A'}</span>
                    </td>
                    <td className="py-4 px-6 text-sm">
                      <button 
                        onClick={() => handleToggleStatus(admin._id)}
                        className={`px-3 py-1 rounded-full text-xs font-bold tracking-wide transition-transform hover:scale-105 active:scale-95 ${
                          admin.active ? 'bg-green-600 text-white shadow-sm hover:bg-green-700' : 'bg-red-600 text-white shadow-sm hover:bg-red-700'
                        }`}
                        title="Click to toggle status"
                      >
                        {admin.active ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex flex-wrap gap-1.5 max-w-[250px]">
                        {admin.permissions && admin.permissions.length > 0 ? (
                          admin.permissions.filter(perm => !['users', 'leads', 'settings'].includes(perm)).map(perm => (
                            <span 
                              key={perm}
                              className="px-2 py-0.5 rounded text-[10px] font-semibold border"
                              style={{ 
                                backgroundColor: themeColors.background, 
                                borderColor: themeColors.border,
                                color: themeColors.text
                              }}
                            >
                              {perm}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs italic" style={{ color: themeColors.textSecondary }}>No permissions</span>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex justify-center gap-2">
                        <button 
                          onClick={() => handleViewUser(admin._id)}
                          className="p-2 rounded-md transition-all hover:scale-110"
                          style={{ color: '#0ea5e9', backgroundColor: 'rgba(14, 165, 233, 0.1)' }}
                          title="View Details"
                        >
                          {isFetchingDetails && viewingUser?._id === admin._id ? (
                            <FaShieldAlt className="animate-spin" />
                          ) : (
                            <FaEye />
                          )}
                        </button>
                        <button 
                          onClick={() => openEditModal(admin)}
                          className="p-2 rounded-md transition-all hover:scale-110"
                          style={{ color: themeColors.primary, backgroundColor: `${themeColors.primary}10` }}
                          title="Edit Admin"
                        >
                          <FaEdit />
                        </button>
                        <button 
                          onClick={() => handleDeleteUser(admin._id, admin.name)}
                          className="p-2 rounded-md transition-all hover:scale-110"
                          style={{ color: '#ef4444', backgroundColor: 'rgba(239, 68, 68, 0.1)' }}
                          title="Delete Admin"
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
      </div>

      {/* Create Admin Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div 
            className="w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            style={{ backgroundColor: themeColors.surface }}
          >
            {/* Modal Header */}
            <div className="p-5 border-b flex justify-between items-center" style={{ borderColor: themeColors.border }}>
              <h2 className="text-xl font-bold flex items-center gap-2" style={{ color: themeColors.text }}>
                <FaUserPlus style={{ color: themeColors.primary }} />
                Create New Admin
              </h2>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                style={{ color: themeColors.textSecondary }}
              >
                <FaTimes />
              </button>
            </div>

            {/* Modal Body (Scrollable) */}
            <div className="p-6 overflow-y-auto custom-scrollbar">
              <form id="createAdminForm" onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* Left Column: Basic Details */}
                <div className="space-y-4">
                  <h3 className="text-md font-bold mb-4" style={{ color: themeColors.text }}>Personal Details</h3>
                  
                  <div>
                    <label className="block text-sm font-semibold mb-1" style={{ color: themeColors.text }}>Full Name *</label>
                    <input 
                      type="text" name="name" value={formData.name} onChange={handleChange} required
                      placeholder="e.g. Test Admin"
                      className="w-full p-2.5 rounded-lg border focus:outline-none focus:ring-2 shadow-sm"
                      style={{ backgroundColor: themeColors.background, color: themeColors.text, borderColor: themeColors.border }}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold mb-1" style={{ color: themeColors.text }}>Email Address *</label>
                    <input 
                      type="email" name="email" value={formData.email} onChange={handleChange} required
                      placeholder="admin1@gmail.com"
                      className="w-full p-2.5 rounded-lg border focus:outline-none focus:ring-2 shadow-sm"
                      style={{ backgroundColor: themeColors.background, color: themeColors.text, borderColor: themeColors.border }}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold mb-1" style={{ color: themeColors.text }}>Phone Number</label>
                    <input 
                      type="tel" name="phone" value={formData.phone} onChange={handleChange}
                      placeholder="9876543211"
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
                  
                  <div>
                    <label className="block text-sm font-semibold mb-1" style={{ color: themeColors.text }}>Role</label>
                    <input 
                      type="text" value="Admin" disabled
                      className="w-full p-2.5 rounded-lg border focus:outline-none shadow-sm cursor-not-allowed opacity-70 font-medium"
                      style={{ backgroundColor: themeColors.background, color: themeColors.text, borderColor: themeColors.border }}
                    />
                  </div>
                </div>

                {/* Right Column: Permissions */}
                <div className="flex flex-col h-full">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-md font-bold flex items-center gap-2" style={{ color: themeColors.text }}>
                      <FaShieldAlt className="text-sm" style={{ color: themeColors.primary }} />
                      Permissions
                    </h3>
                    <div className="flex gap-2">
                      <button onClick={selectAllPermissions} className="text-xs font-semibold hover:underline" style={{ color: themeColors.primary }}>Select All</button>
                      <span className="text-xs" style={{ color: themeColors.border }}>|</span>
                      <button onClick={clearAllPermissions} className="text-xs font-semibold hover:underline" style={{ color: themeColors.textSecondary }}>Clear</button>
                    </div>
                  </div>
                  
                  <div className="space-y-2 flex-1 overflow-y-auto pr-2 custom-scrollbar">
                    {PERMISSIONS_LIST.map((perm) => {
                      const isActive = formData.permissions.includes(perm.id);
                      return (
                        <div 
                          key={perm.id}
                          onClick={() => handlePermissionToggle(perm.id)}
                          className="flex items-center justify-between p-2.5 rounded-lg border cursor-pointer transition-all hover:shadow-sm"
                          style={{ 
                            borderColor: isActive ? themeColors.primary : themeColors.border,
                            backgroundColor: isActive ? `${themeColors.primary}08` : themeColors.background
                          }}
                        >
                          <span className="text-sm font-medium" style={{ color: isActive ? themeColors.primary : themeColors.text }}>
                            {perm.label}
                          </span>
                          <div 
                            className={`w-4 h-4 rounded flex items-center justify-center transition-all ${isActive ? 'scale-100' : 'scale-90 opacity-50 border'}`}
                            style={{ 
                              backgroundColor: isActive ? themeColors.primary : 'transparent',
                              borderColor: themeColors.border
                            }}
                          >
                            {isActive && <FaCheck className="text-white text-[10px]" />}
                          </div>
                        </div>
                      )
                    })}
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
                form="createAdminForm"
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

      {/* Edit Admin Modal */}
      {editModalOpen && selectedAdmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div 
            className="w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            style={{ backgroundColor: themeColors.surface }}
          >
            {/* Modal Header */}
            <div className="p-5 border-b flex justify-between items-center" style={{ borderColor: themeColors.border }}>
              <h2 className="text-xl font-bold flex items-center gap-2" style={{ color: themeColors.text }}>
                <FaEdit style={{ color: themeColors.primary }} />
                Update Admin Member
              </h2>
              <button 
                onClick={() => setEditModalOpen(false)}
                className="p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                style={{ color: themeColors.textSecondary }}
              >
                <FaTimes />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto custom-scrollbar">
              <form id="editAdminForm" onSubmit={handleUpdateAdmin} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* Left Column: Basic Details */}
                <div className="space-y-4">
                  <h3 className="text-md font-bold mb-4" style={{ color: themeColors.text }}>Personal Details</h3>
                  
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
                    <label className="block text-sm font-semibold mb-1" style={{ color: themeColors.text }}>Change Password (Optional)</label>
                    <input 
                      type="text" value={editFormData.password} onChange={(e) => setEditFormData({...editFormData, password: e.target.value})}
                      placeholder="Enter new password" minLength={6}
                      className="w-full p-2.5 rounded-lg border focus:outline-none focus:ring-2 shadow-sm"
                      style={{ backgroundColor: themeColors.background, color: themeColors.text, borderColor: themeColors.border }}
                    />
                  </div>
                </div>

                {/* Right Column: Permissions */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-md font-bold" style={{ color: themeColors.text }}>Access Control</h3>
                    <div className="flex gap-2">
                      <button type="button" onClick={selectAllEditPermissions} className="text-xs font-semibold hover:underline" style={{ color: themeColors.primary }}>Select All</button>
                      <span className="text-xs" style={{ color: themeColors.border }}>|</span>
                      <button type="button" onClick={clearAllEditPermissions} className="text-xs font-semibold hover:underline" style={{ color: themeColors.textSecondary }}>Clear</button>
                    </div>
                  </div>
                  
                  <div className="space-y-2 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
                    {PERMISSIONS_LIST.map((perm) => {
                      const isActive = editPermissions.includes(perm.id);
                      return (
                        <div 
                          key={perm.id}
                          onClick={() => handleEditPermissionToggle(perm.id)}
                          className="flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all hover:shadow-sm"
                          style={{ 
                            borderColor: isActive ? themeColors.primary : themeColors.border,
                            backgroundColor: isActive ? `${themeColors.primary}08` : themeColors.background
                          }}
                        >
                          <span className="text-sm font-medium" style={{ color: isActive ? themeColors.primary : themeColors.text }}>
                            {perm.label}
                          </span>
                          <div 
                            className={`w-5 h-5 rounded flex items-center justify-center transition-all ${isActive ? 'scale-100' : 'scale-90 opacity-50 border'}`}
                            style={{ 
                              backgroundColor: isActive ? themeColors.primary : 'transparent',
                              borderColor: themeColors.border
                            }}
                          >
                            {isActive && <FaCheck className="text-white text-xs" />}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </form>
            </div>

            {/* Modal Footer */}
            <div className="p-5 border-t flex justify-end gap-3" style={{ borderColor: themeColors.border, backgroundColor: themeColors.background }}>
              <button
                type="button"
                onClick={() => setEditModalOpen(false)}
                className="py-2.5 px-5 rounded-xl font-bold text-sm transition-all border hover:bg-black/5 dark:hover:bg-white/5"
                style={{ borderColor: themeColors.border, color: themeColors.text }}
              >
                Cancel
              </button>
              <button
                type="submit"
                form="editAdminForm"
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
                Admin Details
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

              <div className="mt-4">
                <p className="text-sm font-bold mb-2" style={{ color: themeColors.textSecondary }}>Granted Permissions</p>
                <div className="flex flex-wrap gap-2">
                  {viewingUser.permissions && viewingUser.permissions.length > 0 ? (
                    viewingUser.permissions.filter(perm => !['users', 'leads', 'settings'].includes(perm)).map(perm => (
                      <span 
                        key={perm}
                        className="px-2.5 py-1 rounded-md text-xs font-semibold border"
                        style={{ backgroundColor: `${themeColors.primary}05`, borderColor: themeColors.primary, color: themeColors.text }}
                      >
                        {perm}
                      </span>
                    ))
                  ) : (
                    <span className="text-sm italic" style={{ color: themeColors.textSecondary }}>No permissions granted.</span>
                  )}
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

export default memo(CreateAdmin);
