import { useState, useRef, useEffect } from "react";
import { FaSearch, FaChevronDown, FaTimes, FaCheck } from "react-icons/fa";

const SearchableSelect = ({
  options = [],
  value = "",
  onChange,
  placeholder = "Search by name...",
  defaultLabel = "Select Option",
  icon: Icon = null,
  themeColors = {},
  className = "w-full md:w-56"
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const containerRef = useRef(null);
  const searchInputRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
    if (!isOpen) {
      setSearchTerm("");
    }
  }, [isOpen]);

  const selectedOption = options.find((opt) => String(opt.value) === String(value));
  const displayLabel = selectedOption ? selectedOption.label : defaultLabel;

  const filteredOptions = options.filter((opt) =>
    opt.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelect = (val) => {
    onChange(val);
    setIsOpen(false);
  };

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between pl-10 pr-4 py-2.5 rounded-lg border text-sm transition-all focus:outline-none focus:ring-1 text-left cursor-pointer"
        style={{
          backgroundColor: themeColors.background || "#fff",
          borderColor: themeColors.border || "#e5e7eb",
          color: themeColors.text || "#111827",
        }}
      >
        {Icon && (
          <Icon
            className="absolute left-3 top-1/2 transform -translate-y-1/2 z-10 text-sm pointer-events-none"
            style={{ color: themeColors.textSecondary || "#6b7280" }}
          />
        )}
        <span className="truncate pr-2 font-medium">{displayLabel}</span>
        <FaChevronDown
          className={`text-xs transition-transform duration-200 shrink-0 ${isOpen ? "rotate-180" : ""}`}
          style={{ color: themeColors.textSecondary || "#6b7280" }}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          className="absolute left-0 top-full mt-1.5 w-full min-w-[220px] rounded-xl shadow-xl border z-50 overflow-hidden"
          style={{
            backgroundColor: themeColors.surface || "#ffffff",
            borderColor: themeColors.border || "#e5e7eb",
          }}
        >
          {/* Search Bar Input inside Dropdown */}
          <div className="p-2 border-b relative" style={{ borderColor: themeColors.border || "#e5e7eb" }}>
            <FaSearch
              className="absolute left-4 top-1/2 transform -translate-y-1/2 text-xs"
              style={{ color: themeColors.textSecondary || "#9ca3af" }}
            />
            <input
              ref={searchInputRef}
              type="text"
              placeholder={placeholder}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-7 py-1.5 text-xs rounded-md border focus:outline-none focus:ring-1"
              style={{
                backgroundColor: themeColors.background || "#f9fafb",
                borderColor: themeColors.border || "#d1d5db",
                color: themeColors.text || "#111827",
              }}
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm("")}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-xs hover:opacity-75"
                style={{ color: themeColors.textSecondary }}
              >
                <FaTimes />
              </button>
            )}
          </div>

          {/* Options List */}
          <div className="max-h-60 overflow-y-auto py-1 text-xs">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((opt) => {
                const isSelected = String(opt.value) === String(value);
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => handleSelect(opt.value)}
                    className="w-full flex items-center justify-between px-3 py-2 text-left transition-colors hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer"
                    style={{
                      backgroundColor: isSelected ? `${themeColors.primary || '#3b82f6'}15` : "transparent",
                      color: isSelected ? themeColors.primary || "#3b82f6" : themeColors.text || "#111827",
                      fontWeight: isSelected ? "600" : "400",
                    }}
                  >
                    <span className="truncate">{opt.label}</span>
                    {isSelected && <FaCheck className="text-xs shrink-0 ml-2" />}
                  </button>
                );
              })
            ) : (
              <div className="px-3 py-3 text-center text-xs italic" style={{ color: themeColors.textSecondary }}>
                No members found
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchableSelect;
