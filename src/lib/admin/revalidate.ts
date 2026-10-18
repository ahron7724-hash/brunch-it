import "server-only";

import { revalidatePath } from "next/cache";

/** After any admin change, refresh every shop page (they are cached for speed). */
export function revalidateSite() {
  revalidatePath("/", "layout");
}
