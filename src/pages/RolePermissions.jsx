import { memo, useState } from "react";
import { FaSave, FaShieldAlt, FaCheck } from "react-icons/fa";
import { useTheme } from "../context/ThemeContext";

const RolePermissions = () => {
  const { themeColors } = useTheme();
  const [selectedRole, setSelectedRole] = useState("admin");

  const roles = [
    { id: "admin", name: "Admin" },
    { id: "accountant", name: "Accountant" },
    { id: "calling_repo", name: "Calling Repo" },
    { id: "sales_repo", name: "Sales Repo" },
    { id: "installer", name: "Installer" }
  ];

  const modules = [
    { id: "dashboard", name: "Dashboard", desc: "View overview statistics and charts" },
    { id: "team", name: "Team Management", desc: "Add, edit, and remove team members" },
    { id: "permissions", name: "Role Permissions", desc: "Manage access rights and privileges" },
    { id: "customers", name: "Customers", desc: "View and manage customer data" },
    { id: "leads", name: "Lead Management", desc: "Track and manage sales leads" },
    { id: "reports", name: "Financial Reports", desc: "Access billing and financial data" },
  ];

  // Dummy initial state for permissions UI
  const [permissions, setPermissions] = useState({
    admin: {
      dashboard: { view: true, create: true, edit: true, delete: true },
      team: { view: true, create: true, edit: true, delete: false },
      permissions: { view: false, create: false, edit: false, delete: false },
      customers: { view: true, create: true, edit: true, delete: true },
      leads: { view: true, create: true, edit: true, delete: true },
      reports: { view: true, create: true, edit: false, delete: false },
    }
  });

  const handleToggle = (module, action) => {
    setPermissions(prev => {
      const rolePerms = prev[selectedRole] || {};
      const modulePerms = rolePerms[module] || { view: false, create: false, edit: false, delete: false };
      
      return {
        ...prev,
        [selectedRole]: {
          ...rolePerms,
          [module]: {
            ...modulePerms,
            [action]: !modulePerms[action]
          }
        }
      };
    });
  };

  const currentPerms = permissions[selectedRole] || {};

  return (
    <div className="p-6 animate-fade-in relative max-w-6xl mx-auto">
      {/* Header Area */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <FaShieldAlt className="text-2xl" style={{ color: themeColors.primary }} />
            <h1 className="text-2xl font-bold tracking-tight" style={{ color: themeColors.text }}>
              Role & Permissions
            </h1>
          </div>
          <p className="text-sm" style={{ color: themeColors.textSecondary }}>
            Configure module access and actions for different roles
          </p>
        </div>
        
        <button 
          className="flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5"
          style={{ 
            backgroundColor: themeColors.primary, 
            color: themeColors.onPrimary 
          }}
        >
          <FaSave className="text-sm" /> Save Permissions
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Roles Sidebar */}
        <div 
          className="w-full lg:w-64 shrink-0 rounded-xl shadow-sm border overflow-hidden self-start"
          style={{ backgroundColor: themeColors.surface, borderColor: themeColors.border }}
        >
          <div className="p-4 border-b font-semibold" style={{ borderColor: themeColors.border, color: themeColors.text }}>
            Select Role
          </div>
          <div className="flex flex-col p-2">
            {roles.map(role => (
              <button
                key={role.id}
                onClick={() => setSelectedRole(role.id)}
                className={`text-left px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 mb-1 flex justify-between items-center ${
                  selectedRole === role.id ? 'shadow-sm' : 'hover:bg-black/5 dark:hover:bg-white/5'
                }`}
                style={{
                  backgroundColor: selectedRole === role.id ? `${themeColors.primary}15` : 'transparent',
                  color: selectedRole === role.id ? themeColors.primary : themeColors.text,
                  border: selectedRole === role.id ? `1px solid ${themeColors.primary}30` : '1px solid transparent'
                }}
              >
                {role.name}
                {selectedRole === role.id && <FaCheck className="text-xs" />}
              </button>
            ))}
          </div>
        </div>

        {/* Permissions Table */}
        <div 
          className="flex-1 rounded-xl shadow-sm border overflow-hidden"
          style={{ backgroundColor: themeColors.surface, borderColor: themeColors.border }}
        >
          <div className="p-5 border-b flex justify-between items-center" style={{ borderColor: themeColors.border }}>
            <h2 className="font-semibold text-lg" style={{ color: themeColors.text }}>
              Permissions for <span style={{ color: themeColors.primary }}>{roles.find(r => r.id === selectedRole)?.name}</span>
            </h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[600px]">
              <thead>
                <tr style={{ backgroundColor: `${themeColors.primary}05`, borderBottom: `1px solid ${themeColors.border}` }}>
                  <th className="py-4 px-6 font-semibold text-sm w-1/3" style={{ color: themeColors.textSecondary }}>Module</th>
                  <th className="py-4 px-4 font-semibold text-sm text-center" style={{ color: themeColors.textSecondary }}>View</th>
                  <th className="py-4 px-4 font-semibold text-sm text-center" style={{ color: themeColors.textSecondary }}>Create</th>
                  <th className="py-4 px-4 font-semibold text-sm text-center" style={{ color: themeColors.textSecondary }}>Edit</th>
                  <th className="py-4 px-4 font-semibold text-sm text-center" style={{ color: themeColors.textSecondary }}>Delete</th>
                </tr>
              </thead>
              <tbody>
                {modules.map((mod, index) => {
                  const modPerms = currentPerms[mod.id] || { view: false, create: false, edit: false, delete: false };
                  return (
                    <tr 
                      key={mod.id} 
                      style={{ borderBottom: index !== modules.length - 1 ? `1px solid ${themeColors.border}` : 'none' }}
                      className="hover:bg-black/5 dark:hover:bg-white/5 transition-colors duration-150"
                    >
                      <td className="py-4 px-6">
                        <p className="font-medium text-sm" style={{ color: themeColors.text }}>{mod.name}</p>
                        <p className="text-xs mt-1" style={{ color: themeColors.textSecondary }}>{mod.desc}</p>
                      </td>
                      
                      {['view', 'create', 'edit', 'delete'].map(action => (
                        <td key={action} className="py-4 px-4 text-center">
                          <label className="inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              className="w-4 h-4 rounded border-gray-300 focus:ring-2 focus:ring-opacity-50 cursor-pointer transition-all"
                              style={{ 
                                accentColor: themeColors.primary,
                                color: themeColors.primary 
                              }}
                              checked={modPerms[action]}
                              onChange={() => handleToggle(mod.id, action)}
                            />
                          </label>
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default memo(RolePermissions);
