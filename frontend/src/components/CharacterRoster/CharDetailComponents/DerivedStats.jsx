import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

function DerivedStats({ character, userId, refreshCharacter }) {
  const navigate = useNavigate();

  // ---- safe defaults if character is momentarily undefined ----
  const attrs = character?.attributes ?? {};
  const skills = character?.skills ?? {};
  const equip = character?.equipment ?? {};

  const [fleshWounds, setFleshWounds] = useState(character?.fleshWounds || 0);
  const [deepWounds, setDeepWounds] = useState(character?.deepWounds || 0);
  const prevWounds = useRef({
    fleshWounds: character?.fleshWounds || 0,
    deepWounds: character?.deepWounds || 0,
  });

  const [isSaving, setIsSaving] = useState(false);
  const timerRef = useRef(null);

  // ---- derived stats ----
  const Alertness = attrs.Expertise || 0;
  const Body = attrs.Body || 0;
  const Intelligence = attrs.Intelligence || 0;
  const Spirit = attrs.Spirit || 0;
  const Brawl = skills.CQC || 0;
  const Melee = skills.Melee || 0;

  const Defense = 1 + Alertness + Body;
  const CombatSense = 1 + Intelligence + Spirit;
  const Health = Math.ceil((Body + Spirit) / 2);
  const Stamina = 5 + Body + Spirit;
  const SystemShock = 5 + Health;

  // IMPORTANT: fix operator precedence; add armor only if present, else 0
  const FleshWoundThreshold = Math.ceil(Stamina / 2) + (equip.armorClass ?? 0);
  const DeepWoundThreshold = Stamina + (equip.armorClass ?? 0);
  const InstantDeath = Stamina * 2;
  const UnarmedDamage = 3 + Body + Brawl;
  const ArmedDamage = 3 + Body + Melee;
  const woundMod = fleshWounds + deepWounds * 2;

  // ---- PATCH after debounce (700ms) only if changed ----
  useEffect(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    timerRef.current = setTimeout(async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        console.log("No token found, redirecting to login.");
        navigate("/login");
        return;
      }

      const changed =
        fleshWounds !== prevWounds.current.fleshWounds ||
        deepWounds !== prevWounds.current.deepWounds;

      if (!changed) return;

      setIsSaving(true);
      try {
        const res = await fetch(
          `https://callicom.onrender.com/api/characters/${userId}/${character?.callsign}`,
          {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ fleshWounds, deepWounds }),
          }
        );

        if (res.ok) {
          prevWounds.current = { fleshWounds, deepWounds };
          refreshCharacter?.();
        } else {
          console.error("Failed to update wounds:", await res.text());
        }
      } catch (err) {
        console.error("Error updating wounds:", err);
      } finally {
        setIsSaving(false);
      }
    }, 700);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [fleshWounds, deepWounds, userId, character?.callsign, navigate, refreshCharacter]);

  // Reset when character changes
  useEffect(() => {
    if (!character) return;
    const fw = character.fleshWounds || 0;
    const dw = character.deepWounds || 0;
    setFleshWounds(fw);
    setDeepWounds(dw);
    prevWounds.current = { fleshWounds: fw, deepWounds: dw };
  }, [character]);

  const handleDecreaseFleshWounds = () =>
    setFleshWounds((v) => Math.max(v - 1, 0));
  const handleIncreaseFleshWounds = () => setFleshWounds((v) => v + 1);

  const handleDecreaseDeepWounds = () =>
    setDeepWounds((v) => Math.max(v - 1, 0));
  const handleIncreaseDeepWounds = () => setDeepWounds((v) => v + 1);

  return (
    <div className="mt-8 text-white font-geist">
      {/* Save state */}
      <div className="flex items-center gap-3 text-sm mb-3">
        {isSaving ? (
          <div className="flex items-center text-orange-400 font-semibold">
            <div className="w-4 h-4 border-2 border-neutral-700 border-t-2 border-t-orange-500 rounded-full animate-spin mr-2" />
            Saving…
          </div>
        ) : (
          <div className="text-orange-400 font-semibold">Saved</div>
        )}
      </div>

      {/* Card */}
      <div className="rounded-sm overflow-hidden bg-gradient-to-t from-neutral-800 to-neutral-850 border-l-8 border-orange-400">

        <div className="grid grid-cols-2 md:grid-cols-4 text-center text-sm">
          {/* Row 1 headers */}
          <HeaderCell>Health</HeaderCell>
          <HeaderCell>Stamina</HeaderCell>
          <HeaderCell>Defense</HeaderCell>
          <HeaderCell>Combat Sense</HeaderCell>

          {/* Row 1 values */}
          <ValueCell>{Health}</ValueCell>
          <ValueCell>{Stamina}</ValueCell>
          <ValueCell>{Defense}</ValueCell>
          <ValueCell>{CombatSense}</ValueCell>

          {/* Row 2 headers */}
          <HeaderCell>Flesh Wound</HeaderCell>
          <HeaderCell>Deep Wound</HeaderCell>
          <HeaderCell>Unarmed DMG</HeaderCell>
          <HeaderCell>Armed DMG</HeaderCell>

          {/* Row 2 values */}
          <ValueCell>{FleshWoundThreshold}</ValueCell>
          <ValueCell>{DeepWoundThreshold}</ValueCell>
          <ValueCell>{UnarmedDamage}</ValueCell>
          <ValueCell>{ArmedDamage}</ValueCell>

          {/* Row 3 headers */}
          <HeaderCell className="text-red-400/90">Instant Death</HeaderCell>
          <HeaderCell className="text-orange-400/90">System Shock</HeaderCell>
          <HeaderCell className="md:col-span-2">
            <span className="text-red-400 font-semibold">Wound Mod</span>
            <span className="ml-2 text-red-500 font-bold">-{woundMod}</span>
          </HeaderCell>

          {/* Row 3 values */}
          <ValueCell>{InstantDeath}</ValueCell>
          <ValueCell>{SystemShock}</ValueCell>

          {/* Counters */}
          <div className="col-span-2 grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-white/5">
            <CounterCell
              title="Flesh Wounds"
              value={fleshWounds}
              onDec={handleDecreaseFleshWounds}
              onInc={handleIncreaseFleshWounds}
              disabled={isSaving}
            />
            <CounterCell
              title="Deep Wounds"
              value={deepWounds}
              onDec={handleDecreaseDeepWounds}
              onInc={handleIncreaseDeepWounds}
              disabled={isSaving}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

/* --- UI bits --- */
function HeaderCell({ children, className = "" }) {
  return (
    <div
      className={[
        "bg-neutral-900/70 font-semibold py-2.5",
        "border-b border-white/5",
        "text-xs tracking-wide uppercase text-white/80",
        className,
      ].join(" ")}
    >
      {children}
    </div>
  );
}

function ValueCell({ children }) {
  return (
    <div className="bg-neutral-900/30 py-3 border-b border-white/5">
      <span className="text-base tabular-nums">{children}</span>
    </div>
  );
}

function CounterCell({ title, value, onDec, onInc, disabled }) {
  return (
    <div className="bg-neutral-900/30 py-3 flex flex-col items-center gap-2">
      <span className="font-semibold text-orange-400 text-sm">{title}</span>
      <div className="flex items-center gap-3">
        <RoundBtn sign="−" onClick={onDec} disabled={disabled} ariaLabel={`${title} minus`} />
        <span className="min-w-6 text-center text-lg tabular-nums">{value}</span>
        <RoundBtn sign="+" onClick={onInc} disabled={disabled} ariaLabel={`${title} plus`} />
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
        isPlus ? "focus:ring-1 focus:ring-orange-500/50" : "focus:ring-1 focus:ring-red-500/50",
      ].join(" ")}
    >
      <span className={isPlus ? "text-orange-400" : "text-red-400"}>{sign}</span>
    </button>
  );
}

export default DerivedStats;
