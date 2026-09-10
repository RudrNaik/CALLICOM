function SpecView({ specializations, isEditing, removeSpec }) {
  /** 
   * Handles removing specializations if need be. This may be removed later when the progression rework is implemented.
   */
  const handleRemove = (index) => {
    const ok = window.confirm(
      "Remove this specialization and return 5 XP?"
    );
    if (!ok) return;
    removeSpec(index);
  };

  return (
    <div>

      <ul className="list-disc list-inside text-md space-y-1">
        {specializations.map((s, i) => (
          <li key={i} className="flex justify-between items-center rounded-sm bg-gradient-to-r mt-1 from-neutral-800 to-neutral-850 border-l-4 border-orange-500 p-2">
            <span>
              <span className="text-orange-400 font-medium">{s.skill}:</span>{" "}
              {s.label} | <span className="text-neutral-300">{s.details}</span>
            </span>

            {isEditing && (
              <button
                onClick={() => handleRemove(i)}
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
