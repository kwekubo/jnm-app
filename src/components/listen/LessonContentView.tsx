import React, { createContext, useContext, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { FontAwesome5 } from "@expo/vector-icons";

import type {
  DrillGroup,
  LessonContent,
  LessonContentExercise,
  LessonContentNote,
  LessonContentSection,
  PatternTable,
} from "@/src/data/contentSchemas";
import { useLessonContent } from "@/src/hooks/useLessonContent";
import type { CourseName } from "@/src/types";

// ---------------------------------------------------------------------------
// Renders the written material of a lesson (schema v0.3.1) for one of the
// text tabs: dialogue, vocabulary, notes, or exercises. Answers are hidden
// behind tappable chips; each exercise card offers "Show answers"; model
// answers for translation passages sit behind a single reveal.
// ---------------------------------------------------------------------------

export type ContentTab = "dialogue" | "vocabulary" | "notes" | "exercises";

const AMBER_BG = "#FAEEDA";
const AMBER_TEXT = "#633806";

type Palette = { text: string; dim: string; line: string };

const RevealContext = createContext(0);

const AnswerChip = ({ answer, gloss }: { answer: string; gloss?: string }) => {
  const tick = useContext(RevealContext);
  const [revealed, setRevealed] = useState(false);
  useEffect(() => {
    if (tick > 0) setRevealed(true);
  }, [tick]);
  return (
    <Text>
      <Text
        onPress={() => setRevealed((r) => !r)}
        style={styles.chip}
        suppressHighlighting
      >
        {revealed ? ` ${answer} ` : "  •••  "}
      </Text>
      {revealed && gloss ? <Text style={styles.chipGloss}> {gloss}</Text> : null}
    </Text>
  );
};

const SectionHeading = ({
  eo,
  en,
  p,
}: {
  eo?: string;
  en?: string;
  p: Palette;
}) =>
  eo || en ? (
    <View style={styles.headingRow}>
      {eo ? <Text style={[styles.headingEo, { color: p.text }]}>{eo}</Text> : null}
      {en ? <Text style={[styles.headingEn, { color: p.dim }]}>{en}</Text> : null}
    </View>
  ) : null;

const Card = ({
  children,
  p,
  onShowAll,
}: {
  children: React.ReactNode;
  p: Palette;
  onShowAll?: () => void;
}) => (
  <View style={[styles.card, { borderColor: p.line }]}>
    {children}
    {onShowAll ? (
      <Pressable onPress={onShowAll} hitSlop={8}>
        <Text style={[styles.showAll, { color: p.dim }]}>Show answers</Text>
      </Pressable>
    ) : null}
  </View>
);

// --- dialogue ----------------------------------------------------------------

const DialogueBlock = ({
  content,
  p,
  hasDialogueAudio,
  onPlayDialogue,
}: {
  content: LessonContent;
  p: Palette;
  hasDialogueAudio: boolean;
  onPlayDialogue?: () => void;
}) => {
  const speakerNames = Object.entries(content.speakers);
  const dialogues = content.sections.filter(
    (s): s is Extract<LessonContentSection, { type: "dialogue" }> =>
      s.type === "dialogue"
  );
  return (
    <View>
      {speakerNames.length ? (
        <Text style={[styles.speakerLegend, { color: p.dim }]}>
          {speakerNames.map(([k, v]) => `${k}. = ${v}`).join("   ")}
        </Text>
      ) : null}
      {dialogues.map((d, i) => (
        <View key={i}>
          {d.turns.map((t, j) => (
            <Text key={j} style={[styles.turn, { color: p.text }]}>
              <Text style={styles.turnSpeaker}>{t.speaker}.</Text> {t.text}
            </Text>
          ))}
        </View>
      ))}
      {hasDialogueAudio && onPlayDialogue ? (
        <Pressable
          onPress={onPlayDialogue}
          style={[styles.dialogueButton, { borderColor: p.text }]}
          android_ripple={{ color: "rgba(255,255,255,0.15)" }}
        >
          <FontAwesome5 name="headphones" size={16} color={p.text} />
          <Text style={[styles.dialogueButtonText, { color: p.text }]}>
            Listen to the dialogue
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
};

// --- vocabulary ---------------------------------------------------------------

const VocabularyBlock = ({
  content,
  p,
}: {
  content: LessonContent;
  p: Palette;
}) => (
  <View>
    {content.vocabulary.map((v, i) => (
      <View key={i} style={[styles.vocabRow, { borderColor: p.line }]}>
        <Text style={[styles.vocabTerm, { color: p.text }]}>{v.term}</Text>
        <View style={styles.vocabRight}>
          <Text style={[styles.vocabGloss, { color: p.text }]}>{v.gloss}</Text>
          {v.note ? (
            <Text style={[styles.vocabNote, { color: p.dim }]}>{v.note}</Text>
          ) : null}
        </View>
      </View>
    ))}
  </View>
);

// --- notes ---------------------------------------------------------------------

const NoteBlock = ({ note, p }: { note: LessonContentNote; p: Palette }) => (
  <View style={styles.noteBlock}>
    <Text style={styles.noteRule}>{note.rule}</Text>
    {note.body ? (
      <Text style={[styles.noteBody, { color: p.text }]}>{note.body}</Text>
    ) : null}
    {note.examples?.map((ex, i) => (
      <Text key={i} style={[styles.noteExample, { color: p.text }]}>
        <Text style={styles.noteExampleEo}>{ex.eo}</Text>
        {ex.en ? <Text style={{ color: p.dim }}>  — {ex.en}</Text> : null}
      </Text>
    ))}
    {note.table ? (
      <View style={[styles.table, { borderColor: p.line }]}>
        {note.table.columnHeaders.some((h) => h) ? (
          <View style={[styles.tableRow, { borderColor: p.line }]}>
            {note.table.columnHeaders.map((h, i) => (
              <Text key={i} style={[styles.tableHeader, { color: p.dim }]}>
                {h}
              </Text>
            ))}
          </View>
        ) : null}
        {note.table.rows.map((row, i) => (
          <View key={i} style={[styles.tableRow, { borderColor: p.line }]}>
            {row.map((cell, j) => (
              <View key={j} style={styles.tableCell}>
                <Text style={{ color: p.text, fontStyle: "italic" }}>
                  {cell.eo}
                </Text>
                {cell.en ? (
                  <Text style={{ color: p.dim, fontSize: 13 }}>{cell.en}</Text>
                ) : null}
              </View>
            ))}
          </View>
        ))}
      </View>
    ) : null}
  </View>
);

// --- drills ---------------------------------------------------------------------

const DrillGroupBlock = ({ group, p }: { group: DrillGroup; p: Palette }) => {
  const [tick, setTick] = useState(0);
  return (
    <RevealContext.Provider value={tick}>
      <Card p={p} onShowAll={() => setTick((t) => t + 1)}>
        {group.instructions ? (
          <Text style={[styles.instructions, { color: p.dim }]}>
            {group.instructions}
          </Text>
        ) : null}
        {group.model ? (
          <View style={[styles.modelBox, { borderColor: p.line }]}>
            <Text style={[styles.modelLabel, { color: p.dim }]}>MODEL</Text>
            <Text style={{ color: p.text }}>
              {group.model.prompt}
              {group.model.cue ? (
                <Text style={{ color: p.dim }}>  ({group.model.cue})</Text>
              ) : null}
              {"  →  "}
              <Text style={styles.modelAnswer}>{group.model.answer}</Text>
              {group.model.answerGloss ? (
                <Text style={{ color: p.dim }}>  {group.model.answerGloss}</Text>
              ) : null}
            </Text>
          </View>
        ) : null}
        {group.items.map((item, i) => (
          <Text key={i} style={[styles.exerciseItem, { color: p.text }]}>
            {item.prompt}
            {item.promptGloss ? (
              <Text style={{ color: p.dim }}>  ({item.promptGloss})</Text>
            ) : null}
            {item.cue ? (
              <Text style={{ color: p.dim }}>  ({item.cue})</Text>
            ) : null}
            {"  →"}
            <AnswerChip answer={item.answer} gloss={item.answerGloss} />
          </Text>
        ))}
      </Card>
    </RevealContext.Provider>
  );
};

// --- pattern practice -------------------------------------------------------------

const PatternTableBlock = ({
  table,
  p,
}: {
  table: PatternTable;
  p: Palette;
}) => (
  <View style={[styles.patternRow, { borderColor: p.line }]}>
    {table.columns.map((col, i) => (
      <View
        key={i}
        style={[
          styles.patternColumn,
          { borderColor: p.line },
          i > 0 && styles.patternColumnDivider,
        ]}
      >
        {col.map((cell, j) => (
          <View key={j} style={styles.patternCell}>
            <Text style={{ color: p.text, fontSize: 14 }}>{cell.text}</Text>
            {cell.gloss ? (
              <Text style={{ color: p.dim, fontSize: 11 }}>{cell.gloss}</Text>
            ) : null}
          </View>
        ))}
      </View>
    ))}
  </View>
);

// --- written exercises --------------------------------------------------------------

const FillBlanksItem = ({
  text,
  answers,
  p,
}: {
  text: string;
  answers: string[][];
  p: Palette;
}) => {
  const parts = text.split("{gap}");
  return (
    <Text style={[styles.exerciseItem, { color: p.text }]}>
      {parts.map((part, i) => (
        <Text key={i}>
          {part}
          {i < parts.length - 1 ? (
            <AnswerChip answer={(answers[i] ?? []).join(" / ")} />
          ) : null}
        </Text>
      ))}
    </Text>
  );
};

const ExerciseBlock = ({
  exercise,
  p,
}: {
  exercise: LessonContentExercise;
  p: Palette;
}) => {
  const [tick, setTick] = useState(0);
  const [showModel, setShowModel] = useState(false);

  if (exercise.kind === "translatePassage") {
    return (
      <Card p={p}>
        <Text style={[styles.instructions, { color: p.dim }]}>
          {exercise.instructions}
        </Text>
        {exercise.lines.map((line, i) => (
          <Text key={i} style={[styles.turn, { color: p.text }]}>
            <Text style={styles.turnSpeaker}>{line.speaker}.</Text> {line.text}
          </Text>
        ))}
        <Pressable onPress={() => setShowModel((s) => !s)} hitSlop={8}>
          <Text style={[styles.showAll, { color: p.dim }]}>
            {showModel ? "Hide model answer" : "Show model answer"}
          </Text>
        </Pressable>
        {showModel ? (
          <View style={styles.modelAnswerPanel}>
            {exercise.modelAnswer.lines.map((line, i) => (
              <Text key={i} style={[styles.turn, { color: AMBER_TEXT }]}>
                <Text style={styles.turnSpeaker}>{line.speaker}.</Text>{" "}
                {line.text}
              </Text>
            ))}
          </View>
        ) : null}
      </Card>
    );
  }

  return (
    <RevealContext.Provider value={tick}>
      <Card p={p} onShowAll={() => setTick((t) => t + 1)}>
        <Text style={[styles.instructions, { color: p.dim }]}>
          {exercise.instructions}
        </Text>
        {exercise.kind === "fillBlanks"
          ? exercise.items.map((item, i) => (
              <FillBlanksItem
                key={i}
                text={item.text}
                answers={item.answers}
                p={p}
              />
            ))
          : null}
        {exercise.kind === "matchPairs" ? (
          <View>
            {exercise.pairs.map((pair, i) => (
              <Text key={i} style={[styles.exerciseItem, { color: p.text }]}>
                {pair.eo}
                {"  →"}
                <AnswerChip answer={pair.en} />
              </Text>
            ))}
            <Text style={[styles.matchNote, { color: p.dim }]}>
              (the booklet prints the two columns shuffled)
            </Text>
          </View>
        ) : null}
        {exercise.kind === "transform" ||
        exercise.kind === "translateList" ||
        exercise.kind === "wordBuilding" ||
        exercise.kind === "openResponse"
          ? exercise.items.map((item, i) => (
              <Text key={i} style={[styles.exerciseItem, { color: p.text }]}>
                {item.prompt}
                {item.promptGloss ? (
                  <Text style={{ color: p.dim }}>  ({item.promptGloss})</Text>
                ) : null}
                {"  →"}
                <AnswerChip answer={item.answer} gloss={item.answerGloss} />
              </Text>
            ))
          : null}
      </Card>
    </RevealContext.Provider>
  );
};

// --- top level -------------------------------------------------------------------

const LessonContentView = ({
  course,
  lesson,
  tab,
  textColor,
  hasDialogueAudio,
  onPlayDialogue,
}: {
  course: CourseName;
  lesson: number;
  tab: ContentTab;
  textColor: string;
  hasDialogueAudio: boolean;
  onPlayDialogue?: () => void;
}) => {
  const { content, isLoading, error, refetch } = useLessonContent(
    course,
    lesson
  );
  const p: Palette = {
    text: textColor,
    dim: "rgba(255,255,255,0.65)",
    line: "rgba(255,255,255,0.22)",
  };

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={textColor} />
      </View>
    );
  }
  if (error) {
    return (
      <View style={styles.center}>
        <Text style={{ color: p.dim, textAlign: "center", marginBottom: 12 }}>
          {error.message}
        </Text>
        <Pressable onPress={() => refetch()} hitSlop={8}>
          <Text style={{ color: textColor, textDecorationLine: "underline" }}>
            Try again
          </Text>
        </Pressable>
      </View>
    );
  }
  if (!content) {
    return (
      <View style={styles.center}>
        <Text style={{ color: p.dim, textAlign: "center" }}>
          The written material for this lesson has not been published yet.
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.scrollContent}
    >
      {tab === "dialogue" ? (
        <DialogueBlock
          content={content}
          p={p}
          hasDialogueAudio={hasDialogueAudio}
          onPlayDialogue={onPlayDialogue}
        />
      ) : null}
      {tab === "vocabulary" ? <VocabularyBlock content={content} p={p} /> : null}
      {tab === "notes"
        ? content.sections
            .filter(
              (s): s is Extract<LessonContentSection, { type: "notes" }> =>
                s.type === "notes"
            )
            .map((section, i) => (
              <View key={i}>
                <SectionHeading
                  eo={section.heading?.eo}
                  en={section.heading?.en}
                  p={p}
                />
                {section.notes.map((note, j) => (
                  <NoteBlock key={j} note={note} p={p} />
                ))}
              </View>
            ))
        : null}
      {tab === "exercises"
        ? content.sections.map((section, i) => {
            if (section.type === "drill") {
              return (
                <View key={i}>
                  <SectionHeading
                    eo={section.heading?.eo}
                    en={section.heading?.en}
                    p={p}
                  />
                  {section.groups.map((group, j) => (
                    <DrillGroupBlock key={j} group={group} p={p} />
                  ))}
                </View>
              );
            }
            if (section.type === "patternPractice") {
              return (
                <View key={i}>
                  <SectionHeading
                    eo={section.heading?.eo}
                    en={section.heading?.en}
                    p={p}
                  />
                  {section.tables.map((table, j) => (
                    <PatternTableBlock key={j} table={table} p={p} />
                  ))}
                </View>
              );
            }
            if (section.type === "writtenExercises") {
              return (
                <View key={i}>
                  <SectionHeading
                    eo={section.heading?.eo}
                    en={section.heading?.en}
                    p={p}
                  />
                  {section.exercises.map((exercise, j) => (
                    <ExerciseBlock key={j} exercise={exercise} p={p} />
                  ))}
                </View>
              );
            }
            return null;
          })
        : null}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scroll: { flex: 1, alignSelf: "stretch" },
  scrollContent: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 16 },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  speakerLegend: { fontSize: 13, marginBottom: 12 },
  turn: { fontSize: 16, lineHeight: 24, marginBottom: 8 },
  turnSpeaker: { fontWeight: "700" },
  dialogueButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 11,
    marginTop: 16,
  },
  dialogueButtonText: { fontSize: 15, fontWeight: "600" },
  vocabRow: {
    flexDirection: "row",
    paddingVertical: 7,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  vocabTerm: { width: "42%", fontWeight: "600", fontSize: 15 },
  vocabRight: { flex: 1 },
  vocabGloss: { fontSize: 15 },
  vocabNote: { fontSize: 12, marginTop: 1 },
  headingRow: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
    marginTop: 18,
    marginBottom: 8,
  },
  headingEo: { fontSize: 19, fontWeight: "700" },
  headingEn: { fontSize: 14, fontStyle: "italic" },
  noteBlock: { marginBottom: 18 },
  noteRule: {
    color: "#F4C26B",
    fontSize: 12.5,
    fontWeight: "700",
    letterSpacing: 0.6,
    textTransform: "uppercase",
    marginBottom: 6,
  },
  noteBody: { fontSize: 15, lineHeight: 22, marginBottom: 6 },
  noteExample: { fontSize: 15, lineHeight: 23, marginBottom: 3 },
  noteExampleEo: { fontStyle: "italic" },
  table: { borderWidth: StyleSheet.hairlineWidth, borderRadius: 8, marginTop: 8 },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  tableHeader: { flex: 1, fontSize: 12, fontWeight: "700" },
  tableCell: { flex: 1, paddingRight: 6 },
  card: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 10,
    padding: 12,
    marginBottom: 14,
  },
  instructions: { fontStyle: "italic", fontSize: 14, marginBottom: 8 },
  modelBox: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
  },
  modelLabel: { fontSize: 11, fontWeight: "700", letterSpacing: 1, marginBottom: 4 },
  modelAnswer: { fontStyle: "italic" },
  exerciseItem: { fontSize: 15.5, lineHeight: 26, marginBottom: 9 },
  chip: {
    backgroundColor: AMBER_BG,
    color: AMBER_TEXT,
    fontWeight: "600",
    borderRadius: 6,
    overflow: "hidden",
  },
  chipGloss: { color: "rgba(255,255,255,0.65)", fontSize: 13 },
  showAll: {
    fontSize: 13,
    textDecorationLine: "underline",
    marginTop: 4,
    alignSelf: "flex-end",
  },
  matchNote: { fontSize: 12, fontStyle: "italic", marginTop: 2 },
  modelAnswerPanel: {
    backgroundColor: AMBER_BG,
    borderRadius: 8,
    padding: 10,
    marginTop: 8,
  },
  patternRow: {
    flexDirection: "row",
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 10,
    marginBottom: 12,
    overflow: "hidden",
  },
  patternColumn: { flex: 1, paddingVertical: 6, paddingHorizontal: 8 },
  patternColumnDivider: { borderLeftWidth: StyleSheet.hairlineWidth },
  patternCell: { marginBottom: 6 },
});

export default LessonContentView;
