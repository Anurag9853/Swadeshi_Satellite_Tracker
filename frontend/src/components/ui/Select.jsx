import { useState, useRef, useEffect } from "react";
import { HiChevronDown } from "react-icons/hi";
import { motion, AnimatePresence } from "framer-motion";
import { createPortal } from "react-dom";

const Select = ({
  value,
  onChange,
  options = [],
  className = "",
  placeholder = "Select...",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const selectRef = useRef(null);

  // Dropdown absolute coordinates (for portal)
  const [dropdownPos, setDropdownPos] = useState({
    top: 0,
    left: 0,
    width: 0,
  });

  //
  // CLOSE DROPDOWN WHEN CLICKING OUTSIDE
  //
  useEffect(() => {
    const handleClickOutside = (event) => {
      // If click OUTSIDE select button AND outside dropdown → close
      if (
        selectRef.current &&
        !selectRef.current.contains(event.target) &&
        !event.target.closest(".select-portal-dropdown")
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () =>
      document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  //
  // GET POSITION OF SELECT TO PLACE DROPDOWN
  //
  useEffect(() => {
    if (isOpen && selectRef.current) {
      const rect = selectRef.current.getBoundingClientRect();
      setDropdownPos({
        top: rect.bottom + window.scrollY,
        left: rect.left + window.scrollX,
        width: rect.width,
      });
    }
  }, [isOpen]);

  const isDisabled = !options || options.length === 0;

  const selectedOption = options.find(
    (opt) => String(opt.value) === String(value)
  );

  const displayValue = selectedOption
    ? selectedOption.label
    : placeholder;

  return (
    <>
      {/* Select Button */}
      <div ref={selectRef} className={`relative z-[9999] ${className}`}>
        <button
          type="button"
          onClick={() => {
            if (!isDisabled) {
              setIsOpen((prev) => !prev);
            }
          }}
          disabled={isDisabled}
          className={`w-full bg-white/5 border border-white/10 backdrop-blur-xl 
                     rounded-xl px-4 py-2 text-white flex items-center 
                     justify-between hover:bg-white/10 transition ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <span className="truncate">{displayValue}</span>
          <HiChevronDown
            className={`h-5 w-5 transition-transform ${
              isOpen ? "rotate-180" : ""
            }`}
          />
        </button>
      </div>

      {/* DROPDOWN - PORTALED OUTSIDE MAP */}
      {isOpen &&
        createPortal(
          <AnimatePresence>
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.15 }}
              style={{
                position: "absolute",
                top: dropdownPos.top,
                left: dropdownPos.left,
                width: dropdownPos.width,
                zIndex: 999999,
              }}
              className="select-portal-dropdown bg-slate-900 border border-white/10 
                         rounded-xl shadow-xl max-h-60 overflow-y-auto
                         backdrop-blur-xl"

              // IMPORTANT — prevent closing before click registers
              onMouseDown={(e) => e.stopPropagation()}
              onClick={(e) => e.stopPropagation()}
            >
              {options.length === 0 && (
                <div className="px-4 py-3 text-slate-400 text-sm">
                  No options available
                </div>
              )}

              {options.map((opt) => {
                const isSelected =
                  String(opt.value) === String(value);

                return (
                  <button
                    key={opt.value}
                    onClick={() => {
                      onChange(opt.value); // ← updates parent state
                      setIsOpen(false); // close dropdown
                    }}
                    className={`w-full text-left px-4 py-2.5 text-sm transition 
                      ${
                        isSelected
                          ? "bg-purple-500/20 text-purple-300"
                          : "text-slate-300 hover:bg-white/10 hover:text-white"
                      }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </motion.div>
          </AnimatePresence>,
          document.body
        )}
    </>
  );
};

export default Select;
