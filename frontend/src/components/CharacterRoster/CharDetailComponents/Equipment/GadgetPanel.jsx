import GadgetAmmo from "./GadgetAmmo";

const GadgetPanel = ({
  gadgetId,
  classGadgets,
  equipmentData,
  activeGadgetConfig,
  gadgetAmmo,
  secondaryGadget,
  secondaryGadgetSource,
  hasMulticlass,
  onSecondaryGadgetSourceChange,
  characterId,
  charClass,
  multiClass,
  charActive,
  ownedGadgetIds,
  itemById,
  isEditing,
  onGadgetChange,
  onGadgetAmmoChange,
}) => {
  const selectedGadget = equipmentData.find((gadget) => gadget.id === gadgetId);

  return (
    <div className="bg-gradient-to-t from-neutral-800 to-neutral-850 border-l-4 border-orange-500 p-4 rounded-xs shadow">
      <h3 className="font-semibold text-orange-300">Gadget</h3>
      {isEditing ? (
        <select
          className="w-full select-themed p-2 rounded"
          value={gadgetId}
          onChange={(e) => onGadgetChange(e.target.value)}
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
          {classGadgets.find((gadget) => gadget.id === gadgetId)?.title ||
            "None Selected"}
        </p>
      )}

      {gadgetId && (
        <div className="text-xs text-gray-300 space-y-2 mt-2">
          <p className="whitespace-pre-line">
            {selectedGadget?.rulesText || "n/a"}
          </p>
          <p className="italic">{selectedGadget?.description || "n/a"}</p>
        </div>
      )}

      {/* Special Ammo UI */}
      {activeGadgetConfig && (
        <GadgetAmmo
          key={`${characterId}-${gadgetId}`}
          isEditing={isEditing}
          isActive={charActive}
          gadgetId={gadgetId}
          gadgetAmmo={gadgetAmmo || {}}
          setGadgetAmmo={onGadgetAmmoChange}
          itemById={itemById}
          classGadget={secondaryGadget?.id}
          characterId={characterId}
          config={activeGadgetConfig}
          ownedOptionIds={ownedGadgetIds}
        />
      )}

      {(secondaryGadget || hasMulticlass) && (
        <div className="text-sm text-gray-300 space-y-2 mt-2">
          {hasMulticlass &&
            (isEditing ? (
              <div className="flex items-center gap-2 text-xs flex-wrap">
                <span className="text-orange-300 font-semibold">
                  Secondary Gadget:
                </span>
                {[
                  ["main", charClass],
                  ["multi", multiClass],
                ].map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => onSecondaryGadgetSourceChange(value)}
                    className={`px-2 py-1 rounded-xs border transition-all ${
                      secondaryGadgetSource === value
                        ? "border-orange-500 bg-orange-900/40 text-orange-200"
                        : "border-neutral-600 text-gray-400"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            ) : (
              <></>
            ))}

          {secondaryGadget ? (
            <p className="text-xs text-gray-200 whitespace-pre-line border-orange-400/30 border bg-orange-900/20 px-2 py-1 mt-2 rounded-xs">
              <span className="text-orange-300 text-sm font-semibold">
                Secondary Gadget: {secondaryGadget.id} {"\n"}
              </span>
              <p className="text-[0.625rem] text-gray-400 tracking-wide italic">
                Source:{" "}
                {secondaryGadgetSource === "multi" ? multiClass : charClass}
              </p>
              <span className="text-xs">
                {secondaryGadget.gameplay}
                {"\n"}
              </span>
              <span className="text-[0.625rem] text-gray-400 italic">
                {secondaryGadget.description}
              </span>
            </p>
          ) : (
            hasMulticlass && (
              <p className="text-xs text-gray-500 italic">
                No secondary gadget for this class.
              </p>
            )
          )}
        </div>
      )}
    </div>
  );
};

export default GadgetPanel;
