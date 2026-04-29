import type {
  BodyPart,
  JobType,
  RecoveryProfileInput,
} from "@/lib/onboarding/recovery-profile";

const millisecondsPerDay = 24 * 60 * 60 * 1000;

const bodyPartLabels: Record<BodyPart, string> = {
  finger: "Finger",
  metacarpal: "Metacarpal",
};

const jobTypeLabels: Record<JobType, string> = {
  desk: "Desk / computer work",
  manual: "Manual or tool-heavy work",
  caregiving: "Caregiving or household tasks",
  student: "Student",
  other: "Other daily-use pattern",
};

export function getBodyPartLabel(bodyPart: BodyPart) {
  return bodyPartLabels[bodyPart];
}

export function getJobTypeLabel(jobType: JobType) {
  return jobTypeLabels[jobType];
}

export function formatDominantHandImpact(value: RecoveryProfileInput["dominantHandAffected"]) {
  return value === "yes" ? "Yes" : "No";
}

export function getRecoveryWindowSummary(castRemovedAt: string, now = new Date()) {
  const removalDate = new Date(`${castRemovedAt}T00:00:00`);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const diff = Math.floor((today.getTime() - removalDate.getTime()) / millisecondsPerDay);

  if (diff < 0) {
    const daysUntilRemoval = Math.abs(diff);

    return `Your cast is scheduled to come off in ${daysUntilRemoval} ${
      daysUntilRemoval === 1 ? "day" : "days"
    }. This plan is built for the 14 days after removal.`;
  }

  if (diff <= 14) {
    const windowDay = diff + 1;

    return `You are in day ${windowDay} of the critical 2-week window after cast removal.`;
  }

  return `You removed your cast ${diff} days ago. This plan still focuses on the early recovery motions many people miss.`;
}
