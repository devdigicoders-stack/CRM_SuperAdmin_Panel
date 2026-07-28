import { useState, useEffect } from "react";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import { toast } from "sonner";
import { X, Plus, Pencil, Trash2, Users, Building2, ChevronDown, Search } from "lucide-react";

const BASE = import.meta.env.VITE_API_BASE_URL;

const apiFetch = async (path, options = {}) => {
  const token = localStorage.getItem("admin-token");
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    ...options,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Request failed");
  return data;
};

// ── Modal ─────────────────────────────────────────────────────────────────────
function BranchModal({ branch, admins, allUsers, onClose, onSaved, c }) {
  const isEdit = !!branch;
  const [form, setForm] = useState({
    name:          branch?.name          || "",
    description:   branch?.description   || "",
    branchAdmin:   branch?.branchAdmin?._id || "",
    assignedUsers: branch?.assignedUsers?.map(u => u._id) || [],
  });
  const [saving, setSaving]   = useState(false);
  const [search, setSearch]   = useState("");

  const filteredUsers = allUsers.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    u.role.toLowerCase().includes(search.toLowerCase())
  );

  const toggleUser = (id) => {
    setForm(p => ({
      ...p,
      assignedUsers: p.assignedUsers.includes(id)
        ? p.assignedUsers.filter(x => x !== id)
        : [...p.assignedUsers, id],
    }));
  };

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error("Branch name is required"); return; }
    setSaving(true);
    try {
      if (isEdit) {
        await apiFetch(`/branches/${branch._id}`, {
          method: "PUT",
          body: JSON.stringify(form),
        });
        toast.success("Branch updated successfully!");
      } else {
        await apiFetch("/branches", {
          method: "POST",
          body: JSON.stringify(form),
        });
        toast.success("Branch created successfully!");
      }
      onSaved();
      onClose();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl"
        style={{ backgroundColor: c.surface, border: `1px solid ${c.border}` }}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5"
          style={{ borderBottom: `1px solid ${c.border}` }}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: c.primary + "20" }}>
              <Building2 size={18} style={{ color: c.primary }} />
            </div>
            <h2 className="font-black text-lg" style={{ color: c.text }}>
              {isEdit ? "Edit Branch" : "Create New Branch"}
            </h2>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:opacity-70 transition"
            style={{ color: c.textSecondary }}>
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Name */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider mb-1.5"
              style={{ color: c.textSecondary }}>Branch Name *</label>
            <input
              value={form.name}
              onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
              placeholder="e.g. Delhi Branch"
              className="w-full px-4 py-3 rounded-xl text-sm font-medium focus:outline-none transition"
              style={{ backgroundColor: c.background, border: `1px solid ${c.border}`, color: c.text }}
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider mb-1.5"
              style={{ color: c.textSecondary }}>Description</label>
            <textarea
              value={form.description}
              onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
              placeholder="Optional description..."
              rows={2}
              className="w-full px-4 py-3 rounded-xl text-sm font-medium focus:outline-none transition resize-none"
              style={{ backgroundColor: c.background, border: `1px solid ${c.border}`, color: c.text }}
            />
          </div>

          {/* Branch Admin */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider mb-1.5"
              style={{ color: c.textSecondary }}>Branch Admin (optional)</label>
            <div className="relative">
              <select
                value={form.branchAdmin}
                onChange={e => setForm(p => ({ ...p, branchAdmin: e.target.value }))}
                className="w-full px-4 py-3 rounded-xl text-sm font-medium focus:outline-none transition appearance-none"
                style={{ backgroundColor: c.background, border: `1px solid ${c.border}`, color: c.text }}
              >
                <option value="">— No Admin Assigned —</option>
                {admins.map(a => (
                  <option key={a._id} value={a._id}>{a.name} ({a.email})</option>
                ))}
              </select>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"
                style={{ color: c.textSecondary }} />
            </div>
          </div>

          {/* Assign Users */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold uppercase tracking-wider"
                style={{ color: c.textSecondary }}>
                Assign Staff ({form.assignedUsers.length} selected)
              </label>
              {form.assignedUsers.length > 0 && (
                <button onClick={() => setForm(p => ({ ...p, assignedUsers: [] }))}
                  className="text-xs font-semibold hover:opacity-70 transition"
                  style={{ color: c.danger }}>
                  Clear all
                </button>
              )}
            </div>

            {/* Search */}
            <div className="relative mb-3">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2"
                style={{ color: c.textSecondary }} />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search staff by name, email, role..."
                className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm focus:outline-none transition"
                style={{ backgroundColor: c.background, border: `1px solid ${c.border}`, color: c.text }}
              />
            </div>

            {/* User list */}
            <div className="rounded-xl overflow-hidden max-h-56 overflow-y-auto"
              style={{ border: `1px solid ${c.border}` }}>
              {filteredUsers.length === 0 ? (
                <div className="px-4 py-6 text-center text-sm" style={{ color: c.textSecondary }}>
                  No staff found
                </div>
              ) : filteredUsers.map(u => {
                const selected = form.assignedUsers.includes(u._id);
                return (
                  <div
                    key={u._id}
                    onClick={() => toggleUser(u._id)}
                    className="flex items-center gap-3 px-4 py-3 cursor-pointer transition"
                    style={{
                      backgroundColor: selected ? c.primary + "12" : "transparent",
                      borderBottom: `1px solid ${c.border}`,
                    }}
                  >
                    {/* Checkbox */}
                    <div className="w-5 h-5 rounded-md flex items-center justify-center shrink-0 transition"
                      style={{
                        backgroundColor: selected ? c.primary : "transparent",
                        border: `2px solid ${selected ? c.primary : c.border}`,
                      }}>
                      {selected && <span className="text-white text-xs font-bold">✓</span>}
                    </div>

                    {/* Avatar */}
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0"
                      style={{ backgroundColor: c.primary + "20", color: c.primary }}>
                      {u.name?.[0]?.toUpperCase()}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold truncate" style={{ color: c.text }}>{u.name}</p>
                      <p className="text-xs truncate" style={{ color: c.textSecondary }}>{u.email}</p>
                    </div>

                    <span className="text-xs font-bold px-2 py-1 rounded-lg capitalize shrink-0"
                      style={{ backgroundColor: c.primary + "15", color: c.primary }}>
                      {u.role}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button onClick={onClose}
              className="flex-1 py-3 rounded-xl text-sm font-bold transition"
              style={{ border: `1px solid ${c.border}`, color: c.textSecondary }}>
              Cancel
            </button>
            <button onClick={handleSave} disabled={saving}
              className="flex-1 py-3 rounded-xl text-sm font-bold transition disabled:opacity-60"
              style={{ backgroundColor: c.primary, color: "#fff" }}>
              {saving ? "Saving..." : isEdit ? "Save Changes" : "Create Branch"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function BranchManagement() {
  const { themeColors: c } = useTheme();
  const { admin } = useAuth();

  const [branches,  setBranches]  = useState([]);
  const [admins,    setAdmins]    = useState([]);
  const [allUsers,  setAllUsers]  = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [modal,     setModal]     = useState(null); // null | 'create' | branch object
  const [deleting,  setDeleting]  = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const [branchRes, usersRes] = await Promise.all([
        apiFetch("/branches"),
        apiFetch("/branches/available-users"),
      ]);
      setBranches(branchRes.data?.branches || []);
      setAdmins(usersRes.data?.admins || []);
      setAllUsers(usersRes.data?.users || []);
    } catch (e) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleDelete = async (branch) => {
    if (!window.confirm(`Delete branch "${branch.name}"? This cannot be undone.`)) return;
    setDeleting(branch._id);
    try {
      await apiFetch(`/branches/${branch._id}`, { method: "DELETE" });
      toast.success("Branch deleted");
      load();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setDeleting(null);
    }
  };

  const statusColor = (active) => active
    ? { bg: c.success + "15", text: c.success }
    : { bg: c.danger  + "15", text: c.danger  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-black" style={{ color: c.text }}>Branch Management</h1>
          <p className="text-sm mt-0.5" style={{ color: c.textSecondary }}>
            Create and manage branches, assign staff and admins
          </p>
        </div>
        <button
          onClick={() => setModal("create")}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition hover:opacity-90"
          style={{ backgroundColor: c.primary, color: "#fff" }}
        >
          <Plus size={16} />
          Create Branch
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Branches",  value: branches.length },
          { label: "Active",          value: branches.filter(b => b.active).length },
          { label: "With Admin",      value: branches.filter(b => b.branchAdmin).length },
          { label: "Total Staff",     value: branches.reduce((s, b) => s + (b.assignedUsers?.length || 0), 0) },
        ].map(({ label, value }) => (
          <div key={label} className="rounded-2xl p-5"
            style={{ backgroundColor: c.surface, border: `1px solid ${c.border}` }}>
            <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: c.textSecondary }}>{label}</p>
            <p className="text-2xl font-black" style={{ color: c.text }}>{value}</p>
          </div>
        ))}
      </div>

      {/* Branch list */}
      <div className="rounded-2xl overflow-hidden"
        style={{ backgroundColor: c.surface, border: `1px solid ${c.border}` }}>
        <div className="px-5 py-4" style={{ borderBottom: `1px solid ${c.border}` }}>
          <h2 className="font-bold text-sm" style={{ color: c.text }}>All Branches</h2>
        </div>

        {loading ? (
          <div className="px-5 py-10 text-center text-sm" style={{ color: c.textSecondary }}>
            Loading branches...
          </div>
        ) : branches.length === 0 ? (
          <div className="px-5 py-16 text-center">
            <Building2 size={40} className="mx-auto mb-3 opacity-30" style={{ color: c.textSecondary }} />
            <p className="font-bold text-sm" style={{ color: c.textSecondary }}>No branches yet</p>
            <p className="text-xs mt-1" style={{ color: c.textSecondary }}>Click "Create Branch" to get started</p>
          </div>
        ) : (
          <div className="divide-y" style={{ borderColor: c.border }}>
            {branches.map(branch => {
              const sc = statusColor(branch.active);
              return (
                <div key={branch._id} className="px-5 py-4">
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    {/* Left */}
                    <div className="flex items-start gap-4 min-w-0">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                        style={{ backgroundColor: c.primary + "15" }}>
                        <Building2 size={18} style={{ color: c.primary }} />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-black text-sm" style={{ color: c.text }}>{branch.name}</p>
                          <span className="text-xs font-bold px-2 py-0.5 rounded-lg"
                            style={{ backgroundColor: sc.bg, color: sc.text }}>
                            {branch.active ? "Active" : "Inactive"}
                          </span>
                        </div>
                        {branch.description && (
                          <p className="text-xs mt-0.5 truncate max-w-xs" style={{ color: c.textSecondary }}>
                            {branch.description}
                          </p>
                        )}
                        <div className="flex items-center gap-4 mt-2 flex-wrap">
                          <span className="text-xs font-medium" style={{ color: c.textSecondary }}>
                            👤 Admin: <span style={{ color: c.text }}>{branch.branchAdmin?.name || "—"}</span>
                          </span>
                          <span className="text-xs font-medium" style={{ color: c.textSecondary }}>
                            👥 Staff: <span style={{ color: c.text }}>{branch.assignedUsers?.length || 0}</span>
                          </span>
                        </div>

                        {/* Staff chips */}
                        {branch.assignedUsers?.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mt-2">
                            {branch.assignedUsers.slice(0, 5).map(u => (
                              <span key={u._id}
                                className="text-xs px-2 py-0.5 rounded-lg font-medium"
                                style={{ backgroundColor: c.background, border: `1px solid ${c.border}`, color: c.textSecondary }}>
                                {u.name}
                              </span>
                            ))}
                            {branch.assignedUsers.length > 5 && (
                              <span className="text-xs px-2 py-0.5 rounded-lg font-medium"
                                style={{ backgroundColor: c.primary + "15", color: c.primary }}>
                                +{branch.assignedUsers.length - 5} more
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => setModal(branch)}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition hover:opacity-80"
                        style={{ backgroundColor: c.primary + "15", color: c.primary }}>
                        <Pencil size={13} /> Edit
                      </button>
                      <button
                        onClick={() => handleDelete(branch)}
                        disabled={deleting === branch._id}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition hover:opacity-80 disabled:opacity-50"
                        style={{ backgroundColor: c.danger + "15", color: c.danger }}>
                        <Trash2 size={13} />
                        {deleting === branch._id ? "..." : "Delete"}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal */}
      {modal && (
        <BranchModal
          branch={modal === "create" ? null : modal}
          admins={admins}
          allUsers={allUsers}
          onClose={() => setModal(null)}
          onSaved={load}
          c={c}
        />
      )}
    </div>
  );
}
