"use server";

import { assessDbContextQuality } from "@/src/lib/opportunity-radar/db-context-quality";

export async function assessDbContextQualityAction(contextLimit: number = 20) {
  return await assessDbContextQuality(contextLimit);
}
