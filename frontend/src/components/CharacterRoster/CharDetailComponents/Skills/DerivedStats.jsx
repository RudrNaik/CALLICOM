import { calculateDerivedStats } from "../../../../engine/characterEngine";

function DerivedStats({
  character,
  fleshWounds,
  deepWounds,
  isSavingWounds,
  onIncreaseFlesh,
  onDecreaseFlesh,
  onIncreaseDeep,
  onDecreaseDeep,
}) {
  // Safe defaults
  const attrs = character?.attributes ?? {};
  const skills = character?.skills ?? {};
  const equip = character?.equipment ?? {};

  // the 'derivation' of stats
  const stats = calculateDerivedStats({
    ...character,
    fleshWounds,
    deepWounds,
  });

  const {
    defense: Defense,
    combatSense: CombatSense,
    health: Health,
    stamina: Stamina,
    systemShock: SystemShock,
    fleshThreshold: FleshWoundThreshold,
    deepThreshold: DeepWoundThreshold,
    instantDeath: InstantDeath,
    unarmedDamage: UnarmedDamage,
    armedDamage: ArmedDamage,
    woundMod: woundMod,
  } = stats;

  return (
    <div className="mt-8 text-white font-geist">
      {/* Save state */}
      <div className="flex items-center gap-3 text-sm">
        {isSavingWounds ? (
          <div className="flex items-center text-orange-400 font-semibold">
            <div className="w-4 h-4 border-2 border-neutral-700 border-t-orange-500 rounded-full animate-spin mr-2" />
            Saving…
          </div>
        ) : (
          <div className="text-orange-400 font-semibold">Saved</div>
        )}
      </div>

      <div className="rounded-xs bg-gradient-to-t from-neutral-800 to-neutral-850 border-l-4 border-orange-500 p-2">
        {/* mobile specific view*/}
        <div className="grid grid-cols-2 gap-3 sm:hidden">
          <StatCard label="Health" value={Health} />
          <StatCard label="Stamina" value={Stamina} />
          <StatCard label="Defense" value={Defense} />
          <StatCard label="Combat Sense" value={CombatSense} />

          <StatCard label="Flesh Threshold" value={FleshWoundThreshold} />
          <StatCard label="Deep Threshold" value={DeepWoundThreshold} />

          <StatCard label="Unarmed DMG" value={UnarmedDamage} />
          <StatCard label="Armed DMG" value={ArmedDamage} />

          <StatCard label="System Shock" value={SystemShock} accent="orange" />
          <StatCard label="Instant Death" value={InstantDeath} accent="red" />

          <div className="col-span-2 text-center text-sm font-semibold text-red-400">
            Wound Malus: -{woundMod}
          </div>
        </div>

        {/* desktop */}
        <div className="hidden sm:block space-y-2">
          <StatRow>
            <StatCard label="Health" value={Health} />
            <StatCard label="Stamina" value={Stamina} />
            <StatCard label="Defense" value={Defense} />
            <StatCard label="Combat Sense" value={CombatSense} />
          </StatRow>

          <StatRow>
            <StatCard label="Flesh Threshold" value={FleshWoundThreshold} />
            <StatCard label="Deep Threshold" value={DeepWoundThreshold} />
            <StatCard label="Unarmed DMG" value={UnarmedDamage} />
            <StatCard label="Armed DMG" value={ArmedDamage} />
          </StatRow>

          <StatRow>
            <StatCard
              label="System Shock"
              value={SystemShock}
              accent="orange"
            />
            <StatCard label="Instant Death" value={InstantDeath} accent="red" />
            <div className="flex items-center justify-center col-span-2">
              <span className="text-red-400 font-semibold">
                Wound Mod: −{woundMod}
              </span>
            </div>
          </StatRow>
        </div>

        {/* counters. */}
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-white/5">
          <CounterCell
            title="Flesh Wounds"
            value={fleshWounds}
            onDec={onDecreaseFlesh}
            onInc={onIncreaseFlesh}
            disabled={isSavingWounds}
          />
          <CounterCell
            title="Deep Wounds"
            value={deepWounds}
            onDec={onDecreaseDeep}
            onInc={onIncreaseDeep}
            disabled={isSavingWounds}
          />
        </div>
      </div>
    </div>
  );
}

function StatRow({ children }) {
  return <div className="grid grid-cols-4 gap-2">{children}</div>;
}

function StatCard({ label, value, accent = "default" }) {
  const accentMap = {
    red: "text-red-400",
    orange: "text-orange-400",
    default: "text-neutral-100",
  };

  return (
    <div className="rounded-md border border-neutral-700 bg-neutral-900/60 p-2">
      <p className="text-[10px] tracking-widest text-neutral-400 uppercase">
        {label}
      </p>
      <p className={`text-lg font-bold ${accentMap[accent]}`}>{value}</p>
    </div>
  );
}

function CounterCell({ title, value, onDec, onInc, disabled }) {
  return (
    <div className="bg-neutral-900/40 py-3 flex flex-col items-center gap-2">
      <span className="font-semibold text-orange-400 text-sm tracking-wide">
        {title}
      </span>
      <div className="flex items-center gap-3">
        <RoundBtn
          sign="−"
          onClick={onDec}
          disabled={disabled}
          ariaLabel={`${title} minus`}
        />
        <span className="min-w-6 text-center text-lg tabular-nums">
          {value}
        </span>
        <RoundBtn
          sign="+"
          onClick={onInc}
          disabled={disabled}
          ariaLabel={`${title} plus`}
        />
      </div>
    </div>
  );
}

function RoundBtn({ sign, onClick, disabled, ariaLabel }) {
  const isPlus = sign === "+";

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      disabled={disabled}
      className={[
        "h-8 w-8 inline-flex items-center justify-center rounded-sm",
        "border border-white/10",
        "text-white/90 hover:text-white",
        "hover:border-white/20 hover:bg-white/5",
        "active:scale-[0.98] transition",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        isPlus
          ? "focus:ring-1 focus:ring-orange-500/50"
          : "focus:ring-1 focus:ring-red-500/50",
      ].join(" ")}
    >
      <span className={isPlus ? "text-orange-400" : "text-red-400"}>
        {sign}
      </span>
    </button>
  );
}

export default DerivedStats;
