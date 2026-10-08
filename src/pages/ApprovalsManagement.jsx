import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import axios from "axios";
import { toast } from "sonner";
import Swal from "sweetalert2";
import {
  FaCheckCircle,
  FaTimesCircle,
  FaClock,
  FaTruck,
  FaTrashAlt,
  FaSearch,
  FaFilter,
  FaBoxes,
  FaWarehouse,
  FaEye,
  FaUserCheck,
  FaExclamationTriangle,
  FaHistory,
  FaArrowRight,
  FaPhoneAlt,
  FaMapMarkerAlt,
  FaRupeeSign,
  FaBuilding
} from "react-icons/fa";

export default function ApprovalsManagement() {
  const { token, admin } = useAuth();
  const [activeTab, setActiveTab] = useState("transfers"); // "transfers" | "deletions"
  
  // Transfers state
  const [transfers, setTransfers] = useState([]);
  const [transfersLoading, setTransfersLoading] = useState(true);
  const [transferStatus, setTransferStatus] = useState("pending");
  const [transferSearch, setTransferSearch] = useState("");
  const [selectedTransferLead, setSelectedTransferLead] = useState(null);

  // Deletions state
  const [deletions, setDeletions] = useState([]);
  const [deletionsLoading, setDeletionsLoading] = useState(true);
  const [deletionStatus, setDeletionStatus] = useState("pending");
  const [deletionType, setDeletionType] = useState("");
  const [deletionSearch, setDeletionSearch] = useState("");
  const [selectedDeletionReq, setSelectedDeletionReq] = useState(null);

  const baseUrl = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api/v1";

  useEffect(() => {
    if (activeTab === "transfers") {
      fetchTransfers();
    } else {
      fetchDeletions();
    }
  }, [activeTab, transferStatus, transferSearch, deletionStatus, deletionType, deletionSearch]);

  const fetchTransfers = async () => {
    setTransfersLoading(true);
    try {
      const params = {};
      if (transferStatus && transferStatus !== "all") params.status = transferStatus;
      if (transferSearch) params.search = transferSearch;

      const res = await axios.get(`${baseUrl}/accounts/transfer-requests`, {
        params,
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.status === "success") {
        setTransfers(res.data.data || []);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch transfer approval requests");
    } finally {
      setTransfersLoading(false);
    }
  };

  const fetchDeletions = async () => {
    setDeletionsLoading(true);
    try {
      const params = {};
      if (deletionStatus && deletionStatus !== "all") params.status = deletionStatus;
      if (deletionType) params.itemType = deletionType;
      if (deletionSearch) params.search = deletionSearch;

      const res = await axios.get(`${baseUrl}/stock/delete-requests`, {
        params,
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.status === "success") {
        setDeletions(res.data.data || []);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch stock deletion requests");
    } finally {
      setDeletionsLoading(false);
    }
  };

  // --- Transfer Actions ---
  const handleApproveTransfer = async (lead) => {
    const itemsListHtml = lead.stockCheck?.items?.map(it => `
      <div style="display: flex; justify-content: space-between; align-items: center; padding: 6px 0; border-bottom: 1px solid #f3f4f6; font-size: 13px;">
        <div>
          <b>${it.productName || 'Product'}</b> (${it.sku || ''}) x <b>${it.requestedQty} ${it.unit}</b>
          <div style="font-size: 11px; color: #64748b;">📍 WH: <b>${it.warehouseName || 'Assigned WH'}</b></div>
        </div>
        <span style="font-weight: 700; color: ${it.isAvailable ? '#10b981' : '#ef4444'}; text-align: right;">
          ${it.warehouseStock} in stock ${it.isAvailable ? '✓' : '⚠️ Low Stock'}
        </span>
      </div>
    `).join('') || '';

    const { value: remarks } = await Swal.fire({
      title: 'Approve Transfer & Deduct Stock?',
      html: `
        <div style="text-align: left; font-size: 14px;">
          <p style="margin-bottom: 10px; color: #4b5563;">
            You are approving the transfer for <b>${lead.name}</b> (${lead.phone}). Stock will be deducted from the respective warehouse selected for each product:
          </p>
          <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 10px; margin-bottom: 12px;">
            <span style="font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase;">Stock Deduction Preview:</span>
            ${itemsListHtml}
          </div>
          <p style="font-size: 12px; color: #64748b; margin-bottom: 8px;">
            Respective warehouse stock balances will be deducted and recorded in the Stock Panel.
          </p>
          <label style="display: block; font-weight: 600; margin-bottom: 4px; color: #374151;">Approval Remarks (Optional)</label>
          <textarea id="swal-approval-remarks" class="swal2-textarea" placeholder="E.g., Approved and dispatched via fast courier..." style="width: 100%; height: 60px; margin: 0; padding: 8px; border-radius: 6px; border: 1px solid #d1d5db; font-size: 13px;"></textarea>
        </div>
      `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Yes, Approve & Deduct Stock',
      confirmButtonColor: '#10B981',
      cancelButtonText: 'Cancel',
      preConfirm: () => {
        return document.getElementById('swal-approval-remarks').value;
      }
    });

    if (remarks !== undefined) {
      try {
        const res = await axios.put(`${baseUrl}/accounts/leads/${lead._id}/approve-transfer`, {
          remarks
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (res.data.status === 'success') {
          Swal.fire('Approved!', 'Transfer approved and stock deducted from warehouse.', 'success');
          fetchTransfers();
        }
      } catch (err) {
        console.error(err);
        Swal.fire('Error', err.response?.data?.message || 'Failed to approve transfer', 'error');
      }
    }
  };

  const handleRejectTransfer = async (lead) => {
    const { value: remarks } = await Swal.fire({
      title: 'Reject Transfer Request?',
      text: `Provide a reason for rejecting the transfer of ${lead.name}:`,
      input: 'textarea',
      inputPlaceholder: 'E.g., Insufficient stock in Mumbai warehouse, select Delhi warehouse instead...',
      inputValidator: (value) => {
        if (!value || !value.trim()) {
          return 'Rejection reason is required!';
        }
      },
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Reject Request',
      confirmButtonColor: '#ef4444',
      cancelButtonText: 'Cancel'
    });

    if (remarks) {
      try {
        const res = await axios.put(`${baseUrl}/accounts/leads/${lead._id}/reject-transfer`, {
          remarks
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (res.data.status === 'success') {
          Swal.fire('Rejected', 'Transfer request rejected and Accounts team notified.', 'info');
          fetchTransfers();
        }
      } catch (err) {
        console.error(err);
        Swal.fire('Error', err.response?.data?.message || 'Failed to reject transfer', 'error');
      }
    }
  };

  // --- Deletion Actions ---
  const handleActionDeletion = async (reqItem, action) => {
    const isApprove = action === 'approve';
    const { value: remarks } = await Swal.fire({
      title: isApprove ? `Approve Deletion of ${reqItem.itemName}?` : `Reject Deletion Request?`,
      text: isApprove
        ? `This will permanently delete ${reqItem.itemType} "${reqItem.itemName}". Complete snapshot history will be retained.`
        : `Provide remarks for rejecting this deletion request:`,
      input: isApprove ? 'text' : 'textarea',
      inputPlaceholder: isApprove ? 'Approval remarks (optional)...' : 'Reason for rejection...',
      icon: isApprove ? 'warning' : 'question',
      showCancelButton: true,
      confirmButtonText: isApprove ? 'Yes, Permanently Delete' : 'Reject Request',
      confirmButtonColor: isApprove ? '#ef4444' : '#64748b',
      cancelButtonText: 'Cancel',
      inputValidator: (val) => {
        if (!isApprove && (!val || !val.trim())) {
          return 'Rejection remarks are required!';
        }
      }
    });

    if (remarks !== undefined) {
      try {
        const res = await axios.put(`${baseUrl}/stock/delete-requests/${reqItem._id}/action`, {
          action,
          remarks
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (res.data.status === 'success') {
          Swal.fire('Success', res.data.message || `Request ${action}d successfully`, 'success');
          fetchDeletions();
        }
      } catch (err) {
        console.error(err);
        Swal.fire('Error', err.response?.data?.message || 'Failed to process deletion action', 'error');
      }
    }
  };

  const pendingTransfersCount = transfers.filter(t => t.transferApprovalStatus === 'pending').length;
  const pendingDeletionsCount = deletions.filter(d => d.status === 'pending').length;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
        <div>
          <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2.5">
            <FaCheckCircle className="text-emerald-500" /> Approvals & Requests Center
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Accounts team ke <b>Warehouse Transfer Requests</b> aur Stock panel ke <b>Delete Requests</b> ko yahan verify aur approve karein.
          </p>
        </div>

        {/* Tab Buttons */}
        <div className="flex items-center gap-2 bg-gray-100 p-1.5 rounded-2xl">
          <button
            onClick={() => setActiveTab("transfers")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === "transfers"
                ? "bg-white text-blue-600 shadow-xs"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <FaTruck /> Installation Transfers
            {pendingTransfersCount > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-500 text-white animate-pulse">
                {pendingTransfersCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab("deletions")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === "deletions"
                ? "bg-white text-rose-600 shadow-xs"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <FaTrashAlt /> Stock Deletion Requests
            {pendingDeletionsCount > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-500 text-white animate-pulse">
                {pendingDeletionsCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* TAB 1: INSTALLATION TRANSFER APPROVALS */}
      {activeTab === "transfers" && (
        <div className="space-y-6">
          {/* Controls Bar */}
          <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
            <div className="relative w-full md:w-80">
              <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
              <input
                type="text"
                placeholder="Search lead, customer phone, AWB..."
                value={transferSearch}
                onChange={(e) => setTransferSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto">
              <div className="flex items-center gap-1.5">
                <FaFilter className="text-gray-400 text-xs" />
                <select
                  value={transferStatus}
                  onChange={(e) => setTransferStatus(e.target.value)}
                  className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-700 focus:outline-none"
                >
                  <option value="pending">Pending Approval ({pendingTransfersCount})</option>
                  <option value="approved">Approved & Transferred</option>
                  <option value="rejected">Rejected Transfers</option>
                  <option value="all">All Transfer Requests</option>
                </select>
              </div>

              <button
                onClick={fetchTransfers}
                className="px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl text-xs font-bold transition-all"
              >
                Refresh
              </button>
            </div>
          </div>

          {/* Transfers List */}
          <div className="space-y-4">
            {transfersLoading ? (
              <div className="py-20 text-center bg-white rounded-3xl border border-gray-100">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-3 text-sm text-gray-500 font-medium">Loading transfer requests...</p>
              </div>
            ) : transfers.length === 0 ? (
              <div className="py-16 text-center bg-white rounded-3xl border border-gray-100">
                <FaTruck className="mx-auto text-4xl text-gray-300 mb-3" />
                <p className="text-base font-bold text-gray-700">No Transfer Requests Found</p>
                <p className="text-xs text-gray-400 mt-1">Accounts team jab warehouse select karke transfer request bhejegi, wo yahan show hogi.</p>
              </div>
            ) : (
              transfers.map((lead) => (
                <div
                  key={lead._id}
                  className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-all flex flex-col lg:flex-row gap-5 lg:items-center justify-between"
                >
                  {/* Lead & Customer Info */}
                  <div className="space-y-2 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-base font-black text-gray-900">{lead.name}</h3>
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-100">
                        {lead.phone}
                      </span>
                      {lead.awbNumber && (
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-50 text-purple-700 border border-purple-100">
                          AWB: {lead.awbNumber}
                        </span>
                      )}
                      {lead.transferApprovalStatus === 'pending' ? (
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-amber-50 text-amber-700 border border-amber-200 animate-pulse">
                          ⏳ Pending Approval
                        </span>
                      ) : lead.transferApprovalStatus === 'approved' ? (
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-emerald-50 text-emerald-700 border border-emerald-200">
                          ✓ Approved & Transferred
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-rose-50 text-rose-700 border border-rose-200">
                          ✕ Rejected
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <FaBuilding className="text-gray-400" /> Dispatch Warehouse: <b className="text-gray-800">{lead.dispatchWarehouse?.name || "Not Selected"}</b>
                      </span>
                      {lead.dealValue ? (
                        <span className="flex items-center gap-0.5 font-bold text-gray-800">
                          <FaRupeeSign className="text-gray-400" /> {lead.dealValue.toLocaleString("en-IN")}
                        </span>
                      ) : null}
                      <span>Requested by: <b className="text-gray-700">{lead.transferRequestedBy?.name || "Accounts Team"}</b></span>
                      <span>Date: <b className="text-gray-700">{lead.transferRequestedAt ? new Date(lead.transferRequestedAt).toLocaleDateString("en-IN", { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—'}</b></span>
                    </div>

                    {/* Stock items badge */}
                    <div className="bg-gray-50 p-3 rounded-2xl border border-gray-100 mt-2 space-y-1.5">
                      <span className="text-[10px] font-bold uppercase text-gray-400 tracking-wider block">Products to Out & Warehouse Stock Check:</span>
                      <div className="flex flex-wrap gap-2">
                        {lead.stockCheck?.items?.map((it, idx) => (
                          <div key={idx} className="flex flex-col gap-1 p-2.5 bg-white rounded-xl border border-gray-200 text-xs">
                            <div className="flex items-center justify-between gap-3">
                              <span className="font-bold text-gray-900">{it.productName || 'Product'} x{it.requestedQty} {it.unit}</span>
                              <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold ${
                                it.isAvailable ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                              }`}>
                                Stock: {it.warehouseStock}
                              </span>
                            </div>
                            <span className="text-[11px] font-medium text-blue-600 bg-blue-50/70 px-2 py-0.5 rounded-md self-start border border-blue-100">
                              📍 WH: {it.warehouseName || 'Assigned WH'}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {lead.dispatchRemarks && (
                      <p className="text-xs text-gray-600 italic">
                        Transport Remark: "{lead.dispatchRemarks}"
                      </p>
                    )}

                    {lead.transferRejectionRemarks && (
                      <p className="text-xs text-rose-600 font-medium">
                        Rejection Reason: "{lead.transferRejectionRemarks}"
                      </p>
                    )}
                  </div>

                  {/* Actions Column */}
                  <div className="flex flex-wrap lg:flex-col items-center gap-2 justify-end">
                    {lead.transferApprovalStatus === 'pending' && (
                      <>
                        <button
                          onClick={() => handleApproveTransfer(lead)}
                          className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow-sm transition-all flex items-center gap-1.5 cursor-pointer w-full justify-center"
                        >
                          <FaCheckCircle /> Approve & Deduct Stock
                        </button>
                        <button
                          onClick={() => handleRejectTransfer(lead)}
                          className="px-5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer w-full justify-center"
                        >
                          <FaTimesCircle /> Reject Transfer
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 2: STOCK DELETION REQUESTS & AUDIT HISTORY */}
      {activeTab === "deletions" && (
        <div className="space-y-6">
          {/* Controls Bar */}
          <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
            <div className="relative w-full md:w-80">
              <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
              <input
                type="text"
                placeholder="Search item, reason, user..."
                value={deletionSearch}
                onChange={(e) => setDeletionSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
              />
            </div>

            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              <div className="flex items-center gap-1.5">
                <FaFilter className="text-gray-400 text-xs" />
                <select
                  value={deletionStatus}
                  onChange={(e) => setDeletionStatus(e.target.value)}
                  className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-700 focus:outline-none"
                >
                  <option value="pending">Pending Approval ({pendingDeletionsCount})</option>
                  <option value="approved">Approved & Deleted</option>
                  <option value="rejected">Rejected Deletions</option>
                  <option value="all">All Deletion History</option>
                </select>
              </div>

              <select
                value={deletionType}
                onChange={(e) => setDeletionType(e.target.value)}
                className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-700 focus:outline-none"
              >
                <option value="">All Item Types</option>
                <option value="Product">Products</option>
                <option value="Warehouse">Warehouses</option>
                <option value="Category">Categories</option>
                <option value="Brand">Brands</option>
                <option value="Unit">Units</option>
                <option value="StockMovement">Stock Movements</option>
              </select>

              <button
                onClick={fetchDeletions}
                className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-bold transition-all"
              >
                Refresh
              </button>
            </div>
          </div>

          {/* Deletions Table */}
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
            {deletionsLoading ? (
              <div className="py-20 text-center">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-rose-600 mx-auto"></div>
                <p className="mt-3 text-sm text-gray-500 font-medium">Loading deletion requests...</p>
              </div>
            ) : deletions.length === 0 ? (
              <div className="py-16 text-center">
                <FaTrashAlt className="mx-auto text-4xl text-gray-300 mb-3" />
                <p className="text-base font-bold text-gray-700">No Deletion Requests Found</p>
                <p className="text-xs text-gray-400 mt-1">Stock panel se koi bhi item delete hone par yahan approval aur complete audit snapshot save hota hai.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50/80 border-b border-gray-100 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                      <th className="py-3.5 px-4">Item & Type</th>
                      <th className="py-3.5 px-4">Item Snapshot Details</th>
                      <th className="py-3.5 px-4">Requested By</th>
                      <th className="py-3.5 px-4">Reason</th>
                      <th className="py-3.5 px-4">Status</th>
                      <th className="py-3.5 px-4">Admin Remarks</th>
                      <th className="py-3.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-sm">
                    {deletions.map((req) => (
                      <tr key={req._id} className="hover:bg-gray-50/60 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2.5">
                            <div className="p-2 rounded-xl bg-gray-100 text-rose-600 font-bold">
                              <FaTrashAlt size={13} />
                            </div>
                            <div>
                              <p className="font-bold text-gray-900">{req.itemName}</p>
                              <span className="text-[10px] font-extrabold text-blue-600 uppercase tracking-wider">
                                {req.itemType}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-xs text-gray-600 max-w-xs">
                          {req.itemDetails || "—"}
                        </td>
                        <td className="py-3.5 px-4">
                          <p className="font-semibold text-gray-800 text-xs">{req.requestedBy?.name || "Staff Member"}</p>
                          <p className="text-[10px] text-gray-400">
                            {new Date(req.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                          </p>
                        </td>
                        <td className="py-3.5 px-4 text-xs text-gray-700 italic max-w-xs">
                          "{req.reason || "No reason given"}"
                        </td>
                        <td className="py-3.5 px-4">
                          {req.status === "pending" ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200 animate-pulse">
                              <FaClock /> Pending
                            </span>
                          ) : req.status === "approved" ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <FaCheckCircle /> Approved & Deleted
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
                              <FaTimesCircle /> Rejected
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-xs">
                          {req.status === "pending" ? (
                            <span className="text-gray-400">Pending Review</span>
                          ) : (
                            <div>
                              <p className="font-medium text-gray-800">{req.actionRemarks || "—"}</p>
                              <p className="text-[10px] text-gray-400">
                                By {req.actionBy?.name || "Admin"} • {req.actionAt ? new Date(req.actionAt).toLocaleDateString("en-IN") : ""}
                              </p>
                            </div>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {req.status === "pending" ? (
                              <>
                                <button
                                  onClick={() => handleActionDeletion(req, "approve")}
                                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all"
                                  title="Approve & Delete from database"
                                >
                                  Approve & Delete
                                </button>
                                <button
                                  onClick={() => handleActionDeletion(req, "reject")}
                                  className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg text-xs font-bold transition-all"
                                  title="Reject request"
                                >
                                  Reject
                                </button>
                              </>
                            ) : null}
                            <button
                              onClick={() => setSelectedDeletionReq(req)}
                              className="p-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-600 text-xs transition-colors"
                              title="View Full Item Snapshot"
                            >
                              <FaEye size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Snapshot Preview Modal */}
      {selectedDeletionReq && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-gray-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-4">
              <div>
                <h3 className="font-black text-lg text-gray-900">
                  {selectedDeletionReq.itemName}
                </h3>
                <span className="text-xs text-rose-600 font-bold uppercase tracking-wider">
                  {selectedDeletionReq.itemType} Snapshot (Audit History)
                </span>
              </div>
              <button
                onClick={() => setSelectedDeletionReq(null)}
                className="text-gray-400 hover:text-gray-600 text-xl font-bold p-1"
              >
                &times;
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 bg-gray-50 p-4 rounded-2xl text-xs">
                <div>
                  <span className="text-gray-400 font-semibold block">Requested By</span>
                  <span className="font-bold text-gray-800">{selectedDeletionReq.requestedBy?.name || "Staff"}</span>
                </div>
                <div>
                  <span className="text-gray-400 font-semibold block">Requested Date</span>
                  <span className="font-medium text-gray-700">{new Date(selectedDeletionReq.createdAt).toLocaleString("en-IN")}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-gray-400 font-semibold block">Reason for Deletion</span>
                  <p className="text-gray-800 font-medium mt-0.5">"{selectedDeletionReq.reason || "None"}"</p>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">Original Item Snapshot (Preserved History)</h4>
                <pre className="p-4 bg-gray-900 text-emerald-400 text-xs rounded-2xl overflow-x-auto max-h-60">
                  {JSON.stringify(selectedDeletionReq.itemData || selectedDeletionReq.itemDetails, null, 2)}
                </pre>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-gray-100 flex justify-end">
              <button
                onClick={() => setSelectedDeletionReq(null)}
                className="px-5 py-2 bg-gray-900 text-white rounded-xl text-xs font-bold hover:bg-gray-800 transition-colors"
              >
                Close Snapshot
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
