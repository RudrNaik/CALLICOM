import logoIcon from "../../assets/Images/Calamari_Logo.png";

const TopDeploymentBanner = ({
  unit = "CALAMARI OPERATIONAL SUPPORT GROUP",
  callsign = "GAMBLER | MOBSTER",
  client = "JSDF/MI6/CIA/DGSE",
  payout = "1.5m",
}) => {
  return (
    <div className="text-white bg-neutral-900/80 rounded-xs p-1 border-l-4 border-orange-500 mb-3 mt-2">
      <div className="w-full flex items-center">
        {/* Left: Logo Block */}
        <div
          className="bg-orange-500 flex items-center px-4 py-3 space-x-4 min-w-xl relative"
          style={{
            clipPath:
              "polygon(0 0, calc(100% - 20px) 0, 100% 50%, calc(100% - 20px) 100%, 0 100%)",
          }}
        >
            
          {logoIcon && (
            <img
              src={logoIcon}
              alt="Logo"
              className="w-15 h-15 object-contain"
            />
          )}
          <div>
            <h1 className="uppercase font-extrabold tracking-wide text-white text-lg leading-tight">
              {unit}
            </h1>
            <p className="text-md tracking-wider text-black/80 font-bold">
              UNIT:<span className="text-white"> // {callsign}</span>
            </p>
          </div>
        </div>

        {/* Planet and Deployment Info */}
        <div className="flex-1 px-6 py-3 flex justify-between items-center">
          {/* Planet */}

          {/* Deployment Info */}
          <div className="grid grid-cols-3 gap-6 text-xs uppercase tracking-wider text-gray-200">
            <div>
              <p className="text-gray-400">Clientelle</p>
              <p className="text-white font-bold">{client}</p>
            </div>
            <div>
              <p className="text-gray-400">Payout</p>
              <p className="text-white font-bold">{payout}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TopDeploymentBanner;
