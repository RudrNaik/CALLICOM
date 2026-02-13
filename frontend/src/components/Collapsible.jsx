import React, { useState, useRef, useEffect } from "react";

export default function Collapsible({ title, color, children, autoOpen, headerSize }) {
  const [open, setOpen] = useState(false);
  const [height, setHeight] = useState(0);
  const ref = useRef(null);

  useEffect(() => {
    if (!ref.current) return;

    const resizeObserver = new ResizeObserver(() => {
      setHeight(ref.current?.scrollHeight || 0);
    });

    resizeObserver.observe(ref.current);

    if(autoOpen){
      setOpen(true);
    }

    return () => resizeObserver.disconnect();
  }, []);

  return (
    <div className="w-full pt-3">
      {/* Header */}
      <div onClick={() => setOpen(!open)} className="cursor-pointer">
        <h2 className={`text-${headerSize} font-bold mb-2 border-${color}`}>
          <span className={`text-${color}`}>{title}</span>
          <span className={`text-${color}`}> {`${open ? "🗁" : "🗀"}`}</span>
        </h2>
      </div>

      {/* Content wrapper */}
      <div
        style={{
          maxHeight: open ? height : 0,
        }}
        className="overflow-hidden transition-all duration-300"
      >
        <div ref={ref} className="pt-2 pb-3">
          {children}
        </div>
      </div>

      <div className="relative flexitems-center">
        <div className="flex-grow border-t border-gray-100/10"></div>
      </div>
    </div>
  );
}