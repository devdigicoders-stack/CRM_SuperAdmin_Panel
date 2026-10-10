import { memo, useState, useEffect, useMemo, useCallback } from "react";
import {
  FaBoxes,
  FaWarehouse,
  FaExclamationTriangle,
  FaCheckCircle,
  FaTimesCircle,
  FaRupeeSign,
  FaCalendarDay,
  FaCalendarWeek,
  FaCalendarAlt,
  FaHistory,
  FaFilter,
  FaDownload,
  FaSearch,
  FaTag,
  FaCity,
  FaArrowRight,
  FaEye,
  FaTimes,
  FaSyncAlt,
  FaChartPie,
  FaChartBar,
  FaFileExport,
  FaMapMarkerAlt,
  FaArrowDown,
  FaArrowUp,
  FaLayerGroup
} from "react-icons/fa";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import axios from "axios";
import { toast } from "sonner";
import Highcharts from "highcharts";
import HighchartsReact from "highcharts-react-official";
import SearchableSelect from "../components/SearchableSelect";

const TIMEFRAMES = [
  { id: "today", label: "Today", icon: FaCalendarDay },
  { id: "thisWeek", label: "This Week", icon: FaCalendarWeek },
  { id: "thisMonth", label: "This Month", icon: FaCalendarAlt },
  { id: "thisYear", label: "This Year", icon: FaCalendarAlt },
  { id: "allTime", label: "All Time", icon: FaHistory },
];

const StockReports = () => {
  const { themeColors } = useTheme();
  const { token } = useAuth();

  // Filters State
  const [warehouses, setWarehouses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [selectedWarehouse, setSelectedWarehouse] = useState("all");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedBrand, setSelectedBrand] = useState("all");
  const [selectedCity, setSelectedCity] = useState("");
  const [activeTimeframe, setActiveTimeframe] = useState("thisMonth");
  const [filterStartDate, setFilterStartDate] = useState("");
  const [filterEndDate, setFilterEndDate] = useState("");

  // Report Data
  const [analyticsData, setAnalyticsData] = useState(null);
  const [isFetching, setIsFetching] = useState(false);

  // Drilldown Modal State
  const [drilldownOpen, setDrilldownOpen] = useState(false);
  const [drilldownLoading, setDrilldownLoading] = useState(false);
  const [drilldownType, setDrilldownType] = useState("product"); // "product" or "movement"
  const [drilldownData, setDrilldownData] = useState([]);
  const [drilldownTitle, setDrilldownTitle] = useState("");
  const [drilldownSubtitle, setDrilldownSubtitle] = useState("");
  const [drilldownMetric, setDrilldownMetric] = useState("totalProducts");
  const [drilldownTargetWarehouse, setDrilldownTargetWarehouse] = useState("all");
  const [drilldownSearch, setDrilldownSearch] = useState("");
  const [drilldownStockStatusFilter, setDrilldownStockStatusFilter] = useState("");

  // Product Movement Ledger Modal State
  const [ledgerModalOpen, setLedgerModalOpen] = useState(false);
  const [ledgerLoading, setLedgerLoading] = useState(false);
  const [selectedProductForLedger, setSelectedProductForLedger] = useState(null);
  const [productLedgerMovements, setProductLedgerMovements] = useState([]);

  // Fetch initial metadata
  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        const baseUrl = import.meta.env.VITE_API_BASE_URL;
        const [whRes, catRes, brRes] = await Promise.all([
          axios.get(`${baseUrl}/stock/warehouses`, { headers: { Authorization: `Bearer ${token}` } }).catch(() => ({ data: { data: [] } })),
          axios.get(`${baseUrl}/stock/categories`, { headers: { Authorization: `Bearer ${token}` } }).catch(() => ({ data: { data: [] } })),
          axios.get(`${baseUrl}/stock/brands`, { headers: { Authorization: `Bearer ${token}` } }).catch(() => ({ data: { data: [] } }))
        ]);

        setWarehouses(whRes.data?.data || whRes.data?.warehouses || []);
        setCategories(catRes.data?.data || catRes.data?.categories || []);
        setBrands(brRes.data?.data || brRes.data?.brands || []);
      } catch (err) {
        console.error("Failed to load stock metadata:", err);
      }
    };

    if (token) {
      fetchMetadata();
    }
  }, [token]);

  // Fetch Report Analytics
  const fetchAnalytics = useCallback(async () => {
    setIsFetching(true);
    try {
      const baseUrl = import.meta.env.VITE_API_BASE_URL;
      const params = new URLSearchParams();

      if (selectedWarehouse && selectedWarehouse !== "all") {
        params.append("warehouseId", selectedWarehouse);
      }
      if (selectedCategory && selectedCategory !== "all") {
        params.append("categoryId", selectedCategory);
      }
      if (selectedBrand && selectedBrand !== "all") {
        params.append("brandId", selectedBrand);
      }
      if (selectedCity) {
        params.append("city", selectedCity);
      }

      if (activeTimeframe === "custom") {
        if (filterStartDate) params.append("startDate", filterStartDate);
        if (filterEndDate) params.append("endDate", filterEndDate);
      } else {
        params.append("timeframe", activeTimeframe);
      }

      const res = await axios.get(`${baseUrl}/stock/reports/analytics?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.data.status === "success") {
        setAnalyticsData(res.data.data);
      }
    } catch (err) {
      console.error("Failed to fetch stock analytics:", err);
      toast.error("Failed to load stock reports");
    } finally {
      setIsFetching(false);
    }
  }, [
    selectedWarehouse,
    selectedCategory,
    selectedBrand,
    selectedCity,
    activeTimeframe,
    filterStartDate,
    filterEndDate,
    token
  ]);

  useEffect(() => {
    if (token) {
      fetchAnalytics();
    }
  }, [fetchAnalytics, token]);

  // Open Drilldown View
  const handleOpenDrilldown = async ({
    metricType = "totalProducts",
    title = "Stock Inventory Drilldown",
    subtitle = "",
    targetWarehouse = selectedWarehouse,
    targetCategory = selectedCategory,
    targetCity = selectedCity
  }) => {
    setDrilldownTitle(title);
    setDrilldownSubtitle(subtitle);
    setDrilldownMetric(metricType);
    setDrilldownTargetWarehouse(targetWarehouse);
    setDrilldownSearch("");
    setDrilldownStockStatusFilter(metricType === "lowStock" || metricType === "outOfStock" || metricType === "inStock" ? metricType : "");
    setDrilldownOpen(true);
    setDrilldownLoading(true);
    setDrilldownData([]);

    try {
      const baseUrl = import.meta.env.VITE_API_BASE_URL;
      const params = new URLSearchParams();

      if (metricType) {
        params.append("metricType", metricType);
      }
      if (targetWarehouse && targetWarehouse !== "all") {
        params.append("warehouseId", targetWarehouse);
      }
      if (targetCategory && targetCategory !== "all") {
        params.append("categoryId", targetCategory);
      }
      if (selectedBrand && selectedBrand !== "all") {
        params.append("brandId", selectedBrand);
      }
      if (targetCity) {
        params.append("city", targetCity);
      }

      if (activeTimeframe === "custom") {
        if (filterStartDate) params.append("startDate", filterStartDate);
        if (filterEndDate) params.append("endDate", filterEndDate);
      } else {
        params.append("timeframe", activeTimeframe);
      }

      const res = await axios.get(`${baseUrl}/stock/reports/drilldown?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.data.status === "success") {
        setDrilldownType(res.data.drilldownType || "product");
        setDrilldownData(res.data.data || []);
      }
    } catch (err) {
      console.error("Failed to fetch drilldown stock:", err);
      toast.error("Failed to load stock details");
    } finally {
      setDrilldownLoading(false);
    }
  };

  // Open Product Movement Ledger
  const handleOpenProductLedger = async (product) => {
    setSelectedProductForLedger(product);
    setLedgerModalOpen(true);
    setLedgerLoading(true);
    setProductLedgerMovements([]);

    try {
      const baseUrl = import.meta.env.VITE_API_BASE_URL;
      const res = await axios.get(`${baseUrl}/stock/reports/product-movements/${product._id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.status === "success") {
        setProductLedgerMovements(res.data.data.movements || []);
      }
    } catch (err) {
      console.error("Failed to load product movement ledger:", err);
      toast.error("Failed to load movement ledger");
    } finally {
      setLedgerLoading(false);
    }
  };

  // Filter Drilldown Table
  const filteredDrilldownItems = useMemo(() => {
    if (drilldownType === "movement") {
      return drilldownData.filter((item) => {
        if (!drilldownSearch) return true;
        const q = drilldownSearch.toLowerCase();
        return (
          (item.product?.name && item.product.name.toLowerCase().includes(q)) ||
          (item.product?.sku && item.product.sku.toLowerCase().includes(q)) ||
          (item.warehouse?.name && item.warehouse.name.toLowerCase().includes(q)) ||
          (item.referenceNo && item.referenceNo.toLowerCase().includes(q)) ||
          (item.transactionType && item.transactionType.toLowerCase().includes(q))
        );
      });
    }

    return drilldownData.filter((p) => {
      const matchesSearch =
        !drilldownSearch ||
        (p.name && p.name.toLowerCase().includes(drilldownSearch.toLowerCase())) ||
        (p.sku && p.sku.toLowerCase().includes(drilldownSearch.toLowerCase())) ||
        (p.category?.name && p.category.name.toLowerCase().includes(drilldownSearch.toLowerCase())) ||
        (p.brand?.name && p.brand.name.toLowerCase().includes(drilldownSearch.toLowerCase())) ||
        (p.warehouseStock && p.warehouseStock.some(ws => ws.warehouse?.name && ws.warehouse.name.toLowerCase().includes(drilldownSearch.toLowerCase())));

      let matchesStatus = true;
      const stock = p.currentStock || 0;
      const min = p.minStockLevel || 5;
      if (drilldownStockStatusFilter === "outOfStock") {
        matchesStatus = stock <= 0;
      } else if (drilldownStockStatusFilter === "lowStock") {
        matchesStatus = stock > 0 && stock <= min;
      } else if (drilldownStockStatusFilter === "inStock") {
        matchesStatus = stock > min;
      }

      return matchesSearch && matchesStatus;
    });
  }, [drilldownData, drilldownSearch, drilldownStockStatusFilter, drilldownType]);

  // Export Drilldown to CSV
  const handleExportDrilldownCSV = () => {
    if (!filteredDrilldownItems.length) {
      toast.info("No items to export");
      return;
    }

    let csvContent = "";
    if (drilldownType === "movement") {
      const headers = ["Date", "Type", "Product", "SKU", "Warehouse", "City", "Quantity", "Unit Price", "Total Price", "Reference No"];
      const rows = filteredDrilldownItems.map(m => [
        `"${new Date(m.createdAt).toLocaleString()}"`,
        `"${m.transactionType?.toUpperCase() || ''}"`,
        `"${m.product?.name || ''}"`,
        `"${m.product?.sku || ''}"`,
        `"${m.warehouse?.name || ''}"`,
        `"${m.warehouse?.city || ''}"`,
        m.quantity || 0,
        m.unitPrice || 0,
        m.totalPrice || 0,
        `"${m.referenceNo || ''}"`
      ]);
      csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    } else {
      const headers = ["SKU", "Product Name", "Category", "Brand", "Unit", "Current Stock", "Min Stock Level", "Purchase Price (INR)", "Selling Price (INR)", "Total Valuation (INR)", "Status"];
      const rows = filteredDrilldownItems.map(p => {
        const stock = p.currentStock || 0;
        const min = p.minStockLevel || 5;
        const statusText = stock <= 0 ? "Out of Stock" : stock <= min ? "Low Stock" : "In Stock";
        return [
          `"${p.sku || ''}"`,
          `"${(p.name || '').replace(/"/g, '""')}"`,
          `"${p.category?.name || 'N/A'}"`,
          `"${p.brand?.name || 'N/A'}"`,
          `"${p.unit?.shortName || p.unit?.name || 'pcs'}"`,
          stock,
          min,
          p.purchasePrice || 0,
          p.sellingPrice || 0,
          (stock * (p.purchasePrice || 0)),
          `"${statusText}"`
        ];
      });
      csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `stock_drilldown_${drilldownMetric}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Stock report exported successfully!");
  };

  const hasLocationFilter = Boolean(selectedCity);

  // Highcharts: Category Donut Chart
  const categoryPieOptions = useMemo(() => {
    if (!analyticsData?.categoryBreakdown) return null;
    const chartData = Object.entries(analyticsData.categoryBreakdown)
      .filter(([, cat]) => cat.count > 0)
      .map(([catName, cat]) => ({
        name: catName,
        y: cat.count,
        stockQuantity: cat.stockQuantity,
        valuation: cat.valuation
      }));

    return {
      chart: { type: "pie", backgroundColor: "transparent", height: 320 },
      title: { text: "" },
      tooltip: {
        pointFormat: "<b>{point.y} Products</b><br/>Total Units: {point.stockQuantity}<br/>Valuation: ₹{point.valuation:,.0f}"
      },
      plotOptions: {
        pie: {
          innerSize: "60%",
          allowPointSelect: true,
          cursor: "pointer",
          dataLabels: { enabled: false },
          showInLegend: true,
          point: {
            events: {
              click: function () {
                const catObj = categories.find(c => c.name === this.name);
                handleOpenDrilldown({
                  metricType: "totalProducts",
                  targetCategory: catObj ? catObj._id : "all",
                  title: `${this.name} Category Products`,
                  subtitle: `Showing all inventory items under "${this.name}"`
                });
              }
            }
          }
        }
      },
      legend: {
        itemStyle: { color: themeColors.text, fontSize: "11px", fontWeight: "600" },
        layout: "horizontal",
        align: "center",
        verticalAlign: "bottom"
      },
      series: [{ name: "Category", data: chartData }],
      credits: { enabled: false }
    };
  }, [analyticsData, themeColors, categories]);

  // Highcharts: Warehouse Stock Bar Chart
  const warehouseBarOptions = useMemo(() => {
    if (!analyticsData?.warehouseBreakdown || analyticsData.warehouseBreakdown.length === 0) return null;
    const categoriesList = analyticsData.warehouseBreakdown.map(w => w.name);
    const stockData = analyticsData.warehouseBreakdown.map(w => w.totalStock);
    const valuationData = analyticsData.warehouseBreakdown.map(w => w.totalValuation);

    return {
      chart: { type: "bar", backgroundColor: "transparent", height: 300 },
      title: { text: "" },
      xAxis: {
        categories: categoriesList,
        labels: { style: { color: themeColors.text, fontSize: "11px", fontWeight: "600" } },
        lineColor: themeColors.border
      },
      yAxis: {
        title: { text: "Units Stored", style: { color: themeColors.textSecondary } },
        labels: { style: { color: themeColors.textSecondary } },
        gridLineColor: `${themeColors.border}40`,
        allowDecimals: false
      },
      tooltip: {
        shared: true,
        formatter: function () {
          const idx = this.points[0].point.index;
          const wh = analyticsData.warehouseBreakdown[idx];
          return `<b>${wh.name} (${wh.city})</b><br/>Units Stored: <b>${wh.totalStock}</b><br/>Inventory Value: <b>₹${wh.totalValuation.toLocaleString()}</b><br/>Low Stock: <b style="color:orange">${wh.lowStockCount}</b>`;
        }
      },
      plotOptions: {
        bar: {
          borderRadius: 4,
          color: themeColors.primary,
          colorByPoint: true,
          point: {
            events: {
              click: function () {
                const wh = analyticsData.warehouseBreakdown[this.index];
                if (wh) {
                  setSelectedWarehouse(wh._id);
                  handleOpenDrilldown({
                    metricType: "totalProducts",
                    targetWarehouse: wh._id,
                    title: `${wh.name} Inventory`,
                    subtitle: `Depot located in ${wh.city}`
                  });
                }
              }
            }
          }
        }
      },
      legend: { enabled: false },
      series: [{ name: "Stock Units", data: stockData }],
      credits: { enabled: false }
    };
  }, [analyticsData, themeColors]);

  // Highcharts: Movement Trend (Stock In vs Stock Out)
  const movementTrendOptions = useMemo(() => {
    if (!analyticsData?.dailyMovementTrend) return null;
    const categoriesList = analyticsData.dailyMovementTrend.map(d => `${d.day} (${d.date.slice(5)})`);
    const inData = analyticsData.dailyMovementTrend.map(d => d.stockIn);
    const outData = analyticsData.dailyMovementTrend.map(d => d.stockOut);

    return {
      chart: { type: "column", backgroundColor: "transparent", height: 320 },
      title: { text: "" },
      xAxis: {
        categories: categoriesList,
        labels: { style: { color: themeColors.textSecondary, fontSize: "11px" } },
        lineColor: themeColors.border
      },
      yAxis: {
        title: { text: "Quantity", style: { color: themeColors.textSecondary } },
        labels: { style: { color: themeColors.textSecondary } },
        gridLineColor: `${themeColors.border}40`,
        allowDecimals: false
      },
      tooltip: { shared: true },
      plotOptions: {
        column: {
          borderRadius: 4,
          borderWidth: 0
        }
      },
      legend: {
        itemStyle: { color: themeColors.text, fontSize: "12px", fontWeight: "600" }
      },
      series: [
        { name: "Stock In / Purchases", data: inData, color: "#10b981" },
        { name: "Stock Out / Dispatches", data: outData, color: "#ef4444" }
      ],
      credits: { enabled: false }
    };
  }, [analyticsData, themeColors]);

  const summary = analyticsData?.summary || {
    totalProducts: 0,
    totalStockQuantity: 0,
    totalStockValuation: 0,
    totalRetailValuation: 0,
    inStockCount: 0,
    lowStockCount: 0,
    outOfStockCount: 0,
    totalWarehouses: 0,
    totalMovements: 0,
    stockInQuantity: 0,
    stockOutQuantity: 0,
    stockInValue: 0,
    stockOutValue: 0
  };

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6 animate-fade-in">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gradient-to-r from-amber-900/10 via-emerald-900/10 to-blue-900/10 p-5 rounded-2xl border" style={{ borderColor: themeColors.border }}>
        <div>
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-amber-600 text-white shadow-lg shadow-amber-500/20">
              <FaBoxes className="text-2xl" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-black tracking-tight" style={{ color: themeColors.text }}>
                Stock & Inventory Reports
              </h1>
              <p className="text-xs md:text-sm font-medium mt-0.5" style={{ color: themeColors.textSecondary }}>
                Live warehouse valuation, inventory health tracking, stock inflow/outflow audit, and complete product drilldown.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 self-stretch md:self-auto">
          <button
            onClick={fetchAnalytics}
            disabled={isFetching}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition shadow-sm border hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer"
            style={{ backgroundColor: themeColors.surface, borderColor: themeColors.border, color: themeColors.text }}
          >
            <FaSyncAlt className={isFetching ? "animate-spin text-amber-500" : ""} />
            {isFetching ? "Refreshing..." : "Refresh"}
          </button>
          <button
            onClick={() => handleOpenDrilldown({
              metricType: "totalProducts",
              title: "Complete Stock Inventory Directory",
              subtitle: "All products across registered warehouses and storage depots"
            })}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white transition shadow-md hover:opacity-90 cursor-pointer"
            style={{ backgroundColor: themeColors.primary }}
          >
            <FaFileExport />
            Drilldown All Stock
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="p-5 rounded-2xl border shadow-sm space-y-4" style={{ backgroundColor: themeColors.surface, borderColor: themeColors.border }}>
        {/* Row 1: Warehouse, Category & Brand */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Select Warehouse */}
          <div>
            <label className="block text-xs font-extrabold uppercase tracking-wider mb-1.5" style={{ color: themeColors.textSecondary }}>
              Warehouse Depot
            </label>
            <SearchableSelect
              options={[
                { value: "all", label: "All Warehouses (Global Stock)" },
                ...warehouses.map((w) => ({
                  value: w._id,
                  label: `${w.name} (${w.city || "Depot"})`,
                })),
              ]}
              value={selectedWarehouse}
              onChange={(val) => setSelectedWarehouse(val || "all")}
              placeholder="Search warehouse..."
              defaultLabel="All Warehouses"
              icon={FaWarehouse}
              themeColors={themeColors}
              className="w-full"
            />
          </div>

          {/* Select Category */}
          <div>
            <label className="block text-xs font-extrabold uppercase tracking-wider mb-1.5" style={{ color: themeColors.textSecondary }}>
              Category
            </label>
            <SearchableSelect
              options={[
                { value: "all", label: "All Categories" },
                ...categories.map((c) => ({
                  value: c._id,
                  label: c.name,
                })),
              ]}
              value={selectedCategory}
              onChange={(val) => setSelectedCategory(val || "all")}
              placeholder="Filter by category..."
              defaultLabel="All Categories"
              icon={FaLayerGroup}
              themeColors={themeColors}
              className="w-full"
            />
          </div>

          {/* Select Brand */}
          <div>
            <label className="block text-xs font-extrabold uppercase tracking-wider mb-1.5" style={{ color: themeColors.textSecondary }}>
              Brand
            </label>
            <SearchableSelect
              options={[
                { value: "all", label: "All Brands" },
                ...brands.map((b) => ({
                  value: b._id,
                  label: b.name,
                })),
              ]}
              value={selectedBrand}
              onChange={(val) => setSelectedBrand(val || "all")}
              placeholder="Filter by brand..."
              defaultLabel="All Brands"
              icon={FaTag}
              themeColors={themeColors}
              className="w-full"
            />
          </div>

          {/* Location / City Filter */}
          <div>
            <label className="block text-xs font-extrabold uppercase tracking-wider mb-1.5" style={{ color: themeColors.textSecondary }}>
              Location / City
            </label>
            <SearchableSelect
              options={[
                { value: "", label: "All Warehouse Cities" },
                ...(analyticsData?.availableLocations?.cities || []).map((c) => ({
                  value: c,
                  label: c,
                })),
              ]}
              value={selectedCity}
              onChange={(val) => setSelectedCity(val || "")}
              placeholder="Select warehouse city..."
              defaultLabel="All Cities"
              icon={FaCity}
              themeColors={themeColors}
              className="w-full"
            />
          </div>
        </div>

        {/* Row 2: Date Range & Timeframe */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t" style={{ borderColor: themeColors.border }}>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold mr-1" style={{ color: themeColors.textSecondary }}>Timeframe:</span>
            {TIMEFRAMES.map((tf) => {
              const isActive = activeTimeframe === tf.id;
              return (
                <button
                  key={tf.id}
                  onClick={() => {
                    setActiveTimeframe(tf.id);
                    setFilterStartDate("");
                    setFilterEndDate("");
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                    isActive ? "shadow-sm" : "hover:bg-black/5 dark:hover:bg-white/5 opacity-80"
                  }`}
                  style={{
                    backgroundColor: isActive ? themeColors.primary : "transparent",
                    color: isActive ? "#ffffff" : themeColors.text,
                    border: `1px solid ${isActive ? themeColors.primary : themeColors.border}`
                  }}
                >
                  <tf.icon className="text-xs" />
                  {tf.label}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-400">Custom Dates:</span>
            <input
              type="date"
              value={filterStartDate}
              onChange={(e) => {
                setFilterStartDate(e.target.value);
                setActiveTimeframe("custom");
              }}
              className="p-1.5 text-xs font-bold rounded-lg border outline-none"
              style={{ backgroundColor: themeColors.background, borderColor: themeColors.border, color: themeColors.text }}
            />
            <span className="text-xs font-bold">-</span>
            <input
              type="date"
              value={filterEndDate}
              onChange={(e) => {
                setFilterEndDate(e.target.value);
                setActiveTimeframe("custom");
              }}
              className="p-1.5 text-xs font-bold rounded-lg border outline-none"
              style={{ backgroundColor: themeColors.background, borderColor: themeColors.border, color: themeColors.text }}
            />
          </div>
        </div>

        {/* Active Filters Bar */}
        {(selectedWarehouse !== "all" || selectedCategory !== "all" || selectedBrand !== "all" || selectedCity) && (
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t text-xs" style={{ borderColor: themeColors.border }}>
            <span className="font-bold text-slate-400">Active Filters:</span>
            {selectedWarehouse !== "all" && (
              <span className="px-2.5 py-0.5 rounded-lg bg-blue-500/10 text-blue-600 font-bold flex items-center gap-1">
                Warehouse: {warehouses.find(w => w._id === selectedWarehouse)?.name || selectedWarehouse}
                <FaTimes className="cursor-pointer ml-1" onClick={() => setSelectedWarehouse("all")} />
              </span>
            )}
            {selectedCategory !== "all" && (
              <span className="px-2.5 py-0.5 rounded-lg bg-purple-500/10 text-purple-600 font-bold flex items-center gap-1">
                Category: {categories.find(c => c._id === selectedCategory)?.name || selectedCategory}
                <FaTimes className="cursor-pointer ml-1" onClick={() => setSelectedCategory("all")} />
              </span>
            )}
            {selectedCity && (
              <span className="px-2.5 py-0.5 rounded-lg bg-emerald-500/10 text-emerald-600 font-bold flex items-center gap-1">
                City: {selectedCity}
                <FaTimes className="cursor-pointer ml-1" onClick={() => setSelectedCity("")} />
              </span>
            )}
            <button
              onClick={() => {
                setSelectedWarehouse("all");
                setSelectedCategory("all");
                setSelectedBrand("all");
                setSelectedCity("");
              }}
              className="text-rose-500 hover:underline font-bold ml-2 cursor-pointer"
            >
              Reset All
            </button>
          </div>
        )}
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Products (SKUs) */}
        <div
          onClick={() => handleOpenDrilldown({
            metricType: "totalProducts",
            title: "Total Registered Products (SKUs)",
            subtitle: "All active products registered in the inventory catalog"
          })}
          className="p-5 rounded-2xl border shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-md cursor-pointer group relative overflow-hidden"
          style={{ backgroundColor: themeColors.surface, borderColor: themeColors.border }}
        >
          <div className="flex justify-between items-start mb-3">
            <span className="text-xs font-bold uppercase tracking-wider" style={{ color: themeColors.textSecondary }}>
              Total Products (SKUs)
            </span>
            <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-600 group-hover:scale-110 transition-transform">
              <FaBoxes className="text-lg" />
            </div>
          </div>
          <div className="text-3xl font-black tracking-tight" style={{ color: themeColors.text }}>
            {summary.totalProducts.toLocaleString()}
          </div>
          <div className="mt-3 flex items-center justify-between text-xs font-semibold">
            <span className="text-blue-600 dark:text-blue-400 flex items-center gap-1">
              Click to drilldown <FaArrowRight className="text-[10px] group-hover:translate-x-1 transition-transform" />
            </span>
            <span className="text-slate-400">{categories.length} Categories</span>
          </div>
        </div>

        {/* Total Stock Quantity */}
        <div
          onClick={() => handleOpenDrilldown({
            metricType: "totalProducts",
            title: "Total Inventory Units",
            subtitle: "Total physical stock quantity currently present across depots"
          })}
          className="p-5 rounded-2xl border shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-md cursor-pointer group relative overflow-hidden"
          style={{ backgroundColor: themeColors.surface, borderColor: themeColors.border }}
        >
          <div className="flex justify-between items-start mb-3">
            <span className="text-xs font-bold uppercase tracking-wider" style={{ color: themeColors.textSecondary }}>
              Total Units In Stock
            </span>
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 group-hover:scale-110 transition-transform">
              <FaLayerGroup className="text-lg" />
            </div>
          </div>
          <div className="text-3xl font-black text-emerald-600 dark:text-emerald-400 tracking-tight">
            {summary.totalStockQuantity.toLocaleString()}
          </div>
          <div className="mt-3 flex items-center justify-between text-xs font-semibold">
            <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
              Healthy Stock: <span className="font-extrabold">{summary.inStockCount} items</span>
            </span>
            <span className="text-slate-400">across {summary.totalWarehouses} depots</span>
          </div>
        </div>

        {/* Total Stock Valuation (Purchase Cost) */}
        <div
          onClick={() => handleOpenDrilldown({
            metricType: "totalProducts",
            title: "Inventory Stock Valuation",
            subtitle: "Asset valuation calculated by purchase price and selling price"
          })}
          className="p-5 rounded-2xl border shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-md cursor-pointer group relative overflow-hidden"
          style={{ backgroundColor: themeColors.surface, borderColor: themeColors.border }}
        >
          <div className="flex justify-between items-start mb-3">
            <span className="text-xs font-bold uppercase tracking-wider" style={{ color: themeColors.textSecondary }}>
              Stock Valuation (Asset Value)
            </span>
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-600 group-hover:scale-110 transition-transform">
              <FaRupeeSign className="text-lg" />
            </div>
          </div>
          <div className="text-3xl font-black text-amber-600 dark:text-amber-400 tracking-tight">
            ₹{Math.round(summary.totalStockValuation).toLocaleString()}
          </div>
          <div className="mt-3 flex items-center justify-between text-xs font-semibold">
            <span className="text-slate-400">Retail Worth:</span>
            <span className="text-emerald-600 font-bold">
              ₹{Math.round(summary.totalRetailValuation).toLocaleString()}
            </span>
          </div>
        </div>

        {/* Low Stock & Out of Stock Alerts */}
        <div
          onClick={() => handleOpenDrilldown({
            metricType: "lowStock",
            title: "Low Stock Inventory Alerts",
            subtitle: "Products reaching or below re-order thresholds"
          })}
          className="p-5 rounded-2xl border shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-md cursor-pointer group relative overflow-hidden"
          style={{ backgroundColor: themeColors.surface, borderColor: themeColors.border }}
        >
          <div className="flex justify-between items-start mb-3">
            <span className="text-xs font-bold uppercase tracking-wider" style={{ color: themeColors.textSecondary }}>
              Stock Alerts & Reorders
            </span>
            <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-600 group-hover:scale-110 transition-transform">
              <FaExclamationTriangle className="text-lg" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-rose-600 dark:text-rose-400 tracking-tight">
              {summary.lowStockCount}
            </span>
            <span className="text-xs font-bold text-rose-500">Low Stock</span>
            {summary.outOfStockCount > 0 && (
              <span className="text-xs font-extrabold text-red-700 bg-red-100 dark:bg-red-950/60 px-2 py-0.5 rounded-full ml-auto">
                {summary.outOfStockCount} Out of Stock
              </span>
            )}
          </div>
          <div className="mt-3 flex items-center justify-between text-xs font-semibold text-rose-600 dark:text-rose-400">
            <span className="flex items-center gap-1">
              Click to view alerts <FaArrowRight className="text-[10px] group-hover:translate-x-1 transition-transform" />
            </span>
            <span className="text-slate-400">Urgent Purchase</span>
          </div>
        </div>
      </div>

      {/* Inflow vs Outflow Secondary Strip */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Stock Inflow (Purchases & Returns) */}
        <div
          onClick={() => handleOpenDrilldown({
            metricType: "stockIn",
            title: "Stock Inflow & Purchase Entries",
            subtitle: "Audited stock movements added to inventory in the selected timeframe"
          })}
          className="p-5 rounded-2xl border shadow-sm flex items-center justify-between transition-all hover:shadow-md cursor-pointer group"
          style={{ backgroundColor: themeColors.surface, borderColor: themeColors.border }}
        >
          <div className="space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
              <FaArrowDown className="text-xs" /> Total Stock Inflow (Added)
            </span>
            <div className="text-2xl font-black text-emerald-700 dark:text-emerald-300">
              +{summary.stockInQuantity.toLocaleString()} Units
            </div>
            <p className="text-xs text-slate-500">
              Total Purchase Value: <span className="font-bold text-slate-800 dark:text-slate-200">₹{Math.round(summary.stockInValue).toLocaleString()}</span>
            </p>
          </div>
          <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-600 group-hover:scale-110 transition-transform">
            <FaBoxes className="text-xl" />
          </div>
        </div>

        {/* Stock Outflow (Sales & Dispatches) */}
        <div
          onClick={() => handleOpenDrilldown({
            metricType: "stockOut",
            title: "Stock Outflow & Dispatches",
            subtitle: "Audited stock dispatches and installation deliveries in the selected timeframe"
          })}
          className="p-5 rounded-2xl border shadow-sm flex items-center justify-between transition-all hover:shadow-md cursor-pointer group"
          style={{ backgroundColor: themeColors.surface, borderColor: themeColors.border }}
        >
          <div className="space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
              <FaArrowUp className="text-xs" /> Total Stock Outflow (Dispatched)
            </span>
            <div className="text-2xl font-black text-rose-700 dark:text-rose-300">
              -{summary.stockOutQuantity.toLocaleString()} Units
            </div>
            <p className="text-xs text-slate-500">
              Total Dispatched Cost: <span className="font-bold text-slate-800 dark:text-slate-200">₹{Math.round(summary.stockOutValue).toLocaleString()}</span>
            </p>
          </div>
          <div className="p-3 rounded-2xl bg-rose-500/10 text-rose-600 group-hover:scale-110 transition-transform">
            <FaWarehouse className="text-xl" />
          </div>
        </div>
      </div>

      {/* Visual Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Breakdown (Donut Chart) */}
        <div className="p-5 rounded-2xl border shadow-sm" style={{ backgroundColor: themeColors.surface, borderColor: themeColors.border }}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-extrabold flex items-center gap-2" style={{ color: themeColors.text }}>
                <FaChartPie className="text-purple-500" /> Stock by Category
              </h2>
              <p className="text-xs" style={{ color: themeColors.textSecondary }}>
                Click any slice to drill down into products in that category
              </p>
            </div>
          </div>

          {categoryPieOptions ? (
            <HighchartsReact highcharts={Highcharts} options={categoryPieOptions} />
          ) : (
            <div className="py-24 text-center text-xs italic" style={{ color: themeColors.textSecondary }}>
              No category data found for this selection.
            </div>
          )}
        </div>

        {/* Daily Movement Trend (7 Days) */}
        <div className="p-5 rounded-2xl border shadow-sm" style={{ backgroundColor: themeColors.surface, borderColor: themeColors.border }}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-extrabold flex items-center gap-2" style={{ color: themeColors.text }}>
                <FaChartBar className="text-emerald-500" /> Stock Inflow vs Outflow Trend (7 Days)
              </h2>
              <p className="text-xs" style={{ color: themeColors.textSecondary }}>
                Daily stock in (purchases/returns) vs stock out (sales/deliveries)
              </p>
            </div>
          </div>

          {movementTrendOptions ? (
            <HighchartsReact highcharts={Highcharts} options={movementTrendOptions} />
          ) : (
            <div className="py-24 text-center text-xs italic" style={{ color: themeColors.textSecondary }}>
              No movement activity recorded in this period.
            </div>
          )}
        </div>
      </div>

      {/* Warehouse Depots Stock Distribution Bar Chart */}
      {warehouseBarOptions && (
        <div className="p-5 rounded-2xl border shadow-sm" style={{ backgroundColor: themeColors.surface, borderColor: themeColors.border }}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-extrabold flex items-center gap-2" style={{ color: themeColors.text }}>
                <FaWarehouse className="text-blue-500" /> Warehouse Inventory Depots & Stored Units
              </h2>
              <p className="text-xs" style={{ color: themeColors.textSecondary }}>
                Click any warehouse bar to filter report and drilldown directly by that storage depot
              </p>
            </div>
          </div>
          <HighchartsReact highcharts={Highcharts} options={warehouseBarOptions} />
        </div>
      )}

      {/* Warehouse Inventory Directory Table */}
      <div className="p-5 rounded-2xl border shadow-sm space-y-4" style={{ backgroundColor: themeColors.surface, borderColor: themeColors.border }}>
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
          <div>
            <h2 className="text-lg font-black flex items-center gap-2" style={{ color: themeColors.text }}>
              <FaWarehouse className="text-amber-500" /> Warehouse Depots Breakdown & Valuation
            </h2>
            <p className="text-xs font-medium" style={{ color: themeColors.textSecondary }}>
              Comprehensive inventory status, manager in-charge, and valuation for each warehouse location.
            </p>
          </div>
          <span className="text-xs font-bold px-3 py-1 rounded-full bg-blue-500/10 text-blue-600 self-start sm:self-auto">
            {analyticsData?.warehouseBreakdown?.length || 0} Depots Listed
          </span>
        </div>

        <div className="overflow-x-auto rounded-xl border" style={{ borderColor: themeColors.border }}>
          <table className="w-full text-left text-xs whitespace-nowrap">
            <thead style={{ backgroundColor: themeColors.background, color: themeColors.textSecondary }}>
              <tr className="border-b" style={{ borderColor: themeColors.border }}>
                <th className="px-4 py-3.5 font-extrabold">Warehouse & Code</th>
                <th className="px-4 py-3.5 font-extrabold">City / Location</th>
                <th className="px-4 py-3.5 font-extrabold">Manager</th>
                <th className="px-4 py-3.5 font-extrabold text-center">Products Stored</th>
                <th className="px-4 py-3.5 font-extrabold text-center">Total Stock Units</th>
                <th className="px-4 py-3.5 font-extrabold text-right">Inventory Valuation</th>
                <th className="px-4 py-3.5 font-extrabold text-center">Stock Health</th>
                <th className="px-4 py-3.5 font-extrabold text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {analyticsData?.warehouseBreakdown?.length ? (
                analyticsData.warehouseBreakdown.map((wh, idx) => (
                  <tr
                    key={wh._id || idx}
                    className="hover:bg-black/5 dark:hover:bg-white/5 transition-colors border-b last:border-b-0"
                    style={{ borderColor: themeColors.border }}
                  >
                    <td className="px-4 py-3.5 font-medium">
                      <div className="flex items-center gap-2.5">
                        <div className="p-2 rounded-lg bg-blue-500/10 text-blue-600">
                          <FaWarehouse className="text-xs" />
                        </div>
                        <div>
                          <div className="font-bold" style={{ color: themeColors.text }}>{wh.name}</div>
                          <div className="text-[11px] font-mono text-slate-400">{wh.code || "WH-MAIN"}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 font-medium" style={{ color: themeColors.textSecondary }}>
                      <div className="flex items-center gap-1 font-bold">
                        <FaMapMarkerAlt className="text-rose-500 text-[10px]" />
                        <span>{wh.city}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 font-medium" style={{ color: themeColors.text }}>
                      {wh.managerName || "Store Head"}
                    </td>
                    <td className="px-4 py-3.5 text-center font-bold text-blue-600 dark:text-blue-400">
                      {wh.totalProducts}
                    </td>
                    <td className="px-4 py-3.5 text-center font-black text-emerald-600 dark:text-emerald-400">
                      {wh.totalStock.toLocaleString()}
                    </td>
                    <td className="px-4 py-3.5 text-right font-black text-amber-600 dark:text-amber-400">
                      ₹{Math.round(wh.totalValuation).toLocaleString()}
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      {wh.lowStockCount > 0 ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500/10 text-amber-600">
                          {wh.lowStockCount} low stock
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/10 text-emerald-600">
                          Optimal
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <button
                        onClick={() => handleOpenDrilldown({
                          metricType: "totalProducts",
                          targetWarehouse: wh._id,
                          title: `${wh.name} Stock Directory`,
                          subtitle: `All products stored in ${wh.city} depot`
                        })}
                        className="px-3 py-1.5 rounded-lg text-xs font-bold text-white transition shadow-sm hover:opacity-90 cursor-pointer flex items-center gap-1 mx-auto"
                        style={{ backgroundColor: themeColors.primary }}
                      >
                        <FaEye className="text-[10px]" /> View Stock
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-xs italic" style={{ color: themeColors.textSecondary }}>
                    No warehouses configured in the system.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* DRILLDOWN MODAL */}
      {drilldownOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-3 md:p-6 animate-fade-in">
          <div
            className="w-full max-w-6xl max-h-[92vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden border"
            style={{ backgroundColor: themeColors.surface, borderColor: themeColors.border }}
          >
            {/* Header */}
            <div className="p-5 border-b flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3" style={{ borderColor: themeColors.border }}>
              <div>
                <div className="flex items-center gap-2">
                  <span className="p-2 rounded-xl bg-amber-500/10 text-amber-600">
                    <FaBoxes className="text-base" />
                  </span>
                  <h2 className="text-xl font-black tracking-tight" style={{ color: themeColors.text }}>
                    {drilldownTitle}
                  </h2>
                </div>
                {drilldownSubtitle && (
                  <p className="text-xs font-medium mt-0.5" style={{ color: themeColors.textSecondary }}>
                    {drilldownSubtitle}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <button
                  onClick={handleExportDrilldownCSV}
                  disabled={!filteredDrilldownItems.length}
                  className="px-3.5 py-2 rounded-xl text-xs font-bold text-emerald-700 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <FaDownload /> Export CSV ({filteredDrilldownItems.length})
                </button>
                <button
                  onClick={() => setDrilldownOpen(false)}
                  className="p-2.5 rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition cursor-pointer"
                  style={{ color: themeColors.textSecondary }}
                >
                  <FaTimes className="text-base" />
                </button>
              </div>
            </div>

            {/* Filter Bar */}
            <div className="p-4 border-b flex flex-col sm:flex-row gap-3 bg-black/5 dark:bg-white/5" style={{ borderColor: themeColors.border }}>
              <div className="relative flex-1">
                <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs" />
                <input
                  type="text"
                  placeholder="Search by SKU, product name, category, warehouse..."
                  value={drilldownSearch}
                  onChange={(e) => setDrilldownSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border outline-none font-medium"
                  style={{ backgroundColor: themeColors.background, borderColor: themeColors.border, color: themeColors.text }}
                />
              </div>

              {drilldownType === "product" && (
                <select
                  value={drilldownStockStatusFilter}
                  onChange={(e) => setDrilldownStockStatusFilter(e.target.value)}
                  className="px-3 py-2 text-xs font-bold rounded-xl border outline-none cursor-pointer"
                  style={{ backgroundColor: themeColors.background, borderColor: themeColors.border, color: themeColors.text }}
                >
                  <option value="">All Stock Levels ({drilldownData.length})</option>
                  <option value="inStock">Healthy / In Stock</option>
                  <option value="lowStock">Low Stock Alert</option>
                  <option value="outOfStock">Out of Stock (Zero)</option>
                </select>
              )}
            </div>

            {/* Content Table */}
            <div className="p-4 overflow-y-auto flex-1 custom-scrollbar">
              {drilldownLoading ? (
                <div className="py-24 flex flex-col items-center justify-center">
                  <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2" style={{ borderColor: themeColors.primary }}></div>
                  <p className="mt-4 text-xs font-bold" style={{ color: themeColors.textSecondary }}>
                    Loading inventory data...
                  </p>
                </div>
              ) : filteredDrilldownItems.length === 0 ? (
                <div className="py-24 text-center text-xs italic" style={{ color: themeColors.textSecondary }}>
                  No inventory items found matching current drilldown criteria.
                </div>
              ) : drilldownType === "movement" ? (
                /* Stock Movements Table */
                <div className="overflow-x-auto rounded-xl border" style={{ borderColor: themeColors.border }}>
                  <table className="w-full text-left text-xs whitespace-nowrap">
                    <thead style={{ backgroundColor: themeColors.background, color: themeColors.textSecondary }}>
                      <tr className="border-b" style={{ borderColor: themeColors.border }}>
                        <th className="px-4 py-3 font-extrabold">Date & Time</th>
                        <th className="px-4 py-3 font-extrabold">Type</th>
                        <th className="px-4 py-3 font-extrabold">Product</th>
                        <th className="px-4 py-3 font-extrabold">Warehouse</th>
                        <th className="px-4 py-3 font-extrabold text-center">Quantity</th>
                        <th className="px-4 py-3 font-extrabold text-right">Unit Price</th>
                        <th className="px-4 py-3 font-extrabold text-right">Total Price</th>
                        <th className="px-4 py-3 font-extrabold">Ref / Invoice</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredDrilldownItems.map((m, idx) => {
                        const isIn = ["stock_in", "purchase", "opening_stock"].includes(m.transactionType);
                        return (
                          <tr key={m._id || idx} className="hover:bg-black/5 dark:hover:bg-white/5 border-b last:border-b-0" style={{ borderColor: themeColors.border }}>
                            <td className="px-4 py-3 font-medium" style={{ color: themeColors.textSecondary }}>
                              {new Date(m.createdAt).toLocaleString()}
                            </td>
                            <td className="px-4 py-3">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                                isIn ? "bg-emerald-500/10 text-emerald-600" : "bg-rose-500/10 text-rose-600"
                              }`}>
                                {m.transactionType?.replace("_", " ")}
                              </span>
                            </td>
                            <td className="px-4 py-3 font-bold" style={{ color: themeColors.text }}>
                              {m.product?.name || "Product"}
                              <span className="text-[11px] text-slate-400 font-mono ml-1">({m.product?.sku})</span>
                            </td>
                            <td className="px-4 py-3 font-medium" style={{ color: themeColors.textSecondary }}>
                              {m.warehouse?.name} {m.warehouse?.city ? `(${m.warehouse.city})` : ''}
                            </td>
                            <td className={`px-4 py-3 text-center font-black ${isIn ? "text-emerald-600" : "text-rose-600"}`}>
                              {isIn ? "+" : "-"}{Math.abs(m.quantity || 0)}
                            </td>
                            <td className="px-4 py-3 text-right font-medium">₹{m.unitPrice || 0}</td>
                            <td className="px-4 py-3 text-right font-bold">₹{m.totalPrice || 0}</td>
                            <td className="px-4 py-3 font-mono text-slate-400">{m.referenceNo || m.invoiceNumber || "-"}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                /* Products Inventory Table */
                <div className="overflow-x-auto rounded-xl border" style={{ borderColor: themeColors.border }}>
                  <table className="w-full text-left text-xs whitespace-nowrap">
                    <thead style={{ backgroundColor: themeColors.background, color: themeColors.textSecondary }}>
                      <tr className="border-b" style={{ borderColor: themeColors.border }}>
                        <th className="px-4 py-3 font-extrabold">SKU & Product Name</th>
                        <th className="px-4 py-3 font-extrabold">Category & Brand</th>
                        <th className="px-4 py-3 font-extrabold text-center">Available Stock</th>
                        <th className="px-4 py-3 font-extrabold text-center">Min Level</th>
                        <th className="px-4 py-3 font-extrabold text-center">Stock Status</th>
                        <th className="px-4 py-3 font-extrabold text-right">Purchase Cost</th>
                        <th className="px-4 py-3 font-extrabold text-right">Selling Price</th>
                        <th className="px-4 py-3 font-extrabold text-right">Valuation</th>
                        <th className="px-4 py-3 font-extrabold text-center">Audit Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredDrilldownItems.map((p, idx) => {
                        const stock = p.currentStock || 0;
                        const min = p.minStockLevel || 5;
                        const isOut = stock <= 0;
                        const isLow = stock > 0 && stock <= min;

                        return (
                          <tr key={p._id || idx} className="hover:bg-black/5 dark:hover:bg-white/5 border-b last:border-b-0" style={{ borderColor: themeColors.border }}>
                            <td className="px-4 py-3">
                              <div className="font-bold text-slate-900 dark:text-slate-100">{p.name}</div>
                              <div className="text-[11px] font-mono text-blue-600 dark:text-blue-400 font-bold mt-0.5">
                                SKU: {p.sku}
                              </div>
                            </td>

                            <td className="px-4 py-3 font-medium" style={{ color: themeColors.textSecondary }}>
                              <div className="font-semibold text-slate-800 dark:text-slate-200">{p.category?.name || "Uncategorized"}</div>
                              <div className="text-[11px] text-slate-400">{p.brand?.name || "Brand"}</div>
                            </td>

                            <td className="px-4 py-3 text-center font-black text-sm" style={{ color: themeColors.text }}>
                              {stock} <span className="text-[10px] font-normal text-slate-400">{p.unit?.shortName || "pcs"}</span>
                            </td>

                            <td className="px-4 py-3 text-center font-medium text-slate-400">
                              {min}
                            </td>

                            <td className="px-4 py-3 text-center">
                              {isOut ? (
                                <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-400">
                                  Out of Stock
                                </span>
                              ) : isLow ? (
                                <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400">
                                  Low Stock ({stock})
                                </span>
                              ) : (
                                <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400">
                                  In Stock
                                </span>
                              )}
                            </td>

                            <td className="px-4 py-3 text-right font-medium">₹{p.purchasePrice || 0}</td>
                            <td className="px-4 py-3 text-right font-medium text-emerald-600">₹{p.sellingPrice || 0}</td>
                            <td className="px-4 py-3 text-right font-black text-amber-600 dark:text-amber-400">
                              ₹{Math.round(stock * (p.purchasePrice || 0)).toLocaleString()}
                            </td>

                            <td className="px-4 py-3 text-center">
                              <button
                                onClick={() => handleOpenProductLedger(p)}
                                className="px-2.5 py-1 rounded-lg text-xs font-bold text-blue-600 bg-blue-500/10 hover:bg-blue-500/20 transition cursor-pointer flex items-center gap-1 mx-auto"
                                title="View Movement Ledger"
                              >
                                <FaHistory className="text-[10px]" /> Ledger
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t flex flex-col sm:flex-row justify-between items-center gap-2 bg-black/5 dark:bg-white/5" style={{ borderColor: themeColors.border }}>
              <span className="text-xs font-bold" style={{ color: themeColors.textSecondary }}>
                Showing {filteredDrilldownItems.length} records in drilldown
              </span>
              <button
                onClick={() => setDrilldownOpen(false)}
                className="px-6 py-2 rounded-xl text-xs font-bold text-white transition shadow-sm hover:opacity-90 cursor-pointer"
                style={{ backgroundColor: themeColors.primary }}
              >
                Close Drilldown
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PRODUCT MOVEMENT LEDGER MODAL */}
      {ledgerModalOpen && selectedProductForLedger && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div
            className="w-full max-w-3xl max-h-[85vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden border"
            style={{ backgroundColor: themeColors.surface, borderColor: themeColors.border }}
          >
            {/* Header */}
            <div className="p-5 border-b flex justify-between items-center" style={{ borderColor: themeColors.border }}>
              <div>
                <h3 className="text-lg font-black" style={{ color: themeColors.text }}>
                  {selectedProductForLedger.name} — Stock Ledger
                </h3>
                <p className="text-xs font-medium" style={{ color: themeColors.textSecondary }}>
                  SKU: {selectedProductForLedger.sku} • Current Stock: {selectedProductForLedger.currentStock} {selectedProductForLedger.unit?.shortName || 'pcs'}
                </p>
              </div>
              <button
                onClick={() => setLedgerModalOpen(false)}
                className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition cursor-pointer"
                style={{ color: themeColors.textSecondary }}
              >
                <FaTimes />
              </button>
            </div>

            {/* Movements List */}
            <div className="p-6 overflow-y-auto flex-1 custom-scrollbar space-y-3">
              {ledgerLoading ? (
                <div className="py-20 flex flex-col items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2" style={{ borderColor: themeColors.primary }}></div>
                  <p className="mt-3 text-xs font-bold text-slate-400">Loading movement ledger...</p>
                </div>
              ) : productLedgerMovements.length > 0 ? (
                <div className="space-y-2.5">
                  {productLedgerMovements.map((m, idx) => {
                    const isIn = ["stock_in", "purchase", "opening_stock"].includes(m.transactionType);
                    return (
                      <div
                        key={m._id || idx}
                        className="p-3.5 rounded-xl border flex items-center justify-between gap-4 bg-black/5 dark:bg-white/5"
                        style={{ borderColor: themeColors.border }}
                      >
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase ${
                              isIn ? "bg-emerald-500/10 text-emerald-600" : "bg-rose-500/10 text-rose-600"
                            }`}>
                              {m.transactionType?.replace("_", " ")}
                            </span>
                            <span className="text-xs font-bold" style={{ color: themeColors.text }}>
                              {m.warehouse?.name || "Main Warehouse"} {m.warehouse?.city ? `(${m.warehouse.city})` : ''}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-400">
                            {new Date(m.createdAt).toLocaleString()} {m.referenceNo ? `• Ref: ${m.referenceNo}` : ''}
                          </div>
                        </div>

                        <div className="text-right">
                          <div className={`text-base font-black ${isIn ? "text-emerald-600" : "text-rose-600"}`}>
                            {isIn ? "+" : "-"}{Math.abs(m.quantity || 0)} {selectedProductForLedger.unit?.shortName || 'pcs'}
                          </div>
                          {m.totalPrice > 0 && (
                            <div className="text-[11px] font-semibold text-slate-400">
                              ₹{m.totalPrice.toLocaleString()}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="py-16 text-center text-xs italic text-slate-400">
                  No stock transactions or movement logs recorded for this product yet.
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t flex justify-end" style={{ borderColor: themeColors.border }}>
              <button
                onClick={() => setLedgerModalOpen(false)}
                className="px-5 py-2 rounded-xl text-xs font-bold text-white transition hover:opacity-90 cursor-pointer"
                style={{ backgroundColor: themeColors.primary }}
              >
                Close Ledger
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default memo(StockReports);
