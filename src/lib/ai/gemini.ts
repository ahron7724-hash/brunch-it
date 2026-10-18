import "server-only";

import { GoogleGenAI } from "@google/genai";
import { z } from "zod";

// Gemini, used only from admin Server Actions. The key stays on the server (never NEXT_PUBLIC_).

export const AI_MODEL = process.env.GEMINI_MODEL || "gemini-3.8-flash";

export type AiResult<T> = { ok: true; data: T } | { ok: false; message: string };

let client: GoogleGenAI | null = null;

function getClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  client ??= new GoogleGenAI({ apiKey });
  return client;
}

// JSON Schema keywords sent to Gemini. Everything else (pattern, maxLength, and minItems/maxItems,
// which gemini-3.5-flash-lite rejects with 400 although the docs list them) is stripped here and
// enforced by zod on the answer instead.
const SUPPORTED_KEYWORDS = new Set([
  "type", "title", "description", "anyOf", "$ref", "$defs", "properties", "required", "additionalProperties",
  "enum", "format", "minimum", "maximum", "items", "prefixItems",
]);

/** Keeps only the schema keywords Gemini supports (recursively; property names are kept as-is). */
function geminiSchema(node: unknown): unknown {
  if (Array.isArray(node)) return node.map(geminiSchema);
  if (typeof node !== "object" || node === null) return node;
  return Object.fromEntries(
    Object.entries(node).flatMap(([key, value]) => {
      if (!SUPPORTED_KEYWORDS.has(key)) return [];
      if (key === "properties" || key === "$defs") {
        return [[key, Object.fromEntries(Object.entries(value as object).map(([name, sub]) => [name, geminiSchema(sub)]))]];
      }
      return [[key, geminiSchema(value)]];
    })
  );
}

/** Models tried in order when the previous one is overloaded (GEMINI_FALLBACK_MODELS overrides, comma-separated). */
const MODELS = [
  AI_MODEL,
  ...(process.env.GEMINI_FALLBACK_MODELS ?? "gemini-3.6-flash,gemini-3.5-flash-lite").split(",").map((m) => m.trim()),
].filter((m, i, all) => m && all.indexOf(m) === i);

/** Overloaded / rate-limited: worth retrying or trying another model. */
function isTransient(error: unknown): boolean {
  const status = typeof error === "object" && error !== null && "status" in error ? Number(error.status) : NaN;
  if (status === 429 || status === 500 || status === 503) return true;
  const message = error instanceof Error ? error.message : String(error);
  return /"code":\s*(429|500|503)|UNAVAILABLE|RESOURCE_EXHAUSTED|high demand/i.test(message);
}

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Asks Gemini for JSON matching `schema`, and validates the answer before returning it.
 * When a model is overloaded it retries once, then moves to the next model in MODELS.
 */
export async function generateJson<T>(schema: z.ZodType<T>, system: string, prompt: string): Promise<AiResult<T> & { model?: string }> {
  const ai = getClient();
  if (!ai) return { ok: false, message: "חסר מפתח Gemini (GEMINI_API_KEY) בהגדרות השרת." };
  const responseJsonSchema = geminiSchema(z.toJSONSchema(schema));

  let overloaded = false;
  for (const model of MODELS) {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: prompt,
          config: { systemInstruction: system, responseMimeType: "application/json", responseJsonSchema, temperature: 0.3 },
        });
        const text = response.text;
        if (!text) return { ok: false, message: "ה-AI לא החזיר תשובה. נסו שוב." };
        const parsed = schema.safeParse(JSON.parse(text));
        if (!parsed.success) {
          console.error("gemini: invalid response shape", model, parsed.error.issues[0]?.path);
          return { ok: false, message: "ה-AI החזיר תשובה לא תקינה. נסו שוב." };
        }
        return { ok: true, data: parsed.data, model };
      } catch (error) {
        if (!isTransient(error)) {
          console.error("gemini: request failed", model, error instanceof Error ? error.message.slice(0, 300) : "unknown");
          return { ok: false, message: "הפנייה ל-AI נכשלה. נסו שוב בעוד רגע." };
        }
        overloaded = true;
        console.warn("gemini: overloaded, retrying", model, attempt);
        if (attempt === 0) await wait(1500);
      }
    }
  }
  return {
    ok: false,
    message: overloaded ? "Gemini עמוס כרגע (עומס זמני אצל גוגל). נסו שוב בעוד כמה דקות." : "הפנייה ל-AI נכשלה. נסו שוב בעוד רגע.",
  };
}
