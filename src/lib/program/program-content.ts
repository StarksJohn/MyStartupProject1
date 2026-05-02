import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

import { Prisma } from "@prisma/client";
import { z } from "zod";

const totalProgramDays = 14;
const dangerSignals = [
  "severe pain",
  "numbness",
  "blue or purple color change",
  "fever",
  "pus",
  "sudden swelling",
  "inability to move",
];

const programDaySchema = z.object({
  dayIndex: z.number().int().min(1).max(totalProgramDays),
  stage: z.string().min(1),
  title: z.string().min(1),
  focus: z.string().min(1),
  summary: z.string().min(1),
  exerciseSlugs: z.array(z.string().min(1)).min(1),
  faqSlugs: z.array(z.string().min(1)).min(1),
  normalSignals: z.array(z.string().min(1)).min(1),
  getHelpSignals: z.array(z.string().min(1)).min(1),
  safetyNotes: z.array(z.string().min(1)).min(1),
  estimatedMinutes: z.number().int().min(1).max(60),
});

const programTemplateSchema = z.object({
  templateVersion: z.string().min(1),
  bodyPart: z.enum(["finger", "metacarpal"]),
  stages: z.array(z.string().min(1)).min(1),
  days: z.array(programDaySchema).length(totalProgramDays),
});

const exerciseSchema = z.object({
  slug: z.string().min(1),
  title: z.string().min(1),
  bodyPart: z.enum(["finger", "metacarpal"]),
  stage: z.string().min(1),
  instructions: z.array(z.string().min(1)).min(1),
  contraindications: z.array(z.string().min(1)).min(1),
  durationSeconds: z.number().int().min(1),
  repetitions: z.string().min(1),
  videoUrl: z.string().nullable(),
  thumbnailUrl: z.string().nullable(),
});

const faqSchema = z.object({
  slug: z.string().min(1),
  source: z.enum(["AAOS", "NHS", "GUZHE", "FAQ", "BLOG"]),
  bodyPart: z.enum(["finger", "metacarpal", "general"]),
  phase: z.string().min(1),
  riskLevel: z.enum(["low", "medium", "escalation"]),
  question: z.string().min(1),
  answer: z.string().min(1),
  escalationRequired: z.boolean(),
});

const exerciseFileSchema = z
  .union([exerciseSchema, z.array(exerciseSchema)])
  .transform((value) => (Array.isArray(value) ? value : [value]));

const faqFileSchema = z
  .union([faqSchema, z.array(faqSchema)])
  .transform((value) => (Array.isArray(value) ? value : [value]));

export type ProgramTemplate = z.infer<typeof programTemplateSchema>;
export type ProgramTemplateDay = z.infer<typeof programDaySchema>;
export type ProgramExercise = z.infer<typeof exerciseSchema>;
export type ProgramFaq = z.infer<typeof faqSchema>;

export interface ProgramContentBundle {
  templates: ProgramTemplate[];
  exercises: ProgramExercise[];
  faqs: ProgramFaq[];
}

export interface RecoveryProfileForTemplate {
  bodyPart: string;
  subType: string;
  hasHardware: string;
  referredToPt: string;
  painLevel: number;
  dominantHandAffected: boolean;
  jobType: string;
  notes: string | null;
  riskFlagsJson: Prisma.JsonValue | null;
}

export interface GeneratedProgramDayInput {
  dayIndex: number;
  stage: string;
  estimatedMinutes: number;
  contentJson: Prisma.InputJsonObject;
}

export interface GeneratedProgramContent {
  templateVersion: string;
  generatedSummaryJson: Prisma.InputJsonObject;
  days: GeneratedProgramDayInput[];
}

let cachedProgramContentBundle: ProgramContentBundle | null = null;

function contentDirectory(...segments: string[]) {
  return path.join(process.cwd(), "content", ...segments);
}

export function isRuntimeContentFile(fileName: string) {
  return fileName.endsWith(".json") && !path.basename(fileName).startsWith("_");
}

function formatZodError(filePath: string, error: z.ZodError) {
  const details = error.issues
    .map((issue) => `${issue.path.join(".") || "<root>"}: ${issue.message}`)
    .join("; ");

  return `Invalid program content in ${filePath}: ${details}`;
}

async function readJsonFile(filePath: string) {
  const raw = await readFile(filePath, "utf8");

  try {
    return JSON.parse(raw) as unknown;
  } catch (error) {
    throw new Error(`Invalid JSON in ${filePath}: ${(error as Error).message}`);
  }
}

async function readContentFiles<T>(
  directory: string,
  parse: (value: unknown, filePath: string) => T[]
) {
  const entries = await readdir(directory);
  const runtimeFiles = entries.filter(isRuntimeContentFile).sort();
  const results: T[] = [];

  for (const fileName of runtimeFiles) {
    const filePath = path.join(directory, fileName);
    const parsed = await readJsonFile(filePath);
    results.push(...parse(parsed, filePath));
  }

  return results;
}

function parseTemplate(value: unknown, filePath: string) {
  const parsed = programTemplateSchema.safeParse(value);

  if (!parsed.success) {
    throw new Error(formatZodError(filePath, parsed.error));
  }

  return [parsed.data];
}

function parseExercises(value: unknown, filePath: string) {
  const parsed = exerciseFileSchema.safeParse(value);

  if (!parsed.success) {
    throw new Error(formatZodError(filePath, parsed.error));
  }

  return parsed.data;
}

function parseFaqs(value: unknown, filePath: string) {
  const parsed = faqFileSchema.safeParse(value);

  if (!parsed.success) {
    throw new Error(formatZodError(filePath, parsed.error));
  }

  return parsed.data;
}

function assertUniqueDays(template: ProgramTemplate) {
  const indexes = new Set(template.days.map((day) => day.dayIndex));

  if (indexes.size !== totalProgramDays) {
    throw new Error(
      `Program template ${template.templateVersion} must contain unique dayIndex values 1-14.`
    );
  }

  for (let dayIndex = 1; dayIndex <= totalProgramDays; dayIndex += 1) {
    if (!indexes.has(dayIndex)) {
      throw new Error(
        `Program template ${template.templateVersion} is missing day ${dayIndex}.`
      );
    }
  }
}

function assertUniqueSlugs(items: Array<{ slug: string }>, label: string) {
  const seen = new Set<string>();

  for (const item of items) {
    if (seen.has(item.slug)) {
      throw new Error(`Duplicate ${label} slug: ${item.slug}`);
    }

    seen.add(item.slug);
  }
}

export function validateProgramContentReferences(bundle: ProgramContentBundle) {
  if (bundle.templates.length === 0) {
    throw new Error("No runtime program templates found in content/programs.");
  }

  if (bundle.exercises.length === 0) {
    throw new Error("No runtime exercises found in content/exercises.");
  }

  if (bundle.faqs.length === 0) {
    throw new Error("No runtime FAQ entries found in content/faq.");
  }

  assertUniqueSlugs(bundle.exercises, "exercise");
  assertUniqueSlugs(bundle.faqs, "FAQ");

  const exerciseSlugs = new Set(bundle.exercises.map((exercise) => exercise.slug));
  const faqSlugs = new Set(bundle.faqs.map((faq) => faq.slug));

  for (const template of bundle.templates) {
    assertUniqueDays(template);

    for (const day of template.days) {
      for (const exerciseSlug of day.exerciseSlugs) {
        if (!exerciseSlugs.has(exerciseSlug)) {
          throw new Error(
            `Program template ${template.templateVersion} day ${day.dayIndex} references missing exercise slug: ${exerciseSlug}`
          );
        }
      }

      for (const faqSlug of day.faqSlugs) {
        if (!faqSlugs.has(faqSlug)) {
          throw new Error(
            `Program template ${template.templateVersion} day ${day.dayIndex} references missing FAQ slug: ${faqSlug}`
          );
        }
      }
    }
  }
}

export async function loadProgramContentBundle(): Promise<ProgramContentBundle> {
  if (cachedProgramContentBundle) {
    return cachedProgramContentBundle;
  }

  const bundle = {
    templates: await readContentFiles(
      contentDirectory("programs"),
      parseTemplate
    ),
    exercises: await readContentFiles(
      contentDirectory("exercises"),
      parseExercises
    ),
    faqs: await readContentFiles(contentDirectory("faq"), parseFaqs),
  };

  validateProgramContentReferences(bundle);
  cachedProgramContentBundle = bundle;

  return bundle;
}

function normalizeBodyPart(bodyPart: string): ProgramTemplate["bodyPart"] {
  return bodyPart.toLowerCase().includes("metacarpal")
    ? "metacarpal"
    : "finger";
}

export function selectProgramTemplate(
  profile: Pick<RecoveryProfileForTemplate, "bodyPart">,
  templates: ProgramTemplate[]
) {
  const normalizedBodyPart = normalizeBodyPart(profile.bodyPart);
  const exactTemplate = templates.find(
    (template) => template.bodyPart === normalizedBodyPart
  );
  const fallbackTemplate = templates.find((template) => template.bodyPart === "finger");

  if (!exactTemplate && !fallbackTemplate) {
    throw new Error("No safe finger program template is available.");
  }

  return exactTemplate ?? fallbackTemplate!;
}

function getPersonalizationFlags(profile: RecoveryProfileForTemplate) {
  const flags: string[] = [];

  if (profile.dominantHandAffected) {
    flags.push("dominant-hand daily-use caution");
  }

  if (profile.jobType === "desk") {
    flags.push("typing and desk-task pacing");
  }

  if (profile.painLevel >= 7) {
    flags.push("higher pain caution");
  }

  if (profile.hasHardware === "yes" || profile.referredToPt === "yes") {
    flags.push("follow clinician-specific restrictions first");
  }

  return flags;
}

function createDayContentJson({
  day,
  template,
  profile,
  exerciseMap,
  faqMap,
  personalizationFlags,
}: {
  day: ProgramTemplateDay;
  template: ProgramTemplate;
  profile: RecoveryProfileForTemplate;
  exerciseMap: Map<string, ProgramExercise>;
  faqMap: Map<string, ProgramFaq>;
  personalizationFlags: string[];
}): Prisma.InputJsonObject {
  const exercises = day.exerciseSlugs.map((slug) => exerciseMap.get(slug)!);
  const faqs = day.faqSlugs.map((slug) => faqMap.get(slug)!);
  const profileCautions = [
    profile.painLevel >= 7
      ? "Your pain score is high, so keep today especially gentle and contact a clinician if pain worsens."
      : null,
    profile.dominantHandAffected
      ? "Because your dominant hand is affected, keep daily tasks short and avoid compensating with force."
      : null,
    profile.hasHardware === "yes"
      ? "Because hardware was reported, clinician-specific restrictions come before this educational plan."
      : null,
  ].filter(Boolean);

  return {
    templateVersion: template.templateVersion,
    bodyPart: template.bodyPart,
    dayIndex: day.dayIndex,
    stage: day.stage,
    title: day.title,
    focus: day.focus,
    summary: day.summary,
    exerciseSlugs: day.exerciseSlugs,
    exercises: exercises.map((exercise) => ({
      slug: exercise.slug,
      title: exercise.title,
      instructions: exercise.instructions,
      contraindications: exercise.contraindications,
      durationSeconds: exercise.durationSeconds,
      repetitions: exercise.repetitions,
      videoUrl: exercise.videoUrl,
      thumbnailUrl: exercise.thumbnailUrl,
    })),
    faqSlugs: day.faqSlugs,
    faqs: faqs.map((faq) => ({
      slug: faq.slug,
      question: faq.question,
      answer: faq.answer,
      riskLevel: faq.riskLevel,
      escalationRequired: faq.escalationRequired,
    })),
    normalSignals: day.normalSignals,
    getHelpSignals: [...new Set([...day.getHelpSignals, ...dangerSignals])],
    safetyNotes: [...day.safetyNotes, ...profileCautions],
    personalizationFlags,
  };
}

export async function buildTemplateFirstProgram(
  profile: RecoveryProfileForTemplate
): Promise<GeneratedProgramContent> {
  const bundle = await loadProgramContentBundle();
  const template = selectProgramTemplate(profile, bundle.templates);
  const exerciseMap = new Map(
    bundle.exercises.map((exercise) => [exercise.slug, exercise])
  );
  const faqMap = new Map(bundle.faqs.map((faq) => [faq.slug, faq]));
  const personalizationFlags = getPersonalizationFlags(profile);
  const sortedDays = [...template.days].sort((a, b) => a.dayIndex - b.dayIndex);

  return {
    templateVersion: template.templateVersion,
    generatedSummaryJson: {
      source: "template-first",
      templateVersion: template.templateVersion,
      bodyPart: template.bodyPart,
      subType: profile.subType,
      personalizationFlags,
      safetyBoundary:
        "Educational support only. Follow clinician instructions and contact a clinician for danger signs.",
    },
    days: sortedDays.map((day) => ({
      dayIndex: day.dayIndex,
      stage: day.stage,
      estimatedMinutes: day.estimatedMinutes,
      contentJson: createDayContentJson({
        day,
        template,
        profile,
        exerciseMap,
        faqMap,
        personalizationFlags,
      }),
    })),
  };
}
