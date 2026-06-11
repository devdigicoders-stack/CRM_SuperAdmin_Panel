import { memo, useState } from "react";
import { FaPlus, FaEdit, FaTrash, FaTimes } from "react-icons/fa";
import { useTheme } from "../context/ThemeContext";

const TeamManagement = () => {
  const { themeColors } = useTheme();
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Static data for demonstration
  const teamMembers = [
    { id: 1, name: "Vivek Kumar", email: "vivek@example.com", role: "admin", status: "Active" },
    { id: 2, name: "Neha Sharma", email: "neha@example.com", role: "accountant", status: "Active" },
    { id: 3, name: "Rahul Singh", email: "rahul@example.com", role: "sales repo", status: "Active" },
    { id: 4, name: "Pooja Verma", email: "pooja@example.com", role: "calling repo", status: "Inactive" },
    { id: 5, name: "Amit Sharma", email: "amit@example.com", role: "installer", status: "Active" },
  ];

  return (
    <div className="p-6 animate-fade-in relative">
      {/* Header Area */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: themeColors.text }}>
            Team Management
          </h1>
          <p className="text-sm mt-1" style={{ color: themeColors.textSecondary }}>
            Manage all team members, roles, and access levels
          </p>
        </div>
        
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5"
          style={{ 
            backgroundColor: themeColors.primary, 
            color: themeColors.onPrimary 
          }}
        >
          <FaPlus className="text-sm" /> Add Team Member
        </button>
      </div>

      {/* Main Content Card */}
      <div 
        className="rounded-xl shadow-sm border overflow-hidden transition-all duration-300 hover:shadow-md"
        style={{ 
          backgroundColor: themeColors.surface,
          borderColor: themeColors.border
        }}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr style={{ backgroundColor: `${themeColors.primary}08`, borderBottom: `1px solid ${themeColors.border}` }}>
                <th className="py-4 px-6 font-semibold text-sm" style={{ color: themeColors.textSecondary }}>Name</th>
                <th className="py-4 px-6 font-semibold text-sm" style={{ color: themeColors.textSecondary }}>Email</th>
                <th className="py-4 px-6 font-semibold text-sm" style={{ color: themeColors.textSecondary }}>Role</th>
                <th className="py-4 px-6 font-semibold text-sm" style={{ color: themeColors.textSecondary }}>Status</th>
                <th className="py-4 px-6 font-semibold text-sm text-center" style={{ color: themeColors.textSecondary }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {teamMembers.map((member, index) => (
                <tr 
                  key={member.id} 
                  style={{ 
                    borderBottom: index !== teamMembers.length - 1 ? `1px solid ${themeColors.border}` : 'none' 
                  }}
                  className="hover:bg-black/5 dark:hover:bg-white/5 transition-colors duration-150 group"
                >
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs"
                        style={{ backgroundColor: `${themeColors.primary}20`, color: themeColors.primary }}
                      >
                        {member.name.charAt(0)}
                      </div>
                      <span className="text-sm font-medium" style={{ color: themeColors.text }}>{member.name}</span>
                    </div>
                  </td>
                  <td className="py-4 px-6 text-sm" style={{ color: themeColors.textSecondary }}>{member.email}</td>
                  <td className="py-4 px-6 text-sm">
                    <span 
                      className="px-2.5 py-1 rounded-md text-xs font-medium capitalize"
                      style={{ 
                        backgroundColor: `${themeColors.primary}15`, 
                        color: themeColors.primary,
                        border: `1px solid ${themeColors.primary}30`
                      }}
                    >
                      {member.role}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-sm">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold tracking-wide ${
                      member.status === 'Active' 
                        ? 'bg-green-600 text-white shadow-sm' 
                        : 'bg-red-600 text-white shadow-sm'
                    }`}>
                      {member.status}
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <button 
                        className="p-2 rounded-md transition-all hover:scale-110"
                        style={{ color: themeColors.primary, backgroundColor: `${themeColors.primary}10` }}
                        title="Edit Member"
                      >
                        <FaEdit />
                      </button>
                      <button 
                        className="p-2 rounded-md transition-all hover:scale-110"
                        style={{ color: '#ef4444', backgroundColor: 'rgba(239, 68, 68, 0.1)' }}
                        title="Delete Member"
                      >
                        <FaTrash />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Member Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div 
            className="w-full max-w-md rounded-xl shadow-2xl overflow-hidden"
            style={{ 
              backgroundColor: themeColors.surface, 
              borderColor: themeColors.border, 
              borderWidth: '1px' 
            }}
          >
            {/* Modal Header */}
            <div className="flex justify-between items-center p-4 border-b" style={{ borderColor: themeColors.border }}>
              <h2 className="text-lg font-semibold" style={{ color: themeColors.text }}>Add New Team Member</h2>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                style={{ color: themeColors.textSecondary }}
              >
                <FaTimes />
              </button>
            </div>
            
            {/* Modal Body */}
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: themeColors.text }}>Full Name</label>
                <input 
                  type="text" 
                  placeholder="Enter name"
                  className="w-full p-2.5 rounded-lg border focus:outline-none focus:ring-1 transition-colors"
                  style={{ 
                    backgroundColor: themeColors.background, 
                    borderColor: themeColors.border,
                    color: themeColors.text,
                  }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: themeColors.text }}>Email Address</label>
                <input 
                  type="email" 
                  placeholder="Enter email"
                  className="w-full p-2.5 rounded-lg border focus:outline-none focus:ring-1 transition-colors"
                  style={{ 
                    backgroundColor: themeColors.background, 
                    borderColor: themeColors.border,
                    color: themeColors.text,
                  }}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: themeColors.text }}>Password</label>
                  <input 
                    type="password" 
                    placeholder="Enter password"
                    className="w-full p-2.5 rounded-lg border focus:outline-none focus:ring-1 transition-colors"
                    style={{ 
                      backgroundColor: themeColors.background, 
                      borderColor: themeColors.border,
                      color: themeColors.text,
                    }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: themeColors.text }}>Confirm Password</label>
                  <input 
                    type="password" 
                    placeholder="Confirm password"
                    className="w-full p-2.5 rounded-lg border focus:outline-none focus:ring-1 transition-colors"
                    style={{ 
                      backgroundColor: themeColors.background, 
                      borderColor: themeColors.border,
                      color: themeColors.text,
                    }}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: themeColors.text }}>Role</label>
                <div className="relative">
                  <select 
                    className="w-full p-2.5 rounded-lg border focus:outline-none focus:ring-1 transition-colors appearance-none"
                    style={{ 
                      backgroundColor: themeColors.background, 
                      borderColor: themeColors.border,
                      color: themeColors.text,
                    }}
                    defaultValue=""
                  >
                    <option value="" disabled>Select a role</option>
                    <option value="admin">Admin</option>
                    <option value="accountant">Accountant</option>
                    <option value="calling repo">Calling Repo</option>
                    <option value="sales repo">Sales Repo</option>
                    <option value="installer">Installer</option>
                  </select>
                  {/* Custom select arrow */}
                  <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none" style={{ color: themeColors.textSecondary }}>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                    </svg>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Modal Footer */}
            <div className="flex justify-end gap-3 p-4 border-t bg-black/5 dark:bg-white/5" style={{ borderColor: themeColors.border }}>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 rounded-lg font-medium transition-colors border hover:bg-black/5 dark:hover:bg-white/5"
                style={{ 
                  color: themeColors.text, 
                  borderColor: themeColors.border,
                }}
              >
                Cancel
              </button>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 rounded-lg font-medium transition-transform active:scale-95"
                style={{ 
                  backgroundColor: themeColors.primary, 
                  color: themeColors.onPrimary 
                }}
              >
                Save Member
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default memo(TeamManagement);
