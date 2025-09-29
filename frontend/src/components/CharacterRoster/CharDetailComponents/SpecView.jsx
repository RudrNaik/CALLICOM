function SpecView({ specializations, isEditing, removeSpec }) {
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
