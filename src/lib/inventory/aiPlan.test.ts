import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { checkPlan } from "./aiPlan.ts";
import type { Batch } from "./calc.ts";

const batches: Batch[] = [
  { id: "B1", pickupDate: "2026-11-03", productId: "p1", productTitle: "קיש", categories: [], units: 130, flavors: [], ingredients: [], manual: [] },
  { id: "B2", pickupDate: "2026-11-03", productId: "p2", productTitle: "סלט", categories: [], units: 20, flavors: [], ingredients: [], manual: [] },
];

const task = (title: string, batchIds: string[]) => ({ group: "בצקים", time: "בוקר", title, details: "", batchIds });

describe("checkPlan", () => {
  it("drops unknown batch ids and warns about unplanned batches", () => {
    const { plan, warnings } = checkPlan({ days: [{ date: "2026-11-02", tasks: [task("בצק", ["B1", "B9"])] }], notes: [] }, batches);
    assert.deepEqual(plan.days[0]?.tasks[0]?.batchIds, ["B1"]);
    assert.deepEqual(warnings, ["לא תוכננה הכנה לסלט (20 יח׳, איסוף 2026-11-03)"]);
  });

  it("warns about tasks after pickup and on Shabbat", () => {
    const { warnings } = checkPlan(
      {
        days: [
          { date: "2026-11-07", tasks: [task("בצק", ["B1"])] },
          { date: "2026-11-03", tasks: [task("סלט", ["B2"])] },
        ],
        notes: [],
      },
      batches
    );
    assert.ok(warnings.some((w) => w.includes("אחרי מועד האיסוף")));
    assert.ok(warnings.some((w) => w.includes("בשבת")));
  });
});
