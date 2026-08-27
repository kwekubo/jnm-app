import { useLogger } from "@/src/utils/log";
import { FontAwesome5 } from "@expo/vector-icons";
import Constants from "expo-constants";
import { useRouter } from "expo-router";
import type { ComponentProps, ReactNode } from "react";
import React from "react";
import {
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableNativeFeedback,
  View,
} from "react-native";

type IconName = ComponentProps<typeof FontAwesome5>["name"];

const ICON_SIZE = 24;

const Icon = ({
  name,
  size = ICON_SIZE,
}: {
  name: IconName;
  size?: number;
}) => <FontAwesome5 name={name} size={size} />;

// React Native has no <i>, <b> or <br>. Use these instead:
//   <I>...</I> for italic, <B>...</B> for bold, {"\n"} for a line break.
const I = ({ children }: { children: ReactNode }) => (
  <Text style={styles.italic}>{children}</Text>
);
const B = ({ children }: { children: ReactNode }) => (
  <Text style={styles.bold}>{children}</Text>
);

const SectionCard = ({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) => (
  <View>
    <Text style={styles.sectionTitle}>{title}</Text>
    <View style={styles.sectionCard}>{children}</View>
  </View>
);

const AboutScreen = () => {
  const router = useRouter();
  const log = useLogger({
    surface: "about",
  });

  const appVersion = Constants.expoConfig?.version ?? "unknown";

  return (
    <ScrollView style={styles.body} contentContainerStyle={styles.container}>
      <View style={styles.sectionStack}>
        <SectionCard title="Jen Nia Mondo">
          <Text style={styles.bodyText}>
            Jen Nia Mondo is an introductory series of lessons in Esperanto —
            the living language which aims to solve the world&apos;s language
            problem by becoming a second language, neutral and simple, for all
            mankind.
          </Text>

          <Text style={[styles.bodyText, styles.bodyTextAboveButton]}>
            First published by the Esperanto Association of Britain over 50 years ago
            and used and enjoyed since then by countless students in an audio format with accompanying booklets, the
            course is now available as a fully featured app. This allows
            you to participate fully, wherever you are in the world. Just
            engage, pause, think and answer out loud, and the rest will take
            care of itself.
          </Text>

          <View style={styles.additionalButton}>
            <TouchableNativeFeedback
              onPress={() => {
                log({
                  action: "visit_website",
                });
                Linking.openURL("https://www.esperanto.org.uk");
              }}
              useForeground={true}
            >
              <View style={styles.additionalButtonInner}>
                <Text style={styles.additionalButtonText}>
                  Visit esperanto.org.uk
                </Text>
                <Icon name="link" />
              </View>
            </TouchableNativeFeedback>
          </View>
        </SectionCard>

        <SectionCard title="How to use this course">
          <Text style={styles.bodyText}>
            If you like, familiarise yourself with the contents of each lesson
            before listening to the recording; however, many people think it
            wiser to listen first, and to turn to the notes only afterwards.
          </Text>
          <Text style={styles.bodyText}>
            After you&apos;ve heard each lesson, follow this routine:
          </Text>

          <Text style={styles.listElement}>
            {"\u2022"} <B>read through the notes and vocabulary</B>
          </Text>
          <Text style={styles.listElement}>
            {"\u2022"} <B>read over the text of the dialogue</B>
          </Text>
          <Text style={styles.listElement}>
            {"\u2022"} refer backwards and forwards between them as necessary,
            making sure you understand everything in the text
          </Text>
          <Text style={styles.listElement}>
            {"\u2022"} play the recording over repeatedly <I>without</I>{" "}
            looking at the book, until you know it well
          </Text>
          <Text style={styles.listElement}>
            {"\u2022"} if possible, act out the dialogue with a friend
          </Text>
          <Text style={styles.listElement}>
            {"\u2022"} <B>do the exercises</B>
          </Text>
          <Text style={styles.listElement}>
            {"\u2022"} listen to the lesson once more.
          </Text>
        </SectionCard>

        <SectionCard title="Sounds &amp; Letters">
          <Text style={styles.bodyText}>
            Model your pronunciation on the voices you hear in the lessons.
            Esperanto has acquired a more-or-less standard international
            pronunciation; it is advisable to avoid too much of an
            &quot;English accent&quot;.
          </Text>
          <Text style={styles.bodyText}>
            The vowels /a, e, i, o, u/ are monophthongs (pure vowels). The
            diphthongs /ej, aj, oj, uj/ start at /e a o u/ respectively and
            glide towards an i-quality; /eŭ, aŭ/ start at /e a/ and glide
            towards an u-quality. All vowels should be clearly sounded.
          </Text>
          <Text style={styles.bodyText}>
            Word stress is without exception on the last but one syllable, i.e.
            on the penultimate vowel.
          </Text>
          <Text style={styles.bodyText}>
            The consonants /p, t, k, b, d, f, v, s, z, m, n, h/ are as in
            English (but don&apos;t use a glottal stop for /t/; /p t k/ are
            best unaspirated). Spelling <I>g</I> means a &quot;hard&quot; /g/,{" "}
            <I>ĝ</I> a &quot;soft&quot; one like English <I>j</I>. <I>C</I>{" "}
            stands for an affricate like <I>ts</I>, <I>ĉ</I> for one like
            English <I>ch</I> in <I>child</I>. Similarly, <I>ŝ</I> is like
            English <I>sh</I>; <I>ĵ</I> denotes the corresponding voiced sound,
            as in <I>measure</I>. The rare <I>ĥ</I> is a voiceless velar
            fricative, as in <I>loch</I>. A trill or tap is best for /r/; a
            &quot;clear&quot; lateral for /l/ — be careful not to omit them
            after vowels. <I>J</I> corresponds to English <I>y</I>; <I>jes</I>{" "}
            has the same sound and meaning as English <I>yes</I>.
          </Text>
          <Text style={styles.bodyText}>
            The correspondence between sound and spelling is exact in
            Esperanto. Seeing the written form of a word, you can know with
            certainty the way to pronounce it.
          </Text>
        </SectionCard>

        <SectionCard title="Credits">
          <Text style={styles.bodyText}>
            First published 1974{"\n"}
            Reprinted 1976, 1977{"\n"}
            Revised 1984{"\n"}
            Reprinted 1992, 2005{"\n"}
            E-book format 2020{"\n"}
            App format 2026
          </Text>

          <Text style={styles.bodyText}>Course written by John C. Wells</Text>

          <Text style={styles.bodyText}>
            Additional exercises by R. McDermott{"\n"}
            and John C. Wells
          </Text>

          <Text style={styles.bodyText}>
            Lessons based on <I>Esperanto for Beginners</I> by Montagu C. Butler
          </Text>

          <Text style={styles.bodyText}>
            Dialogues written by Daphne Lister, Don Lord, Neil Salvesen
          </Text>

          <Text style={styles.bodyText}>Print design by Peter Oliver</Text>

          <Text style={styles.bodyText}>App format by Gabriel Beecham</Text>

          <Text style={styles.bodyText}>
            <I>Helena</I> — Irene Schilperoord{"\n"}
            <I>Petro</I> — Karlo Bartošik{"\n"}
            <I>Teacher</I> — John C. Wells
          </Text>

          <Text style={styles.bodyText}>
            Studio production by Peter Schilperoord{"\n"}
            Sound recording by Acorn Audio Service
          </Text>

          <Text style={styles.bodyText}>
            First published by <B>Group Five</B>
            {"\n"}
            <I>Esperanto on Radio and Television</I>
          </Text>

          <Text style={styles.bodyText}>
            Copyright © 1974, 1984, 1992, 2020, 2026 Group Five and Esperanto-Asocio de Britio
          </Text>

          <Text style={[styles.bodyText, styles.bodyTextAboveButton]}>
            If you have any feedback that you&apos;d like to share about how we
            can improve the Jen Nia Mondo app, feel free to send an email:
          </Text>

          <View style={styles.additionalButton}>
            <TouchableNativeFeedback
              onPress={() => {
                Linking.openURL(
                  "mailto:eab@esperanto.org.uk" +
                    `?subject=${encodeURIComponent(
                      "Feedback about the Jen Nia Mondo app"
                    )}`
                );
              }}
              useForeground={true}
            >
              <View style={styles.additionalButtonInner}>
                <Text style={styles.additionalButtonText}>Contact us</Text>
                <Icon name="envelope" />
              </View>
            </TouchableNativeFeedback>
          </View>

          <Text style={styles.bodyText}>
            The Jen Nia Mondo app is built on the Language Transfer app
            platform, which is free, open-source software. You can find its
            source code on GitHub:
          </Text>
          <View
            style={[styles.additionalButton, styles.additionalButtonExtraMargin]}
          >
            <TouchableNativeFeedback
              onPress={() => {
                log({
                  action: "open_github",
                });
                Linking.openURL("https://www.github.com/kwekubo/jnm-app");
              }}
              useForeground={true}
            >
              <View style={styles.additionalButtonInner}>
                <Text style={styles.additionalButtonText}>Visit on GitHub</Text>
                <Icon name="github" />
              </View>
            </TouchableNativeFeedback>
          </View>
          <View style={[styles.additionalButton]}>
            <TouchableNativeFeedback
              onPress={() => router.push("/licenses")}
              useForeground={true}
            >
              <View style={styles.additionalButtonInner}>
                <Text style={styles.additionalButtonText}>Licenses</Text>
                <Icon name="osi" />
              </View>
            </TouchableNativeFeedback>
          </View>

          <Text style={styles.bodyText}>
            This is version {appVersion} of the Jen Nia Mondo app.
          </Text>
        </SectionCard>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  body: {
    flex: 1,
    backgroundColor: "#f7f7f7",
  },
  container: {
    paddingBottom: 32,
    paddingHorizontal: 18,
    paddingTop: 28,
  },
  sectionStack: {
    gap: 24,
  },
  sectionCard: {
    backgroundColor: "white",
    borderRadius: 8,
    paddingVertical: 22,
    paddingHorizontal: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 7,
    elevation: 4,
  },
  sectionTitle: {
    fontSize: 26,
    fontWeight: "bold",
    marginBottom: 14,
  },
  bodyText: {
    fontSize: 18,
    lineHeight: 28,
    marginBottom: 12,
  },
  bodyTextAboveButton: {
    marginBottom: 18,
  },
  italic: {
    fontStyle: "italic",
  },
  bold: {
    fontWeight: "bold",
  },
  listElement: {
    fontSize: 17,
    marginLeft: 30,
    marginRight: 10,
    marginBottom: 10,
    lineHeight: 24,
  },
  additionalButton: {
    marginBottom: 20,
    borderRadius: 12,
    backgroundColor: "white",
    overflow: "hidden",
    elevation: 2,
    borderColor: "#ececec",
    borderWidth: StyleSheet.hairlineWidth,
    alignSelf: "stretch",
  },
  additionalButtonExtraMargin: {
    marginTop: 14,
  },
  additionalButtonInner: {
    paddingVertical: 16,
    paddingHorizontal: 18,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  additionalButtonText: {
    fontSize: 18,
    maxWidth: "90%",
  },
});

export default AboutScreen;
