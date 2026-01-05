import React, { useEffect, useState } from "react";
import background from "./assets/Images/4060492.jpg";
import Calamari from "./assets/Images/Calamari_Logo.png";
import IntelReport from "./components/LoreDocs/Report";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

const Lore = () => {
  const [step, setStep] = useState(0);
  const [file, setFile] = useState(null);
  const [expandedSections, setExpandedSections] = useState({});
  const [lore, setLore] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    let isCurrent = true;
    const ac = new AbortController();

    (async () => {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch("https://callicom.onrender.com/api/lore", {
          headers: { "Content-Type": "application/json" },
          signal: ac.signal,
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const loreData = await res.json();
        if (!isCurrent) return;

        const asArray = Array.isArray(loreData)
          ? loreData
          : Array.isArray(loreData?.data)
          ? loreData.data
          : [];

        setLore(asArray);
        setHasLoaded(true);
      } catch (err) {
        if (err.name === "AbortError") return;
        if (isCurrent) {
          console.error("Error fetching lore data:", err);
          setError(err);
          //navigate("/CALLICOM");
        }
      } finally {
        if (isCurrent) setLoading(false);
      }
    })();

    return () => {
      isCurrent = false;
      ac.abort();
    };
  }, [navigate]);

  const showInitialLoader = loading || (!hasLoaded && lore.length === 0);

  const sections = lore.filter((r) => !r.parentId);
  const toggleSection = (id) =>
    setExpandedSections((prev) => ({ ...prev, [id]: !prev[id] }));
  const getChildren = (parentId) => lore.filter((r) => r.parentId === parentId);
  const indexOfSelected = (id) => lore.findIndex((r) => r.id === id);

  function handleStepChange(id) {
    const idx = indexOfSelected(id);
    if (idx >= 0) {
      setFile(idx);
      setStep(1);
    }
  }

  if (showInitialLoader) {
    return (
      <div className="fixed inset-0 bg-neutral-900 flex flex-col items-center justify-center">
        <svg
          className="animate-spin h-8 w-8 inline-block text-orange-500"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="3"
          ></circle>
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
          ></path>
        </svg>
        <p className="text-white text-sm font-mono tracking-wide">
          Initializing archives environment...
        </p>
        <p className="text-xs py-2 mx-2 font-mono text-neutral-400/80">
          //[⚠]:: Please be patient as occasionally the environment will require
          the backend to spool up. Usually this takes 20-30 seconds.
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-neutral-900 flex flex-col items-center justify-center">
        <p className="text-white font-mono">Failed to load database.</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-3 px-3 py-1 rounded border border-orange-500 hover:bg-orange-500/10 text-white"
        >
          Retry
        </button>
      </div>
    );
  }

  const selected = file != null ? lore[file] : null;

  return (
    <div
      className="bg-repeat bg-[length:1920px_1080px] w-full min-h-screen text-white text-xs"
      style={{ backgroundImage: `url(${background})` }}
    >
      <div style={{ fontFamily: "Geist_Mono" }}>
      <div className="py-10"></div>
      {/* Header and fluff */}
      <div>
        {/* title */}
        <div className="grid grid-cols-5 gap-2">
          <div className="justify-items-end">
            <img
              src={Calamari}
              alt="Calamari Logo"
              className="ml-5 max-h-[150px]"
            />
          </div>
          <div className="place-items-start mt-[75px] col-span-4 ">
            <h1 className="border-orange-500 border-l-8 px-2 text-5xl font-extrabold">
              CALLICOM-DB
            </h1>
            <h2 className="text-md mt-2 text-neutral-400">
              INTELLIGENCE AND RECORDS
            </h2>
          </div>
        </div>

        {/* DB information */}
        <div className="grid grid-cols-5 gap-2 bg-neutral-900/80">
          <div className="col-span-3 col-start-2">
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
          <div className="grid grid-cols-5 text-sm">
            <ul className="col-start-2 col-span-3 text-sm">
              {sections.map((sec) => {
                const children = getChildren(sec.id);
                const isSectionOpen = !!expandedSections[sec.id];

                return (
                  <li key={sec.id}>
                    <div
                      className="flex items-center px-2 py-1 hover:text-orange-400 cursor-pointer"
                      onClick={() => toggleSection(sec.id)}
                    >
                      {children.length > 0 ? (
                        <span className=" text-orange-300 select-none px-2">
                          {isSectionOpen ? "🗁 " : "🗀 "}
                        </span>
                      ) : (
                        <span className=" text-neutral-300 select-none px-2">
                          {"🗀"}
                        </span>
                      )}
                      {sec.title}
                    </div>

                    {isSectionOpen && children.length > 0 && (
                      <ul className="ml-4 mt-1 px-3 text-gray-300">
                        {children.map((sub) => (
                          <li
                            key={sub.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleStepChange(sub.id);
                            }}
                            className="hover:text-orange-300 cursor-pointer"
                          >
                            ↳ 🗏 {sub.title}
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {/* Content */}
        {step === 1 && (
          <div className="grid grid-cols-5">
            {/* Side list */}
            <ul className="col-span-1 justify-items-normal mx-auto text-sm mt-10">
              <li>
                <div
                  className="flex items-center px-2 py-1 hover:text-orange-400 cursor-pointer"
                  onClick={() => setStep(0)}
                >
                  <span className="px-2">↰ Back to DB</span>
                </div>
              </li>
              {sections.map((sec) => {
                const children = getChildren(sec.id);
                const isSectionOpen = !!expandedSections[sec.id];
                return (
                  <li key={sec.id}>
                    <div
                      className="flex items-center px-2 py-1 hover:text-orange-400 cursor-pointer"
                      onClick={() => toggleSection(sec.id)}
                    >
                      {children.length > 0 ? (
                        <span className=" text-orange-300 select-none px-2">
                          {isSectionOpen ? "🗁 " : "🗀 "}
                        </span>
                      ) : (
                        <span className=" text-neutral-300 select-none px-2">
                          {"🗀"}
                        </span>
                      )}
                      {sec.id}
                    </div>

                    {isSectionOpen && children.length > 0 && (
                      <ul className="ml-4 mt-1 px-3 text-gray-300">
                        {children.map((sub) => (
                          <li
                            key={sub.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleStepChange(sub.id);
                            }}
                            className="hover:text-orange-300 cursor-pointer"
                          >
                            ↳ 🗏 {sub.id}
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                );
              })}
            </ul>

            {/* Actual content */}
            <div className="col-span-3 mt-10">
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
