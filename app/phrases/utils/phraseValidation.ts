/**
 * Gentle phrase validation for speech input.
 * Keyword-based matching - prioritizes encouragement over correctness.
 * Keep separate from UI for easy expansion.
 */

export const PHRASE_RULES: Record<
  string,
  { required: string[]; optional: string[] }
> = {
  "I need to use the restroom": {
    required: ["need"],
    optional: ["restroom", "bathroom", "toilet"],
  },
  "I am hungry": {
    required: ["hungry"],
    optional: [],
  },
  "I'm sorry": {
    required: ["sorry"],
    optional: [],
  },
  "May I have some please": {
    required: ["please"],
    optional: ["have", "some"],
  },
};

export function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/gi, "")
    .trim();
}

export type ValidationStatus = "success" | "partial" | "try_again" | "unknown";

export interface ValidationResult {
  status: ValidationStatus;
}

export function validateSpeech(
  transcript: string,
  targetPhrase: string
): ValidationResult {
  const rules = PHRASE_RULES[targetPhrase];
  if (!rules) return { status: "unknown" };

  const normalized = normalizeText(transcript);

  const hasRequired = rules.required.every((word) =>
    normalized.includes(word)
  );

  const hasOptional =
    rules.optional.length === 0 ||
    rules.optional.some((word) => normalized.includes(word));

  if (hasRequired && hasOptional) {
    return { status: "success" };
  }

  if (hasRequired) {
    return { status: "partial" };
  }

  return { status: "try_again" };
}
