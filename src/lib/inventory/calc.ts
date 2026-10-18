// Inventory, shopping list and production plan calculations.
// Pure functions with no imports, so they run anywhere (server, client, `npm test`).

export const UNITS = ["g", "kg", "ml", "l", "unit", "cup", "tbsp", "tsp"] as const;
export type Unit = (typeof UNITS)[number];

export const UNIT_LABELS: Record<Unit, string> = {
  g: "גרם",
  kg: "ק״ג",
  ml: "מ״ל",
  l: "ליטר",
  unit: "יח׳",
  cup: "כוסות",
  tbsp: "כפות",
  tsp: "כפיות",
};

export const TRACKING = ["measured", "manual"] as const;
export type Tracking = (typeof TRACKING)[number];

export type Material = {
  id: string;
  name: string;
  unit: Unit;
  tracking: Tracking;
  currentStock: number;
  minStockAlert: number;
};

export type MaterialCategory = { id: string; name: string };

/** Materials split by category, in category order; materials without a category come last. */
export function groupByCategory<T extends { categoryId: string | null }>(
  items: T[],
  categories: MaterialCategory[]
): { id: string | null; name: string; items: T[] }[] {
  const known = new Set(categories.map((c) => c.id));
  const groups = categories.map((c) => ({ id: c.id as string | null, name: c.name, items: items.filter((i) => i.categoryId === c.id) }));
  groups.push({ id: null, name: "ללא קטגוריה", items: items.filter((i) => !i.categoryId || !known.has(i.categoryId)) });
  return groups.filter((g) => g.items.length > 0);
}

/** One ingredient of one product, per single unit. optionId null = base recipe (all flavors). */
export type RecipeLine = {
  productId: string;
  optionId: string | null;
  materialId: string;
  /** null for manual materials (vegetables). */
  amountPerUnit: number | null;
};

export type OrderLine = {
  orderId: string;
  pickupDate: string;
  /** Measured stock was already deducted for this order (confirmed / ready / collected). */
  stockDeducted: boolean;
  productId: string | null;
  productTitle: string;
  quantity: number;
  /** Units in one package. */
  unitCount: number;
  options: { id: string | null; label: string }[];
};

export type PrepStep = {
  id: string;
  productId: string;
  title: string;
  daysBefore: number;
  sortOrder: number;
};

/** Total single units on a line: packages × units per package. */
export function lineUnits(line: OrderLine): number {
  return line.quantity * line.unitCount;
}

/** The recipe lines that apply to an order line: the base recipe plus its chosen flavors. */
function recipeForLine(line: OrderLine, recipes: RecipeLine[]): RecipeLine[] {
  const chosen = new Set(line.options.flatMap((o) => (o.id ? [o.id] : [])));
  return recipes.filter((r) => r.productId === line.productId && (r.optionId === null || chosen.has(r.optionId)));
}

/**
 * Amount of each measured material needed for the given lines. Each order's total is rounded up
 * to a whole unit (3.57 eggs → 4), the same way the database deducts stock when an order is confirmed.
 */
export function measuredNeeds(lines: OrderLine[], recipes: RecipeLine[], materials: Material[]): Map<string, number> {
  const measured = new Set(materials.filter((m) => m.tracking === "measured").map((m) => m.id));
  const perOrder = new Map<string, Map<string, number>>();
  for (const line of lines) {
    const units = lineUnits(line);
    const order = perOrder.get(line.orderId) ?? new Map<string, number>();
    for (const r of recipeForLine(line, recipes)) {
      if (r.amountPerUnit === null || !measured.has(r.materialId)) continue;
      order.set(r.materialId, (order.get(r.materialId) ?? 0) + units * r.amountPerUnit);
    }
    perOrder.set(line.orderId, order);
  }
  const needs = new Map<string, number>();
  for (const order of perOrder.values()) {
    for (const [id, amount] of order) needs.set(id, (needs.get(id) ?? 0) + wholeUnits(amount));
  }
  return needs;
}

/**
 * Rounds an amount up to a whole unit of its material (3.57 → 4). Rounds to 2 decimals first,
 * so recipe rounding like 0.1429 × 35 = 5.0015 stays 5 and doesn't become 6.
 */
export function wholeUnits(amount: number): number {
  return Math.ceil(Math.round(amount * 100) / 100);
}

export type ManualUse = { label: string; units: number };

/**
 * For each manual material (vegetables): which products / flavors need it and how many units of each.
 * e.g. בטטה → [{ "קיש · בטטה", 70 }]
 */
export function manualNeeds(lines: OrderLine[], recipes: RecipeLine[], materials: Material[]): Map<string, ManualUse[]> {
  const manual = new Set(materials.filter((m) => m.tracking === "manual").map((m) => m.id));
  const byMaterial = new Map<string, Map<string, number>>();
  for (const line of lines) {
    const units = lineUnits(line);
    for (const r of recipeForLine(line, recipes)) {
      if (!manual.has(r.materialId)) continue;
      const flavor = r.optionId === null ? null : line.options.find((o) => o.id === r.optionId)?.label;
      const label = flavor ? `${line.productTitle} · ${flavor}` : line.productTitle;
      const uses = byMaterial.get(r.materialId) ?? new Map<string, number>();
      uses.set(label, (uses.get(label) ?? 0) + units);
      byMaterial.set(r.materialId, uses);
    }
  }
  return new Map(
    [...byMaterial].map(([id, uses]) => [id, [...uses].map(([label, units]) => ({ label, units })).sort((a, b) => b.units - a.units)])
  );
}

export type ShoppingRow = {
  material: Material;
  /** Needed for orders whose stock wasn't deducted yet. */
  required: number;
  /** max(0, required − current_stock): what's missing for the orders themselves. */
  shortage: number;
  /** Enough to cover the orders and stay at the alert threshold. */
  toBuy: number;
  belowAlert: boolean;
};

export type ShoppingList = {
  measured: ShoppingRow[];
  manual: { material: Material; uses: ManualUse[] }[];
};

/**
 * Shortages only. Confirmed orders were already deducted from current_stock, so only orders
 * not yet deducted add to "required" — nothing is counted twice:
 *   shortage = max(0, required − current_stock)
 * Materials that would end under their alert threshold are listed too; toBuy brings them back to it.
 */
export function shoppingList(lines: OrderLine[], recipes: RecipeLine[], materials: Material[]): ShoppingList {
  const pending = lines.filter((l) => !l.stockDeducted);
  const needs = measuredNeeds(pending, recipes, materials);
  const measured: ShoppingRow[] = [];
  for (const material of materials) {
    if (material.tracking !== "measured") continue;
    const required = needs.get(material.id) ?? 0;
    const after = material.currentStock - required;
    const belowAlert = after < material.minStockAlert;
    const shortage = roundAmount(Math.max(0, -after));
    const toBuy = belowAlert ? roundAmount(material.minStockAlert - after) : 0;
    if (toBuy > 0) measured.push({ material, required, shortage, toBuy, belowAlert });
  }

  // Manual materials aren't deducted automatically, so every active order counts.
  const uses = manualNeeds(lines, recipes, materials);
  const manual = materials.flatMap((material) => {
    const list = uses.get(material.id);
    return list ? [{ material, uses: list }] : [];
  });

  return { measured: measured.sort(byName), manual: manual.sort(byName) };
}

export type DaySummary = {
  pickupDate: string;
  products: { title: string; units: number; flavors: { label: string; units: number }[] }[];
  totalUnits: number;
};

/** Units to make per pickup date and product ("130 קישים"), with the flavor breakdown. */
export function productionSummary(lines: OrderLine[]): DaySummary[] {
  const days = new Map<string, Map<string, { units: number; flavors: Map<string, number> }>>();
  for (const line of lines) {
    const products = days.get(line.pickupDate) ?? new Map();
    const entry = products.get(line.productTitle) ?? { units: 0, flavors: new Map<string, number>() };
    const units = lineUnits(line);
    entry.units += units;
    const flavor = line.options.map((o) => o.label).join(" · ");
    if (flavor) entry.flavors.set(flavor, (entry.flavors.get(flavor) ?? 0) + units);
    products.set(line.productTitle, entry);
    days.set(line.pickupDate, products);
  }
  return [...days]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([pickupDate, products]) => {
      const list = [...products].map(([title, e]) => ({
        title,
        units: e.units,
        flavors: [...e.flavors].map(([label, units]) => ({ label, units })).sort((a, b) => b.units - a.units),
      }));
      return { pickupDate, products: list.sort((a, b) => b.units - a.units), totalUnits: list.reduce((s, p) => s + p.units, 0) };
    });
}

/** One product for one pickup date: the unit the AI planner arranges into days and tasks. */
export type Batch = {
  id: string;
  pickupDate: string;
  productId: string | null;
  productTitle: string;
  /** The product's site categories (קישים, עוגות…), so the planner knows what kind of work it is. */
  categories: string[];
  units: number;
  flavors: { label: string; units: number }[];
  /** Measured ingredients for the whole batch (base + chosen flavors). */
  ingredients: { name: string; amount: number; unit: Unit }[];
  /** Vegetables etc. – no amounts. */
  manual: string[];
};

/** Splits orders into batches (pickup date × product), with ingredient totals computed here, not by the AI. */
export function buildBatches(
  lines: OrderLine[],
  recipes: RecipeLine[],
  materials: Material[],
  categories: Map<string, string[]> = new Map()
): Batch[] {
  const groups = new Map<string, OrderLine[]>();
  for (const line of lines) {
    const key = `${line.pickupDate}|${line.productId ?? line.productTitle}`;
    groups.set(key, [...(groups.get(key) ?? []), line]);
  }
  const byId = new Map(materials.map((m) => [m.id, m]));
  return [...groups.values()]
    .sort((a, b) => a[0]!.pickupDate.localeCompare(b[0]!.pickupDate) || a[0]!.productTitle.localeCompare(b[0]!.productTitle, "he"))
    .map((group, index) => {
      const first = group[0]!;
      const [summary] = productionSummary(group);
      const needs = measuredNeeds(group, recipes, materials);
      return {
        id: `B${index + 1}`,
        pickupDate: first.pickupDate,
        productId: first.productId,
        productTitle: first.productTitle,
        categories: (first.productId && categories.get(first.productId)) || [],
        units: summary?.totalUnits ?? 0,
        flavors: summary?.products[0]?.flavors ?? [],
        ingredients: [...needs].flatMap(([id, amount]) => {
          const m = byId.get(id);
          return m ? [{ name: m.name, amount, unit: m.unit }] : [];
        }),
        manual: [...manualNeeds(group, recipes, materials).keys()].flatMap((id) => {
          const m = byId.get(id);
          return m ? [m.name] : [];
        }),
      };
    });
}

export type PrepTask = {
  stepId: string;
  title: string;
  productTitle: string;
  units: number;
  pickupDate: string;
  daysBefore: number;
};

export type WorkDay = { workDate: string; tasks: PrepTask[] };

/**
 * Prep tasks grouped by the day they should be done: pickup date − days before.
 * A task that would fall on Shabbat moves to Friday.
 */
export function workPlan(lines: OrderLine[], steps: PrepStep[]): WorkDay[] {
  const units = new Map<string, { pickupDate: string; productId: string; productTitle: string; units: number }>();
  for (const line of lines) {
    if (!line.productId) continue;
    const key = `${line.pickupDate}|${line.productId}`;
    const entry = units.get(key) ?? { pickupDate: line.pickupDate, productId: line.productId, productTitle: line.productTitle, units: 0 };
    entry.units += lineUnits(line);
    units.set(key, entry);
  }

  const days = new Map<string, PrepTask[]>();
  for (const entry of units.values()) {
    for (const step of steps.filter((s) => s.productId === entry.productId).sort((a, b) => a.sortOrder - b.sortOrder)) {
      const workDate = workDateFor(entry.pickupDate, step.daysBefore);
      const task: PrepTask = {
        stepId: step.id,
        title: step.title,
        productTitle: entry.productTitle,
        units: entry.units,
        pickupDate: entry.pickupDate,
        daysBefore: step.daysBefore,
      };
      days.set(workDate, [...(days.get(workDate) ?? []), task]);
    }
  }
  return [...days]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([workDate, tasks]) => ({
      workDate,
      tasks: tasks.sort((a, b) => a.pickupDate.localeCompare(b.pickupDate) || b.daysBefore - a.daysBefore),
    }));
}

/** pickupDate − daysBefore, moved back to Friday if it lands on Shabbat. */
export function workDateFor(pickupDate: string, daysBefore: number): string {
  const date = new Date(`${pickupDate}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() - daysBefore);
  if (date.getUTCDay() === 6) date.setUTCDate(date.getUTCDate() - 1);
  return date.toISOString().slice(0, 10);
}

/** "1500 g" → "1.5 ק״ג", "750 ml" → "750 מ״ל", "2.5 cup" → "2.5 כוסות". */
export function formatAmount(amount: number, unit: Unit): string {
  const [value, label] =
    unit === "g" && Math.abs(amount) >= 1000
      ? [amount / 1000, UNIT_LABELS.kg]
      : unit === "ml" && Math.abs(amount) >= 1000
        ? [amount / 1000, UNIT_LABELS.l]
        : [amount, UNIT_LABELS[unit]];
  return `${numberFormatter.format(value)} ${label}`;
}

const numberFormatter = new Intl.NumberFormat("he-IL", { maximumFractionDigits: 2 });

function roundAmount(value: number): number {
  return Math.round(value * 1000) / 1000;
}

function byName<T extends { material: Material }>(a: T, b: T): number {
  return a.material.name.localeCompare(b.material.name, "he");
}
