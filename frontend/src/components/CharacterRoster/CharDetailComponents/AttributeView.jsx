function AttributeView({ character }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
      {Object.entries(character.attributes).map(([key, val]) => (
        <div className="bg-neutral-800 p-2 rounded" key={key}>
          <div className="font-semibold text-orange-300">{key}</div>
          <div>{val}</div>
        </div>
      ))}
    </div>
  );
}

export default AttributeView;
