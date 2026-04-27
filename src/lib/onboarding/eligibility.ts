export type EligibilityAnswer = "yes" | "no";

export type ImmobilizationStatus =
  | "removed_or_near_removal"
  | "still_immobilized"
  | "not_sure";

export type InjuryArea =
  | "finger_or_metacarpal"
  | "other_body_part"
  | "not_sure";

export type EligibilityResult =
  | "eligible"
  | "not_eligible"
  | "needs_clinician_attention";

export interface EligibilityGateAnswers {
  clinicianEvaluated: EligibilityAnswer;
  immobilizationStatus: ImmobilizationStatus;
  injuryArea: InjuryArea;
  hasRedFlags: EligibilityAnswer;
}

export function classifyEligibility(
  answers: EligibilityGateAnswers
): EligibilityResult {
  if (answers.hasRedFlags === "yes") {
    return "needs_clinician_attention";
  }

  if (answers.clinicianEvaluated !== "yes") {
    return "not_eligible";
  }

  if (answers.immobilizationStatus !== "removed_or_near_removal") {
    return "not_eligible";
  }

  if (answers.injuryArea !== "finger_or_metacarpal") {
    return "not_eligible";
  }

  return "eligible";
}
