import { FontAwesome5, MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import formatDuration from "format-duration";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Easing,
  Image,
  Linking,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import LessonContentView, {
  type ContentTab,
} from "@/src/components/listen/LessonContentView";
import ListenScrubber from "@/src/components/listen/ListenScrubber";
import { useLessonContent } from "@/src/hooks/useLessonContent";
import { contentAssetUrl } from "@/src/utils/contentAssets";
import CourseData from "@/src/data/courseData";
import {
  useCurrentCourse,
  useCurrentCourseColors,
  useCurrentLesson,
} from "@/src/hooks/useCourseLessonData";
import {
  playLessonDialogue,
  stopLessonAudio,
  useLessonAudio,
} from "@/src/services/audioPlayer";
import {
  CourseDownloadManager,
  useLessonDownloadStatus,
} from "@/src/services/downloadManager";
import { markLessonFinished } from "@/src/storage/persistence";
import { useLogger } from "@/src/utils/log";
import { SafeAreaView } from "react-native-safe-area-context";

type Tab = "listen" | ContentTab;

const TABS: { key: Tab; label: string }[] = [
  { key: "listen", label: "Listen" },
  { key: "dialogue", label: "Dialogue" },
  { key: "vocabulary", label: "Vocabulary" },
  { key: "notes", label: "Notes" },
  { key: "exercises", label: "Exercises" },
];

const ListenBody = () => {
  const course = useCurrentCourse();
  const lesson = useCurrentLesson();
  const controls = useLessonAudio(course, lesson);
  const downloadStatus = useLessonDownloadStatus(course, lesson);
  const downloaded = downloadStatus === "downloaded";
  const [busyAction, setBusyAction] = useState<"download" | "delete" | null>(
    null
  );
  const [sheetOpen, setSheetOpen] = useState(false);
  const [tab, setTab] = useState<Tab>("listen");
  const router = useRouter();
  const latestPositionRef = useRef(0);
  const sheetAnim = useRef(new Animated.Value(0)).current;

  const lessonTitle = CourseData.getLessonTitle(course, lesson);
  const { content } = useLessonContent(course, lesson);
  const miniTitle = /^leciono/i.test(lessonTitle)
    ? lessonTitle
    : `Leciono ${lesson} — ${lessonTitle}`;
  const hasDialogueAudio = !!CourseData.getLessonDialogue(course, lesson);
  const colors = useCurrentCourseColors();
  const log = useLogger({
    surface: "listen_screen",
  });

  useEffect(() => {
    latestPositionRef.current = controls.position;
  }, [controls.position]);

  const reportMailto = useMemo(() => {
    return (
      "mailto:info@languagetransfer.org" +
      `?subject=${encodeURIComponent(
        `Feedback about ${CourseData.getCourseFullTitle(course)}`
      )}` +
      `&body=${encodeURIComponent(
        `Hi! I found a problem with the ${CourseData.getCourseFullTitle(
          course
        )} course:\n\nLesson: ${lessonTitle}\nPosition: ${formatDuration(
          controls.position * 1000
        )}`
      )}`
    );
  }, [controls.position, course, lessonTitle]);

  const openSheet = () => {
    if (sheetOpen) {
      return;
    }
    log({
      action: "open_bottom_sheet",
      position: latestPositionRef.current,
    });
    sheetAnim.setValue(0);
    setSheetOpen(true);
    requestAnimationFrame(() => {
      Animated.timing(sheetAnim, {
        toValue: 1,
        duration: 220,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }).start();
    });
  };

  const closeSheet = () => {
    if (!sheetOpen) {
      return;
    }
    log({
      action: "close_bottom_sheet",
      position: latestPositionRef.current,
    });
    Animated.timing(sheetAnim, {
      toValue: 0,
      duration: 200,
      easing: Easing.in(Easing.ease),
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) {
        setSheetOpen(false);
      }
    });
  };

  const handleDownloadToggle = async () => {
    if (downloaded === null) {
      return;
    }

    setBusyAction(downloaded ? "delete" : "download");
    try {
      if (downloaded) {
        log({
          action: "delete_download",
          surface: "listen_bottom_sheet",
        });
        await stopLessonAudio();
        await CourseDownloadManager.unrequestDownload(course, lesson);
      } else {
        log({
          action: "download_lesson",
          surface: "listen_bottom_sheet",
        });
        await CourseDownloadManager.requestDownload(course, lesson);
      }
    } catch (err) {
      Alert.alert(
        downloaded ? "Unable to delete download" : "Unable to download lesson",
        err instanceof Error ? err.message : "Unknown error"
      );
      log({
        action: downloaded ? "delete_download_error" : "download_error",
        surface: "listen_bottom_sheet",
        message: err instanceof Error ? err.message : String(err),
      });
    } finally {
      setBusyAction(null);
    }
  };

  const handleMarkFinished = async () => {
    closeSheet();
    log({
      action: "mark_finished",
      surface: "listen_bottom_sheet",
      position: controls.position,
    });
    await markLessonFinished(course, lesson);
    router.back();
  };

  const handlePlayDialogue = async () => {
    log({
      action: "play_dialogue",
      surface: "dialogue_tab",
    });
    await playLessonDialogue(course, lesson);
  };

  const selectTab = (next: Tab) => {
    if (next === tab) {
      return;
    }
    log({
      action: "select_lesson_tab",
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      tab: next as any,
    });
    setTab(next);
  };

  if (controls.error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{controls.error.message}</Text>
      </View>
    );
  }

  const compact = tab !== "listen";

  return (
    <View style={[styles.body, { backgroundColor: colors?.background }]}>
      <View style={styles.tabBar}>
        {TABS.map(({ key, label }) => {
          const active = key === tab;
          return (
            <Pressable
              key={key}
              onPress={() => selectTab(key)}
              style={styles.tabButton}
              android_ripple={{ color: "rgba(255,255,255,0.15)" }}
            >
              <Text
                style={[
                  styles.tabLabel,
                  { color: colors?.text },
                  !active && styles.tabLabelInactive,
                ]}
              >
                {label}
              </Text>
              <View
                style={[
                  styles.tabUnderline,
                  active && { backgroundColor: colors?.text },
                ]}
              />
            </Pressable>
          );
        })}
      </View>

      {tab === "listen" ? (
        <View style={styles.listenMiddle}>
          {content?.illustration ? (
            <Image
              source={{ uri: contentAssetUrl(content.illustration.asset) }}
              style={styles.listenIllustration}
              resizeMode="contain"
              accessibilityLabel={content.illustration.alt}
            />
          ) : null}
          <View style={styles.lessonName}>
            <Text style={[styles.courseTitle, { color: colors?.text }]}>
              {CourseData.getCourseShortTitle(course)}
            </Text>
            <Text style={[styles.lesson, { color: colors?.text }]}>
              {lessonTitle}
            </Text>
          </View>
        </View>
      ) : (
        <LessonContentView
          course={course}
          lesson={lesson}
          tab={tab}
          textColor={colors?.text ?? "#ffffff"}
          hasDialogueAudio={hasDialogueAudio}
          onPlayDialogue={handlePlayDialogue}
        />
      )}

      <View style={[styles.controls, compact && styles.controlsCompact]}>
        {compact ? (
          <Text style={[styles.miniLessonTitle, { color: colors?.text }]}>
            {miniTitle}
          </Text>
        ) : null}
        <View style={styles.icons}>
          <Pressable
            onPress={() => controls.skipBack()}
            android_ripple={{
              color: "rgba(255,255,255,0.2)",
              borderless: true,
            }}
          >
            <MaterialIcons
              name="replay-10"
              size={compact ? 30 : 42}
              color={colors?.text}
            />
          </Pressable>

          {controls.ready ? (
            <Pressable
              onPress={() => controls.toggle()}
              android_ripple={{
                color: "rgba(255,255,255,0.2)",
                borderless: true,
              }}
              style={styles.playButton}
              aria-label={controls.playing ? "Pause" : "Play"}
            >
              <FontAwesome5
                name={controls.playing ? "pause" : "play"}
                size={compact ? 44 : 64}
                color={colors?.text}
              />
            </Pressable>
          ) : (
            <ActivityIndicator size={compact ? 44 : 64} color={colors?.text} />
          )}

          <Pressable
            onPress={openSheet}
            android_ripple={{
              color: "rgba(255,255,255,0.2)",
              borderless: true,
            }}
          >
            <MaterialIcons
              name="settings"
              size={compact ? 30 : 42}
              color={colors?.text}
            />
          </Pressable>
        </View>

        {controls.activeKind === "dialogue" ? (
          <Text style={[styles.nowPlayingHint, { color: colors?.text }]}>
            Dialogue
          </Text>
        ) : null}

        <ListenScrubber
          course={course}
          lesson={lesson}
          position={controls.position}
          duration={controls.duration}
          seekTo={controls.seekTo}
        />
      </View>

      {sheetOpen ? (
        <Modal
          animationType="none"
          transparent
          visible={sheetOpen}
          onRequestClose={closeSheet}
        >
          <SafeAreaView style={{ flex: 1 }}>
            <View style={styles.sheetOverlay}>
              <Animated.View
                style={[
                  styles.sheetBackdrop,
                  {
                    opacity: sheetAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, 0.35],
                    }),
                  },
                ]}
              >
                <Pressable
                  style={StyleSheet.absoluteFill}
                  onPress={closeSheet}
                />
              </Animated.View>
              <Animated.View
                style={[
                  styles.sheetContainer,
                  {
                    transform: [
                      {
                        translateY: sheetAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [400, 0],
                        }),
                      },
                    ],
                  },
                ]}
              >
                <View style={styles.sheetHandle} />
                <SheetRow
                  label="Mark as finished"
                  icon={<FontAwesome5 name="check" size={20} color="#222" />}
                  onPress={handleMarkFinished}
                />
                <SheetRow
                  label={
                    downloaded ? "Delete download" : "Download for offline"
                  }
                  icon={
                    busyAction || downloaded === null ? (
                      <ActivityIndicator size="small" color="#555" />
                    ) : (
                      <FontAwesome5
                        name={downloaded ? "trash" : "download"}
                        size={18}
                        color="#222"
                      />
                    )
                  }
                  disabled={busyAction !== null || downloaded === null}
                  onPress={async () => {
                    await handleDownloadToggle();
                    closeSheet();
                  }}
                />
                <SheetRow
                  label="Report a problem"
                  icon={
                    <FontAwesome5
                      name="exclamation-triangle"
                      size={18}
                      color="#222"
                    />
                  }
                  onPress={() => {
                    Linking.openURL(reportMailto);
                    closeSheet();
                  }}
                />
              </Animated.View>
            </View>
          </SafeAreaView>
        </Modal>
      ) : null}
    </View>
  );
};

const SheetRow = ({
  label,
  icon,
  onPress,
  disabled,
}: {
  label: string;
  icon: React.ReactNode;
  onPress: () => void | Promise<void>;
  disabled?: boolean;
}) => (
  <Pressable
    android_ripple={{ color: "rgba(0,0,0,0.08)" }}
    onPress={onPress}
    disabled={disabled}
  >
    <View style={[styles.sheetRow, disabled && styles.sheetRowDisabled]}>
      <Text style={styles.sheetRowText}>{label}</Text>
      <View style={styles.sheetRowIcon}>{icon}</View>
    </View>
  </Pressable>
);

const styles = StyleSheet.create({
  body: {
    flex: 1,
    paddingBottom: 32,
  },
  tabBar: {
    flexDirection: "row",
    paddingHorizontal: 8,
  },
  tabButton: {
    flex: 1,
    alignItems: "center",
    paddingTop: 6,
  },
  tabLabel: {
    fontSize: 13.5,
    fontWeight: "600",
    paddingVertical: 8,
  },
  tabLabelInactive: {
    opacity: 0.55,
    fontWeight: "400",
  },
  tabUnderline: {
    height: 2,
    alignSelf: "stretch",
    marginHorizontal: 6,
    borderRadius: 1,
    backgroundColor: "transparent",
  },
  listenMiddle: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  lessonName: {
    alignItems: "center",
  },
  courseTitle: {
    fontWeight: "bold",
    fontSize: 48,
  },
  lesson: {
    fontSize: 32,
    textAlign: "center",
  },
  controls: {
    paddingHorizontal: 24,
    paddingTop: 18,
  },
  controlsCompact: {
    paddingTop: 10,
  },
  miniLessonTitle: {
    alignSelf: "center",
    fontSize: 12,
    opacity: 0.75,
    marginBottom: 6,
  },
  listenIllustration: {
    width: "92%",
    height: "52%",
    marginBottom: 20,
  },
  icons: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
    marginBottom: 8,
  },
  playButton: {
    paddingHorizontal: 20,
  },
  nowPlayingHint: {
    alignSelf: "center",
    fontSize: 12,
    opacity: 0.7,
    marginBottom: 2,
  },
  errorContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  errorText: {
    color: "#fff",
  },
  sheetOverlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  sheetBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#000",
  },
  sheetContainer: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    paddingVertical: 8,
    paddingBottom: 24,
    paddingHorizontal: 8,
    gap: 4,
  },
  sheetHandle: {
    alignSelf: "center",
    width: 48,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#ccc",
    marginVertical: 8,
  },
  sheetRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: 20,
  },
  sheetRowDisabled: {
    opacity: 0.5,
  },
  sheetRowText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111",
  },
  sheetRowIcon: {
    width: 28,
    alignItems: "flex-end",
  },
});

export default ListenBody;
