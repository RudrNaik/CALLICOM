import { CLASS_KEYS, VEHICLE_KEYS, classLabel } from "./tokenBadges";

// <option>s for a token's classKey select: infantry classes and vehicles,
// grouped so a vehicle can be picked in place of a class.
export default function ClassOptions() {
  return (
    <>
      <optgroup label="Infantry">
        {CLASS_KEYS.map((c) => (
          <option key={c} value={c}>
            {classLabel(c)}
          </option>
        ))}
      </optgroup>
      <optgroup label="Vehicles">
        {VEHICLE_KEYS.map((v) => (
          <option key={v} value={v}>
            {classLabel(v)}
          </option>
        ))}
      </optgroup>
    </>
  );
}
