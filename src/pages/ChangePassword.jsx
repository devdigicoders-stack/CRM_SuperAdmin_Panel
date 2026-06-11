import { memo, useState } from "react";
import { FaLock, FaSave, FaEye, FaEyeSlash } from "react-icons/fa";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import axios from "axios";
import { toast } from "sonner";

const ChangePassword = () => {
  const { themeColors } = useTheme();
  const { token } = useAuth();
  
  // States to toggle password visibility
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Form State
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!currentPassword || !newPassword || !confirmPassword) {
      return toast.error("Please fill in all fields");
    }
    if (newPassword !== confirmPassword) {
      return toast.error("New password and confirm password do not match");
    }

    setIsUpdating(true);
    try {
      const baseUrl = import.meta.env.VITE_API_BASE_URL;
      const response = await axios.post(`${baseUrl}/auth/change-password`, {
        currentPassword,
        newPassword
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.status === "success" || response.status === 200) {
        toast.success(response.data.message || "Password updated successfully");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to update password");
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="p-6 animate-fade-in max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <FaLock className="text-2xl" style={{ color: themeColors.primary }} />
            <h1 className="text-2xl font-bold tracking-tight" style={{ color: themeColors.text }}>
              Change Password
            </h1>
          </div>
          <p className="text-sm" style={{ color: themeColors.textSecondary }}>
            Update your password to keep your account secure
          </p>
        </div>
      </div>

      {/* Main Form Card */}
      <div 
        className="rounded-xl shadow-sm border p-6 md:p-8" 
        style={{ backgroundColor: themeColors.surface, borderColor: themeColors.border }}
      >
        <form className="space-y-6" onSubmit={handleSubmit}>
          
          {/* Current Password */}
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: themeColors.text }}>
              Current Password
            </label>
            <div className="relative">
              <input 
                type={showCurrent ? "text" : "password"} 
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter current password"
                className="w-full p-3 rounded-lg border focus:outline-none focus:ring-1 transition-colors pr-10"
                style={{ backgroundColor: themeColors.background, borderColor: themeColors.border, color: themeColors.text }}
              />
              <button 
                type="button"
                onClick={() => setShowCurrent(!showCurrent)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:opacity-70 transition-opacity"
                style={{ color: themeColors.textSecondary }}
              >
                {showCurrent ? <FaEyeSlash size={18} /> : <FaEye size={18} />}
              </button>
            </div>
          </div>

          {/* New Password */}
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: themeColors.text }}>
              New Password
            </label>
            <div className="relative">
              <input 
                type={showNew ? "text" : "password"} 
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
                className="w-full p-3 rounded-lg border focus:outline-none focus:ring-1 transition-colors pr-10"
                style={{ backgroundColor: themeColors.background, borderColor: themeColors.border, color: themeColors.text }}
              />
              <button 
                type="button"
                onClick={() => setShowNew(!showNew)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:opacity-70 transition-opacity"
                style={{ color: themeColors.textSecondary }}
              >
                {showNew ? <FaEyeSlash size={18} /> : <FaEye size={18} />}
              </button>
            </div>
            <p className="text-xs mt-2 font-medium" style={{ color: themeColors.textSecondary }}>
              Password must be at least 8 characters long and include a mix of letters, numbers, and symbols.
            </p>
          </div>

          {/* Confirm New Password */}
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: themeColors.text }}>
              Confirm New Password
            </label>
            <div className="relative">
              <input 
                type={showConfirm ? "text" : "password"} 
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter new password"
                className="w-full p-3 rounded-lg border focus:outline-none focus:ring-1 transition-colors pr-10"
                style={{ backgroundColor: themeColors.background, borderColor: themeColors.border, color: themeColors.text }}
              />
              <button 
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:opacity-70 transition-opacity"
                style={{ color: themeColors.textSecondary }}
              >
                {showConfirm ? <FaEyeSlash size={18} /> : <FaEye size={18} />}
              </button>
            </div>
          </div>

          {/* Actions */}
          <div className="pt-6 mt-6 border-t flex flex-col-reverse sm:flex-row justify-end gap-3" style={{ borderColor: themeColors.border }}>
            <button 
              type="button"
              onClick={() => {
                setCurrentPassword("");
                setNewPassword("");
                setConfirmPassword("");
              }}
              className="px-5 py-2.5 rounded-lg font-medium transition-colors border hover:bg-black/5 dark:hover:bg-white/5"
              style={{ color: themeColors.text, borderColor: themeColors.border }}
            >
              Clear
            </button>
            <button 
              type="submit"
              disabled={isUpdating}
              className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg font-medium transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
              style={{ backgroundColor: themeColors.primary, color: themeColors.onPrimary }}
            >
              <FaSave /> {isUpdating ? 'Updating...' : 'Update Password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default memo(ChangePassword);
