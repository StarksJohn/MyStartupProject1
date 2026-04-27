import { z } from "zod";

export const bodyPartOptions = ["finger", "metacarpal"] as const;
export const hardwareOptions = ["yes", "no", "not_sure"] as const;
export const ptReferralOptions = ["yes", "no", "not_sure"] as const;
export const jobTypeOptions = [
  "desk",
  "manual",
  "caregiving",
  "student",
  "other",
] as const;

export type BodyPart = (typeof bodyPartOptions)[number];
export type HardwareStatus = (typeof hardwareOptions)[number];
export type PtReferralStatus = (typeof ptReferralOptions)[number];
export type JobType = (typeof jobTypeOptions)[number];

function isValidDateString(value: string) {
  const timestamp = Date.parse(value);

  if (Number.isNaN(timestamp)) {
    return false;
  }

  return new Date(timestamp).toISOString().startsWith(value);
}

export const recoveryProfileSchema = z.object({
  bodyPart: z.enum(bodyPartOptions, {
    error: "Choose whether this is a finger or metacarpal recovery.",
  }),
  subType: z
    .string()
    .trim()
    .min(2, { error: "Describe the subtype in at least 2 characters." })
    .max(80, { error: "Keep the subtype under 80 characters." }),
  castRemovedAt: z
    .string()
    .trim()
    .refine(isValidDateString, {
      error: "Enter a valid cast removal date.",
    }),
  hasHardware: z.enum(hardwareOptions, {
    error: "Choose whether hardware is present.",
  }),
  referredToPt: z.enum(ptReferralOptions, {
    error: "Choose whether PT was recommended.",
  }),
  painLevel: z
    .number({ error: "Choose your current pain level." })
    .int({ error: "Pain level must be a whole number." })
    .min(0, { error: "Pain level cannot be below 0." })
    .max(10, { error: "Pain level cannot be above 10." }),
  dominantHandAffected: z.enum(["yes", "no"], {
    error: "Choose whether your dominant hand is affected.",
  }),
  jobType: z.enum(jobTypeOptions, {
    error: "Choose the work or daily-use category that fits best.",
  }),
  notes: z
    .string()
    .trim()
    .max(500, { error: "Keep notes under 500 characters." })
    .optional()
    .or(z.literal("")),
});

export type RecoveryProfileInput = z.infer<typeof recoveryProfileSchema>;

export interface RecoveryProfileSaveInput
  extends Omit<RecoveryProfileInput, "dominantHandAffected"> {
  dominantHandAffected: boolean;
}

export function toRecoveryProfileSaveInput(
  input: RecoveryProfileInput
): RecoveryProfileSaveInput {
  return {
    ...input,
    dominantHandAffected: input.dominantHandAffected === "yes",
    notes: input.notes?.trim() || undefined,
  };
}
