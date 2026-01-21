import React, { useState } from "react";
import { useRef } from "react";

export default function Collapsible({ title, color, children }) {
  const [open, setOpen] = useState(false);

  const ref = useRef(null);

  return (
    <div className="w-fullpl-4 pt-3">
      {/* Header */}
      <div onClick={() => setOpen(!open)} className="">
        <h2 className="text-xl font-bold mb-2">
          <span className={color}>{title}</span>
          <span className={color}> {`${open ? "🗁" : "🗀"}`}</span>
        </h2>
      </div>

      {/* Content wrapper that collapses */}
      <div
        style={{
          maxHeight: open ? ref.current?.scrollHeight : 0,
        }}
        className="overflow-hidden transition-all duration-300"
      >
        <div ref={ref} className="pt-2">{children}</div>
      </div>
    </div>
  );
}
