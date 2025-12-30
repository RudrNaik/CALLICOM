import React, { useState } from "react";

export default function Collapsible({ title, children }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="w-full">
      {/* Header */}
      <div onClick={() => setOpen(!open)} className="">
        <h2 className="text-xl font-bold text-orange-400 mb-2">
          {title}
          <span
            className={`transition-transform duration-200 ${
              open ? "rotate-180" : "rotate-0"
            }`}
          >
            {" "} ▼
          </span>
        </h2>
      </div>

      {/* Content wrapper that collapses */}
      <div
        className={`overflow-hidden transition-[max-height] duration-300 ${
          open ? "max-h-[2000px]" : "max-h-0"
        }`}
      >
        <div className="pt-2">{children}</div>
      </div>
    </div>
  );
}
