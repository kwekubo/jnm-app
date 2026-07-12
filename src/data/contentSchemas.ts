import { z } from "zod";

// ---------------------------------------------------------------------------
// Lesson content wire format (schema v0.3.1) — the structured written
// material for a Jen Nia Mondo lesson: dialogue transcript, margin
// vocabulary, grammar notes, drills, pattern-practice tables and written
// exercises. Produced by the jnm-content pipeline; served as
// content/<lesson-id>.json objects referenced from jnm-meta.json.
// ---------------------------------------------------------------------------

const headingSchema = z.object({ eo: z.string(), en: z.string() });

const vocabEntrySchema = z.object({
  term: z.string(),
  gloss: z.string(),
  note: z.string().optional(),
});

const dialogueTurnSchema = z.object({
  speaker: z.string(),
  text: z.string(),
});

const noteExampleSchema = z.object({
  eo: z.string(),
  en: z.string().optional(),
});

const noteTableCellSchema = z.object({
  eo: z.string(),
  en: z.string().optional(),
});

const noteSchema = z.object({
  rule: z.string(),
  body: z.string().optional(),
  examples: z.array(noteExampleSchema).optional(),
  table: z
    .object({
      columnHeaders: z.array(z.string()),
      rows: z.array(z.array(noteTableCellSchema)),
    })
    .optional(),
});

const drillItemSchema = z.object({
  prompt: z.string(),
  promptGloss: z.string().optional(),
  cue: z.string().optional(),
  answer: z.string(),
  answerGloss: z.string().optional(),
});

const drillGroupSchema = z.object({
  model: z
    .object({
      prompt: z.string(),
      cue: z.string().optional(),
      answer: z.string(),
      answerGloss: z.string().optional(),
    })
    .optional(),
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
  answer: z.string(),
  answerGloss: z.string().optional(),
});

const passageLineSchema = z.object({
  speaker: z.string(),
  text: z.string(),
});

const exerciseSchema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("fillBlanks"),
    instructions: z.string(),
    items: z.array(
      z.object({
        text: z.string(),
        answers: z.array(z.array(z.string())),
        openEnded: z.boolean(),
      })
    ),
  }),
  z.object({
    kind: z.literal("matchPairs"),
    instructions: z.string(),
    pairs: z.array(z.object({ eo: z.string(), en: z.string() })),
  }),
  z.object({
    kind: z.literal("openResponse"),
    instructions: z.string(),
    items: z.array(promptAnswerItemSchema),
  }),
  z.object({
    kind: z.literal("transform"),
    instructions: z.string(),
    items: z.array(promptAnswerItemSchema),
  }),
  z.object({
    kind: z.literal("translateList"),
    instructions: z.string(),
    items: z.array(promptAnswerItemSchema),
  }),
  z.object({
    kind: z.literal("wordBuilding"),
    instructions: z.string(),
    items: z.array(promptAnswerItemSchema),
  }),
  z.object({
    kind: z.literal("translatePassage"),
    instructions: z.string(),
    lines: z.array(passageLineSchema),
    modelAnswer: z.object({ lines: z.array(passageLineSchema) }),
  }),
]);

const sectionSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("dialogue"),
    turns: z.array(dialogueTurnSchema),
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
    tables: z.array(patternTableSchema),
  }),
  z.object({
    type: z.literal("writtenExercises"),
    heading: headingSchema.optional(),
    exercises: z.array(exerciseSchema),
  }),
]);

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
