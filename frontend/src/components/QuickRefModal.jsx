import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

import ActionEconomy from "./QuickRef/MiniActionEconView";

const getLockCount = () => window.__scrollLockCount ?? 0;
const setLockCount = (n) => (window.__scrollLockCount = n);

export default function QuickRefModal({ open, onClose }) {
  const [tab, setTab] = useState("actions");
  const lockedByMe = useRef(false);
  const prevOverflow = useRef("");

  // Scroll lock tied to `open`
  useEffect(() => {
    if (open) {
      // only set once per open
      if (!lockedByMe.current) {
        prevOverflow.current = document.body.style.overflow; // inline style only
        if (getLockCount() === 0) {
          document.body.style.overflow = "hidden";
        }
        setLockCount(getLockCount() + 1);
        lockedByMe.current = true;
      }
    } else if (lockedByMe.current) {
      // release lock when closing
      setLockCount(Math.max(0, getLockCount() - 1));
      if (getLockCount() === 0) {
        // restore to previous inline value
        document.body.style.overflow = prevOverflow.current || "";
      }
      lockedByMe.current = false;
    }
    // release on unmount
    return () => {
      if (lockedByMe.current) {
        setLockCount(Math.max(0, getLockCount() - 1));
        if (getLockCount() === 0) {
          document.body.style.overflow = prevOverflow.current || "";
        }
        lockedByMe.current = false;
      }
    };
  }, [open]);

  // Close on Esc only while open
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] bg-black/30"
          onClick={onClose}
          aria-modal="true"
          role="dialog"
        >
          <div
            className="absolute left-1/2 top-1/2 w-[min(64rem,95vw)] 
             min-h-[90vh] max-h-[90vh] -translate-x-1/2 -translate-y-1/2
             rounded-sm border border-orange-400 bg-neutral-900/95 shadow-2xl 
             overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 pt-4 shrink-0">
              {/* Title */}
              <h2 className="text-2xl font-bold text-neutral-100 tracking-wide">
                QUICK REFERENCE
              </h2>
              {/* Tabs */}
              <div>
                <div className="inline-flex rounded-xl border border-orange-500/40 bg-neutral-900/60 overflow-hidden mt-4">
                  <button
                    className={`px-4 py-2 text-sm font-semibold ${
                      tab === "actions"
                        ? "bg-orange-500 text-white"
                        : "text-orange-300 hover:bg-neutral-800"
                    }`}
                    onClick={() => setTab("actions")}
                  >
                    Actions
                  </button>
                  <button
                    className={`px-4 py-2 text-sm font-semibold border-l border-orange-500/40 ${
                      tab === "rules"
                        ? "bg-orange-500 text-white"
                        : "text-orange-300 hover:bg-neutral-800"
                    }`}
                    onClick={() => setTab("rules")}
                  >
                    Rules
                  </button>
                </div>
              </div>
            </div>

            {/* content */}
            <div className="flex-1 min-h-0 overflow-y-auto px-6 pb-6 scrollbar-thin scrollbar-thumb-orange-400 scrollbar-track-neutral-700">
              {tab === "actions" && <ActionEconomy />}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
