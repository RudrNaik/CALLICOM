import React, { useEffect, useState } from "react";
import background from "./assets/Images/4060492.jpg";
import Calamari from "./assets/Images/Calamari_Logo.png";
import IntelReport from "./components/LoreDocs/Report";
import SidebarNav from "./components/Rulebook/SidebarNav";
import loreExample from "./data/loreExample.json";
import { useNavigate } from "react-router-dom";

const Lore = () => {
  const [step, setStep] = useState(0);
  const [file, setFile] = useState(null);
  const [expandedSections, setExpandedSections] = useState({});
  const [lore, setLore] = useState(loreExample);
  const navigate = useNavigate();

  const loadingLoreData = lore.legnth == 0;
  const isInitialLoading = loadingLoreData || isLoading;

  useEffect(() => {
    const fetchLore = fetch(
      "https://callicom.onrender.com/api/lore", //https://callicom.onrender.com/api/lore
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    ).then((res) => res.json());

    Promise.all([fetchLore])
      .then(([loreData]) => {
        setLore(loreData);
      })
      .catch((err) => {
        console.error("Error fetching lore data:", err);
        navigate("/CALLICOM");
      });
  }, []);

  const sections = lore.filter((r) => !r.parentId);
  const toggleSection = (id) =>
    setExpandedSections((prev) => ({ ...prev, [id]: !prev[id] }));
  const getChildren = (parentId) => lore.filter((r) => r.parentId === parentId);
  const indexOfSelected = (id) => lore.findIndex((r) => r.id === id);

  function handleStepChange(id) {
    setFile(indexOfSelected(id));
    setStep(1);
  }

  if (isInitialLoading) {
    return (
      <div className="fixed inset-0 bg-neutral-900 flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-orange-500 border-solid mb-4"></div>
        <p className="text-white text-sm font-mono tracking-wide">
          Initializing briefing environment...
        </p>
        <p className="text-xs py-2 font-mono text-neutral-400/80">
          //[⚠]:: Please be patient as occasionally the environment will require
          the backend to spool up. Usually this takes 20-30 seconds.
        </p>
      </div>
    );
  }

  return (
    <div
      className="bg-repeat bg-[length:1920px_1080px] w-full min-h-screen text-white  text-xs font-[Geist_Mono]"
      style={{ backgroundImage: `url(${background})` }}
    >
      <div className="py-10"></div>
      {/* Header and fluff */}
      <div>
        {/* title */}
        <div className="grid grid-cols-5 gap-2">
          <div>
            <img
              src={Calamari}
              alt="Calamari Logo"
              className="ml-5 max-h-[250px]"
            />
          </div>
          <div className="place-items-start mt-[75px] col-span-4 ">
            <h1 className="border-orange-500 border-l-8 px-2 text-7xl font-extrabold">
              CALLICOM-DB
            </h1>
            <h2 className="text-2xl mt-2 text-neutral-400">
              INTELLIGENCE AND RECORDS
            </h2>
          </div>
        </div>
        {/* DB information */}
        <div className="grid grid-cols-5 gap-2 bg-neutral-900/80">
          <div className="col-span-3 col-start-2">
            <div className="border-l-4 px-1 text-lg">DATABASE ABSTRACT</div>
            <div className="">
              <p className="mt-2 p-2">
                This Database is a general compendium of testing logs, SSE,
                intelligence assessments, after action reports, and other
                miscellaneous information deemed important enough by both HICOM
                and the ISR division for it to be logged and stored within the
                general database.Clearance levels for information in this
                database is [BLUE-4] which encompasses most contractors within
                the Rapid Response Regiment, SYNTAC, Special Reconaissance
                Detachment and other special units within Calamari. [Black-5]
                information is redacted- and stored separately. Information of
                that classification can be accessed via filing a request with
                ADMIN-RECORDS or HICOM.
              </p>
              <p className="py-3 px-2">
                The goal of this database is to be an asset and a resource for
                all Contractors of [BLUE-4] clearance. As this information
                provides a baseline knowledge of company standard operating
                procedures, backgrounds, and history that are useful for
                onboarding after contractors have completed the final segments
                of their interviewing pipelines.
              </p>
              <p className="py-3 px-2">
                If you have access to these files and are not of [BLUE-4]
                clearance. Please close out of the window and contact your
                supervisor.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* list View */}
      {step == 0 && (
        <div className="grid grid-cols-5 text-sm">
          <ul className="col-start-2 col-span-3 text-sm">
            {sections.map((lore) => {
              const children = getChildren(lore.id);
              const isSectionOpen = expandedSections[lore.id];

              return (
                <li key={lore.id}>
                  <div
                    className="flex items-center px-2 py-1 hover:text-orange-400 cursor-pointer"
                    onClick={() => toggleSection(lore.id)}
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
                    {lore.id}
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
                        >
                          {" "}
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
      {step == 1 && (
        <div className="grid grid-cols-5">
          {/* Another list copy. */}
          <ul className="col-span-1 justify-items-normal mx-auto text-sm">
            <li>
              <div
                className="flex items-center px-2 py-1 hover:text-orange-400 cursor-pointer"
                onClick={() => setStep(0)}
              >
                <span className="px-2">↰ Back to DB</span>
              </div>
            </li>
            {sections.map((lore) => {
              const children = getChildren(lore.id);
              const isSectionOpen = expandedSections[lore.id];

              return (
                <li key={lore.id}>
                  <div
                    className="flex items-center px-2 py-1 hover:text-orange-400 cursor-pointer"
                    onClick={() => toggleSection(lore.id)}
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
                    {lore.id}
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
                        >
                          {" "}
                          ↳ 🗏 {sub.title}
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              );
            })}
          </ul>
          {/* Actual content: */}
          <div className="col-span-3 mt-10">
            <IntelReport
              title={lore[file].title}
              content={lore[file].content}
              fluff={lore[file].fluff}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default Lore;
