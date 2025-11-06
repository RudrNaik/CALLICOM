import React from "react";
import background from "./assets/Images/4060492.jpg";
import Calamari from "./assets/Images/Calamari_Logo.png";
import IntelReport from "./components/CharacterRoster/LoreDocs/Report";
import SidebarNav from "./components/Rulebook/SidebarNav";

function Lore() {
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

      {/* Content */}
      <div className="grid grid-cols-5">
        <SidebarNav rules={[]}></SidebarNav>
        <div className="cols-span-3 mt-10">
          <IntelReport title={"SOMETHING"}/>  
        </div>
        
      </div>

      
    </div>
  );
}

export default Lore;
