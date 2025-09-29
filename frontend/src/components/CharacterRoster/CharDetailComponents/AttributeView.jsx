function AttributeView({ character }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
      
        <div className="bg-gradient-to-t from-neutral-800 to-neutral-850 p-2 rounded">
          <div className="font-semibold text-orange-300">Alertness</div>
          <div>{character.attributes.Expertise}</div>
        </div>
        <div className="bg-gradient-to-t from-neutral-800 to-neutral-850 p-2 rounded">
          <div className="font-semibold text-orange-300">Body</div>
          <div>{character.attributes.Body}</div>
        </div>
        <div className="bg-gradient-to-t from-neutral-800 to-neutral-850 p-2 rounded">
          <div className="font-semibold text-orange-300">Intelligence</div>
          <div>{character.attributes.Intelligence}</div>
        </div>
        <div className="bg-gradient-to-t from-neutral-800 to-neutral-850 p-2 rounded">
          <div className="font-semibold text-orange-300">Spirit</div>
          <div>{character.attributes.Spirit}</div>
        </div>
    </div>
  );
}

export default AttributeView;
