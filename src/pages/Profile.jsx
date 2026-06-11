import { useState, useEffect, memo } from "react";
import { FaUser, FaSave, FaCamera, FaLock } from "react-icons/fa";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import { toast } from "sonner";
import axios from "axios";

const Profile = () => {
  const { themeColors } = useTheme();
  const { token } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    bio: ""
  });

  useEffect(() => {
    fetchProfile();
  }, [token]);

  const fetchProfile = async () => {
    if (!token) return;
    try {
      setLoading(true);
      const baseUrl = import.meta.env.VITE_API_BASE_URL;
      const res = await axios.get(`${baseUrl}/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.status === "success") {
        const user = res.data.data.user || res.data.data.admin;
        setProfile(user);
        setFormData({
          name: user.name || "",
          email: user.email || "",
          phone: user.phone || "",
          bio: user.bio || ""
        });
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to load profile data");
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (name) => {
    if (!name) return "U";
    return name.split(" ").map(n => n[0]).join("").toUpperCase().substring(0, 2);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSave = async () => {
    if (!formData.name || !formData.phone) {
      toast.error("Name and phone are required");
      return;
    }
    try {
      setIsSaving(true);
      const baseUrl = import.meta.env.VITE_API_BASE_URL;
      const data = new FormData();
      data.append("name", formData.name);
      data.append("phone", formData.phone);
      if (selectedFile) {
        data.append("profilePic", selectedFile);
      }
      
      // Some APIs use PUT or POST for profile update, we'll use PUT as standard
      const res = await axios.put(`${baseUrl}/profile`, data, {
        headers: { 
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data" 
        }
      });
      
      if (res.data.status === "success") {
        toast.success("Profile updated successfully");
        fetchProfile(); // Refresh profile data
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to update profile");
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="p-6 animate-fade-in max-w-5xl mx-auto">
      {/* Header Area */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <FaUser className="text-2xl" style={{ color: themeColors.primary }} />
            <h1 className="text-2xl font-bold tracking-tight" style={{ color: themeColors.text }}>
              My Profile
            </h1>
          </div>
          <p className="text-sm" style={{ color: themeColors.textSecondary }}>
            Manage your personal information
          </p>
        </div>
        
        <button 
          onClick={handleSave}
          disabled={isSaving}
          className="flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 disabled:opacity-70 disabled:hover:shadow-none disabled:hover:translate-y-0"
          style={{ backgroundColor: themeColors.primary, color: themeColors.onPrimary }}
        >
          {isSaving ? <div className="w-4 h-4 rounded-full border-2 border-t-transparent animate-spin"></div> : <FaSave className="text-sm" />}
          {isSaving ? "Saving..." : "Save Changes"}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column - Avatar & Quick Info */}
        <div className="space-y-6">
          <div className="rounded-xl shadow-sm border p-6 flex flex-col items-center text-center" style={{ backgroundColor: themeColors.surface, borderColor: themeColors.border }}>
            <div className="relative group cursor-pointer mb-4">
              <label htmlFor="profilePicInput" className="cursor-pointer block relative">
                <div 
                  className="w-32 h-32 rounded-full overflow-hidden border-4 flex items-center justify-center text-4xl font-bold transition-all group-hover:opacity-80"
                  style={{ borderColor: themeColors.background, backgroundColor: `${themeColors.primary}20`, color: themeColors.primary }}
                >
                  {previewUrl || profile?.profilePic ? (
                    <img src={previewUrl || profile?.profilePic} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    getInitials(profile?.name)
                  )}
                </div>
                <div className="absolute inset-0 rounded-full flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                  <FaCamera className="text-white text-2xl" />
                </div>
              </label>
              <input 
                type="file" 
                id="profilePicInput" 
                accept="image/*" 
                className="hidden" 
                onChange={handleFileChange} 
              />
            </div>
            <h2 className="text-xl font-bold" style={{ color: themeColors.text }}>{profile?.name}</h2>
            <p className="text-sm font-medium mt-1 mb-3 capitalize" style={{ color: themeColors.primary }}>{profile?.role}</p>
            
            <div className="w-full border-t my-4" style={{ borderColor: themeColors.border }}></div>
            
            <div className="w-full text-left space-y-3">
              <div>
                <p className="text-xs uppercase tracking-wider font-semibold mb-1" style={{ color: themeColors.textSecondary }}>Email</p>
                <p className="text-sm font-medium" style={{ color: themeColors.text }}>{profile?.email || 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wider font-semibold mb-1" style={{ color: themeColors.textSecondary }}>Phone</p>
                <p className="text-sm font-medium" style={{ color: themeColors.text }}>{profile?.phone || 'N/A'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Form Fields */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Personal Info */}
          <div className="rounded-xl shadow-sm border p-6" style={{ backgroundColor: themeColors.surface, borderColor: themeColors.border }}>
            <h3 className="text-lg font-semibold mb-5" style={{ color: themeColors.text }}>Personal Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1.5" style={{ color: themeColors.text }}>Full Name</label>
                <input 
                  type="text" 
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full p-2.5 rounded-lg border focus:outline-none focus:ring-1 transition-colors"
                  style={{ backgroundColor: themeColors.background, borderColor: themeColors.border, color: themeColors.text }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: themeColors.text }}>Email Address</label>
                <input 
                  type="email" 
                  value={formData.email}
                  readOnly
                  className="w-full p-2.5 rounded-lg border focus:outline-none focus:ring-1 transition-colors opacity-80 cursor-not-allowed"
                  style={{ backgroundColor: themeColors.background, borderColor: themeColors.border, color: themeColors.text }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: themeColors.text }}>Phone Number</label>
                <input 
                  type="text" 
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  className="w-full p-2.5 rounded-lg border focus:outline-none focus:ring-1 transition-colors"
                  style={{ backgroundColor: themeColors.background, borderColor: themeColors.border, color: themeColors.text }}
                />
              </div>
            </div>
            
            <div className="mt-6 p-4 rounded-lg bg-blue-50 border border-blue-100 dark:bg-blue-900/20 dark:border-blue-800">
              <p className="text-sm text-blue-700 dark:text-blue-300">
                <strong>Note:</strong> Email address cannot be changed here. To change your password, go to the <a href="/change-password" className="underline font-bold">Change Password</a> page.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default memo(Profile);
