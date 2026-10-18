import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  buildBatches,
  wholeUnits,
  formatAmount,
  manualNeeds,
  measuredNeeds,
  productionSummary,
  shoppingList,
  workDateFor,
  workPlan,
  type Material,
  type OrderLine,
  type RecipeLine,
} from "./calc.ts";

const QUICHE = "quiche";
const SWEET_POTATO = "opt-sweet-potato";
const EGGPLANT = "opt-eggplant";

const materials: Material[] = [
  { id: "flour", name: "קמח", unit: "g", tracking: "measured", currentStock: 5000, minStockAlert: 0 },
  { id: "eggs", name: "ביצים", unit: "unit", tracking: "measured", currentStock: 30, minStockAlert: 10 },
  { id: "potato", name: "בטטה", unit: "kg", tracking: "manual", currentStock: 0, minStockAlert: 0 },
  { id: "eggplant", name: "חציל", unit: "kg", tracking: "manual", currentStock: 0, minStockAlert: 0 },
];

const recipes: RecipeLine[] = [
  { productId: QUICHE, optionId: null, materialId: "flour", amountPerUnit: 50 },
  { productId: QUICHE, optionId: null, materialId: "eggs", amountPerUnit: 0.5 },
  { productId: QUICHE, optionId: SWEET_POTATO, materialId: "potato", amountPerUnit: null },
  { productId: QUICHE, optionId: EGGPLANT, materialId: "eggplant", amountPerUnit: null },
];

function line(overrides: Partial<OrderLine>): OrderLine {
  return {
    orderId: "o1",
    pickupDate: "2026-11-03",
    stockDeducted: false,
    productId: QUICHE,
    productTitle: "קיש",
    quantity: 1,
    unitCount: 20,
    options: [{ id: SWEET_POTATO, label: "בטטה" }],
    ...overrides,
  };
}

describe("measuredNeeds", () => {
  it("multiplies the single-unit recipe by packages × units per package", () => {
    // Size A (20) × 2 packages + size B (35) × 1 package = 75 quiches.
    const needs = measuredNeeds([line({ quantity: 2, unitCount: 20 }), line({ unitCount: 35 })], recipes, materials);
    assert.equal(needs.get("flour"), 75 * 50);
    assert.equal(needs.get("eggs"), 38); // 37.5 rounded up to a whole egg
  });

  it("ignores manual materials and other products", () => {
    const needs = measuredNeeds([line({}), line({ productId: "other" })], recipes, materials);
    assert.equal(needs.has("potato"), false);
    assert.equal(needs.get("flour"), 20 * 50);
  });
});

describe("manualNeeds", () => {
  it("lists which flavor needs each vegetable and how many units", () => {
    const uses = manualNeeds(
      [line({ quantity: 2 }), line({ unitCount: 35, options: [{ id: EGGPLANT, label: "חציל" }] }), line({ orderId: "o2" })],
      recipes,
      materials
    );
    assert.deepEqual(uses.get("potato"), [{ label: "קיש · בטטה", units: 60 }]);
    assert.deepEqual(uses.get("eggplant"), [{ label: "קיש · חציל", units: 35 }]);
  });

  it("uses only the base recipe when an old order has no flavor ids", () => {
    const uses = manualNeeds([line({ options: [{ id: null, label: "בטטה" }] })], recipes, materials);
    assert.equal(uses.size, 0);
  });
});

describe("shoppingList", () => {
  it("lists only shortages, and doesn't count already-deducted orders twice", () => {
    // 130 quiches pending → 6500 g flour, stock 5000 → short 1500.
    // The deducted order is already reflected in current_stock.
    const list = shoppingList(
      [line({ quantity: 4, unitCount: 20 }), line({ quantity: 1, unitCount: 50 }), line({ stockDeducted: true, quantity: 10 })],
      recipes,
      materials
    );
    const flour = list.measured.find((r) => r.material.id === "flour");
    assert.equal(flour?.required, 6500);
    assert.equal(flour?.shortage, 1500);
    assert.equal(flour?.toBuy, 1500);
  });

  it("omits materials that are in stock, and tops up those under the alert threshold", () => {
    // 20 quiches: flour 1000 of 5000 (fine), eggs 10 of 30 → 20 left, alert 10 (fine).
    assert.deepEqual(shoppingList([line({})], recipes, materials).measured, []);

    // 50 quiches: eggs 25 of 30 → 5 left, under the alert of 10 → buy 5.
    const eggs = shoppingList([line({ unitCount: 50 })], recipes, materials).measured.find((r) => r.material.id === "eggs");
    assert.equal(eggs?.shortage, 0);
    assert.equal(eggs?.toBuy, 5);
    assert.equal(eggs?.belowAlert, true);
  });

  it("treats negative stock as a shortage", () => {
    const short = materials.map((m) => (m.id === "flour" ? { ...m, currentStock: -200 } : m));
    const flour = shoppingList([], recipes, short).measured.find((r) => r.material.id === "flour");
    assert.equal(flour?.toBuy, 200);
  });

  it("lists vegetables for every active order, deducted or not", () => {
    const list = shoppingList([line({ stockDeducted: true }), line({})], recipes, materials);
    assert.deepEqual(list.manual.map((m) => [m.material.id, m.uses]), [["potato", [{ label: "קיש · בטטה", units: 40 }]]]);
  });
});

describe("productionSummary", () => {
  it("totals units per pickup date with the flavor breakdown", () => {
    const [day] = productionSummary([line({ quantity: 2 }), line({ unitCount: 35, options: [{ id: EGGPLANT, label: "חציל" }] }), line({ unitCount: 50 })]);
    assert.equal(day?.totalUnits, 125);
    assert.deepEqual(day?.products[0]?.flavors, [
      { label: "בטטה", units: 90 },
      { label: "חציל", units: 35 },
    ]);
  });
});

describe("workPlan", () => {
  const steps = [
    { id: "s1", productId: QUICHE, title: "בצק", daysBefore: 2, sortOrder: 0 },
    { id: "s2", productId: QUICHE, title: "מלית ואפייה", daysBefore: 1, sortOrder: 1 },
    { id: "s3", productId: QUICHE, title: "אריזה", daysBefore: 0, sortOrder: 2 },
  ];

  it("places each step on its day before pickup", () => {
    // Pickup Tuesday 3.11 → dough Sunday 1.11, filling Monday 2.11, packing Tuesday.
    const plan = workPlan([line({ quantity: 6, unitCount: 20 }), line({ unitCount: 10 })], steps);
    assert.deepEqual(
      plan.map((d) => [d.workDate, d.tasks.map((t) => `${t.title}:${t.units}`)]),
      [
        ["2026-11-01", ["בצק:130"]],
        ["2026-11-02", ["מלית ואפייה:130"]],
        ["2026-11-03", ["אריזה:130"]],
      ]
    );
  });

  it("moves a task from Shabbat to Friday", () => {
    // Pickup Sunday 8.11: one day before is Shabbat 7.11 → Friday 6.11.
    assert.equal(workDateFor("2026-11-08", 1), "2026-11-06");
    assert.equal(workDateFor("2026-11-08", 2), "2026-11-06");
    assert.equal(workDateFor("2026-11-08", 0), "2026-11-08");
  });
});

describe("formatAmount", () => {
  it("shows large gram and ml amounts in kg and liters", () => {
    assert.equal(formatAmount(1500, "g"), "1.5 ק״ג");
    assert.equal(formatAmount(750, "ml"), "750 מ״ל");
    assert.equal(formatAmount(2.5, "cup"), "2.5 כוסות");
  });
});

describe("buildBatches", () => {
  it("groups by pickup date and product, with ingredient totals from the recipe", () => {
    const batches = buildBatches(
      [line({ quantity: 2 }), line({ pickupDate: "2026-11-04" }), line({ unitCount: 35, options: [{ id: EGGPLANT, label: "חציל" }] })],
      recipes,
      materials
    );
    assert.equal(batches.length, 2);
    const [first] = batches;
    assert.equal(first?.id, "B1");
    assert.equal(first?.units, 75);
    assert.deepEqual(first?.ingredients, [
      { name: "קמח", amount: 3750, unit: "g" },
      { name: "ביצים", amount: 38, unit: "unit" },
    ]);
    assert.deepEqual(first?.manual, ["בטטה", "חציל"]);
    assert.equal(batches[1]?.pickupDate, "2026-11-04");
  });
});

describe("wholeUnits", () => {
  it("rounds totals up to a whole unit, ignoring recipe rounding noise", () => {
    assert.equal(wholeUnits(3.5725), 4); // 0.1429 egg × 25
    assert.equal(wholeUnits(5.0015), 5); // 0.1429 egg × 35 – really 5
    assert.equal(wholeUnits(499.9995), 500);
    assert.equal(wholeUnits(357.1425), 358);
  });

  it("rounds each order separately, like the stock deduction", () => {
    // Three orders of one quiche at 0.5 egg each: each order takes a whole egg → 3 (not 1.5 → 2).
    const lines = ["a", "b", "c"].map((orderId) => line({ orderId, unitCount: 1 }));
    assert.equal(measuredNeeds(lines, recipes, materials).get("eggs"), 3);
  });
});
