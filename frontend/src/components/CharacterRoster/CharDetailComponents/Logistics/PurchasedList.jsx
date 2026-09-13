import { Fragment } from "react";

/**
 * Renders a sold/owned list. Items may carry an optional `group` label (e.g.
 * a gearset's name) — when any do, a divider + header is inserted wherever
 * the group changes between adjacent items, so callers that want grouping
 * just need to sort `items` so same-group entries are adjacent first (see
 * gearSlotEntries in LogisticsView). Callers with no `group` field render
 * exactly as before: one flat list.
 */
function PurchasedList({ title, items, onSell }) {
  if (items.length === 0) return null;
  const hasGroups = items.some(
    (item) => typeof item !== "string" && item.group,
  );

  return (
    <div className="bg-neutral-900 border border-neutral-700 rounded p-3">
      <div className="text-xs text-orange-400 mb-1">{title}</div>
      <ul className="text-xs text-neutral-300 space-y-1">
        {items.map((item, index) => {
          const group = typeof item === "string" ? null : item.group;
          const prevGroup =
            index > 0 && typeof items[index - 1] !== "string"
              ? items[index - 1].group
              : null;
          const isNewGroup = hasGroups && group !== prevGroup;

          return (
            <Fragment key={index}>
              {isNewGroup && (
                <li
                  className={`text-[10px] uppercase tracking-wide text-neutral-500 pt-1 ${
                    index > 0 ? "mt-1 border-t border-neutral-700" : ""
                  }`}
                >
                  {group || "Other"}
                </li>
              )}
              <li className="flex items-center justify-between gap-2">
                <span>{typeof item === "string" ? item : item.label}</span>
                {onSell &&
                  typeof item !== "string" &&
                  (item.sellable ? (
                    <button
                      onClick={() => onSell(item)}
                      className="text-neutral-500 hover:text-red-400 shrink-0 cursor-pointer"
                    >
                      Sell
                    </button>
                  ) : (
                    <span className="text-neutral-700 shrink-0">N/A</span>
                  ))}
              </li>
            </Fragment>
          );
        })}
      </ul>
    </div>
  );
}

export default PurchasedList;
