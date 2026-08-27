import { z } from "zod";

// ---------------------------------------------------------------------------
// Lesson content wire format (schema v0.6.1) — the structured written material
// for a Jen Nia Mondo lesson: dialogue transcript, margin vocabulary, grammar
// notes, drills, pattern-practice tables and written exercises.
//
// COMPLETE FILE — replaces C:\jnm\jnm-app\src\data\contentSchemas.ts wholesale.
// It contains the original v0.3.1 schema plus every later addition (round-1,
// v2, v3, v4), so no hand-edits are needed and none of the old paste-block
// instructions in round1-install.md apply any more. Verified against all 25
// final lesson JSONs.
// ---------------------------------------------------------------------------

const headingSchema = z.object({
  eo: z.string().optional(),
  en: z.string().optional(),
});

const vocabEntrySchema = z.object({
  term: z.string(),
  gloss: z.string().optional(),
  note: z.string().optional(),
});

const dialogueTurnSchema = z.object({
  speaker: z.string().nullable(),
  text: z.string(),
});

const dialogueIllustrationSchema = z.object({
  asset: z.string(),
  alt: z.string().optional(),
  beforeTurn: z.number().optional(),
  afterTurn: z.number().optional(),
});

const noteExampleSchema = z.object({
  eo: z.string().optional(),
  en: z.string().optional(),
});

const noteTableCellSchema = z.object({
  eo: z.string().optional(),
  en: z.string().optional(),
});

const noteTableSchema = z.object({
  columnHeaders: z.array(z.string()),
  rows: z.array(z.array(noteTableCellSchema)),
});

const noteSchema = z.object({
  rule: z.string(),
  body: z.string().optional(),
  examples: z.array(noteExampleSchema).optional(),
  table: noteTableSchema.optional(),
  footnote: z.string().optional(),
});

const modelSchema = z.object({
  prompt: z.string(),
  promptGloss: z.string().optional(),
  cue: z.string().optional(),
  answer: z.string().optional(),
  answerGloss: z.string().optional(),
});

const drillItemSchema = z.object({
  prompt: z.string(),
  promptGloss: z.string().optional(),
  cue: z.string().optional(),
  answer: z.string(),
  answerGloss: z.string().optional(),
});

const drillGroupSchema = z.object({
  model: modelSchema.optional(),
  modelNote: z.string().optional(),
  instructions: z.string().optional(),
  items: z.array(drillItemSchema),
});

const patternCellSchema = z.object({
  text: z.string(),
  gloss: z.string().optional(),
});

const patternTableSchema = z.object({
  columns: z.array(z.array(patternCellSchema)),
});

const promptAnswerItemSchema = z.object({
  prompt: z.string(),
  promptGloss: z.string().optional(),
  answer: z.string().optional(),
  answerGloss: z.string().optional(),
});

const passageLineSchema = z.object({
  speaker: z.string().nullable(),
  text: z.string(),
});

const referenceSchema = z.object({
  label: z.string().optional(),
  items: z.array(z.string()),
  bullets: z.boolean().optional(),
});

const exerciseExtras = {
  model: modelSchema.optional(),
  table: noteTableSchema.optional(),
  image: z
    .object({ asset: z.string(), alt: z.string().optional() })
    .optional(),
  footnote: z.string().optional(),
  reference: referenceSchema.optional(),
  boxA: referenceSchema.optional(),
  boxB: referenceSchema.optional(),
};

const exerciseSchema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("fillBlanks"),
    instructions: z.string(),
    items: z.array(
      z.object({
        text: z.string(),
        answers: z.array(z.array(z.string())),
        openEnded: z.boolean().optional(),
      })
    ),
    ...exerciseExtras,
  }),
  z.object({
    kind: z.literal("matchPairs"),
    instructions: z.string(),
    pairs: z.array(z.object({ eo: z.string(), en: z.string() })),
    ...exerciseExtras,
  }),
  z.object({
    kind: z.literal("openResponse"),
    instructions: z.string(),
    items: z.array(promptAnswerItemSchema),
    ...exerciseExtras,
  }),
  z.object({
    kind: z.literal("transform"),
    instructions: z.string(),
    items: z.array(promptAnswerItemSchema),
    ...exerciseExtras,
  }),
  z.object({
    kind: z.literal("translateList"),
    instructions: z.string(),
    items: z.array(promptAnswerItemSchema),
    ...exerciseExtras,
  }),
  z.object({
    kind: z.literal("wordBuilding"),
    instructions: z.string(),
    items: z.array(promptAnswerItemSchema),
    ...exerciseExtras,
  }),
  z.object({
    kind: z.literal("translatePassage"),
    instructions: z.string(),
    lines: z.array(passageLineSchema),
    modelAnswer: z.object({ lines: z.array(passageLineSchema) }),
    ...exerciseExtras,
  }),
]);

const sectionSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("dialogue"),
    heading: headingSchema.optional(),
    turns: z.array(dialogueTurnSchema),
    illustrations: z.array(dialogueIllustrationSchema).optional(),
  }),
  z.object({
    type: z.literal("notes"),
    heading: headingSchema.optional(),
    notes: z.array(noteSchema),
  }),
  z.object({
    type: z.literal("drill"),
    heading: headingSchema.optional(),
    groups: z.array(drillGroupSchema),
  }),
  z.object({
    type: z.literal("patternPractice"),
    heading: headingSchema.optional(),
    instructions: z.string().optional(),
    model: modelSchema.optional(),
    tables: z.array(patternTableSchema),
    footnote: z.string().optional(),
  }),
  z.object({
    type: z.literal("writtenExercises"),
    heading: headingSchema.optional(),
    exercises: z.array(exerciseSchema),
  }),
]);

const extraIllustrationSchema = z.object({
  asset: z.string(),
  alt: z.string().optional(),
  placement: z.string().optional(),
});

export const lessonContentSchema = z.object({
  schemaVersion: z.literal(1),
  id: z.string(),
  course: z.string(),
  number: z.number(),
  part: z.number(),
  title: z.string(),
  illustration: z
    .object({ asset: z.string(), alt: z.string() })
    .optional(),
  extraIllustrations: z.array(extraIllustrationSchema).optional(),
  speakers: z.record(z.string(), z.string()),
  editorialNotes: z.string().optional(),
  vocabulary: z.array(vocabEntrySchema),
  sections: z.array(sectionSchema),
});

export type LessonContent = z.infer<typeof lessonContentSchema>;
export type LessonContentSection = z.infer<typeof sectionSchema>;
export type LessonContentExercise = z.infer<typeof exerciseSchema>;
export type LessonContentNote = z.infer<typeof noteSchema>;
export type DrillGroup = z.infer<typeof drillGroupSchema>;
export type PatternTable = z.infer<typeof patternTableSchema>;

export const parseLessonContent = (raw: unknown): LessonContent => {
  const result = lessonContentSchema.safeParse(raw);
  if (!result.success) {
    const issue = result.error.issues[0];
    const where = issue ? issue.path.join(".") : "unknown";
    const what = issue ? issue.message : "invalid content";
    throw new Error(`Lesson content failed validation at ${where}: ${what}`);
  }
  return result.data;
};
