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
  className = "w-full md:w-56",
  direction = "down",
  dark = false,
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
    (opt.label || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelect = (val) => {
    onChange(val);
    setIsOpen(false);
  };

  const isUp = direction === "up";

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between pl-9 pr-3 py-2 rounded-xl border text-xs transition-all focus:outline-none text-left cursor-pointer ${
          dark
            ? "bg-slate-800 border-slate-600 text-white hover:border-slate-500"
            : "bg-white border-gray-200 text-gray-900 hover:border-blue-400"
        }`}
        style={
          !dark && Object.keys(themeColors).length > 0
            ? {
                backgroundColor: themeColors.background || "#fff",
                borderColor: themeColors.border || "#e5e7eb",
                color: themeColors.text || "#111827",
              }
            : undefined
        }
      >
        {Icon && (
          <Icon
            className={`absolute left-3 top-1/2 transform -translate-y-1/2 z-10 text-xs pointer-events-none ${
              dark ? "text-blue-400" : "text-gray-400"
            }`}
            style={
              !dark && themeColors.textSecondary
                ? { color: themeColors.textSecondary }
                : undefined
            }
          />
        )}
        <span className="truncate pr-2 font-semibold">{displayLabel}</span>
        <FaChevronDown
          className={`text-[10px] transition-transform duration-200 shrink-0 ${
            isOpen ? "rotate-180" : ""
          } ${dark ? "text-slate-400" : "text-gray-400"}`}
          style={
            !dark && themeColors.textSecondary
              ? { color: themeColors.textSecondary }
              : undefined
          }
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          className={`absolute left-0 ${
            isUp ? "bottom-full mb-1.5" : "top-full mt-1.5"
          } w-full min-w-[240px] rounded-xl shadow-2xl border z-50 overflow-hidden ${
            dark
              ? "bg-slate-900 border-slate-700 text-white"
              : "bg-white border-gray-200 text-gray-900"
          }`}
          style={
            !dark && Object.keys(themeColors).length > 0
              ? {
                  backgroundColor: themeColors.surface || "#ffffff",
                  borderColor: themeColors.border || "#e5e7eb",
                }
              : undefined
          }
        >
          {/* Search Bar Input inside Dropdown */}
          <div
            className={`p-2 border-b relative ${
              dark ? "border-slate-800 bg-slate-900" : "border-gray-100 bg-gray-50/50"
            }`}
          >
            <FaSearch
              className={`absolute left-4 top-1/2 transform -translate-y-1/2 text-[10px] ${
                dark ? "text-slate-400" : "text-gray-400"
              }`}
            />
            <input
              ref={searchInputRef}
              type="text"
              placeholder={placeholder}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full pl-7 pr-6 py-1.5 text-xs rounded-lg border focus:outline-none transition-all ${
                dark
                  ? "bg-slate-800 border-slate-700 text-white placeholder-slate-400 focus:border-blue-500"
                  : "bg-white border-gray-200 text-gray-900 placeholder-gray-400 focus:border-blue-500"
              }`}
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm("")}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-[10px] text-gray-400 hover:text-gray-200"
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
                    className={`w-full flex items-center justify-between px-3 py-2 text-left transition-colors cursor-pointer ${
                      dark
                        ? isSelected
                          ? "bg-blue-600/30 text-blue-300 font-bold"
                          : "hover:bg-slate-800 text-slate-200"
                        : isSelected
                        ? "bg-blue-50 text-blue-600 font-bold"
                        : "hover:bg-gray-50 text-gray-700"
                    }`}
                  >
                    <span className="truncate">{opt.label}</span>
                    {isSelected && (
                      <FaCheck
                        className={`text-xs shrink-0 ml-2 ${
                          dark ? "text-blue-400" : "text-blue-600"
                        }`}
                      />
                    )}
                  </button>
                );
              })
            ) : (
              <div
                className={`px-3 py-3 text-center text-xs italic ${
                  dark ? "text-slate-400" : "text-gray-400"
                }`}
              >
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
