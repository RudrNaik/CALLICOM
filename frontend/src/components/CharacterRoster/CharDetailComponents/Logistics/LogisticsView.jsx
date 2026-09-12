import { useEffect } from "react";
import equipmentData from "../../../../data/Equipment.json";
import gearSetsData from "../../../../data/geasrSets.json";
import {
  sellPurchase,
  getPurchaseEntries,
  getGadgetSubmunitionOptions,
} from "../../../../engine/logisticsEngine";
import {
  getPurchasedGadgetIds,
  getGearPieceByIdAnyClass,
} from "../../../../engine/equipmentEngine";
import { getMoneyTotal, ensureStartingLog } from "../../../../engine/logsEngine";
import EquipmentPurchaseCard from "./EquipmentPurchaseCard";
import GearSlotPurchaseCard, { GEAR_SLOT_LABELS } from "./GearSlotPurchaseCard";

function LogisticsView({ character, refreshCharacter }) {
  const money = getMoneyTotal(character, equipmentData);
  const logs = ensureStartingLog(character, character?.logs ?? []);

  // Guarantees the starting log exists even if this tab is opened before the
  // Logs tab ever is (see LogsView's matching effect / createStartingLog).
  useEffect(() => {
    if (!character?.logs || character.logs.length === 0) {
      refreshCharacter({ logs });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [character?.logs?.length]);

  const handleSell = (entry) => {
    const result = sellPurchase(
      character,
      logs,
      entry.missionIndex,
      entry.purchaseIndex,
      equipmentData,
    );
    if (!result) return;
    refreshCharacter(result);
  };

  // Nothing here is stored on the character — all derived fresh from `logs`
  // each render (see logisticsEngine.getPurchaseEntries). Only purchases on
  // the current buy period (the most recently logged mission) are
  // `sellable` — anything from an older mission is committed for good (see
  // logisticsEngine.sellPurchase).
  const currentMissionIndex = logs.length - 1;
  const purchasedGadgetIds = getPurchasedGadgetIds(logs);
  const gadgetEntries = getPurchaseEntries(logs, "gadget")
    .map(({ missionIndex, purchaseIndex, purchase }) => {
      const gadget = equipmentData.find((g) => g.id === purchase.value);
      if (!gadget) return null;
      const submunitions = getGadgetSubmunitionOptions(gadget, equipmentData);
      const unlockedCount = submunitions.filter(
        (sub) => !sub.cost || purchasedGadgetIds.includes(sub.id),
      ).length;
      const submunitionNote =
        submunitions.length > 0
          ? ` — ${unlockedCount}/${submunitions.length} submunitions unlocked`
          : "";
      return {
        label: `${gadget.title}${submunitionNote}`,
        missionIndex,
        purchaseIndex,
        sellable: missionIndex === currentMissionIndex,
      };
    })
    .filter(Boolean);

  // Listed alongside their parent gadget rather than folded into just the
  // "X/Y unlocked" count on it, so each one can be sold on its own (see
  // logisticsEngine.sellPurchase — selling the parent gadget instead sells
  // these too, if they're still in the same buy period).
  const submunitionEntries = getPurchaseEntries(logs, "submunition")
    .map(({ missionIndex, purchaseIndex, purchase }) => {
      const submunition = equipmentData.find((i) => i.id === purchase.value);
      if (!submunition) return null;
      const parentGadget = equipmentData.find((item) =>
        (item.options ?? []).some((option) => option.id === submunition.id),
      );
      return {
        label: parentGadget
          ? `${parentGadget.title}: ${submunition.title}`
          : submunition.title,
        missionIndex,
        purchaseIndex,
        sellable: missionIndex === currentMissionIndex,
      };
    })
    .filter(Boolean);

  const weaponEntries = getPurchaseEntries(logs, "weapon").map(
    ({ missionIndex, purchaseIndex, purchase }) => ({
      label: `${purchase.value.name || "Unnamed Weapon"} (${purchase.value.category}${
        purchase.value.family ? ` / ${purchase.value.family}` : ""
      })`,
      missionIndex,
      purchaseIndex,
      sellable: missionIndex === currentMissionIndex,
    }),
  );

  const grenadeEntries = getPurchaseEntries(logs, "grenade").map(
    ({ missionIndex, purchaseIndex, purchase }) => ({
      label:
        equipmentData.find((g) => g.id === purchase.value)?.title ||
        purchase.value,
      missionIndex,
      purchaseIndex,
      sellable: missionIndex === currentMissionIndex,
    }),
  );

  // Grouped by gearset (see PurchasedList) so it's clear at a glance how
  // much of a set you actually own — the gearset name only needs to appear
  // once, as the group header, rather than repeated on every line. Sorted so
  // same-gearset entries end up adjacent for that grouping to work; "Other"
  // (a piece whose gearset can no longer be found in geasrSets.json) always
  // sorts last.
  const gearSlotEntries = getPurchaseEntries(logs, "gearSlot")
    .map(({ missionIndex, purchaseIndex, purchase }) => {
      const piece = getGearPieceByIdAnyClass(gearSetsData, purchase.value);
      const slotLabel = GEAR_SLOT_LABELS[purchase.slot] || purchase.slot;
      return {
        label: piece
          ? `${slotLabel}: ${piece.name}`
          : `${slotLabel}: ${purchase.label}`,
        group: piece?.gearsetName || "Other",
        missionIndex,
        purchaseIndex,
        sellable: missionIndex === currentMissionIndex,
      };
    })
    .sort((a, b) => {
      if (a.group === b.group) return 0;
      if (a.group === "Other") return 1;
      if (b.group === "Other") return -1;
      return a.group.localeCompare(b.group);
    });

  return (
    <div className="text-white space-y-6">
      <div className="flex flex-wrap items-center gap-4">
        <div className="bg-gradient-to-t from-neutral-800 to-neutral-850 border-l-4 border-orange-500 px-4 py-2 rounded-xs inline-block">
          <span className="block text-xs text-neutral-400">Current Cash</span>
          <span className="text-lg font-bold text-green-400">${money}</span>
        </div>
      </div>

      <EquipmentPurchaseCard
        character={character}
        logs={logs}
        refreshCharacter={refreshCharacter}
        gadgetEntries={gadgetEntries}
        submunitionEntries={submunitionEntries}
        weaponEntries={weaponEntries}
        grenadeEntries={grenadeEntries}
        onSell={handleSell}
      />

      <GearSlotPurchaseCard
        character={character}
        logs={logs}
        refreshCharacter={refreshCharacter}
        gearSlotEntries={gearSlotEntries}
        onSell={handleSell}
      />
    </div>
  );
}

export default LogisticsView;
