import { useEffect, useState, useMemo } from "react";
import equipmentData from "../../../data/Equipment.json";
import weaponCategories from "../../../data/weaponCategories.json";
import secondaryGadgets from "../../../data/classSkills.json";
import WeaponSlot from "./WeaponCards";
import GadgetAmmo from "./GadgetAmmo";
import GADGET_AMMO_CONFIG from "../../../data/gadgetAmmoConfig.json";

function EquipmentSelection({
  character,
  isEditing,
  userId,
  refreshCharacter,
  setIsEditing,
  charActive,
}) {
  const defaultGear = {
    primaryWeapon: { name: "", category: "" },
    secondaryWeapon: { name: "", category: "" },
    grenades: ["", ""],
    gadget: "",
    gadgetAmmo: {},
    armorClass: 0,
    miscGear: "",
  };

  //percolates items froim the equipment data into an easy to use lookup table.
  const itemById = useMemo(() => {
    const m = {};
    equipmentData.forEach((it) => {
      m[it.id] = it;
    });
    return m;
  }, []);

  const [gear, setGear] = useState(defaultGear);
  const [classGadgets, setClassGadgets] = useState([]);
  const [secondaryGadget, setSecGadget] = useState([]);
  const [grenadeCounts, setGrenadeCounts] = useState([3, 3]);
  const [medCounts, setMedCounts] = useState([1, 2, 1]); // [AFAK, IFAK, Painkiller]
  const activeGadgetConfig = GADGET_AMMO_CONFIG[gear.gadget];
  const [gadgetAmmoBaseline, setGadgetAmmoBaseline] = useState(null);

  useEffect(() => {
    if (!character) return;

    setGear(
      character.equipment ?? {
        primaryWeapon: { name: "", category: "" },
        secondaryWeapon: { name: "", category: "" },
        grenades: ["", ""],
        gadget: "",
        gadgetAmmo: {},
        armorClass: 0,
        miscGear: "",
      }
    );

    const filtered = equipmentData.filter(
      (item) =>
        item.class === character.class || item.class === character.multiClass //&& item.cost === 0
    );
    setClassGadgets(filtered);

    //console.log(secondaryGadgets[character.class].classGadget);

    if (secondaryGadgets[character.class]) {
      setSecGadget(secondaryGadgets[character.class].classGadget);
    } else {
      setSecGadget(null);
    }
    setGrenadeCounts([3, 3]);
  }, [character]);

  const handleChange = (field, value) => {
    setGear((prev) => ({ ...prev, [field]: value }));
  };

  const handleWeaponChange = (slot, subfield, value) => {
    setGear((prev) => ({
      ...prev,
      [slot]: { ...prev[slot], [subfield]: value },
    }));
  };

  const handleGrenadeChange = (index, value) => {
    setGear((prev) => {
      const updated = [...prev.grenades];
      updated[index] = value;
      return { ...prev, grenades: updated };
    });
  };

  const saveToDatabase = async () => {
    const token = localStorage.getItem("token");

    if (!token) {
      console.log("No token found, redirecting to login.");
      navigate("/login");
      setIsLoading(false);
      return;
    }

    try {
      const res = await fetch(
        `https://callicom.onrender.com/api/characters/${userId}/${character.callsign}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ equipment: gear }),
        }
      );
      if (res.ok) {
        refreshCharacter();
        setIsEditing(false);
      } else {
        alert("Failed to save equipment.");
      }
    } catch (err) {
      console.error("Equipment PATCH error:", err);
    }
  };

  return (
    <div className="mt-8 text-white" style={{ fontFamily: "Geist_Mono" }}>
      <div className="relative inline-block group">
        <h2 className="text-xl font-bold text-orange-400 mt-4 mb-4">
          Equipment
        </h2>

        {/* Tooltip modal */}
        <div className="absolute z-10 hidden group-hover:block w-2xl p-2 bg-neutral-800 text-white text-sm rounded shadow-lg top-full left-0 mt-1">
          <p>
            Your equipment determines the gear that you bring into a mission.
            You can choose a{" "}
            <span className="text-orange-500 font-bold">primary</span>, a{" "}
            <span className="text-orange-500 font-bold">secondary</span>, 2
            types of <span className="text-orange-500 font-bold">grenades</span>
            , and then your{" "}
            <span className="text-orange-500 font-bold">armor</span> and{" "}
            <span className="text-orange-500 font-bold">gadget</span>.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Weapons */}
        {["primaryWeapon", "secondaryWeapon"].map((slot) => (
          <WeaponSlot
            key={`${slot}-${character.callsign}`}
            slot={slot}
            weapon={gear[slot]}
            isEditing={isEditing}
            weaponCategories={weaponCategories}
            handleWeaponChange={handleWeaponChange}
            characterCallsign={character.callsign}
            charActive={charActive}
          />
        ))}
        {/* Grenades */}
        <div className="bg-neutral-800/80 border-l-8 border-orange-400 p-6 rounded shadow">
          <h3 className="font-semibold text-orange-300">Grenades</h3>

          {isEditing ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {gear.grenades.map((grenade, i) => (
                <input
                  key={i}
                  className="w-full bg-neutral-900 text-white py-2 px-2 rounded"
                  placeholder={`Grenade ${i + 1}`}
                  value={grenade}
                  onChange={(e) => handleGrenadeChange(i, e.target.value)}
                />
              ))}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {gear.grenades.map((grenade, i) => (
                  <div key={i} className="text-sm text-white space-y-1">
                    <p>
                      <span className="font-semibold text-orange-300">
                        {grenade || `Grenade ${i + 1}`}
                      </span>
                    </p>
                    {charActive && (
                      <div>
                        <p className="px-2 py-1 rounded bg-neutral-900 mb-2">
                          <span className="text-yellow-400">
                            {grenadeCounts[i]} / 3
                          </span>{" "}
                          <span className="text-gray-400 italic">
                            remaining
                          </span>
                        </p>
                        <div className="flex gap-1">
                          <button
                            onClick={() =>
                              setGrenadeCounts((prev) => {
                                const updated = [...prev];
                                updated[i] = Math.max(0, updated[i] - 1);
                                return updated;
                              })
                            }
                            disabled={grenadeCounts[i] === 0}
                            className="bg-orange-600 hover:bg-orange-700 text-white px-2 py-1 rounded disabled:opacity-40 text-xs"
                          >
                            Throw
                          </button>
                          <button
                            onClick={() =>
                              setGrenadeCounts((prev) => {
                                const updated = [...prev];
                                updated[i] = 3;
                                return updated;
                              })
                            }
                            className="bg-green-700 hover:bg-green-800 text-white px-2 py-1 rounded text-xs"
                          >
                            Resupply
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Armor Class */}
        <div className="bg-neutral-800/80 border-l-8 border-orange-400 p-6 rounded shadow">
          <h3 className="font-semibold text-orange-300">Armor Class</h3>
          {isEditing ? (
            <input
              type="number"
              min={0}
              max={3}
              className="w-full bg-neutral-900 text-white p-2 rounded"
              value={gear.armorClass}
              onChange={(e) =>
                handleChange("armorClass", parseInt(e.target.value))
              }
            />
          ) : (
            <p>AC{gear.armorClass}</p>
          )}

          {/* Medicine and meds. */}
          {charActive ? (
            <div className="grid sm:grid-cols-1 md:grid-cols-3 gap-4 mt-2">
              {["AFAK", "IFAK", "Painkiller"].map((med, i) => (
                <div key={med} className="text-sm text-white space-y-1">
                  <p>
                    <span className="font-semibold text-orange-300">{med}</span>
                  </p>
                  <p className="px-2 py-1 rounded bg-neutral-900 mb-2">
                    <span className="text-yellow-400">{medCounts[i]}</span>{" "}
                    <span className="text-gray-400 italic">remaining</span>
                  </p>
                  <div className="flex gap-1">
                    <button
                      onClick={() =>
                        setMedCounts((prev) => {
                          const updated = [...prev];
                          updated[i] = Math.max(0, updated[i] - 1);
                          return updated;
                        })
                      }
                      disabled={medCounts[i] === 0}
                      className="bg-orange-600 hover:bg-orange-700 text-white px-2 py-1 rounded disabled:opacity-40 text-xs"
                    >
                      Use
                    </button>
                    <button
                      onClick={() =>
                        setMedCounts((prev) => {
                          const updated = [...prev];
                          updated[i] = i === 0 ? 2 : 1; // default: AFAK = 2, others = 1
                          return updated;
                        })
                      }
                      className="bg-green-700 hover:bg-green-800 text-white px-2 py-1 rounded text-xs"
                    >
                      Resupply
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 italic">
              No meds shown unless on a mission.
            </p>
          )}
        </div>

        {/* Gadget */}
        <div className="bg-neutral-800/80 border-l-8 border-orange-400 p-6 rounded shadow col-span-2">
          <h3 className="font-semibold text-orange-300">Class Gadget</h3>
          {isEditing ? (
            <select
              className="w-full bg-neutral-900 text-white p-2 rounded"
              value={gear.gadget}
              onChange={(e) => handleChange("gadget", e.target.value)}
            >
              <option value="">Select Gadget</option>
              {classGadgets.map((gadget) => (
                <option key={gadget.id} value={gadget.id}>
                  {gadget.title}
                </option>
              ))}
            </select>
          ) : (
            <p className="font-semibold text-white">
              {classGadgets.find((gadget) => gadget.id === gear.gadget)
                ?.title || "None Selected"}
            </p>
          )}

          {gear.gadget && (
            <div className="text-sm text-gray-300 space-y-2 mt-2">
              <p className="whitespace-pre-line">
                {
                  classGadgets.find((gadget) => gadget.id === gear.gadget)
                    ?.rulesText
                }
              </p>
              <p className="italic">
                {
                  classGadgets.find((gadget) => gadget.id === gear.gadget)
                    ?.description
                }
              </p>
            </div>
          )}

          {/* Special Ammo UI */}
          {activeGadgetConfig && (
            <GadgetAmmo
              key={`${character.callsign}-${gear.gadget}`}
              isEditing={isEditing}
              isActive={charActive}
              gadgetId={gear.gadget}
              gadgetAmmo={gear.gadgetAmmo || {}}
              setGadgetAmmo={(next) => handleChange("gadgetAmmo", next)}
              itemById={itemById}
              charClass={character.class}
              characterCallsign={character.callsign}
              config={activeGadgetConfig}
            />
          )}

          {secondaryGadget && (
            <div className="text-sm text-gray-300 space-y-2 mt-2">
              <p className="text-xs text-gray-200 whitespace-pre-line bg-orange-900/20 px-2 py-1 mt-2 rounded">
                <span className="text-orange-300 text-sm font-semibold">
                  Secondary Gadget: {secondaryGadget.id} {"\n"}
                </span>
                <span className="text-xs">
                  {secondaryGadget.gameplay}
                  {"\n"}
                </span>
                <span className="text-[0.625rem] text-gray-400 italic">
                  {secondaryGadget.description}
                </span>
              </p>
            </div>
          )}
        </div>

        {/* inventory */}
        <div className="bg-neutral-800/80 border-l-8 border-orange-400 p-6 rounded shadow col-span-2">
          <h3 className="font-semibold text-orange-300">Inventory</h3>
          {isEditing ? (
            <textarea
              className="w-full bg-neutral-900 text-white p-2 rounded resize-y min-h-[100px]"
              placeholder="Extra mission items, RP gear, etc..."
              value={gear.miscGear}
              onChange={(e) => handleChange("miscGear", e.target.value)}
            />
          ) : (
            <p className="whitespace-pre-wrap text-xs mt-1">
              {gear.miscGear || "—"}
            </p>
          )}
        </div>
      </div>

      {isEditing && (
        <div className="mt-4">
          <button
            onClick={saveToDatabase}
            className="bg-orange-600 hover:bg-orange-700 px-4 py-2 rounded"
          >
            Save Equipment
          </button>
        </div>
      )}
    </div>
  );
}

export default EquipmentSelection;
