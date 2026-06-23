import { useQuery } from "@tanstack/react-query";
import api from "./api";

const fmt = (t) => (t || "").slice(0, 5);
const DAY_ORDER = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

// Robustly extract the slots array from a class object — API may use
// timetable, timeslot, timeslots, or slots as the key
const extractSlots = (cls) =>
  Array.isArray(cls?.timetable)  ? cls.timetable  :
  Array.isArray(cls?.timeslots)  ? cls.timeslots  :
  Array.isArray(cls?.timeslot)   ? cls.timeslot   :
  Array.isArray(cls?.slots)      ? cls.slots       : [];

// Robustly extract the classes array from the API response payload
// Handles: { classes: [] }, { data: { classes: [] } }, flat [], etc.
const extractClasses = (rd) => {
  if (Array.isArray(rd?.classes))          return rd.classes;
  if (Array.isArray(rd?.data?.classes))    return rd.data.classes;
  if (Array.isArray(rd?.schedule))         return rd.schedule;
  if (Array.isArray(rd))                   return rd;
  return [];
};

const normaliseSlots = (allTimetable, meta, teacherId) => {
  const result = [];
  allTimetable
    .filter((s) => {
      // A slot is "real" if it has a courseCode (occupied or not, the courseCode presence is the signal)
      if (!s.courseCode && !s.courseName) return false;
      // Only exclude if slot explicitly has a DIFFERENT teacherId assigned
      if (teacherId && s.teacherId && s.teacherId !== teacherId) return false;
      return true;
    })
    .forEach((s) => {
      result.push({
        day: s.day,
        slotNumber: s.slotNumber ?? s.slot ?? 0,
        startTime: fmt(s.startTime ?? s.start_time ?? ""),
        endTime: fmt(s.endTime ?? s.end_time ?? ""),
        courseName: s.courseName ?? s.subjectName ?? s.course?.name ?? "",
        courseCode: s.courseCode ?? s.subjectCode ?? s.course?.code ?? "",
        courseId: s.courseId ?? s.course?.id ?? "",
        scheduleId: s.scheduleId ?? s.id ?? "",
        teacherId: s.teacherId ?? teacherId ?? "",
        teacherName: s.teacherName ?? "",
        noofgroups: s.noofgroups ?? s.numberOfGroups ?? null,
        className: s._className ?? meta.className ?? "",
        classId: String(s._classesId ?? meta.classesId ?? meta.classId ?? ""),
        semester: String(s._semester ?? meta.semester ?? ""),
      });
    });
  result.sort((a, b) => {
    const di = DAY_ORDER.indexOf(a.day) - DAY_ORDER.indexOf(b.day);
    return di !== 0 ? di : a.slotNumber - b.slotNumber;
  });
  return result;
};

// ── Fetcher ───────────────────────────────────────────────────────────────────
export const getTeacherScheduleById = async (teacherId) => {
  const res = await api.get(`/schedule/teacher/${encodeURIComponent(teacherId)}`);

  // Unwrap: try responseData first, then raw data
  const rd = res.data?.responseData ?? res.data;

  const classes = extractClasses(rd);

  const allTimetable = [];
  const allMeta = {
    className: "",
    classId: "",
    classesId: "",
    semester: "",
    institutionId: rd?.institutionId ?? "",
    departmentId: rd?.departmentId ?? "",
  };

  classes.forEach((cls) => {
    const rows = extractSlots(cls);
    if (rows.length > 0 && !allMeta.className) {
      allMeta.className = cls.className ?? "";
      allMeta.classId = String(cls.classesId ?? cls.classId ?? "");
      allMeta.classesId = cls.classesId ?? "";
      allMeta.semester = String(cls.semester ?? "");
    }
    rows.forEach((row) =>
      allTimetable.push({
        ...row,
        _classesId: cls.classesId ?? cls.classId,
        _className: cls.className,
        _semester: cls.semester,
      })
    );
  });

  const slots = normaliseSlots(allTimetable, allMeta, teacherId);
  return { timetable: allTimetable, meta: allMeta, slots, classes, rd };
};

// ── Hook ──────────────────────────────────────────────────────────────────────
export const useTeacherScheduleById = (teacherId, options = {}) =>
  useQuery({
    queryKey: ["teacher-schedule-by-id", teacherId ?? ""],
    queryFn: () => getTeacherScheduleById(teacherId),
    enabled: !!teacherId && (options.enabled ?? true),
    staleTime: 5 * 60 * 1000,
    retry: 2,
  });

// ── Composite hook ────────────────────────────────────────────────────────────
export const useTeacherRoutine = () => {
  const user = JSON.parse(localStorage.getItem("gulum-user") || "null");
  const teacherId = user?.id ?? "";

  const { data, isLoading, isError, error } = useTeacherScheduleById(teacherId);

  return {
    slots: data?.slots ?? [],
    meta: data?.meta ?? { className: "", semester: "", classId: "", classesId: "", institutionId: "", departmentId: "" },
    timetable: data?.timetable ?? [],
    classes: data?.classes ?? [],
    isLoading,
    isError,
    error,
  };
};
