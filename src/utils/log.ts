import { useCallback, useMemo } from "react";
import {
  useCurrentCourseIfPresent,
  useCurrentLessonIfPresent,
} from "../hooks/useCourseLessonData";

// Jen Nia Mondo collects no user data, locally or remotely. This module is
// kept as a no-op so call sites throughout the app don't need to change.
export const log = async (data: Record<string, any>): Promise<void> => {
  if (__DEV__) {
    console.log("LOG (not sent — data collection disabled)", data);
  }
};

export const useLogger = (defaultData: Record<string, any> = {}) => {
  const currentCourse = useCurrentCourseIfPresent();
  const currentLesson = useCurrentLessonIfPresent();

  const defaultDataWithContext = useMemo(
    () => ({
      ...(currentCourse !== null ? { course: currentCourse } : {}),
      ...(currentLesson !== null ? { lesson: currentLesson } : {}),
      ...defaultData,
    }),
    [currentCourse, currentLesson, defaultData]
  );

  return useCallback(
    (data: Record<string, any>) => log({ ...defaultDataWithContext, ...data }),
    [defaultDataWithContext]
  );
};