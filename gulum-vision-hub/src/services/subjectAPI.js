import api from "./api";

const unwrap = (data) => data?.responseData ?? data?.data ?? data;

export const normalizeSubject = (item) => {
  const subject = item?.course ?? item?.subject ?? item ?? {};
  const name =
    subject.name ??
    subject.courseName ??
    subject.course_name ??
    subject.subjectName ??
    subject.subject_name ??
    subject.title ??
    "Unknown Subject";
  const code =
    subject.code ??
    subject.courseCode ??
    subject.course_code ??
    subject.subjectCode ??
    subject.subject_code ??
    subject.id ??
    "";

  return {
    id: String(subject.id ?? subject.courseId ?? subject.course_id ?? code ?? name),
    name,
    code: String(code),
  };
};

export const getSubjectsByClassSemester = async ({ classId, semester }) => {
  const response = await api.get(`/course-class/class/${encodeURIComponent(classId)}`, {
    params: semester ? { semester } : undefined,
  });
  const raw = unwrap(response.data);
  const list = Array.isArray(raw)
    ? raw
    : raw?.subjects ?? raw?.courses ?? raw?.courseClasses ?? [];

  return list.map(normalizeSubject).filter((subject) => subject.name || subject.code);
};
