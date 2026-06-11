import { memo, useState, useEffect } from "react";
import { FaSave, FaCog, FaTags, FaListUl, FaLayerGroup, FaCogs, FaTimes, FaPlus } from "react-icons/fa";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import axios from "axios";
import { toast } from "sonner";

const GlobalSettings = () => {
  const { themeColors } = useTheme();
  const { token } = useAuth();
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  const [settings, setSettings] = useState({
    systemName: "",
    leadSources: [],
    leadTags: [],
    priorities: [],
  });

  // Inputs for adding new array items
  const [newSource, setNewSource] = useState("");
  const [newTag, setNewTag] = useState("");

  useEffect(() => {
    if (!token) return;
    fetchSettings();
  }, [token]);

  const fetchSettings = async () => {
    setIsLoading(true);
    try {
      const baseUrl = import.meta.env.VITE_API_BASE_URL;
      const response = await axios.get(`${baseUrl}/settings`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.status === "success") {
        setSettings(response.data.data.settings);
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to load global settings");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    
    // Auto-commit any pending input text into the arrays before saving
    let currentSources = [...(settings.leadSources || [])];
    let currentTags = [...(settings.leadTags || [])];
    
    if (newSource.trim()) {
      currentSources.push(newSource.trim());
      setNewSource("");
    }
    if (newTag.trim()) {
      currentTags.push(newTag.trim());
      setNewTag("");
    }
    
    // Update local state so UI reflects the auto-commit
    setSettings(prev => ({
      ...prev,
      leadSources: currentSources,
      leadTags: currentTags
    }));

    try {
      const baseUrl = import.meta.env.VITE_API_BASE_URL;
      
      const payload = {
        systemName: settings.systemName,
        leadSources: currentSources,
        leadTags: currentTags,
        priorities: settings.priorities
      };

      const response = await axios.put(`${baseUrl}/settings`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.status === "success") {
        toast.success("Settings updated successfully!");
        setSettings(response.data.data.settings);
      }
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || "Failed to update settings");
    } finally {
      setIsSaving(false);
    }
  };

  const handleTextChange = (e) => {
    setSettings(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleRemoveItem = (field, indexToRemove) => {
    setSettings(prev => ({
      ...prev,
      [field]: prev[field].filter((_, idx) => idx !== indexToRemove)
    }));
  };

  const handleAddItem = (field, value, setter) => {
    if (!value.trim()) return;
    setSettings(prev => ({
      ...prev,
      [field]: [...(prev[field] || []), value.trim()]
    }));
    setter(""); // clear input
  };

  const handleKeyDown = (e, field, value, setter) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddItem(field, value, setter);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[70vh] w-full">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2" style={{ borderColor: themeColors.primary }}></div>
      </div>
    );
  }

  return (
    <div className="p-6 animate-fade-in max-w-6xl mx-auto space-y-6">
      
      {/* Header Area */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-3" style={{ color: themeColors.text }}>
            <div className="p-2 rounded-lg" style={{ backgroundColor: `${themeColors.primary}15`, color: themeColors.primary }}>
              <FaCog className="text-lg" />
            </div>
            Global Settings
          </h1>
          <p className="text-sm mt-1" style={{ color: themeColors.textSecondary }}>
            Manage core system configurations, drop-down options, and tags for the CRM.
          </p>
        </div>
        
        <button 
          onClick={handleSave}
          disabled={isSaving}
          className="py-2.5 px-6 rounded-xl font-bold text-sm transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
          style={{ backgroundColor: themeColors.primary, color: themeColors.onPrimary }}
        >
          {isSaving ? <FaCog className="animate-spin" /> : <FaSave />}
          {isSaving ? 'Updating...' : 'Save Settings'}
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* Main Configuration Area */}
        <div className="xl:col-span-2 space-y-6">
          
          {/* General CRM Details */}
          <div className="rounded-xl shadow-sm border p-6 transition-all" style={{ backgroundColor: themeColors.surface, borderColor: themeColors.border }}>
             <h2 className="text-lg font-semibold mb-6 flex items-center gap-2" style={{ color: themeColors.text }}>
               <FaCogs style={{ color: themeColors.primary }} /> System Identity
             </h2>
             
             <div className="grid grid-cols-1 gap-6">
                <div>
                  <label className="block text-sm font-bold mb-1.5" style={{ color: themeColors.text }}>CRM System Name</label>
                  <p className="text-xs mb-3" style={{ color: themeColors.textSecondary }}>This name appears on the browser tab and main login screens.</p>
                  <input 
                    type="text" 
                    name="systemName"
                    value={settings.systemName || ""}
                    onChange={handleTextChange}
                    className="w-full p-3 rounded-lg border focus:outline-none focus:ring-2 shadow-sm transition-colors font-medium"
                    style={{ backgroundColor: themeColors.background, borderColor: themeColors.border, color: themeColors.text }}
                  />
                </div>
             </div>
          </div>

          {/* Lead Dropdowns Configurations */}
          <div className="rounded-xl shadow-sm border p-6" style={{ backgroundColor: themeColors.surface, borderColor: themeColors.border }}>
             <h2 className="text-lg font-semibold mb-6 flex items-center gap-2" style={{ color: themeColors.text }}>
               <FaListUl style={{ color: themeColors.primary }} /> Master Dropdowns
             </h2>
             <p className="text-sm mb-6" style={{ color: themeColors.textSecondary }}>
               Customize the master dropdown lists used when creating or editing leads.
             </p>
             
             <div className="grid grid-cols-1 gap-8">
                {/* Lead Sources */}
                <div>
                  <label className="block text-sm font-bold mb-3 flex items-center gap-2" style={{ color: themeColors.text }}>
                    <span className="p-1.5 rounded-md" style={{ backgroundColor: `${themeColors.primary}15`, color: themeColors.primary }}>
                      <FaLayerGroup />
                    </span>
                    Lead Sources
                  </label>
                  
                  <div className="flex flex-wrap gap-2 mb-4">
                    {settings.leadSources?.map((source, idx) => (
                      <span 
                        key={idx}
                        className="px-3 py-1.5 text-xs font-semibold rounded-lg border shadow-sm flex items-center gap-2 group"
                        style={{ 
                          backgroundColor: themeColors.background, 
                          color: themeColors.text,
                          borderColor: themeColors.border
                        }}
                      >
                        {source}
                        <button 
                          onClick={() => handleRemoveItem('leadSources', idx)}
                          className="text-red-500 hover:text-red-700 opacity-50 group-hover:opacity-100 transition-opacity"
                        >
                          <FaTimes />
                        </button>
                      </span>
                    ))}
                    {(!settings.leadSources || settings.leadSources.length === 0) && (
                      <span className="text-xs italic" style={{ color: themeColors.textSecondary }}>No sources defined</span>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2 max-w-sm">
                    <input 
                      type="text" 
                      value={newSource}
                      onChange={(e) => setNewSource(e.target.value)}
                      onKeyDown={(e) => handleKeyDown(e, 'leadSources', newSource, setNewSource)}
                      placeholder="Add new source (e.g. Instagram Ads)"
                      className="flex-1 p-2 rounded-lg border focus:outline-none focus:ring-1 text-sm"
                      style={{ backgroundColor: themeColors.background, borderColor: themeColors.border, color: themeColors.text }}
                    />
                    <button 
                      onClick={() => handleAddItem('leadSources', newSource, setNewSource)}
                      className="p-2.5 rounded-lg text-white shadow-sm hover:-translate-y-0.5 transition-all"
                      style={{ backgroundColor: themeColors.primary }}
                    >
                      <FaPlus className="text-sm" />
                    </button>
                  </div>
                </div>

                {/* Priorities (Read-Only Usually, but shown for completion) */}
                <div className="pt-6 border-t" style={{ borderColor: themeColors.border }}>
                  <label className="block text-sm font-bold mb-3 flex items-center gap-2" style={{ color: themeColors.text }}>
                    <span className="p-1.5 rounded-md" style={{ backgroundColor: `${themeColors.primary}15`, color: themeColors.primary }}>
                      <FaTags />
                    </span>
                    System Priorities <span className="text-[10px] font-normal uppercase" style={{ color: themeColors.textSecondary }}>(Read Only)</span>
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {settings.priorities?.map((priority, idx) => (
                      <span 
                        key={idx}
                        className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider rounded-lg border shadow-sm"
                        style={{ 
                          backgroundColor: priority === 'high' ? 'rgba(239, 68, 68, 0.1)' : 
                                           priority === 'medium' ? 'rgba(245, 158, 11, 0.1)' : 
                                           'rgba(16, 185, 129, 0.1)', 
                          color: priority === 'high' ? '#ef4444' : 
                                 priority === 'medium' ? '#f59e0b' : 
                                 '#10b981',
                          borderColor: 'transparent'
                        }}
                      >
                        {priority}
                      </span>
                    ))}
                  </div>
                </div>
             </div>
          </div>
        </div>

        {/* Right Sidebar Area */}
        <div className="space-y-6">
          
          {/* Lead Tags Section */}
          <div className="rounded-xl shadow-sm border p-6" style={{ backgroundColor: themeColors.surface, borderColor: themeColors.border }}>
             <h2 className="text-lg font-semibold mb-6 flex items-center gap-2" style={{ color: themeColors.text }}>
               <FaTags style={{ color: themeColors.primary }} /> Lead Tags
             </h2>
             <p className="text-sm mb-4" style={{ color: themeColors.textSecondary }}>
               Categorization tags available to attach to leads.
             </p>
             
             <div className="flex flex-wrap gap-2 mt-4 mb-5">
                {settings.leadTags?.map((tag, idx) => (
                  <span 
                    key={idx}
                    className="px-2.5 py-1 text-xs font-bold rounded-full border shadow-sm flex items-center gap-1 group"
                    style={{ 
                      backgroundColor: `${themeColors.primary}10`, 
                      color: themeColors.primary,
                      borderColor: `${themeColors.primary}20`
                    }}
                  >
                    #{tag}
                    <button 
                      onClick={() => handleRemoveItem('leadTags', idx)}
                      className="ml-1 opacity-50 hover:opacity-100 transition-opacity"
                    >
                      <FaTimes />
                    </button>
                  </span>
                ))}
             </div>

             <div className="flex items-center gap-2">
                <input 
                  type="text" 
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyDown={(e) => handleKeyDown(e, 'leadTags', newTag, setNewTag)}
                  placeholder="e.g. converted"
                  className="flex-1 p-2 rounded-lg border focus:outline-none focus:ring-1 text-sm"
                  style={{ backgroundColor: themeColors.background, borderColor: themeColors.border, color: themeColors.text }}
                />
                <button 
                  onClick={() => handleAddItem('leadTags', newTag, setNewTag)}
                  className="p-2.5 rounded-lg text-white shadow-sm hover:-translate-y-0.5 transition-all"
                  style={{ backgroundColor: themeColors.primary }}
                >
                  <FaPlus className="text-sm" />
                </button>
              </div>
          </div>

          {/* Quick Info Card */}
          <div className="rounded-xl border p-5 flex items-start gap-4" style={{ backgroundColor: themeColors.background, borderColor: themeColors.border }}>
             <div className="p-3 rounded-full mt-1" style={{ backgroundColor: `${themeColors.primary}20`, color: themeColors.primary }}>
               <FaCog className="text-xl animate-[spin_10s_linear_infinite]" />
             </div>
             <div>
               <h3 className="font-bold text-sm mb-1" style={{ color: themeColors.text }}>Save Required</h3>
               <p className="text-xs leading-relaxed" style={{ color: themeColors.textSecondary }}>
                 Don't forget to click "Save Settings" at the top right to persist any additions or removals you make to the tags and sources.
               </p>
               <p className="text-xs mt-3 font-semibold" style={{ color: themeColors.textSecondary }}>
                 Last Updated: {settings.updatedAt ? new Date(settings.updatedAt).toLocaleDateString() : 'N/A'}
               </p>
             </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default memo(GlobalSettings);
