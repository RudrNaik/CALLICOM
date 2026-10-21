import { rosterEntryId } from "../../engine/syncEngine";

import RiflemanIcon from "../../assets/classIcons/Rifleman.png";
import RaiderIcon from "../../assets/classIcons/Raider.png";
import CombatEngineerIcon from "../../assets/classIcons/Combat_Engineer.png";
import TechnicalEngineerIcon from "../../assets/classIcons/Technical_Engineer.png";
import SupportIcon from "../../assets/classIcons/Support.png";
import MedicIcon from "../../assets/classIcons/Medic.png";
import SharpshooterIcon from "../../assets/classIcons/Sharpshooter.png";
import TrapperIcon from "../../assets/classIcons/Trapper.png";

const classIcons = {
  Rifleman: RiflemanIcon,
  Raider: RaiderIcon,
  "Combat Engineer": CombatEngineerIcon,
  "Technical Engineer": TechnicalEngineerIcon,
  "Fire Support": SupportIcon,
  Medic: MedicIcon,
  Sharpshooter: SharpshooterIcon,
  Trapper: TrapperIcon,
};

function CharCard({ character, onSelect, onDelete }) {
  return (
    <div
      onClick={() => onSelect(character)}
      className="bg-neutral-900
          bg-[radial-gradient(circle,_rgba(255,100,0,0.06)_1px,_transparent_1px)]
          [background-size:8px_8px] border border-orange-500 hover:border-orange-400 rounded p-4 shadow text-white hover:bg-orange-500/50 hover:shadow-inner
          transition duration-200
          group cursor-pointer relative overflow-hidden"
    >
      {/* Delete button */}
      <button
        onClick={(event) => {
          event.stopPropagation();
          if (
            window.confirm(
              `Are you sure you want to delete ${character.callsign}?`,
            )
          ) {
            onDelete(rosterEntryId(character));
          }
        }}
        className="absolute top-2 right-2 text-red-400 hover:text-red-600 text-sm"
      >
        X
      </button>

      {character.class in classIcons && (
        <div>
          <img
            src={classIcons[character.class]}
            className="absolute right-5 top-1/5 z-0 -translate-y-1/4 size-15 opacity-20 object-contain pointer-events-none"
          />
          {character.multiClass in classIcons && (
            <img
              src={classIcons[character.multiClass]}
              className="absolute right-18 top-1/5 z-0 -translate-y-1/4 size-15 opacity-20 object-contain pointer-events-none"
            />
          )}
        </div>
      )}

      <h2 className="text-xl font-bold text-orange-300">
        {character.callsign}
      </h2>
      <p className="text-xs italic text-gray-400">{character.name}</p>
      <p className="text-xs text-gray-400">{character.class}</p>
      <p className="text-xs text-gray-400">{character.multiClass || "--------"}</p>
    </div>
  );
}

export default CharCard;
