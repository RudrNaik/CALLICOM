import React, { useState } from "react";

export default function Collapsible({ title, children }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="w-fullpl-4 pt-3">
      {/* Header */}
      <div onClick={() => setOpen(!open)} className="">
        <h2 className="text-xl font-bold mb-2">
          <span className="text-neutral-400">{title}</span>
          <span className="text-neutral-400"> {`${open ? "🗁" : "🗀"}`}</span>
        </h2>
      </div>

      {/* Content wrapper that collapses */}
      <div
        className={`overflow-hidden transition-[max-height] duration-200 ${
          open ? "max-h-[2000px]" : "max-h-0"
        }`}
      >
        <div className="pt-2">{children}</div>
      </div>
    </div>
  );
}
