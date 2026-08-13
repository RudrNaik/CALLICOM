function SpecView({ specializations, isEditing, removeSpec }) {
  const handleRemove = (index) => {
    const ok = window.confirm(
      "Remove this specialization and return 5 XP?"
    );
    if (!ok) return;
    removeSpec(index);
  };

  return (
    <div>

      <ul className="list-disc list-inside text-sm space-y-1">
        {specializations.map((s, i) => (
          <li key={i} className="flex justify-between items-center">
            <span>
              <span className="text-orange-300 font-medium">{s.skill}:</span>{" "}
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
