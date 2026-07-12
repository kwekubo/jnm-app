import { useQuery } from "@tanstack/react-query";
import { File } from "expo-file-system";

import {
  parseLessonContent,
  type LessonContent,
} from "@/src/data/contentSchemas";
import CourseData, { getCASObjectURL } from "@/src/data/courseData";
import { getLocalObjectPath } from "@/src/services/downloadManager";
import type { CourseName } from "@/src/types";

// ---------------------------------------------------------------------------
// Offline-first loader for a lesson's structured written content.
// If the content object has been downloaded alongside the lesson audio it is
// read from local object storage; otherwise it is fetched from the content
// server. Either way the JSON is validated against schema v0.3.1 before the
// UI sees it.
// ---------------------------------------------------------------------------

const loadLessonContent = async (
  course: CourseName,
  lesson: number
): Promise<LessonContent | null> => {
  const pointer = CourseData.getLessonContentPointer(course, lesson);
  if (!pointer) {
    return null;
  }

  const localFile = new File(getLocalObjectPath(pointer));
  if (localFile.exists) {
    const text = await localFile.text();
    return parseLessonContent(JSON.parse(text));
  }

  const url = await getCASObjectURL(pointer);
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Unable to load lesson text (HTTP ${response.status})`);
  }
  return parseLessonContent(await response.json());
};

export const useLessonContent = (course: CourseName, lesson: number) => {
  const query = useQuery({
    queryKey: ["lessonContent", course, lesson],
    queryFn: () => loadLessonContent(course, lesson),
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });

  return {
    content: query.data ?? null,
    isLoading: query.isLoading,
    error: query.error instanceof Error ? query.error : null,
    refetch: query.refetch,
  };
};
