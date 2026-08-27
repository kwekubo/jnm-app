import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  ActivityIndicator,
  Image,
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
import { contentAssetUrl } from "@/src/utils/contentAssets";
import type { CourseName } from "@/src/types";

// ---------------------------------------------------------------------------
// Renders the written material of a lesson (schema v0.6) for one of the
// text tabs: dialogue, vocabulary, notes, or exercises.
//
// v3 edition (27 Aug 2026). Beyond the conventions edition:
// - illustrations load by URL from the content server (contentAssetUrl);
//   dialogue engravings render inline at their beforeTurn/afterTurn
//   positions, extraIllustrations at the end of the notes or exercises tab
//   according to their placement value;
// - notes sections headed "Ekzercu vin!"/"Skribaj ekzercoj" render on the
//   Exercises tab (they are printed under the practice banner);
// - each tab starts at the top and remembers its own scroll position for
//   the life of this lesson screen;
// - "Show answers" toggles to "Hide answers";
// - pattern-practice boxes and any table wider than two columns scroll
//   sideways rather than clipping words;
// - Pattern Practice headings use the full white heading style;
// - a single space separates arrows from answer chips;
// - null-speaker passage lines render as narration (no stray dot).
// ---------------------------------------------------------------------------

export type ContentTab = "dialogue" | "vocabulary" | "notes" | "exercises";

type Palette = { text: string; dim: string; line: string };

// --- inline markup ----------------------------------------------------------

const ASIDE_DIM = "rgba(255,255,255,0.62)";
const EMPH_FULL = "#FFFFFF";

const unesc = (t: string) => t.replace(/\u0001/g, "*");
const Ital = ({ s }: { s: string }) => {
  const parts = s.split("*");
  if (parts.length === 1) return <>{unesc(s)}</>;
  return (
    <>
      {parts.map((part, i) =>
        i % 2 === 1 ? (
          <Text key={i} style={{ fontStyle: "italic" }}>
            {unesc(part)}
          </Text>
        ) : (
          <Text key={i}>{unesc(part)}</Text>
        )
      )}
    </>
  );
};

const Under = ({ s }: { s: string }) => {
  const parts = s.split("__");
  if (parts.length === 1) return <Emph s={s} />;
  return (
    <>
      {parts.map((part, i) =>
        i % 2 === 1 ? (
          <Text key={i} style={{ textDecorationLine: "underline" }}>
            <Emph s={part} />
          </Text>
        ) : (
          <Emph key={i} s={part} />
        )
      )}
    </>
  );
};
const Chain = ({ s }: { s: string }) => {
  const parts = s.split("~");
  if (parts.length === 1) return <Under s={s} />;
  return (
    <>
      {parts.map((part, i) =>
        i % 2 === 1 ? (
          <Text key={i} style={{ color: ASIDE_DIM }}>
            <Under s={part} />
          </Text>
        ) : (
          <Under key={i} s={part} />
        )
      )}
    </>
  );
};

// **word** renders in the full emphasis colour (used inside grey asides,
// e.g. the je entry's "here: on"); *word* renders italic as before.
const Emph = ({ s }: { s: string }) => {
  const parts = s.split("**");
  if (parts.length === 1) return <Ital s={s} />;
  return (
    <>
      {parts.map((part, i) =>
        i % 2 === 1 ? (
          <Text key={i} style={{ color: EMPH_FULL, fontWeight: "700" }}>
            <Ital s={part} />
          </Text>
        ) : (
          <Ital key={i} s={part} />
        )
      )}
    </>
  );
};

// [..] spans render as greyed asides with upright brackets, in all text
// including dialogue stage directions.
const IT = ({ children }: { children?: string | null }) => {
  if (!children) return null;
  const pre = children.replace(/\\\*/g, "\u0001");
  const segs = pre.split(/(\[[^\[\]]*\])/);
  if (segs.length === 1) return <Chain s={pre} />;
  return (
    <>
      {segs.map((seg, i) =>
        seg.startsWith("[") && seg.endsWith("]") ? (
          <Text key={i} style={{ color: ASIDE_DIM }}>
            {"["}
            <Chain s={seg.slice(1, -1)} />
            {"]"}
          </Text>
        ) : (
          <Chain key={i} s={seg} />
        )
      )}
    </>
  );
};

// --- reveal machinery -------------------------------------------------------

type Reveal = { forceAll: boolean; resetTick: number };
const RevealContext = createContext<Reveal>({ forceAll: false, resetTick: 0 });

const AnswerChip = ({ answer, gloss }: { answer: string; gloss?: string }) => {
  const { forceAll, resetTick } = useContext(RevealContext);
  const [local, setLocal] = useState(false);
  useEffect(() => {
    setLocal(false);
  }, [resetTick]);
  const revealed = forceAll || local;
  return (
    <Text>
      <Text
        onPress={() => setLocal((r) => !r)}
        style={styles.chip}
        suppressHighlighting
      >
        {revealed ? (
          <>
            {" "}
            <IT>{answer}</IT>{" "}
          </>
        ) : (
          "  •••  "
        )}
      </Text>
      {revealed && gloss ? (
        <Text style={styles.chipGloss}>
          {" ["}
          <Text style={{ fontStyle: "italic" }}>
            <IT>{gloss}</IT>
          </Text>
          {"]"}
        </Text>
      ) : null}
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
}) => {
  if (!eo && !en) return null;
  // With no Esperanto title (e.g. "Pattern Practice"), the English title
  // takes the full white heading style rather than the small grey one.
  if (!eo && en) {
    return (
      <View style={styles.headingRow}>
        <Text style={[styles.headingEo, { color: p.text, fontStyle: "normal" }]}>
          {en}
        </Text>
      </View>
    );
  }
  return (
    <View style={styles.headingRow}>
      {eo ? (
        <Text style={[styles.headingEo, { color: p.text }]}>{eo}</Text>
      ) : null}
      {en ? (
        <Text style={[styles.headingEn, { color: p.dim }]}>{en}</Text>
      ) : null}
    </View>
  );
};

const Card = ({
  children,
  p,
  reveal,
  onToggleAll,
}: {
  children: React.ReactNode;
  p: Palette;
  reveal?: Reveal;
  onToggleAll?: () => void;
}) => (
  <View style={[styles.card, { borderColor: p.line }]}>
    {children}
    {onToggleAll ? (
      <Pressable onPress={onToggleAll} hitSlop={8}>
        <Text style={[styles.showAll, { color: p.dim }]}>
          {reveal?.forceAll ? "Hide answers" : "Show answers"}
        </Text>
      </Pressable>
    ) : null}
  </View>
);

const useReveal = () => {
  const [reveal, setReveal] = useState<Reveal>({
    forceAll: false,
    resetTick: 0,
  });
  const toggleAll = () =>
    setReveal((r) =>
      r.forceAll
        ? { forceAll: false, resetTick: r.resetTick + 1 }
        : { ...r, forceAll: true }
    );
  return { reveal, toggleAll };
};

// --- images -----------------------------------------------------------------

const ContentImage = ({
  asset,
  alt,
  big,
}: {
  asset: string;
  alt?: string;
  big?: boolean;
}) => (
  <Image
    source={{ uri: contentAssetUrl(asset) }}
    style={big ? styles.extraIllustration : styles.inlineIllustration}
    resizeMode="contain"
    accessibilityLabel={alt}
  />
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
  hasDialogueAudio?: boolean;
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
      {dialogues.map((d, i) => {
        const ills = d.illustrations || [];
        const before = (idx: number) =>
          ills
            .filter((x) => x.beforeTurn === idx)
            .map((x, k) => (
              <ContentImage key={`b${idx}-${k}`} asset={x.asset} alt={x.alt} />
            ));
        const after = (idx: number) =>
          ills
            .filter((x) => x.afterTurn === idx)
            .map((x, k) => (
              <ContentImage key={`a${idx}-${k}`} asset={x.asset} alt={x.alt} />
            ));
        return (
          <View key={i}>
            <SectionHeading eo={d.heading?.eo} en={d.heading?.en} p={p} />
            {d.turns.map((t, j) => (
              <View key={j}>
                {before(j)}
                {t.speaker === null ? (
                  <Text style={[styles.direction, { color: p.dim }]}>
                    <IT>{t.text}</IT>
                  </Text>
                ) : (
                  <Text style={[styles.turn, { color: p.text }]}>
                    <Text style={styles.turnSpeaker}>{t.speaker}.</Text>{" "}
                    <IT>{t.text}</IT>
                  </Text>
                )}
                {after(j)}
              </View>
            ))}
          </View>
        );
      })}
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
        <Text style={[styles.vocabTerm, { color: p.text }]}>
          <IT>{v.term}</IT>
        </Text>
        <View style={styles.vocabRight}>
          <Text style={[styles.vocabGloss, { color: p.text }]}>
            <IT>{v.gloss}</IT>
          </Text>
          {v.note ? (
            <Text style={[styles.vocabNote, { color: p.dim }]}>
              {"["}
              <Text style={{ fontStyle: "italic" }}>
                <IT>{v.note}</IT>
              </Text>
              {"]"}
            </Text>
          ) : null}
        </View>
      </View>
    ))}
  </View>
);

// --- tables (shared by notes and exercise models) -----------------------------

type NoteTable = NonNullable<LessonContentNote["table"]>;

const NoteTableBlock = ({ table, p }: { table: NoteTable; p: Palette }) => {
  const wide = (table.rows[0] || []).length > 2;
  const cell = (
    c: { eo?: string; en?: string },
    j: number,
    fixed: boolean
  ) => (
    <View key={j} style={fixed ? styles.tableCellFixed : styles.tableCell}>
      {c.eo ? (
        <>
          <Text style={{ fontSize: 16, color: p.text, fontStyle: "italic" }}>
            <IT>{c.eo}</IT>
          </Text>
          {c.en ? (
            <Text style={{ color: p.dim, fontSize: 14.5 }}>
              <IT>{c.en}</IT>
            </Text>
          ) : null}
        </>
      ) : (
        <Text style={{ color: p.dim, fontSize: 14.5 }}>
          <IT>{c.en || ""}</IT>
        </Text>
      )}
    </View>
  );
  const body = (
    <View style={[styles.table, { borderColor: p.line }]}>
      {table.columnHeaders.some((h) => h) ? (
        <View style={[styles.tableRow, { borderColor: p.line }]}>
          {table.columnHeaders.map((h, i) => (
            <Text key={i} style={[styles.tableHeader, { color: p.dim }]}>
              {h}
            </Text>
          ))}
        </View>
      ) : null}
      {table.rows.map((row, i) => (
        <View key={i} style={[styles.tableRow, { borderColor: p.line }]}>
          {row.map((c, j) => cell(c, j, wide))}
        </View>
      ))}
    </View>
  );
  return wide ? (
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      {body}
    </ScrollView>
  ) : (
    body
  );
};

// --- notes ---------------------------------------------------------------------

const NoteBlock = ({ note, p }: { note: LessonContentNote; p: Palette }) => (
  <View style={styles.noteBlock}>
    {note.rule ? (
      <Text style={styles.noteRule}>
        <IT>{note.rule}</IT>
      </Text>
    ) : null}
    {note.body ? (
      <Text style={[styles.noteBody, { color: p.text }]}>
        <IT>{note.body}</IT>
      </Text>
    ) : null}
    {note.examples?.map((ex, i) =>
      // A row with no eo is interleaved print prose, not an example; a prose
      // row beginning with an escaped asterisk is a printed footnote and
      // renders in the small footnote style.
      !ex.eo ? (
        (ex.en || "").startsWith("\\*") ? (
          <Text key={i} style={[styles.footnote, { color: p.dim }]}>
            <IT>{ex.en}</IT>
          </Text>
        ) : (
          <Text key={i} style={[styles.noteBody, { color: p.text }]}>
            <IT>{ex.en}</IT>
          </Text>
        )
      ) : (
        <Text key={i} style={[styles.noteExample, { color: p.text }]}>
          <Text style={styles.noteExampleEo}>
            <IT>{ex.eo}</IT>
          </Text>
          {ex.en ? (
            <Text style={{ color: p.dim }}>
              {"  — "}
              <IT>{ex.en}</IT>
            </Text>
          ) : null}
        </Text>
      )
    )}
    {note.table ? <NoteTableBlock table={note.table} p={p} /> : null}
    {note.footnote ? (
      <Text style={[styles.footnote, { color: p.dim }]}>
        <IT>{note.footnote}</IT>
      </Text>
    ) : null}
  </View>
);

const NotesSectionBlock = ({
  section,
  p,
}: {
  section: Extract<LessonContentSection, { type: "notes" }>;
  p: Palette;
}) => (
  <View>
    <SectionHeading eo={section.heading?.eo} en={section.heading?.en} p={p} />
    {section.notes.map((note, j) => (
      <NoteBlock key={j} note={note} p={p} />
    ))}
  </View>
);

// --- model box (shared by drills and written exercises) -----------------------

type Model = NonNullable<DrillGroup["model"]>;

const ModelBox = ({ model, p }: { model: Model; p: Palette }) => (
  <View style={[styles.modelBox, { borderColor: p.line }]}>
    <Text style={[styles.modelLabel, { color: p.dim }]}>Model</Text>
    <Text style={{ color: p.text }}>
      <IT>{model.prompt}</IT>
      {model.promptGloss ? (
        <Text style={{ color: p.dim }}>
          {"  ["}
          <Text style={{ fontStyle: "italic" }}>
            <IT>{model.promptGloss}</IT>
          </Text>
          {"]"}
        </Text>
      ) : null}
      {model.cue ? (
        <Text style={{ color: ASIDE_DIM }}>
          {"  ("}
          <Text style={{ fontStyle: "italic" }}>{model.cue}</Text>
          {")"}
        </Text>
      ) : null}
      {model.answer ? (
        <>
          {"  \u2192  "}
          <Text style={styles.modelAnswer}>
            <IT>{model.answer}</IT>
          </Text>
          {model.answerGloss ? (
            <Text style={{ color: p.dim }}>
              {"  ["}
              <Text style={{ fontStyle: "italic" }}>
                <IT>{model.answerGloss}</IT>
              </Text>
              {"]"}
            </Text>
          ) : null}
        </>
      ) : null}
    </Text>
  </View>
);

// --- reference boxes ----------------------------------------------------------

type Reference = NonNullable<LessonContentExercise["reference"]>;

const RefBox = ({
  box,
  p,
  flex,
}: {
  box: Reference;
  p: Palette;
  flex?: boolean;
}) => (
  <View style={[styles.refBox, { borderColor: p.line }, flex && { flex: 1 }]}>
    {box.label ? (
      <Text style={[styles.refLabel, { color: p.text }]}>
        <IT>{box.label}</IT>
      </Text>
    ) : null}
    {box.items.map((x, i) => (
      <Text key={i} style={{ color: p.text }}>
        {box.bullets ? "\u2022 " : ""}
        <IT>{x}</IT>
      </Text>
    ))}
  </View>
);

// --- drills ---------------------------------------------------------------------

const DrillGroupBlock = ({ group, p }: { group: DrillGroup; p: Palette }) => {
  const { reveal, toggleAll } = useReveal();
  return (
    <RevealContext.Provider value={reveal}>
      <Card p={p} reveal={reveal} onToggleAll={toggleAll}>
        {group.instructions ? (
          <Text style={[styles.instructions, { color: p.dim }]}>
            <IT>{group.instructions}</IT>
          </Text>
        ) : null}
        {group.model ? <ModelBox model={group.model} p={p} /> : null}
        {group.modelNote ? (
          <Text style={[styles.instructions, { color: p.dim }]}>
            <IT>{group.modelNote}</IT>
          </Text>
        ) : null}
        {group.items.map((item, i) => (
          <Text key={i} style={[styles.exerciseItem, { color: p.text }]}>
            <IT>{item.prompt}</IT>
            {item.promptGloss ? (
              <Text style={{ color: p.dim }}>
                {"  ["}
                <Text style={{ fontStyle: "italic" }}>
                  <IT>{item.promptGloss}</IT>
                </Text>
                {"]"}
              </Text>
            ) : null}
            {item.cue ? (
              <Text style={{ color: ASIDE_DIM }}>
                {"  ("}
                <Text style={{ fontStyle: "italic" }}>{item.cue}</Text>
                {")"}
              </Text>
            ) : null}
            {"  \u2192 "}
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
  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
    <View style={styles.patternRow}>
      {table.columns.map((col, i) => (
        <React.Fragment key={i}>
          {i > 0 ? (
            <Text style={[styles.patternJoiner, { color: p.dim }]}>+</Text>
          ) : null}
          <View style={[styles.patternColumn, { borderColor: p.line }]}>
            {col.map((cell, j) => (
              <View key={j} style={styles.patternCell}>
                <Text style={{ color: p.text, fontSize: 15.5 }}>
                  <IT>{cell.text}</IT>
                </Text>
                {cell.gloss ? (
                  <Text style={{ color: p.dim, fontSize: 12.5 }}>
                    {"["}
                    <Text style={{ fontStyle: "italic" }}>
                      <IT>{cell.gloss}</IT>
                    </Text>
                    {"]"}
                  </Text>
                ) : null}
              </View>
            ))}
          </View>
        </React.Fragment>
      ))}
    </View>
  </ScrollView>
);

const PatternSectionBlock = ({
  section,
  p,
}: {
  section: Extract<LessonContentSection, { type: "patternPractice" }>;
  p: Palette;
}) => (
  <View>
    <SectionHeading eo={section.heading?.eo} en={section.heading?.en} p={p} />
    {section.instructions ? (
      <Text style={[styles.instructions, { color: p.dim }]}>
        <IT>{section.instructions}</IT>
      </Text>
    ) : null}
    {section.model ? <ModelBox model={section.model} p={p} /> : null}
    {section.tables.map((table, j) => (
      <PatternTableBlock key={j} table={table} p={p} />
    ))}
    <Text style={[styles.ppCaption, { color: p.dim }]}>
      (Combine one element from each box to make a complete sentence.)
    </Text>
    {section.footnote ? (
      <Text style={[styles.footnote, { color: p.dim }]}>
        <IT>{section.footnote}</IT>
      </Text>
    ) : null}
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
          <IT>{part}</IT>
          {i < parts.length - 1 ? (
            <>
              {" "}
              <AnswerChip answer={(answers[i] ?? []).join(" / ")} />
            </>
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
  const { reveal, toggleAll } = useReveal();
  const [showModel, setShowModel] = useState(false);

  if (exercise.kind === "translatePassage") {
    return (
      <Card p={p}>
        <Text style={[styles.instructions, { color: p.dim }]}>
          <IT>{exercise.instructions}</IT>
        </Text>
        {exercise.lines.map((line, i) =>
          line.speaker === null ? (
            <Text key={i} style={[styles.direction, { color: p.dim }]}>
              <IT>{line.text}</IT>
            </Text>
          ) : (
            <Text key={i} style={[styles.turn, { color: p.text }]}>
              <Text style={styles.turnSpeaker}>{line.speaker}.</Text>{" "}
              <IT>{line.text}</IT>
            </Text>
          )
        )}
        <Pressable onPress={() => setShowModel((s) => !s)} hitSlop={8}>
          <Text style={[styles.showAll, { color: p.dim }]}>
            {showModel ? "Hide model answer" : "Show model answer"}
          </Text>
        </Pressable>
        {showModel ? (
          <View style={styles.modelAnswerPanel}>
            {exercise.modelAnswer.lines.map((line, i) =>
              line.speaker === null ? (
                <Text key={i} style={[styles.direction, { color: "#8a6a3a" }]}>
                  <IT>{line.text}</IT>
                </Text>
              ) : (
                <Text key={i} style={[styles.turn, { color: "#633806" }]}>
                  <Text style={styles.turnSpeaker}>{line.speaker}.</Text>{" "}
                  <IT>{line.text}</IT>
                </Text>
              )
            )}
          </View>
        ) : null}
      </Card>
    );
  }

  return (
    <RevealContext.Provider value={reveal}>
      <Card p={p} reveal={reveal} onToggleAll={toggleAll}>
        {exercise.instructions ? (
          <Text style={[styles.instructions, { color: p.dim }]}>
            <IT>{exercise.instructions}</IT>
          </Text>
        ) : null}
        {exercise.image ? (
          <Image
            source={{ uri: contentAssetUrl(exercise.image.asset) }}
            style={styles.exerciseImage}
            resizeMode="contain"
            accessibilityLabel={exercise.image.alt}
          />
        ) : null}
        {exercise.model ? <ModelBox model={exercise.model} p={p} /> : null}
        {exercise.table ? (
          <NoteTableBlock table={exercise.table} p={p} />
        ) : null}
        {exercise.reference ? <RefBox box={exercise.reference} p={p} /> : null}
        {exercise.boxA || exercise.boxB ? (
          <View style={styles.refPair}>
            {exercise.boxA ? <RefBox box={exercise.boxA} p={p} flex /> : null}
            {exercise.boxB ? <RefBox box={exercise.boxB} p={p} flex /> : null}
          </View>
        ) : null}
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
                <IT>{pair.eo}</IT>
                {"  \u2192 "}
                <AnswerChip answer={pair.en} />
              </Text>
            ))}
          </View>
        ) : null}
        {exercise.kind === "transform" ||
        exercise.kind === "translateList" ||
        exercise.kind === "wordBuilding" ||
        exercise.kind === "openResponse"
          ? exercise.items.map((item, i) => (
              <Text key={i} style={[styles.exerciseItem, { color: p.text }]}>
                <IT>{item.prompt}</IT>
                {item.promptGloss ? (
                  <Text style={{ color: p.dim }}>
                    {"  ["}
                    <Text style={{ fontStyle: "italic" }}>
                      <IT>{item.promptGloss}</IT>
                    </Text>
                    {"]"}
                  </Text>
                ) : null}
                {item.answer !== undefined ? (
                  <>
                    {"  \u2192 "}
                    <AnswerChip answer={item.answer} gloss={item.answerGloss} />
                  </>
                ) : null}
              </Text>
            ))
          : null}
        {exercise.footnote ? (
          <Text style={[styles.footnote, { color: p.dim }]}>
            <IT>{exercise.footnote}</IT>
          </Text>
        ) : null}
      </Card>
    </RevealContext.Provider>
  );
};

// --- top level -------------------------------------------------------------------

const isExerciseHeaded = (s: LessonContentSection) =>
  "heading" in s &&
  !!s.heading?.eo &&
  (s.heading.eo.startsWith("Ekzercu") || s.heading.eo.startsWith("Skribaj"));

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
  hasDialogueAudio?: boolean;
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

  // Each tab starts at the top and remembers its own position for the life
  // of this lesson screen (the component unmounts on leaving the lesson,
  // which resets everything).
  const scrollRef = useRef<ScrollView>(null);
  const offsets = useRef<Record<ContentTab, number>>({
    dialogue: 0,
    vocabulary: 0,
    notes: 0,
    exercises: 0,
  });
  useEffect(() => {
    scrollRef.current?.scrollTo({
      y: offsets.current[tab] ?? 0,
      animated: false,
    });
  }, [tab]);

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

  const extras = (placement: "notes" | "exercises") =>
    (content.extraIllustrations || [])
      .filter((x) =>
        placement === "exercises"
          ? x.placement === "exercises-end"
          : x.placement !== "exercises-end"
      )
      .map((x, i) => <ContentImage key={i} asset={x.asset} alt={x.alt} big />);

  return (
    <ScrollView
      ref={scrollRef}
      style={styles.scroll}
      contentContainerStyle={styles.scrollContent}
      onScroll={(e) => {
        offsets.current[tab] = e.nativeEvent.contentOffset.y;
      }}
      scrollEventThrottle={32}
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
      {tab === "notes" ? (
        <>
          {content.sections
            .filter(
              (s): s is Extract<LessonContentSection, { type: "notes" }> =>
                s.type === "notes" && !isExerciseHeaded(s)
            )
            .map((section, i) => (
              <NotesSectionBlock key={i} section={section} p={p} />
            ))}
          {extras("notes")}
        </>
      ) : null}
      {tab === "exercises" ? (
        <>
          {content.sections.map((section, i) => {
            if (section.type === "notes" && isExerciseHeaded(section)) {
              return <NotesSectionBlock key={i} section={section} p={p} />;
            }
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
              return <PatternSectionBlock key={i} section={section} p={p} />;
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
          })}
          {extras("exercises")}
        </>
      ) : null}
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
  direction: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 8,
    textAlign: "center",
    fontStyle: "italic",
  },
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
  inlineIllustration: {
    width: "64%",
    aspectRatio: 1.2,
    alignSelf: "center",
    marginVertical: 2,
  },
  extraIllustration: {
    width: "96%",
    aspectRatio: 1.1,
    alignSelf: "center",
    marginVertical: 10,
  },
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
  table: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 8,
    marginTop: 8,
    marginBottom: 4,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  tableHeader: { flex: 1, fontSize: 12, fontWeight: "700" },
  tableCell: { flex: 1, paddingRight: 6 },
  tableCellFixed: { paddingRight: 18 },
  footnote: { fontSize: 12.5, marginTop: 4, lineHeight: 17 },
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
  modelLabel: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1,
    marginBottom: 4,
  },
  modelAnswer: { fontStyle: "italic" },
  exerciseItem: { fontSize: 15.5, lineHeight: 26, marginBottom: 9 },
  chip: {
    backgroundColor: "#FAEEDA",
    color: "#633806",
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
  modelAnswerPanel: {
    backgroundColor: "#FAEEDA",
    borderRadius: 8,
    padding: 10,
    marginTop: 8,
  },
  ppCaption: { fontSize: 12.5, fontStyle: "italic", marginTop: 2 },
  patternRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 8,
    paddingRight: 8,
  },
  patternJoiner: { fontSize: 18, fontWeight: "700", marginHorizontal: 6 },
  patternColumn: {
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  patternCell: { marginVertical: 3 },
  exerciseImage: {
    width: "100%",
    aspectRatio: 0.78,
    alignSelf: "center",
    marginVertical: 8,
  },
  refBox: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
    alignSelf: "flex-start",
  },
  refLabel: { fontWeight: "700", marginBottom: 4 },
  refPair: { flexDirection: "row", gap: 10, marginBottom: 10 },
});

export default LessonContentView;
