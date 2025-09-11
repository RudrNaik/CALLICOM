import react from "react";

function GadgetAmmo ({ activeGadgetConfig, gear, isEditing, itemById}) {
{activeGadgetConfig && (
<div className="mt-1 rounded border border-orange-500/40 bg-neutral-900/50 p-3">
              <h4 className="text-orange-300 font-semibold mb-2">
                Special Ammo
              </h4>

              {gear.gadget === "ugl" && (
                <div className="text-xs">
                  <p className="text-xs text-gray-400 mb-2">
                    max {activeGadgetConfig.maxTotal} rounds.
                  </p>

                  {activeGadgetConfig.options.map((opt) => {
                    const count = gear.gadgetAmmo?.[opt.id] ?? 0;

                    // Hide options that have 0 rounds when NOT editing
                    if (!isEditing && count <= -1) return null;

                    const rules = itemById[opt.id]?.rulesText;

                    return (
                      <div
                        key={opt.id}
                        className="flex items-start justify-between gap-2 mb-1"
                      >
                        {/* Label + rulesText */}
                        <div className="flex-1">
                          <div className="flex items-baseline gap-2">
                            <span className="text-xs font-semibold">
                              {opt.label}
                            </span>
                            {rules && (
                              <span className="text-[10px] text-gray-400">
                                {rules}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Right side: input in edit mode, badge in view mode */}

                        <input
                          type="number"
                          min={0}
                          max={activeGadgetConfig.maxTotal}
                          value={count}
                          onChange={(e) => {
                            const val = parseInt(e.target.value) || 0;
                            const total = Object.values({
                              ...gear.gadgetAmmo,
                              [opt.id]: val,
                            }).reduce((a, b) => a + b, 0);

                            if (total <= activeGadgetConfig.maxTotal) {
                              handleChange("gadgetAmmo", {
                                ...gear.gadgetAmmo,
                                [opt.id]: val,
                              });
                            }
                          }}
                          className="w-16 text-center bg-neutral-800 text-white rounded"
                        />
                      </div>
                    );
                  })}
                </div>
              )}

              {gear.gadget === "x89-ams" && (
                <div className="text-xs">
                  <p className="text-xs text-gray-400 mb-2">
                    Choose 8 shells.
                  </p>

                  {activeGadgetConfig.options.map((opt) => {
                    const count = gear.gadgetAmmo?.[opt.id] ?? 0;

                    // Hide options that have 0 rounds when NOT editing
                    if (!isEditing && count <= -1) return null;

                    const rules = itemById[opt.id]?.rulesText;

                    const selectedKeys = Object.keys(
                      gear.gadgetAmmo || {}
                    ).filter((k) => (gear.gadgetAmmo[k] ?? 0) > 0);
                    const disabled =
                      !gear.gadgetAmmo?.[opt.id] &&
                      selectedKeys.length >= activeGadgetConfig.maxTypes;

                    return (
                      <div
                        key={opt.id}
                        className="flex items-start justify-between gap-2 mb-1"
                      >
                        {/* Label + rulesText */}
                        <div className="flex-1">
                          <div className="flex items-baseline gap-2">
                            <span className="text-xs font-semibold">
                              {opt.label}
                            </span>
                            {rules && (
                              <span className="text-[10px] text-gray-400">
                                {rules}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Right side: input in edit mode, badge in view mode */}

                        <input
                          type="number"
                          min={0}
                          max={8}
                          value={count}
                          onChange={(e) => {
                            const val = parseInt(e.target.value) || 0;
                            const total = Object.values({
                              ...gear.gadgetAmmo,
                              [opt.id]: val,
                            }).reduce((a, b) => a + b, 0);

                            if (total <= 8) {
                              handleChange("gadgetAmmo", {
                                ...gear.gadgetAmmo,
                                [opt.id]: val,
                              });
                            }
                          }}
                          className="w-16 text-center bg-neutral-800 text-white rounded"
                        />
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}            
}  

export default GadgetAmmo