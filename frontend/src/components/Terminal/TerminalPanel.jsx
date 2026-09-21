import { Link } from "react-router-dom";

const TerminalPanel = ({ title, subtitle, icon, onHover, link }) => {
  return (
    <div>
      <Link to={link}>
      <div
        onMouseEnter={() =>
          onHover(
            `/access/${title.toLowerCase()}`,
            subtitle
          )
        }
        className={`
          relative
          p-3 pl-4 pr-10
          border border-orange-500/80
          rounded-sm
          bg-neutral-900
          bg-[radial-gradient(circle,_rgba(255,100,0,0.06)_1px,_transparent_1px)]
          [background-size:8px_8px]
          hover:bg-orange-500/80
          hover:shadow-inner
          transition duration-200
          group cursor-pointer
        `}
      >
          <h1 className="text-xl font-bold tracking-wider flex items-center gap-2 pl-2 pb-2 py-1">
            <span className="text-orange-400">{icon}</span> {title}
          </h1>
        
        <p className="text-xs text-gray-300 tracking-wider flex items-center">&gt; {subtitle}</p>
      </div>
      </Link>
    </div>
  );
};

export default TerminalPanel;
