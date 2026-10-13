import React, { useState } from "react";
import background from "./assets/Images/4060492.jpg";
import Calamari from "./assets/Images/Calamari_Logo.png";
import IntelReport from "./components/LoreDocs/Report";
import loreData from "./data/loreDocs.json"
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

const Lore = () => {
  const [step, setStep] = useState(0);
  const [file, setFile] = useState(null);
  const [expandedSections, setExpandedSections] = useState({});
  const [navOpen, setNavOpen] = useState(false);
  const navigate = useNavigate();

  const lore = loreData;
  const sections = lore.filter((r) => !r.parentId);
  const toggleSection = (id) =>
    setExpandedSections((prev) => ({ ...prev, [id]: !prev[id] }));
  const getChildren = (parentId) => lore.filter((r) => r.parentId === parentId);

  function handleStepChange(id) {
    const idx = lore.findIndex((r) => r.id === id);
    if (idx >= 0) {
      setFile(idx);
      setStep(1);
      setNavOpen(false);
    }
  }

  const selected = file != null ? lore[file] : null;

  // Shared folder tree used by both the list view and the reader sidebar
  const renderTree = (labelKey) => (
    <ul>
      {sections.map((sec) => {
        const children = getChildren(sec.id);
        const isSectionOpen = !!expandedSections[sec.id];
        return (
          <li key={sec.id}>
            <div
              className="flex items-center px-2 py-1.5 hover:text-orange-400 cursor-pointer"
              onClick={() => toggleSection(sec.id)}
            >
              <span
                className={`select-none px-2 ${
                  children.length > 0 ? "text-orange-300" : "text-neutral-300"
                }`}
              >
                {children.length > 0 && isSectionOpen ? "🗁 " : "🗀 "}
              </span>
              <span className="break-words min-w-0">{sec[labelKey]}</span>
            </div>

            {isSectionOpen && children.length > 0 && (
              <ul className="ml-2 sm:ml-4 mt-1 px-3 text-gray-300">
                {children.map((sub) => (
                  <li
                    key={sub.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleStepChange(sub.id);
                    }}
                    className={`py-1.5 hover:text-orange-300 cursor-pointer break-words ${
                      selected?.id === sub.id ? "text-orange-300" : ""
                    }`}
                  >
                    ↳ 🗏 {sub[labelKey]}
                  </li>
                ))}
              </ul>
            )}
          </li>
        );
      })}
    </ul>
  );

  return (
    <div
      className="bg-repeat bg-[length:1920px_1080px] w-full min-h-screen text-white text-xs overflow-x-hidden"
      style={{ backgroundImage: `url(${background})` }}
    >
      <div style={{ fontFamily: "Geist_Mono" }}>
        <div className="py-6 sm:py-10"></div>
        {/* Header and fluff */}
        <div>
          {/* title */}
          <div className="flex items-end gap-3 px-4 sm:grid sm:grid-cols-5 sm:gap-2 sm:px-0">
            <div className="sm:justify-items-end shrink-0">
              <img
                src={Calamari}
                alt="Calamari Logo"
                className="sm:ml-5 max-h-[80px] sm:max-h-[150px]"
              />
            </div>
            <div className="sm:mt-[75px] sm:col-span-4 min-w-0">
              <h1 className="border-orange-500 border-l-8 px-2 text-2xl sm:text-5xl font-extrabold break-words">
                CALLICOM-DB
              </h1>
              <h2 className="text-md mt-2 text-neutral-400">
                INTELLIGENCE AND RECORDS
              </h2>
            </div>
          </div>

          {/* DB information */}
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 bg-neutral-900/80 px-4 py-2 sm:px-0 sm:py-0 mt-4 sm:mt-0">
            <div className="sm:col-span-3 sm:col-start-2">
            <div className="border-l-4 px-1 text-lg">DATABASE ABSTRACT</div>
            <div className="">
              <p className="mt-2">
                This Database is a general compendium of testing logs, SSE,
                intelligence assessments, after action reports, and other
                miscellaneous information deemed important enough by both HICOM
                and the ISR division for it to be logged and stored within the
                general database. Clearance levels for information in this
                database is [BLUE-4] which encompasses most contractors within
                the Rapid Response Regiment, SYNTAC, Special Reconaissance
                Detachment and other special units within Calamari.{" "}
                <span
                  className="glitch--subtle"
                  style={{ animation: "distort-subtle 7s ease infinite" }}
                >
                  [Black-5]{" "}
                </span>
                information is redacted and stored separately. Information of
                that classification can be accessed via filing a request with
                ADMIN-RECORDS or HICOM.
              </p>
              <p className="py-3">
                The goal of this database is to be an asset and a resource for
                all Contractors of [BLUE-4] clearance, which comprises members
                of HEAT, Special Reconaissance, Long Range Reconaissance, and
                SYNTAC. Along with leadership elements in the Rapid Response
                Regiment and those in ISR and NIB
              </p>
              <p className="py-3">
                If you have access to these files and are not of [BLUE-4]
                clearance, please close out of the window and contact your
                supervisor.
              </p>
            </div>
            </div>
          </div>
        </div>

        <motion.div
          key={step}
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 1, 0.85, 1] }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5, times: [0, 0.6, 0.85, 1] }}
        >
          {/* list View */}
          {step === 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-5 text-sm px-2 sm:px-0 py-4">
              <div className="sm:col-start-2 sm:col-span-3 text-sm">
                {renderTree("title")}
              </div>
            </div>
          )}

          {/* Content */}
          {step === 1 && (
            <div className="grid grid-cols-1 md:grid-cols-5 px-2 md:px-0">
              {/* Side list */}
              <div className="md:col-span-1 text-sm mt-4 md:mt-10 md:mx-auto">
                <div
                  className="flex items-center px-2 py-1.5 hover:text-orange-400 cursor-pointer"
                  onClick={() => setStep(0)}
                >
                  <span className="px-2">↰ Back to DB</span>
                </div>
                <button
                  className="md:hidden w-full text-left px-4 py-1.5 text-orange-300 border border-neutral-700 bg-neutral-900/80"
                  onClick={() => setNavOpen((o) => !o)}
                >
                  {navOpen ? "▾ Hide file list" : "▸ Browse files"}
                </button>
                <div className={`${navOpen ? "block" : "hidden"} md:block bg-neutral-900/80 md:bg-transparent`}>
                  {renderTree("id")}
                </div>
              </div>

              {/* Actual content */}
              <div className="md:col-span-3 mt-4 md:mt-10 min-w-0">
                {selected ? (
                  <IntelReport
                    title={selected.title}
                    content={selected.content}
                    fluff={selected.fluff}
                  />
                ) : (
                  <div className="text-neutral-400">
                    Select a file from the left.
                  </div>
                )}
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default Lore;
