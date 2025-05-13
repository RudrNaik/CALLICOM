import { useState } from "react";
import ClassCard from "./ClassCard";
import classData from "../../data/classSkills.json";

const CharCreator = ({ formData, setFormData, onNext }) => {
  const [touched, setTouched] = useState({});

  const isValid =
    formData.name && formData.callsign && formData.background && formData.class;

  const handleBlur = (field) => {
    setTouched({ ...touched, [field]: true });
  };

  const getInputClass = (field) =>
    `input-style ${
      touched[field] && !formData[field]
        ? "border-red-500"
        : "border-orange-400"
    }`;

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6 bg-neutral-900/80">
      <div className="bg-neutral-800/60 border-l-8 border-orange-500 p-6 rounded shadow">
        <h1 className="text-4xl font-bold p-2 bg-orange-500">
          New Employee Registration ::/
        </h1>
        <h2 class="text-sm">
          <span className="text-orange-500 ">CALLI/COM</span> UNCC IDENT SERVICE
          // <span className="text-blue-300">BLUE-4</span> PERSONNEL::
          [SRG/LRRC] OPERATOR (C)
        </h2>
        <p class="italic text-sm py-2 text-neutral-400/80">
          Welcome to the United Nations Contracting Council IDENT registration
          service. IDENT is the contractor certification system that helps
          ensure contractors meet regulatory and policy requirements through the
          use of BFTC and intelligence tracking. Contractors that have already
          been issued an IDENT-BFTC tag should not complete this form unless
          instructed to by a UNCC representative or liason.
        </p>
        <p class="text-sm py-2 px-3 text-orange-400/80 border-l-4 border-orange-400">
          By submitting this form you attest that your responses are truthful
          and accurate to the best of your knowledge. Knowingly providing false
          or or incomplete information is punishable under Article 20, paragraph
          10 of the UN Paris Accords.
        </p>
        <div className="grid sm:grid-cols-2 gap-4 py-2">
          <div>
            <p class="text-sm text-orange-400/80"> LC-218-A // Full Name</p>
            <input
              type="text"
              placeholder="Name"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              onBlur={() => handleBlur("name")}
              className={getInputClass("name")}
            />
            {touched.name && !formData.name && (
              <p className="text-red-400 text-sm mt-1">Required</p>
            )}
          </div>

          <div>
            <p class="text-sm text-orange-400/80"> LC-218-B // BFTC CALLSIGN</p>
            <input
              type="text"
              placeholder="Callsign"
              value={formData.callsign}
              onChange={(e) =>
                setFormData({ ...formData, callsign: e.target.value })
              }
              onBlur={() => handleBlur("callsign")}
              className={getInputClass("callsign")}
            />
            {touched.callsign && !formData.callsign && (
              <p className="text-red-400 text-sm mt-1">Required</p>
            )}
          </div>

          <div>
            <p class="text-sm text-orange-400/80">
              {" "}
              LC-218-C // Prior Affiliation
            </p>
            <input
              type="text"
              placeholder="Background"
              value={formData.background}
              onChange={(e) =>
                setFormData({ ...formData, background: e.target.value })
              }
              onBlur={() => handleBlur("background")}
              className={getInputClass("background")}
            />
            {touched.background && !formData.background && (
              <p className="text-red-400 text-sm mt-1">Required</p>
            )}
          </div>
        </div>
      </div>

      <div className="">
        <div className="bg-neutral-800/60 border-l-8 border-orange-500 p-6 rounded shadow">
          <h1 className="text-4xl font-bold p-2 bg-orange-500">
            Contractor Skillsets ::/
          </h1>
          <h2 class="text-sm">
            <span className="text-orange-500 ">CALLI/COM</span> UNCC IDENT
            SERVICE // LC-218-D Skills Assessment
          </h2>
          <p class="italic text-sm py-2 text-neutral-400/80">
            Per Article 15, Paragraph 2, the UNCC IDENT registration service
            provides a quick skill assessment, created and curated via
            background information from various participating intelligence
            services. The UNCC IDENT services have generated a selection of
            Combat Roles based on your prior experience. Each of these will
            populate most of your UNCC LC-218 form based off of your prior
            experience.
          </p>
          <p class="text-sm py-3 px-3 text-orange-400/80 border-l-4 border-orange-400">
            Selecting a class will complete most of your LC-218 skills
            assessment and start your Contractor with a curated set of skills,
            tailored to the class selected below
          </p>
        </div>
      </div>

      <ClassCard
        classData={classData}
        selectedClass={formData.class}
        onSelect={(selected) => {
          setFormData({ ...formData, class: selected });
          handleBlur("class");
        }}
        touched={touched.class}
      />

      <div className="flex justify-end mt-6">
        <button
          disabled={!isValid}
          onClick={onNext}
          className={`px-4 py-2 rounded ${
            isValid
              ? "bg-orange-500 hover:bg-orange-600"
              : "bg-gray-600 cursor-not-allowed"
          } text-white`}
        >
          Continue to Skills
        </button>
      </div>
    </div>
  );
};

export default CharCreator;
