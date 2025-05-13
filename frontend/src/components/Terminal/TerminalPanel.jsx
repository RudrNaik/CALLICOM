import { Link } from "react-router-dom";

const TerminalPanel = ({ title, subtitle, icon, onHover, link }) => {
  return (
    <div>
      <div
        onMouseEnter={() =>
          onHover(
            `/access/${title.toLowerCase()}`,
            subtitle
          )
        }
        className={`
          relative
          p-6 pl-8 pr-10
          border border-orange-500/80
          rounded-md
          bg-neutral-900
          bg-[radial-gradient(circle,_rgba(255,100,0,0.06)_1px,_transparent_1px)]
          [background-size:8px_8px]
          hover:bg-orange-500/80
          hover:shadow-inner
          transition duration-200
          group cursor-pointer
        `}
      >
        <Link to={link}>
          <h1 className="text-3xl font-bold tracking-wider flex items-center gap-3 p-2">
            <span>{icon}</span> {title}
          </h1>
        </Link>
        <p className="text-md text-gray-300 mt-2 tracking-wider flex items-center gap-3">&gt; {subtitle}</p>
      </div>
    </div>
  );
};

export default TerminalPanel;
