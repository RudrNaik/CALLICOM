function SpecView({ specializations, isEditing, removeSpec }) {
  return (
    <div>
      <div className="relative inline-block group">
        <h2 className="text-xl font-bold text-orange-400">Specializations</h2>

        {/* Tooltip modal */}
        <div className="absolute z-10 hidden group-hover:block w-2xl p-2 bg-neutral-800 text-white text-sm rounded shadow-lg top-full left-0 mt-1">
          <p>
            Specialiations provide a <span className="text-orange-500 font-bold">+1</span> to rolls when conditions are met. For example, a specialization in Carbines provides a +1 when rolling to attack with a Carbine.
          </p>
        </div>
      </div>

      <ul className="list-disc list-inside text-sm space-y-1">
        {specializations.map((s, i) => (
          <li key={i} className="flex justify-between items-center">
            <span>
              <span className="text-orange-300 font-medium">{s.skill}:</span>{" "}
              {s.label} | <span className="text-neutral-300">{s.details}</span>
            </span>

            {isEditing && (
              <button
                onClick={() => removeSpec(i)}
                className="text-red-400 text-xs hover:text-red-600 ml-2"
              >
                X
              </button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default SpecView;
