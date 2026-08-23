import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import axios from "axios";
import { toast } from "sonner";
import Swal from "sweetalert2";
import {
  FaTrashAlt,
  FaUsers,
  FaUserTie,
  FaSearch,
  FaFilter,
  FaSync,
  FaExclamationTriangle,
  FaCheckSquare,
  FaSquare,
  FaPhoneAlt,
  FaUser,
  FaCalendarAlt,
  FaTimes,
  FaChevronLeft,
  FaChevronRight,
  FaLayerGroup,
  FaShieldAlt,
  FaCheckCircle,
} from "react-icons/fa";

export default function BulkDeleteStaffData() {
  const { token } = useAuth();
  const { themeColors } = useTheme();

  // Staff list & summary
  const [staffList, setStaffList] = useState([]);
  const [selectedStaffIds, setSelectedStaffIds] = useState([]);
  const [staffSearch, setStaffSearch] = useState("");
  const [staffRoleFilter, setStaffRoleFilter] = useState("all");
  const [loadingStaff, setLoadingStaff] = useState(true);

  // Leads list for selected staff
  const [leads, setLeads] = useState([]);
  const [selectedLeadIds, setSelectedLeadIds] = useState([]);
  const [loadingLeads, setLoadingLeads] = useState(false);
  const [totalLeadsCount, setTotalLeadsCount] = useState(0);

  // Lead Filters
  const [statusFilter, setStatusFilter] = useState("all");
  const [leadSearch, setLeadSearch] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);

  // Action status
  const [isDeleting, setIsDeleting] = useState(false);

  const baseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api/v1";

  // 1. Fetch Staff Data Summary on load
  useEffect(() => {
    fetchStaffSummary();
  }, []);

  const fetchStaffSummary = async () => {
    if (!token) return;
    setLoadingStaff(true);
    try {
      const res = await axios.get(`${baseUrl}/leads/staff-data-summary`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data.status === "success") {
        setStaffList(res.data.data.staff || []);
      }
    } catch (err) {
      console.error("Error fetching staff summary:", err);
      toast.error("Failed to load staff members data");
    } finally {
      setLoadingStaff(false);
    }
  };

  // 2. Fetch Leads when selected staff, filters or pagination changes
  useEffect(() => {
    if (selectedStaffIds.length > 0) {
      fetchLeads();
    } else {
      setLeads([]);
      setSelectedLeadIds([]);
      setTotalLeadsCount(0);
    }
  }, [selectedStaffIds, statusFilter, startDate, endDate, currentPage, pageSize]);

  const fetchLeads = async () => {
    if (!token || selectedStaffIds.length === 0) return;
    setLoadingLeads(true);
    try {
      const params = {
        assignedTo: selectedStaffIds.join(","),
        page: currentPage,
        limit: pageSize,
      };

      if (statusFilter && statusFilter !== "all") {
        params.status = statusFilter;
      }
      if (leadSearch.trim()) {
        params.search = leadSearch.trim();
      }
      if (startDate) params.createdAt = startDate;

      const res = await axios.get(`${baseUrl}/leads`, {
        params,
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.data.status === "success") {
        const fetchedLeads = res.data.data?.leads || [];
        setLeads(fetchedLeads);
        setTotalLeadsCount(res.data.total || fetchedLeads.length);
      }
    } catch (err) {
      console.error("Error fetching leads:", err);
      toast.error("Failed to load assigned leads");
    } finally {
      setLoadingLeads(false);
    }
  };

  const handleLeadSearchSubmit = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchLeads();
  };

  // Staff Selection Helpers
  const toggleStaffSelection = (id) => {
    setSelectedStaffIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
    setSelectedLeadIds([]);
    setCurrentPage(1);
  };

  const selectAllSalesStaff = () => {
    const allIds = filteredStaff.map((s) => s._id);
    setSelectedStaffIds(allIds);
    setSelectedLeadIds([]);
    setCurrentPage(1);
  };

  const deselectAllStaff = () => {
    setSelectedStaffIds([]);
    setSelectedLeadIds([]);
    setLeads([]);
    setTotalLeadsCount(0);
    setCurrentPage(1);
  };

  // Lead Selection Helpers
  const toggleLeadSelection = (id) => {
    setSelectedLeadIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const selectAllVisibleLeads = () => {
    if (selectedLeadIds.length === leads.length) {
      setSelectedLeadIds([]);
    } else {
      setSelectedLeadIds(leads.map((l) => l._id));
    }
  };

  // Filtered staff list for the top section
  const filteredStaff = staffList.filter((s) => {
    const matchesSearch =
      (s.name || "").toLowerCase().includes(staffSearch.toLowerCase()) ||
      (s.email || "").toLowerCase().includes(staffSearch.toLowerCase()) ||
      (s.phone || "").toLowerCase().includes(staffSearch.toLowerCase());
    const matchesRole =
      staffRoleFilter === "all" ? true : s.role === staffRoleFilter;
    return matchesSearch && matchesRole;
  });

  // Calculate selected staff aggregated total leads
  const selectedStaffObjects = staffList.filter((s) =>
    selectedStaffIds.includes(s._id)
  );
  const selectedStaffTotalLeads = selectedStaffObjects.reduce(
    (acc, curr) => acc + (curr.totalLeads || 0),
    0
  );

  // Status color badge helper
  const getStatusBadge = (status) => {
    switch (status) {
      case "new":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "assigned":
        return "bg-purple-50 text-purple-700 border-purple-200";
      case "interested":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "in_process":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "converted":
        return "bg-teal-50 text-teal-700 border-teal-200";
      case "closed":
        return "bg-green-50 text-green-700 border-green-200";
      case "not_interested":
        return "bg-gray-100 text-gray-700 border-gray-200";
      case "call_done":
        return "bg-indigo-50 text-indigo-700 border-indigo-200";
      default:
        return "bg-gray-50 text-gray-600 border-gray-200";
    }
  };

  // --- DELETE ACTION 1: Delete Individually Selected Leads ---
  const handleDeleteSelectedLeads = async () => {
    if (selectedLeadIds.length === 0) {
      toast.error("Please select at least one lead to delete");
      return;
    }

    const result = await Swal.fire({
      title: `Delete ${selectedLeadIds.length} Selected Leads?`,
      html: `
        <div class="text-left text-sm space-y-2">
          <p class="text-rose-600 font-semibold flex items-center gap-1">
            ⚠️ Warning: This action is permanent and cannot be undone!
          </p>
          <p class="text-gray-600">
            You are about to permanently delete <b>${selectedLeadIds.length}</b> customer leads from the system.
          </p>
        </div>
      `,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#6b7280",
      confirmButtonText: `Yes, Permanently Delete (${selectedLeadIds.length})`,
      cancelButtonText: "Cancel",
      reverseButtons: true,
      focusCancel: true,
    });

    if (!result.isConfirmed) return;

    setIsDeleting(true);
    try {
      const res = await axios.post(
        `${baseUrl}/leads/bulk-delete`,
        { leadIds: selectedLeadIds },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.data.status === "success") {
        toast.success(res.data.message || "Selected leads deleted successfully!");
        setSelectedLeadIds([]);
        fetchLeads();
        fetchStaffSummary();
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to delete selected leads");
    } finally {
      setIsDeleting(false);
    }
  };

  // --- DELETE ACTION 2: Delete ALL Leads of Selected Staff ---
  const handleDeleteAllStaffData = async () => {
    if (selectedStaffIds.length === 0) {
      toast.error("Please select at least one staff member");
      return;
    }

    const staffNames = selectedStaffObjects.map((s) => s.name).join(", ");

    const result = await Swal.fire({
      title: `Wipe ALL Data for Selected Staff?`,
      html: `
        <div class="text-left text-sm space-y-3">
          <div class="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs">
            <b>🚨 DANGER ZONE:</b> This will permanently wipe <b>all leads and customer records</b> assigned to:
            <div class="mt-1 font-semibold text-rose-900">${staffNames}</div>
          </div>
          <p class="text-gray-600">
            Total records affected: <b>${totalLeadsCount || selectedStaffTotalLeads}</b> leads
          </p>
          <p class="text-gray-500 text-xs italic">
            Filter applied: <b>${statusFilter === "all" ? "All Statuses" : statusFilter.toUpperCase()}</b>
          </p>
        </div>
      `,
      icon: "error",
      showCancelButton: true,
      confirmButtonColor: "#991b1b",
      cancelButtonColor: "#4b5563",
      confirmButtonText: `Yes, Wipe All Assigned Data!`,
      cancelButtonText: "Cancel",
      reverseButtons: true,
      focusCancel: true,
    });

    if (!result.isConfirmed) return;

    setIsDeleting(true);
    try {
      const payload = {
        userIds: selectedStaffIds,
        status: statusFilter !== "all" ? statusFilter : undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      };

      const res = await axios.post(`${baseUrl}/leads/bulk-delete`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.data.status === "success") {
        Swal.fire({
          title: "Data Deleted Successfully!",
          text: res.data.message || "All assigned leads have been wiped.",
          icon: "success",
          confirmButtonColor: "#2563eb",
        });
        setSelectedLeadIds([]);
        fetchLeads();
        fetchStaffSummary();
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to wipe staff data");
    } finally {
      setIsDeleting(false);
    }
  };

  const totalPages = Math.ceil(totalLeadsCount / pageSize) || 1;

  return (
    <div className="space-y-6 pb-24">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-rose-100 rounded-xl text-rose-600 shadow-sm">
              <FaTrashAlt className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
                Staff Assigned Data Cleanup
                <span className="px-2 py-0.5 text-[10px] font-extrabold uppercase bg-rose-100 text-rose-700 rounded-full border border-rose-200">
                  Super Admin Only
                </span>
              </h1>
              <p className="text-xs text-gray-500 mt-0.5">
                Select sales persons / staff, inspect their assigned data, and safely bulk delete records
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={() => {
            fetchStaffSummary();
            if (selectedStaffIds.length > 0) fetchLeads();
          }}
          className="px-4 py-2 bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm transition-all"
        >
          <FaSync className={loadingStaff || loadingLeads ? "animate-spin" : ""} />
          <span>Refresh All</span>
        </button>
      </div>

      {/* Safety Notice */}
      <div className="p-4 bg-amber-50/80 border border-amber-200/80 rounded-2xl flex items-start gap-3 text-xs text-amber-900 shadow-sm">
        <FaExclamationTriangle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
        <div>
          <span className="font-bold">Instructions & Safety Warning:</span>
          <p className="text-amber-800 mt-0.5">
            1. Select one or more sales persons from the list below to view all customer leads assigned to them.
            <br />
            2. You can filter the data by lead status or date, select specific rows, and delete them in bulk.
            <br />
            3. Deleting records is permanent and cannot be undone. Always verify selections before confirming.
          </p>
        </div>
      </div>

      {/* SECTION 1: Staff Selection Grid */}
      <div className="bg-white border border-gray-200/80 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-gray-100 pb-3">
          <div className="flex items-center gap-2">
            <FaUserTie className="text-blue-600" />
            <h2 className="text-sm font-bold text-gray-900">
              Step 1: Select Sales Persons / Staff Members
            </h2>
            <span className="text-xs text-gray-500 font-semibold">
              ({selectedStaffIds.length} of {staffList.length} selected)
            </span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={selectAllSalesStaff}
              className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-bold transition-colors"
            >
              Select All Staff
            </button>
            <button
              onClick={deselectAllStaff}
              className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-bold transition-colors"
            >
              Clear Selection
            </button>
          </div>
        </div>

        {/* Search & Filter Staff */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          <div className="sm:col-span-8 relative">
            <FaSearch className="w-3.5 h-3.5 text-gray-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search staff by name, email, or phone..."
              value={staffSearch}
              onChange={(e) => setStaffSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-800 focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
            />
          </div>

          <div className="sm:col-span-4 relative">
            <FaFilter className="w-3.5 h-3.5 text-gray-400 absolute left-3.5 top-3" />
            <select
              value={staffRoleFilter}
              onChange={(e) => setStaffRoleFilter(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-800 focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
            >
              <option value="all">All Staff Roles</option>
              <option value="sales">Sales Executives</option>
              <option value="crmuser">CRM Users</option>
              <option value="calling">Telecallers</option>
              <option value="installation">Installers</option>
            </select>
          </div>
        </div>

        {/* Staff Cards Grid */}
        {loadingStaff ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
            <p className="text-xs text-gray-400 mt-2">Loading staff data...</p>
          </div>
        ) : filteredStaff.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 max-h-[340px] overflow-y-auto pr-1">
            {filteredStaff.map((staff) => {
              const isSelected = selectedStaffIds.includes(staff._id);
              return (
                <div
                  key={staff._id}
                  onClick={() => toggleStaffSelection(staff._id)}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer select-none flex flex-col justify-between ${
                    isSelected
                      ? "bg-blue-50/80 border-blue-500 shadow-sm ring-1 ring-blue-400/50"
                      : "bg-white border-gray-200/80 hover:border-blue-300 hover:bg-gray-50/60"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                          isSelected
                            ? "bg-blue-600 text-white"
                            : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {staff.name ? staff.name.charAt(0).toUpperCase() : "U"}
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold text-xs text-gray-900 truncate">
                          {staff.name}
                        </div>
                        <div className="text-[10px] text-gray-400 truncate">
                          {staff.email || staff.phone || "No contact"}
                        </div>
                      </div>
                    </div>

                    <div className="shrink-0">
                      {isSelected ? (
                        <FaCheckSquare className="text-blue-600 text-base" />
                      ) : (
                        <FaSquare className="text-gray-300 text-base" />
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-gray-100 text-[11px]">
                    <span className="px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded text-[10px] font-semibold uppercase">
                      {staff.role}
                    </span>
                    <span
                      className={`font-bold px-2 py-0.5 rounded-full text-[10px] ${
                        staff.totalLeads > 0
                          ? "bg-blue-100 text-blue-800"
                          : "bg-gray-100 text-gray-400"
                      }`}
                    >
                      {staff.totalLeads || 0} Leads
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-8 text-center text-gray-400 text-xs">
            No staff members found matching your search.
          </div>
        )}
      </div>

      {/* SECTION 2: Assigned Leads Data Table */}
      {selectedStaffIds.length > 0 ? (
        <div className="bg-white border border-gray-200/80 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-gray-100 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <FaLayerGroup className="text-rose-600" />
                <h2 className="text-sm font-bold text-gray-900">
                  Step 2: Inspect & Select Assigned Leads
                </h2>
              </div>
              <p className="text-xs text-gray-500 mt-0.5">
                Showing data for <b>{selectedStaffObjects.map((s) => s.name).join(", ")}</b> ({totalLeadsCount} total records found)
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 font-semibold">
                Rows per page:
              </span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="px-2 py-1 bg-gray-50 border border-gray-200 rounded-lg text-xs font-semibold"
              >
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
                <option value={200}>200</option>
              </select>
            </div>
          </div>

          {/* Lead Filters */}
          <form onSubmit={handleLeadSearchSubmit} className="grid grid-cols-1 sm:grid-cols-12 gap-3">
            <div className="sm:col-span-5 relative">
              <FaSearch className="w-3.5 h-3.5 text-gray-400 absolute left-3.5 top-3" />
              <input
                type="text"
                placeholder="Search lead name, phone, email, tags..."
                value={leadSearch}
                onChange={(e) => setLeadSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-800 focus:outline-none focus:border-blue-500 focus:bg-white"
              />
            </div>

            <div className="sm:col-span-3 relative">
              <FaFilter className="w-3.5 h-3.5 text-gray-400 absolute left-3.5 top-3" />
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-800 focus:outline-none focus:border-blue-500 focus:bg-white"
              >
                <option value="all">All Lead Statuses</option>
                <option value="new">New</option>
                <option value="assigned">Assigned</option>
                <option value="interested">Interested</option>
                <option value="in_process">In Process</option>
                <option value="converted">Converted (Closed Won)</option>
                <option value="closed">Closed</option>
                <option value="not_interested">Not Interested</option>
                <option value="call_done">Call Done</option>
              </select>
            </div>

            <div className="sm:col-span-2 relative">
              <FaCalendarAlt className="w-3.5 h-3.5 text-gray-400 absolute left-3.5 top-3" />
              <input
                type="date"
                title="Created Date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-9 pr-2 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-800 focus:outline-none focus:border-blue-500 focus:bg-white"
              />
            </div>

            <div className="sm:col-span-2 flex items-center gap-2">
              <button
                type="submit"
                className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm"
              >
                Filter Leads
              </button>
            </div>
          </form>

          {/* Leads Table */}
          <div className="border border-gray-100 rounded-xl overflow-hidden shadow-sm">
            {loadingLeads ? (
              <div className="p-12 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
                <p className="text-xs text-gray-400 mt-2">Loading assigned leads...</p>
              </div>
            ) : leads.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-gray-700">
                  <thead className="bg-gray-50 text-gray-500 uppercase text-[10px] font-bold border-b border-gray-100">
                    <tr>
                      <th className="py-3 px-4 w-10 text-center">
                        <input
                          type="checkbox"
                          checked={
                            leads.length > 0 &&
                            selectedLeadIds.length === leads.length
                          }
                          onChange={selectAllVisibleLeads}
                          className="rounded border-gray-300 text-rose-600 focus:ring-rose-500 w-4 h-4 cursor-pointer"
                        />
                      </th>
                      <th className="py-3 px-4">Customer Name</th>
                      <th className="py-3 px-4">Phone Number</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Assigned Staff</th>
                      <th className="py-3 px-4">Priority</th>
                      <th className="py-3 px-4">Created Date</th>
                      <th className="py-3 px-4 text-right">Deal Value</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {leads.map((lead) => {
                      const isLeadChecked = selectedLeadIds.includes(lead._id);
                      return (
                        <tr
                          key={lead._id}
                          className={`hover:bg-rose-50/30 transition-colors ${
                            isLeadChecked ? "bg-rose-50/50" : ""
                          }`}
                        >
                          <td className="py-3 px-4 text-center">
                            <input
                              type="checkbox"
                              checked={isLeadChecked}
                              onChange={() => toggleLeadSelection(lead._id)}
                              className="rounded border-gray-300 text-rose-600 focus:ring-rose-500 w-4 h-4 cursor-pointer"
                            />
                          </td>

                          <td className="py-3 px-4 font-bold text-gray-900">
                            <div className="flex items-center gap-1.5">
                              <FaUser className="text-gray-400 text-[10px]" />
                              <span>{lead.name || "Unnamed Customer"}</span>
                            </div>
                            {lead.email && (
                              <span className="text-[10px] text-gray-400 font-normal block">
                                {lead.email}
                              </span>
                            )}
                          </td>

                          <td className="py-3 px-4 font-mono font-semibold text-gray-800">
                            <div className="flex items-center gap-1">
                              <FaPhoneAlt className="text-gray-400 text-[9px]" />
                              <span>{lead.phone}</span>
                            </div>
                          </td>

                          <td className="py-3 px-4">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold border ${getStatusBadge(
                                lead.status
                              )}`}
                            >
                              {lead.status?.replace("_", " ")}
                            </span>
                          </td>

                          <td className="py-3 px-4 font-semibold text-gray-800">
                            <div className="flex items-center gap-1 text-[11px]">
                              <FaUserTie className="text-indigo-600 text-[10px]" />
                              <span>{lead.assignedTo?.name || "Unassigned"}</span>
                            </div>
                          </td>

                          <td className="py-3 px-4">
                            <span
                              className={`px-1.5 py-0.5 rounded text-[10px] uppercase font-bold ${
                                lead.priority === "high"
                                  ? "bg-rose-100 text-rose-700"
                                  : lead.priority === "medium"
                                  ? "bg-amber-100 text-amber-700"
                                  : "bg-gray-100 text-gray-600"
                              }`}
                            >
                              {lead.priority || "Normal"}
                            </span>
                          </td>

                          <td className="py-3 px-4 text-gray-500 text-[11px] whitespace-nowrap">
                            {new Date(lead.createdAt).toLocaleDateString("en-IN", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            })}
                          </td>

                          <td className="py-3 px-4 text-right font-bold text-gray-800">
                            ₹{(lead.dealValue || 0).toLocaleString("en-IN")}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-12 text-center text-gray-400 text-xs">
                No customer leads found for the selected staff and filter criteria.
              </div>
            )}

            {/* Pagination Controls */}
            {totalLeadsCount > pageSize && (
              <div className="p-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between text-xs">
                <span className="text-gray-500">
                  Showing page {currentPage} of {totalPages} ({totalLeadsCount} total records)
                </span>
                <div className="flex items-center gap-2">
                  <button
                    disabled={currentPage <= 1}
                    onClick={() => setCurrentPage((p) => p - 1)}
                    className="p-1.5 bg-white border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-100 disabled:opacity-40"
                  >
                    <FaChevronLeft />
                  </button>
                  <span className="font-bold text-gray-700">{currentPage}</span>
                  <button
                    disabled={currentPage >= totalPages}
                    onClick={() => setCurrentPage((p) => p + 1)}
                    className="p-1.5 bg-white border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-100 disabled:opacity-40"
                  >
                    <FaChevronRight />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="p-12 text-center bg-white border border-gray-200/80 rounded-2xl shadow-sm space-y-3">
          <FaUsers className="w-12 h-12 text-gray-300 mx-auto" />
          <h3 className="font-bold text-gray-700 text-sm">
            No Sales Persons Selected
          </h3>
          <p className="text-xs text-gray-400 max-w-sm mx-auto">
            Please click on one or more staff cards in Step 1 above to load and manage their assigned leads data.
          </p>
        </div>
      )}

      {/* FLOATING ACTION BAR (When items are selected) */}
      {selectedStaffIds.length > 0 && (
        <div className="fixed bottom-4 left-4 right-4 md:left-72 md:right-8 bg-slate-900 text-white p-4 rounded-2xl shadow-2xl z-40 border border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-3 animate-slideUp">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-rose-600/30 rounded-xl text-rose-400">
              <FaShieldAlt className="text-lg" />
            </div>
            <div>
              <div className="font-bold text-sm">
                {selectedLeadIds.length > 0
                  ? `${selectedLeadIds.length} Leads Selected`
                  : `${selectedStaffIds.length} Staff Selected`}
              </div>
              <p className="text-slate-400 text-xs">
                Total matching leads in database:{" "}
                <b className="text-white">{totalLeadsCount}</b>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            {/* Button 1: Delete Checked Leads */}
            <button
              onClick={handleDeleteSelectedLeads}
              disabled={selectedLeadIds.length === 0 || isDeleting}
              className="flex-1 sm:flex-initial px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-md flex items-center justify-center gap-2 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <FaTrashAlt />
              <span>Delete Checked Leads ({selectedLeadIds.length})</span>
            </button>

            {/* Button 2: Wipe ALL Assigned Leads of Selected Staff */}
            <button
              onClick={handleDeleteAllStaffData}
              disabled={isDeleting || totalLeadsCount === 0}
              className="flex-1 sm:flex-initial px-4 py-2.5 bg-red-950 hover:bg-red-900 border border-red-700 text-red-200 hover:text-white rounded-xl text-xs font-bold shadow-md flex items-center justify-center gap-2 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <FaTrashAlt />
              <span>Wipe ALL Staff Data ({totalLeadsCount})</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
