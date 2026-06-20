import { useState, useEffect, useMemo } from "react";
import { toast } from "sonner";
import { AdminShell } from "./AdminShell";
import { ConfirmModal } from "@/components/ConfirmModal";
import { CustomTooltip } from "@/components/CustomTooltip";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Plus,
  Trash2,
  Edit2,
  RefreshCw,
  Scissors,
  Link2,
  Layers,
  Move,
  FileDown,
} from "lucide-react";
import { initialData as deptData, type Subject } from "./departmentsData";
import { useAuth } from "@/contexts/AuthContext";
import {
  useGetDepartments,
  useGetAcademicBatchesByDepartment,
} from "@/services/departmentAPI";
import {
  useGetScheduleRoutine,
  useSaveScheduleRoutine,
  useSwapScheduleLayout,
  useMoveScheduleLayout,
  useExtendScheduleLayout,
  useGenerateScheduleRoutine,
  useDeleteSchedule,
} from "@/services/scheduleAPI";
import { useGetTeachers } from "@/services/teacherCrudAPI";

// Define TypeScript interfaces
interface RoutineItem {
  id: string;
  subject: string;
  code: string;
  teacher: string;
  room: string;
  colSpan: number;
  teacherId?: string;
  dbRecordId?: string;
  noofgroups?: number | null;
  timeslotIds?: string[];
  scheduleIds?: string[];
}

interface RoutineTrack {
  id: string;
  left: RoutineItem[]; // Slots I-IV, total colSpan sum must equal 4
  right: RoutineItem[]; // Slots V-VIII, total colSpan sum must equal 4
}

interface DayRoutine {
  day: string;
  tracks: RoutineTrack[];
}

// Resolve teacherId based on name from the teachers directory
const resolveTeacherId = (name: string, teachersList: any[]) => {
  if (!name) return "";
  const normalized = name.trim().toLowerCase();

  // Try exact match
  let found = teachersList.find(
    (t) => t.full_name?.trim().toLowerCase() === normalized,
  );
  if (found) return found.id;

  // Try partial match
  found = teachersList.find(
    (t) =>
      t.full_name?.trim().toLowerCase().includes(normalized) ||
      normalized.includes(t.full_name?.trim().toLowerCase()),
  );
  if (found) return found.id;

  return "";
};

// Serialize frontend DayRoutine grid to teacher-grouped backend timeslots
const serializeStateToBackend = (
  routine: DayRoutine[],
  teachersList: any[],
  originalRecords: any,
  institutionId: string,
  classId: string,
  semesterVal: number,
  slotTimeMap?: Record<number, { startTime: string; endTime: string }> | null,
) => {
  const flatSlots: {
    teacherId: string;
    teacherName: string;
    day: string;
    slotNumber: number;
    timeslotId?: string;
    scheduleId?: string;
    courseName: string;
    courseCode: string;
    noofgroups: number | null;
  }[] = [];

  const dayMap: Record<string, string> = {
    MON: "Monday",
    TUES: "Tuesday",
    WED: "Wednesday",
    THURS: "Thursday",
    FRI: "Friday",
    SAT: "Saturday",
    SUN: "Sunday",
  };

  routine.forEach((dayItem) => {
    const dbDayName = dayMap[dayItem.day] || dayItem.day;

    dayItem.tracks.forEach((track) => {
      // Process left side (Slots 1-4)
      let leftSlotIdx = 1;
      track.left.forEach((cell) => {
        const span = cell.colSpan;
        if (cell.subject) {
          let tId =
            cell.teacherId || resolveTeacherId(cell.teacher, teachersList);

          for (let i = 0; i < span; i++) {
            const slotNum = leftSlotIdx + i;
            const tIdFromCell = cell.timeslotIds && cell.timeslotIds[i];
            const sIdFromCell = cell.scheduleIds && cell.scheduleIds[i];

            flatSlots.push({
              teacherId: tId,
              teacherName: cell.teacher,
              day: dbDayName,
              slotNumber: slotNum,
              timeslotId: tIdFromCell || undefined,
              scheduleId: sIdFromCell || undefined,
              courseName: cell.subject,
              courseCode: cell.code,
              noofgroups: cell.noofgroups || null,
            });
          }
        }
        leftSlotIdx += span;
      });

      // Process right side (Slots 5-8)
      let rightSlotIdx = 5;
      track.right.forEach((cell) => {
        const span = cell.colSpan;
        if (cell.subject) {
          let tId =
            cell.teacherId || resolveTeacherId(cell.teacher, teachersList);

          for (let i = 0; i < span; i++) {
            const slotNum = rightSlotIdx + i;
            const tIdFromCell = cell.timeslotIds && cell.timeslotIds[i];
            const sIdFromCell = cell.scheduleIds && cell.scheduleIds[i];

            flatSlots.push({
              teacherId: tId,
              teacherName: cell.teacher,
              day: dbDayName,
              slotNumber: slotNum,
              timeslotId: tIdFromCell || undefined,
              scheduleId: sIdFromCell || undefined,
              courseName: cell.subject,
              courseCode: cell.code,
              noofgroups: cell.noofgroups || null,
            });
          }
        }
        rightSlotIdx += span;
      });
    });
  });

  // Group by teacher
  const groupedByTeacher: Record<string, typeof flatSlots> = {};
  flatSlots.forEach((slot) => {
    const key = slot.teacherId || slot.teacherName;
    if (!groupedByTeacher[key]) {
      groupedByTeacher[key] = [];
    }
    groupedByTeacher[key].push(slot);
  });

  return Object.keys(groupedByTeacher).map((key) => {
    const slots = groupedByTeacher[key];
    const firstSlot = slots[0];
    const teacherId = firstSlot.teacherId;
    const teacherName = firstSlot.teacherName;

    let originalRecord: any = null;
    if (Array.isArray(originalRecords)) {
      originalRecord = originalRecords.find(
        (r) =>
          (teacherId && r.teacherId === teacherId) ||
          (r.teacherName &&
            r.teacherName.trim().toLowerCase() ===
            teacherName.trim().toLowerCase()),
      );
    } else if (
      originalRecords &&
      Array.isArray((originalRecords as any).timetable)
    ) {
      const foundSlot = (originalRecords as any).timetable.find(
        (s: any) =>
          (teacherId && s.teacherId === teacherId) ||
          (s.teacherName &&
            s.teacherName.trim().toLowerCase() ===
            teacherName.trim().toLowerCase()),
      );
      if (foundSlot) {
        originalRecord = { id: foundSlot.scheduleId || undefined };
      }
    }

    return {
      id: originalRecord?.id || undefined,
      institutionId,
      semester: semesterVal,
      teacherId: teacherId || null,
      classesId: classId,
      teacherName,
      timeslot: slots.map((s) => {
        const timeInfo = slotTimeMap?.[s.slotNumber];
        return {
          scheduleId: s.scheduleId || undefined,
          timeslotId: s.timeslotId || undefined,
          day: s.day,
          startTime: timeInfo?.startTime || "",
          endTime: timeInfo?.endTime || "",
          slotNumber: s.slotNumber,
          courseName: s.courseName,
          courseCode: s.courseCode,
          noofgroups: s.noofgroups,
        };
      }),
    };
  });
};

// Helper to generate IDs
const generateId = () => "id_" + Math.random().toString(36).substring(2, 9);

// Create a blank row segment (either left or right)
const createBlankSegment = (): RoutineItem[] => [
  {
    id: generateId(),
    subject: "",
    code: "",
    teacher: "",
    room: "",
    colSpan: 1,
  },
  {
    id: generateId(),
    subject: "",
    code: "",
    teacher: "",
    room: "",
    colSpan: 1,
  },
  {
    id: generateId(),
    subject: "",
    code: "",
    teacher: "",
    room: "",
    colSpan: 1,
  },
  {
    id: generateId(),
    subject: "",
    code: "",
    teacher: "",
    room: "",
    colSpan: 1,
  },
];

// Create a default blank timetable (MON to FRI, 1 track each)
const createBlankRoutine = (): DayRoutine[] => [
  {
    day: "MON",
    tracks: [
      {
        id: generateId(),
        left: createBlankSegment(),
        right: createBlankSegment(),
      },
    ],
  },
  {
    day: "TUES",
    tracks: [
      {
        id: generateId(),
        left: createBlankSegment(),
        right: createBlankSegment(),
      },
    ],
  },
  {
    day: "WED",
    tracks: [
      {
        id: generateId(),
        left: createBlankSegment(),
        right: createBlankSegment(),
      },
    ],
  },
  {
    day: "THURS",
    tracks: [
      {
        id: generateId(),
        left: createBlankSegment(),
        right: createBlankSegment(),
      },
    ],
  },
  {
    day: "FRI",
    tracks: [
      {
        id: generateId(),
        left: createBlankSegment(),
        right: createBlankSegment(),
      },
    ],
  },
];

const formatTimeHM = (timeStr: string) => {
  if (!timeStr) return "";
  const parts = timeStr.trim().split(":");
  if (parts.length >= 2) {
    return `${parts[0].padStart(2, "0")}:${parts[1].padStart(2, "0")}`;
  }
  return timeStr;
};

export default function ScheduleRoutine() {
  const { user } = useAuth();
  const institutionId = user?.institutionId || "";

  // Selectors State
  const [selectedDeptId, setSelectedDeptId] = useState<string>("");
  const [selectedYear, setSelectedYear] = useState<string>("");
  const [selectedSection, setSelectedSection] = useState<string>("");
  const [selectedSemester, setSelectedSemester] = useState<string>("");

  // TanStack Query Hooks
  const { data: teachersData = [] } = useGetTeachers();
  const teachers = useMemo(
    () => (Array.isArray(teachersData) ? teachersData : []),
    [teachersData],
  );

  const { data: rawDepts, isLoading: departmentsLoading } = useGetDepartments();
  const departments = useMemo(
    () => (Array.isArray(rawDepts) ? rawDepts : []),
    [rawDepts],
  );

  const { data: rawBatches, isLoading: batchesLoading } =
    useGetAcademicBatchesByDepartment(selectedDeptId, {
      enabled: !!selectedDeptId,
    });
  const batches = useMemo(() => {
    if (!rawBatches) return [];
    return Array.isArray(rawBatches)
      ? rawBatches
      : (rawBatches.responseData ?? rawBatches.data ?? []);
  }, [rawBatches]);

  const [isEditMode, setIsEditMode] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [createGroupCount, setCreateGroupCount] = useState<number>(1);

  // Routine State
  const [routineState, setRoutineState] = useState<DayRoutine[]>([]);

  // Raw records, and slot time map state
  const [rawRoutineData, setRawRoutineData] = useState<any>(null);
  const [slotTimeMap, setSlotTimeMap] = useState<Record<
    number,
    { startTime: string; endTime: string }
  > | null>();

  // Dynamically compute left/right slots and break text
  const dynamicTimeSlotsLeft = useMemo(() => {
    return [
      {
        name: "SLOT-1",
        time: `${formatTimeHM(slotTimeMap?.[1]?.startTime)} - ${formatTimeHM(slotTimeMap?.[1]?.endTime)}`,
      },
      {
        name: "SLOT-2",
        time: `${formatTimeHM(slotTimeMap?.[2]?.startTime)} - ${formatTimeHM(slotTimeMap?.[2]?.endTime)}`,
      },
      {
        name: "SLOT-3",
        time: `${formatTimeHM(slotTimeMap?.[3]?.startTime)} - ${formatTimeHM(slotTimeMap?.[3]?.endTime)}`,
      },
      {
        name: "SLOT-4",
        time: `${formatTimeHM(slotTimeMap?.[4]?.startTime)} - ${formatTimeHM(slotTimeMap?.[4]?.endTime)}`,
      },
    ];
  }, [slotTimeMap]);

  const dynamicTimeSlotsRight = useMemo(() => {
    return [
      {
        name: "SLOT-5",
        time: `${formatTimeHM(slotTimeMap?.[5]?.startTime)} - ${formatTimeHM(slotTimeMap?.[5]?.endTime)}`,
      },
      {
        name: "SLOT-6",
        time: `${formatTimeHM(slotTimeMap?.[6]?.startTime)} - ${formatTimeHM(slotTimeMap?.[6]?.endTime)}`,
      },
      {
        name: "SLOT-7",
        time: `${formatTimeHM(slotTimeMap?.[7]?.startTime)} - ${formatTimeHM(slotTimeMap?.[7]?.endTime)}`,
      },
      {
        name: "SLOT-8",
        time: `${formatTimeHM(slotTimeMap?.[8]?.startTime)} - ${formatTimeHM(slotTimeMap?.[8]?.endTime)}`,
      },
    ];
  }, [slotTimeMap]);

  const breakIntervalText = useMemo(() => {
    const breakStart = slotTimeMap?.[4]?.endTime;
    const breakEnd = slotTimeMap?.[5]?.startTime;
    return `${formatTimeHM(breakStart)}-${formatTimeHM(breakEnd)}`;
  }, [slotTimeMap]);

  const findTimeslotId = (
    dayShort: string,
    slotNum: number,
  ): string | undefined => {
    const dayMap: Record<string, string> = {
      MON: "Monday",
      TUES: "Tuesday",
      WED: "Wednesday",
      THURS: "Thursday",
      FRI: "Friday",
      SAT: "Saturday",
      SUN: "Sunday",
    };
    const fullDay = dayMap[dayShort] || dayShort;

    if (rawRoutineData && Array.isArray((rawRoutineData as any).timetable)) {
      const found = (rawRoutineData as any).timetable.find(
        (s: any) =>
          String(s.day).toLowerCase() === fullDay.toLowerCase() &&
          s.slotNumber === slotNum,
      );
      if (found?.timeslotId) return found.timeslotId;
    }

    if (Array.isArray(rawRoutineData)) {
      for (const record of rawRoutineData) {
        const slots = record.timeslot || record.timeslots || [];
        const found = slots.find(
          (s: any) =>
            String(s.day).toLowerCase() === fullDay.toLowerCase() &&
            s.slotNumber === slotNum,
        );
        if (found?.timeslotId) return found.timeslotId;
      }
    }
    return undefined;
  };

  // Edit Cell Modal State
  const [editingCell, setEditingCell] = useState<{
    dayIndex: number;
    trackIndex: number;
    side: "left" | "right";
    cellIndex: number;
  } | null>(null);

  const [editForm, setEditForm] = useState({
    subject: "",
    code: "",
    teacher: "",
    room: "",
  });

  // Drag states
  const [draggedCellInfo, setDraggedCellInfo] = useState<{
    dayIndex: number;
    trackIndex: number;
    side: "left" | "right";
    cellIndex: number;
  } | null>(null);

  const [resizeInfo, setResizeInfo] = useState<{
    dayIndex: number;
    trackIndex: number;
    side: "left" | "right";
    cellIndex: number;
  } | null>(null);

  const [hoveredCell, setHoveredCell] = useState<string | null>(null); // formatted: "day-track-side-cell"

  const [clearCellTarget, setClearCellTarget] = useState<{
    dayIndex: number;
    trackIndex: number;
    side: "left" | "right";
    cellIndex: number;
  } | null>(null);

  const [removeTrackTarget, setRemoveTrackTarget] = useState<{
    dayIndex: number;
    trackIndex: number;
  } | null>(null);

  // Storage Key for loading/saving
  const storageKey = useMemo(() => {
    return `routine_v1_${selectedDeptId || "dept"}_${(selectedYear || "year").replace(" ", "-")}_${(selectedSection || "sec").replace(" ", "-")}_${selectedSemester || "sem"}`;
  }, [selectedDeptId, selectedYear, selectedSection, selectedSemester]);

  // Derived selections
  const availableYears = useMemo(() => {
    let list: string[] = [];
    if (batches.length === 0 && selectedDeptId) {
      const dept = deptData.find((d) => d.id === selectedDeptId);
      list = dept?.years.map((y) => y.year) || [];
    } else {
      list = Array.from(
        new Set(batches.map((b: any) => b.year).filter(Boolean)),
      ) as string[];
    }
    return [...list].sort((a, b) => {
      const numA = parseInt(a, 10);
      const numB = parseInt(b, 10);
      if (!isNaN(numA) && !isNaN(numB)) {
        return numA - numB;
      }
      return a.localeCompare(b, undefined, {
        numeric: true,
        sensitivity: "base",
      });
    });
  }, [batches, selectedDeptId]);

  const availableSections = useMemo(() => {
    if (batches.length === 0 && selectedDeptId) {
      const dept = deptData.find((d) => d.id === selectedDeptId);
      const yearObj = dept?.years.find((y) => y.year === selectedYear);
      return yearObj?.sections.map((s) => s.name) || [];
    }
    const matchingBatches = batches.filter((b: any) => b.year === selectedYear);
    const sections: string[] = [];
    matchingBatches.forEach((b: any) => {
      if (b.classes && Array.isArray(b.classes)) {
        b.classes.forEach((c: any) => {
          if (c.name) sections.push(c.name);
        });
      }
    });
    return Array.from(new Set(sections));
  }, [batches, selectedDeptId, selectedYear]);

  const availableSemesters = useMemo(() => {
    if (batches.length === 0 && selectedDeptId) {
      return ["1", "2", "3", "4", "5", "6", "7", "8"];
    }
    const matchingBatches = batches.filter((b: any) => b.year === selectedYear);
    const semesters: string[] = [];
    matchingBatches.forEach((b: any) => {
      if (b.classes && Array.isArray(b.classes)) {
        b.classes.forEach((c: any) => {
          if (c.name === selectedSection && c.semester) {
            semesters.push(String(c.semester));
          }
        });
      }
    });
    return Array.from(new Set(semesters));
  }, [batches, selectedDeptId, selectedYear, selectedSection]);

  const selectedClassId = useMemo(() => {
    if (batches.length === 0) return "";
    const matchingBatches = batches.filter((b: any) => b.year === selectedYear);
    let foundId = "";
    matchingBatches.forEach((b: any) => {
      if (b.classes && Array.isArray(b.classes)) {
        b.classes.forEach((c: any) => {
          if (
            c.name === selectedSection &&
            String(c.semester) === selectedSemester
          ) {
            foundId = String(c.id || c.classId || "");
          }
        });
      }
    });
    return foundId;
  }, [batches, selectedYear, selectedSection, selectedSemester]);

  // Map backend timetable items to structured DayRoutine[]
  const mapBackendToState = (data: any): DayRoutine[] => {
    if (!data) return createBlankRoutine();

    // 1. Extract timetable array
    let timetableArray: any[] = [];
    if (data && Array.isArray(data.timetable)) {
      timetableArray = data.timetable;
    } else if (Array.isArray(data)) {
      // old format support or fallback
      data.forEach((record: any) => {
        const timeslots = record.timeslot || record.timeslots || [];
        if (Array.isArray(timeslots)) {
          timeslots.forEach((slot: any) => {
            timetableArray.push({
              timeslotId: slot.timeslotId,
              day: slot.day,
              slotNumber: slot.slotNumber,
              startTime: slot.startTime,
              endTime: slot.endTime,
              occupied: true,
              scheduleId: slot.scheduleId,
              courseName: slot.courseName,
              courseCode: slot.courseCode,
              teacherId: record.teacherId,
              teacherName: record.teacherName,
              noofgroups: slot.noofgroups,
            });
          });
        }
      });
    } else if (data && data.responseData) {
      if (Array.isArray(data.responseData.timetable)) {
        timetableArray = data.responseData.timetable;
      } else if (Array.isArray(data.responseData)) {
        data.responseData.forEach((record: any) => {
          const timeslots = record.timeslot || record.timeslots || [];
          if (Array.isArray(timeslots)) {
            timeslots.forEach((slot: any) => {
              timetableArray.push({
                timeslotId: slot.timeslotId,
                day: slot.day,
                slotNumber: slot.slotNumber,
                startTime: slot.startTime,
                endTime: slot.endTime,
                occupied: true,
                scheduleId: slot.scheduleId,
                courseName: slot.courseName,
                courseCode: slot.courseCode,
                teacherId: record.teacherId,
                teacherName: record.teacherName,
                noofgroups: slot.noofgroups,
              });
            });
          }
        });
      }
    }

    // Proactively extract time slot configurations dynamically from database response
    const newSlotTimeMap = { ...slotTimeMap };
    timetableArray.forEach((slot: any) => {
      if (slot.slotNumber && slot.startTime && slot.endTime) {
        newSlotTimeMap[slot.slotNumber] = {
          startTime: slot.startTime,
          endTime: slot.endTime,
        };
      }
    });
    setSlotTimeMap(newSlotTimeMap);

    // Helper to find timeslotId inside this local function to avoid React state delay
    const getLocalTimeslotId = (
      dayShort: string,
      slotNum: number,
    ): string | undefined => {
      const dayMap: Record<string, string> = {
        MON: "Monday",
        TUES: "Tuesday",
        WED: "Wednesday",
        THURS: "Thursday",
        FRI: "Friday",
        SAT: "Saturday",
        SUN: "Sunday",
      };
      const fullDay = dayMap[dayShort] || dayShort;
      const found = timetableArray.find(
        (s: any) =>
          String(s.day).toLowerCase() === fullDay.toLowerCase() &&
          s.slotNumber === slotNum,
      );
      return found?.timeslotId;
    };

    // Flatten all occupied timeslots
    const flatSlots: {
      dbRecordId: string;
      teacherId: string;
      teacherName: string;
      timeslotId: string;
      scheduleId: string;
      slotNumber: number;
      courseName: string;
      courseCode: string;
      noofgroups: number | null;
      day: string;
    }[] = [];

    timetableArray.forEach((slot: any) => {
      if (!slot.occupied) return;

      // NEW ELECTIVE FORMAT
      if (slot.subjects && Array.isArray(slot.subjects)) {
        slot.subjects.forEach((subject: any) => {
          flatSlots.push({
            dbRecordId: subject.scheduleId || "",
            teacherId: subject.teacherId || "",
            teacherName: subject.teacherName || "",
            timeslotId: slot.timeslotId || "",
            scheduleId: subject.scheduleId || "",
            slotNumber: slot.slotNumber,
            courseName: subject.courseName || "",
            courseCode: subject.courseCode || "",
            noofgroups: subject.noofgroups ?? null,
            day: slot.day,
          });
        });
      } else {
        // OLD FORMAT SUPPORT
        flatSlots.push({
          dbRecordId: slot.scheduleId || "",
          teacherId: slot.teacherId || "",
          teacherName: slot.teacherName || "",
          timeslotId: slot.timeslotId || "",
          scheduleId: slot.scheduleId || "",
          slotNumber: slot.slotNumber,
          courseName: slot.courseName || "",
          courseCode: slot.courseCode || "",
          noofgroups: slot.noofgroups ?? null,
          day: slot.day,
        });
      }
    });

    const dayNameMap: Record<string, string> = {
      monday: "MON",
      tuesday: "TUES",
      wednesday: "WED",
      thursday: "THURS",
      friday: "FRI",
      saturday: "SAT",
      sunday: "SUN",
      mon: "MON",
      tue: "TUES",
      tues: "TUES",
      wed: "WED",
      thu: "THURS",
      thurs: "THURS",
      fri: "FRI",
      sat: "SAT",
      sun: "SUN",
    };

    const base = createBlankRoutine();

    // Helper to build side segment
    const localBuildSideSegment = (
      trackBlocks: any[],
      side: "left" | "right",
      dayShort: string,
    ): RoutineItem[] => {
      const minSlot = side === "left" ? 1 : 5;
      const items: any[] = [];

      for (let offset = 0; offset < 4; offset++) {
        const slotNum = minSlot + offset;
        const tId = getLocalTimeslotId(dayShort, slotNum);
        items.push({
          id: generateId(),
          subject: "",
          code: "",
          teacher: "",
          room: "",
          colSpan: 1,
          slotNumber: slotNum,
          timeslotIds: tId ? [tId] : undefined,
        });
      }

      trackBlocks.forEach((b) => {
        const relevantSlots = b.slots.filter((s: number) =>
          side === "left" ? s <= 4 : s >= 5,
        );
        if (relevantSlots.length === 0) return;

        relevantSlots.sort((a: number, b: number) => a - b);
        const startSlot = relevantSlots[0];
        const span = relevantSlots.length;

        const idx = items.findIndex((item) => item.slotNumber === startSlot);
        if (idx !== -1) {
          items[idx] = {
            id: generateId(),
            subject: b.subject,
            code: b.code,
            teacher: b.teacher,
            room: b.room || "",
            colSpan: span,
            slotNumber: startSlot,
            teacherId: b.teacherId,
            dbRecordId: b.dbRecordId,
            noofgroups: b.noofgroups,
            timeslotIds: b.timeslotIds,
            scheduleIds: b.scheduleIds,
          };
          items.splice(idx + 1, span - 1);
        }
      });

      return items;
    };

    // Process day by day
    base.forEach((dayObj) => {
      const targetDayShort = dayObj.day;

      const daySlots = flatSlots.filter((s) => {
        const slotDayNormalized = String(s.day).toLowerCase();
        return dayNameMap[slotDayNormalized] === targetDayShort;
      });

      if (daySlots.length === 0) {
        dayObj.tracks = [
          {
            id: generateId(),
            left: localBuildSideSegment([], "left", targetDayShort),
            right: localBuildSideSegment([], "right", targetDayShort),
          },
        ];
        return;
      }

      const blocks: {
        subject: string;
        code: string;
        teacher: string;
        teacherId: string;
        dbRecordId: string;
        noofgroups: number | null;
        slots: number[];
        timeslotIds: string[];
        scheduleIds: string[];
      }[] = [];

      daySlots.sort((a, b) => a.slotNumber - b.slotNumber);

      daySlots.forEach((s) => {
        let merged = false;
        for (const b of blocks) {
          const sameCourse = b.subject === s.courseName;
          const sameTeacher = b.teacherId === s.teacherId;

          // electives must never merge together
          const sameGroups =
            b.noofgroups === s.noofgroups && b.teacherId === s.teacherId;

          if (sameCourse && sameTeacher && sameGroups) {
            const maxSlot = Math.max(...b.slots);
            const minSlot = Math.min(...b.slots);
            const isConsecutive =
              s.slotNumber === maxSlot + 1 || s.slotNumber === minSlot - 1;

            const bSide = maxSlot <= 4 ? "left" : "right";
            const sSide = s.slotNumber <= 4 ? "left" : "right";

            if (isConsecutive && bSide === sSide) {
              b.slots.push(s.slotNumber);
              b.slots.sort((a, b) => a - b);
              b.timeslotIds.push(s.timeslotId);
              b.scheduleIds.push(s.scheduleId);
              merged = true;
              break;
            }
          }
        }

        if (!merged) {
          blocks.push({
            subject: s.courseName,
            code: s.courseCode,
            teacher: s.teacherName,
            teacherId: s.teacherId,
            dbRecordId: s.dbRecordId,
            noofgroups: s.noofgroups,
            slots: [s.slotNumber],
            timeslotIds: [s.timeslotId],
            scheduleIds: [s.scheduleId],
          });
        }
      });

      const tracks: (typeof blocks)[] = [];
      blocks.forEach((b) => {
        let placed = false;
        for (const track of tracks) {
          const hasOverlap = track.some((existingBlock) =>
            existingBlock.slots.some((slot) => b.slots.includes(slot)),
          );
          if (!hasOverlap) {
            track.push(b);
            placed = true;
            break;
          }
        }
        if (!placed) {
          tracks.push([b]);
        }
      });

      dayObj.tracks = tracks.map((trackBlocks) => {
        return {
          id: generateId(),
          left: localBuildSideSegment(trackBlocks, "left", targetDayShort),
          right: localBuildSideSegment(trackBlocks, "right", targetDayShort),
        };
      });

      if (dayObj.tracks.length === 0) {
        dayObj.tracks = [
          {
            id: generateId(),
            left: localBuildSideSegment([], "left", targetDayShort),
            right: localBuildSideSegment([], "right", targetDayShort),
          },
        ];
      }
    });

    return base;
  };

  const loadLocalFallback = () => {
    const savedData = localStorage.getItem(storageKey);
    if (savedData) {
      try {
        setRoutineState(JSON.parse(savedData));
        return;
      } catch (e) {
        // Fall through
      }
    }
    setRoutineState(createBlankRoutine());
  };

  // TanStack Query for Routine
  const {
    data: routineData,
    isLoading: routineLoading,
    refetch: refetchRoutine,
  } = useGetScheduleRoutine(institutionId, selectedDeptId, selectedClassId, {
    enabled: !!selectedClassId,
  });

  // Check if the fetched routine has any actual data (any occupied slot)
  const hasRoutineData = useMemo(() => {
    if (!routineData) return false;
    const data = routineData?.responseData ?? routineData;
    if (data && Array.isArray(data.timetable)) {
      return data.timetable.some(
        (slot: any) =>
          slot.occupied === true ||
          slot.courseId ||
          slot.courseName ||
          slot.scheduleId,
      );
    }
    if (Array.isArray(data)) {
      return data.length > 0;
    }
    return false;
  }, [routineData]);

  const saveRoutineMutation = useSaveScheduleRoutine();
  const saving = saveRoutineMutation.isPending;

  const swapScheduleMutation = useSwapScheduleLayout();
  const moveScheduleMutation = useMoveScheduleLayout();
  const extendScheduleMutation = useExtendScheduleLayout();
  const generateRoutineMutation = useGenerateScheduleRoutine();
  const generating = generateRoutineMutation.isPending;
  const deleteScheduleMutation = useDeleteSchedule();

  // Handler for Create button — opens the dialog to input number of groups
  const handleCreateRoutine = () => {
    if (!selectedClassId || !selectedDeptId || !institutionId) {
      toast.error(
        "Please select a complete class (Department, Year, Section, Semester) before creating.",
      );
      return;
    }
    setCreateGroupCount(1);
    setShowCreateDialog(true);
  };

  // Confirm create — calls the generate API with noofgroups body
  const confirmCreateRoutine = () => {
    setShowCreateDialog(false);

    const toastId = toast.loading("Generating schedule routine...");
    generateRoutineMutation.mutate(
      {
        instituteId: institutionId,
        departmentId: selectedDeptId,
        classId: selectedClassId,
        body: { noofgroups: createGroupCount },
      },
      {
        onSuccess: (data) => {
          toast.success("Schedule routine generated successfully!", {
            id: toastId,
          });
          if (data) {
            setRawRoutineData(data);
            const parsed = mapBackendToState(data);
            setRoutineState(parsed);
          }
          setIsEditMode(true);
          refetchRoutine();
        },
        onError: (err) => {
          console.error("Error generating routine:", err);
          toast.error("Failed to generate schedule routine.", { id: toastId });
        },
      },
    );
  };

  // Load / Sync Routine state
  useEffect(() => {
    if (routineData) {
      setRawRoutineData(routineData);
      const parsed = mapBackendToState(routineData);
      setRoutineState(parsed);
    } else if (routineData === null || routineData === undefined) {
      if (!routineLoading) {
        setRawRoutineData([]);
        setSlotTimeMap(null);
        loadLocalFallback();
      }
    }
  }, [routineData, routineLoading, selectedClassId]);

  // Log routine state rendering and time slots
  // useEffect(() => {
  //   console.log("Routine Rendering State:", routineState);
  // }, [routineState]);

  // useEffect(() => {
  //   console.log("Time Slots Left (SLOT-1 to 4):", dynamicTimeSlotsLeft);
  //   console.log("Time Slots Right (SLOT-5 to 8):", dynamicTimeSlotsRight);
  //   console.log("Break Interval Text:", breakIntervalText);
  // }, [dynamicTimeSlotsLeft, dynamicTimeSlotsRight, breakIntervalText]);

  // Save changes locally
  const saveAllToStorage = (newRoutine: DayRoutine[]) => {
    localStorage.setItem(storageKey, JSON.stringify(newRoutine));
  };

  const updateRoutine = (newRoutine: DayRoutine[]) => {
    setRoutineState(newRoutine);
    saveAllToStorage(newRoutine);
  };

  const handleSaveToBackend = () => {
    if (!selectedClassId) {
      toast.error(
        "Please specify a complete class (Department, Year, Section, Semester) before saving.",
      );
      return;
    }

    const payload = serializeStateToBackend(
      routineState,
      teachers,
      rawRoutineData,
      institutionId,
      selectedClassId,
      parseInt(selectedSemester, 10) || 6,
      slotTimeMap,
    );

    saveRoutineMutation.mutate(
      {
        instituteId: institutionId,
        departmentId: selectedDeptId,
        classId: selectedClassId,
        scheduleData: payload,
      },
      {
        onSuccess: (data) => {
          toast.success("Schedule routine saved to backend database!");
          setIsEditMode(false);
          if (data) {
            setRawRoutineData(data);
            const parsed = mapBackendToState(data);
            setRoutineState(parsed);
          }
        },
        onError: (err) => {
          console.error("Error saving routine to backend:", err);
          toast.error("Failed to save schedule routine to database.");
        },
      },
    );
  };

  const handleCancelEdit = () => {
    const parsed = mapBackendToState(rawRoutineData);
    setRoutineState(parsed);
    setIsEditMode(false);
    toast.info("Editing canceled. Routine restored.");
  };

  // Track Management
  const handleAddTrack = (dayIndex: number) => {
    const updated = [...routineState];
    const day = updated[dayIndex];
    day.tracks.push({
      id: generateId(),
      left: createBlankSegment(),
      right: createBlankSegment(),
    });
    updateRoutine(updated);
    toast.success(`Added parallel scheduling row for ${day.day}`);
  };

  const handleRemoveTrack = (dayIndex: number, trackIndex: number) => {
    const day = routineState[dayIndex];
    if (day.tracks.length <= 1) {
      toast.error("At least one schedule track is required per day.");
      return;
    }
    setRemoveTrackTarget({ dayIndex, trackIndex });
  };

  const confirmRemoveTrack = () => {
    if (!removeTrackTarget) return;
    const { dayIndex, trackIndex } = removeTrackTarget;
    const updated = [...routineState];
    const day = updated[dayIndex];
    day.tracks.splice(trackIndex, 1);
    updateRoutine(updated);
    toast.info(`Removed schedule row from ${day.day}`);
  };

  // Edit Cell Modal Operations
  const handleOpenEditCell = (
    dayIndex: number,
    trackIndex: number,
    side: "left" | "right",
    cellIndex: number,
  ) => {
    const cell = routineState[dayIndex].tracks[trackIndex][side][cellIndex];
    setEditingCell({ dayIndex, trackIndex, side, cellIndex });
    setEditForm({
      subject: cell.subject,
      code: cell.code || "",
      teacher: cell.teacher || "",
      room: cell.room || "",
    });
  };

  const handleSaveEditCell = () => {
    if (!editingCell) return;
    const { dayIndex, trackIndex, side, cellIndex } = editingCell;
    const updated = [...routineState];
    const cell = updated[dayIndex].tracks[trackIndex][side][cellIndex];

    const resolvedId = resolveTeacherId(editForm.teacher, teachers);

    updated[dayIndex].tracks[trackIndex][side][cellIndex] = {
      ...cell,
      subject: editForm.subject,
      code: editForm.code,
      teacher: editForm.teacher,
      teacherId: resolvedId || undefined,
      room: editForm.room,
    };
    updateRoutine(updated);
    setEditingCell(null);
    toast.success("Updated schedule slot!");
  };

  // Clear cell details
  const handleClearCell = (
    dayIndex: number,
    trackIndex: number,
    side: "left" | "right",
    cellIndex: number,
  ) => {
    setClearCellTarget({ dayIndex, trackIndex, side, cellIndex });
  };

  const confirmClearCell = () => {
    if (!clearCellTarget) return;
    const { dayIndex, trackIndex, side, cellIndex } = clearCellTarget;
    const updated = [...routineState];
    const cell = updated[dayIndex].tracks[trackIndex][side][cellIndex];
    const scheduleId = cell.dbRecordId || cell.scheduleIds?.[0];

    if (scheduleId) {
      const toastId = toast.loading("Deleting schedule slot...");
      deleteScheduleMutation.mutate(scheduleId, {
        onSuccess: () => {
          toast.success("Schedule slot deleted successfully!", {
            id: toastId,
          });
          // Update state locally
          updated[dayIndex].tracks[trackIndex][side][cellIndex] = {
            ...cell,
            subject: "",
            code: "",
            teacher: "",
            room: "",
            dbRecordId: undefined,
            scheduleIds: undefined,
          };
          updateRoutine(updated);
          refetchRoutine();
        },
        onError: (err) => {
          console.error("Error deleting schedule slot:", err);
          toast.error("Failed to delete schedule slot", {
            id: toastId,
          });
          refetchRoutine();
        },
      });
    } else {
      updated[dayIndex].tracks[trackIndex][side][cellIndex] = {
        ...cell,
        subject: "",
        code: "",
        teacher: "",
        room: "",
      };
      updateRoutine(updated);
      toast.info("Cleared slot details locally");
    }
  };

  // HTML5 Drag and Drop Handlers
  const handleDragStartFromCell = (
    e: React.DragEvent,
    dayIndex: number,
    trackIndex: number,
    side: "left" | "right",
    cellIndex: number,
  ) => {
    if (!isEditMode) {
      e.preventDefault();
      return;
    }
    setDraggedCellInfo({ dayIndex, trackIndex, side, cellIndex });
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOverCell = (
    e: React.DragEvent,
    dayIndex: number,
    trackIndex: number,
    side: "left" | "right",
    cellIndex: number,
  ) => {
    if (!isEditMode) return;
    e.preventDefault();

    if (resizeInfo) {
      if (
        resizeInfo.dayIndex === dayIndex &&
        resizeInfo.trackIndex === trackIndex &&
        resizeInfo.side === side
      ) {
        const sideList = routineState[dayIndex].tracks[trackIndex][side];
        const targetSlotIdx = getTargetSlotIndexFromEvent(
          e,
          sideList,
          cellIndex,
          side,
        );
        const cellKey = `${dayIndex}-${trackIndex}-${side}-${cellIndex}-resize-${targetSlotIdx}`;
        if (hoveredCell !== cellKey) {
          setHoveredCell(cellKey);
        }
      }
      return;
    }

    const cellKey = `${dayIndex}-${trackIndex}-${side}-${cellIndex}`;
    if (hoveredCell !== cellKey) {
      setHoveredCell(cellKey);
    }
  };

  const handleDragLeaveCell = () => {
    setHoveredCell(null);
  };

  const handleDropOnCell = (
    e: React.DragEvent,
    dayIndex: number,
    trackIndex: number,
    side: "left" | "right",
    cellIndex: number,
  ) => {
    e.preventDefault();
    if (!isEditMode) return;
    setHoveredCell(null);

    if (resizeInfo) {
      if (
        resizeInfo.dayIndex === dayIndex &&
        resizeInfo.trackIndex === trackIndex &&
        resizeInfo.side === side
      ) {
        const sideList = routineState[dayIndex].tracks[trackIndex][side];
        const targetSlotIdx = getTargetSlotIndexFromEvent(
          e,
          sideList,
          cellIndex,
          side,
        );
        handleResizeCell(
          dayIndex,
          trackIndex,
          side,
          resizeInfo.cellIndex,
          targetSlotIdx,
        );
      }
      setResizeInfo(null);
      return;
    }

    if (draggedCellInfo) {
      const previousState = JSON.parse(JSON.stringify(routineState));
      const updated = JSON.parse(JSON.stringify(routineState));
      const targetCell = updated[dayIndex].tracks[trackIndex][side][cellIndex];
      const {
        dayIndex: srcDay,
        trackIndex: srcTrack,
        side: srcSide,
        cellIndex: srcCellIdx,
      } = draggedCellInfo;

      // Don't do anything if dropped on itself
      if (
        srcDay === dayIndex &&
        srcTrack === trackIndex &&
        srcSide === side &&
        srcCellIdx === cellIndex
      ) {
        return;
      }

      const sourceCell = updated[srcDay].tracks[srcTrack][srcSide][srcCellIdx];

      // Swap cell data (keep colSpans intact)
      updated[dayIndex].tracks[trackIndex][side][cellIndex] = {
        ...targetCell,
        subject: sourceCell.subject,
        code: sourceCell.code,
        teacher: sourceCell.teacher,
        room: sourceCell.room,
        teacherId: sourceCell.teacherId,
        dbRecordId: sourceCell.dbRecordId,
        noofgroups: sourceCell.noofgroups,
        timeslotIds: sourceCell.timeslotIds,
        scheduleIds: sourceCell.scheduleIds,
      };

      updated[srcDay].tracks[srcTrack][srcSide][srcCellIdx] = {
        ...sourceCell,
        subject: targetCell.subject,
        code: targetCell.code,
        teacher: targetCell.teacher,
        room: targetCell.room,
        teacherId: targetCell.teacherId,
        dbRecordId: targetCell.dbRecordId,
        noofgroups: targetCell.noofgroups,
        timeslotIds: targetCell.timeslotIds,
        scheduleIds: targetCell.scheduleIds,
      };

      // Optimistically update the local state
      updateRoutine(updated);

      const sourceScheduleId = sourceCell.scheduleIds?.[0];
      const targetScheduleId = targetCell.scheduleIds?.[0];

      let targetTimeslotId = targetCell.timeslotIds?.[0];
      if (!targetTimeslotId) {
        const minSlot = side === "left" ? 1 : 5;
        const sideList = updated[dayIndex].tracks[trackIndex][side];
        let targetSlotIdx = 0;
        for (let i = 0; i < cellIndex; i++) {
          targetSlotIdx += sideList[i].colSpan;
        }
        const targetSlotNumber = minSlot + targetSlotIdx;
        targetTimeslotId = findTimeslotId(
          updated[dayIndex].day,
          targetSlotNumber,
        );
      }

      if (targetCell.subject) {
        // SWAP: two occupied class slots
        if (sourceScheduleId && targetScheduleId) {
          const toastId = toast.loading(
            "Swapping scheduling periods...",
          );
          swapScheduleMutation.mutate(
            { sourceScheduleId, targetScheduleId },
            {
              onSuccess: () => {
                toast.success("Swapped scheduling periods successfully!", {
                  id: toastId,
                });
                refetchRoutine();
              },
              onError: (err) => {
                console.error("Failed to swap scheduling periods:", err);
                toast.error(
                  "Failed to swap scheduling periods. Reverting swap.",
                  { id: toastId },
                );
                updateRoutine(previousState);
                refetchRoutine(); // Revert local state by reloading from backend
              },
            },
          );
        } else {
          toast.success("Swapped scheduling periods locally");
        }
      } else {
        // MOVE: one class moved to an empty slot
        if (sourceScheduleId && targetTimeslotId) {
          const toastId = toast.loading(
            "Moving scheduling period...",
          );
          moveScheduleMutation.mutate(
            { sourceScheduleId, targetTimeSlotId: targetTimeslotId },
            {
              onSuccess: () => {
                toast.success("Moved scheduling period successfully!", {
                  id: toastId,
                });
                refetchRoutine();
              },
              onError: (err) => {
                console.error("Failed to move scheduling period:", err);
                toast.error(
                  "Failed to move scheduling period. Reverting move.",
                  { id: toastId },
                );
                updateRoutine(previousState);
                refetchRoutine();
              },
            },
          );
        } else {
          toast.success("Moved scheduling period locally");
        }
      }
    }

    // Reset drags
    setDraggedCellInfo(null);
  };

  const handleDragEnd = () => {
    setDraggedCellInfo(null);
    setHoveredCell(null);
  };

  // Resize Handlers
  const handleResizeStart = (
    e: React.DragEvent,
    dayIndex: number,
    trackIndex: number,
    side: "left" | "right",
    cellIndex: number,
  ) => {
    e.stopPropagation();
    setResizeInfo({ dayIndex, trackIndex, side, cellIndex });
    e.dataTransfer.effectAllowed = "move";
  };

  const handleResizeEnd = () => {
    setResizeInfo(null);
    setHoveredCell(null);
  };

  const getTargetSlotIndexFromEvent = (
    e: React.DragEvent,
    sideList: RoutineItem[],
    cellIndex: number,
    side: "left" | "right",
  ) => {
    let startSlotIdx = 0;
    for (let i = 0; i < cellIndex; i++) {
      startSlotIdx += sideList[i].colSpan;
    }

    const rect = e.currentTarget.getBoundingClientRect();
    const offsetX = e.clientX - rect.left;
    const width = rect.width;

    const span = sideList[cellIndex].colSpan;
    const slotWidth = width / span;

    const hoveredSlotOffset = Math.floor(offsetX / slotWidth);
    const boundedOffset = Math.max(0, Math.min(span - 1, hoveredSlotOffset));

    return startSlotIdx + boundedOffset;
  };

  const handleResizeCell = (
    dayIndex: number,
    trackIndex: number,
    side: "left" | "right",
    srcCellIndex: number,
    targetSlotIdx: number,
  ) => {
    const previousState = JSON.parse(JSON.stringify(routineState));
    const updated = JSON.parse(JSON.stringify(routineState));
    const sideList = updated[dayIndex].tracks[trackIndex][side];

    // Rebuild flat array of 4 slots
    const flat: any[] = [];
    sideList.forEach((cell) => {
      for (let i = 0; i < cell.colSpan; i++) {
        flat.push({
          ...cell,
          timeslotIds: cell.timeslotIds ? [cell.timeslotIds[i]] : undefined,
          scheduleIds: cell.scheduleIds ? [cell.scheduleIds[i]] : undefined,
        });
      }
    });

    let srcStartSlotIdx = 0;
    for (let i = 0; i < srcCellIndex; i++) {
      srcStartSlotIdx += sideList[i].colSpan;
    }

    const srcCell = sideList[srcCellIndex];
    const newSpan = targetSlotIdx - srcStartSlotIdx + 1;

    if (newSpan < 1) {
      return;
    }

    const newFlat: any[] = [];
    for (let i = 0; i < 4; i++) {
      if (i >= srcStartSlotIdx && i <= targetSlotIdx) {
        if (i === srcStartSlotIdx) {
          newFlat.push({
            ...srcCell,
            colSpan: 1,
          });
        } else {
          newFlat.push({
            id: generateId(),
            subject: srcCell.subject,
            code: srcCell.code,
            teacher: srcCell.teacher,
            room: srcCell.room,
            teacherId: srcCell.teacherId,
            dbRecordId: srcCell.dbRecordId,
            noofgroups: srcCell.noofgroups,
            colSpan: 1,
          });
        }
      } else if (
        i > targetSlotIdx &&
        i < srcStartSlotIdx + sideList[srcCellIndex].colSpan
      ) {
        newFlat.push({
          id: generateId(),
          subject: "",
          code: "",
          teacher: "",
          room: "",
          colSpan: 1,
        });
      } else {
        newFlat.push(flat[i]);
      }
    }

    const newSideList: RoutineItem[] = [];
    let currentCell: RoutineItem | null = null;

    for (let i = 0; i < 4; i++) {
      const item = newFlat[i];
      const isSameAsCurrent =
        currentCell &&
        ((!currentCell.subject && !item.subject) ||
          (currentCell.subject &&
            currentCell.subject === item.subject &&
            currentCell.teacher === item.teacher &&
            currentCell.code === item.code));

      if (isSameAsCurrent && currentCell) {
        currentCell.colSpan += 1;
        if (item.timeslotIds && item.timeslotIds[0]) {
          currentCell.timeslotIds = [
            ...(currentCell.timeslotIds || []),
            item.timeslotIds[0],
          ];
        }
        if (item.scheduleIds && item.scheduleIds[0]) {
          currentCell.scheduleIds = [
            ...(currentCell.scheduleIds || []),
            item.scheduleIds[0],
          ];
        }
      } else {
        if (currentCell) {
          newSideList.push(currentCell);
        }
        currentCell = {
          id: item.id || generateId(),
          subject: item.subject,
          code: item.code,
          teacher: item.teacher,
          room: item.room,
          colSpan: 1,
          teacherId: item.teacherId,
          dbRecordId: item.dbRecordId,
          noofgroups: item.noofgroups,
          timeslotIds: item.timeslotIds ? [item.timeslotIds[0]] : undefined,
          scheduleIds: item.scheduleIds ? [item.scheduleIds[0]] : undefined,
        };
      }
    }
    if (currentCell) {
      newSideList.push(currentCell);
    }

    const sourceScheduleId = srcCell.scheduleIds?.[0];
    const minSlot = side === "left" ? 1 : 5;
    const targetSlotNumber = minSlot + targetSlotIdx;
    const targetTimeslotId = findTimeslotId(
      updated[dayIndex].day,
      targetSlotNumber,
    );

    updated[dayIndex].tracks[trackIndex][side] = newSideList;
    updateRoutine(updated);

    if (sourceScheduleId && targetTimeslotId) {
      const toastId = toast.loading("Extending scheduling period...");
      extendScheduleMutation.mutate(
        { sourceScheduleId, targetTimeSlotId: targetTimeslotId },
        {
          onSuccess: () => {
            toast.success("Extended scheduling period successfully!", {
              id: toastId,
            });
            refetchRoutine();
          },
          onError: (err) => {
            console.error("Failed to extend scheduling period:", err);
            toast.error(
              "Failed to extend scheduling period. Reverting extend.",
              { id: toastId },
            );
            updateRoutine(previousState);
            refetchRoutine();
          },
        },
      );
    } else {
      toast.success("Resized schedule period successfully!");
    }
  };

  // Print timetable
  const handleExportPDF = () => {
    window.print();
  };

  // Generate color tints for classes based on subject name
  const getSubjectColorClass = (subject: string) => {
    if (!subject)
      return "bg-background border-dashed border border-border/80 hover:bg-muted/30";

    // Hash function to pick color
    let hash = 0;
    for (let i = 0; i < subject.length; i++) {
      hash = subject.charCodeAt(i) + ((hash << 5) - hash);
    }
    const colors = [
      "bg-rose-50 dark:bg-rose-950/20 text-rose-700 dark:text-rose-300 border-l-4 border-l-rose-500",
      "bg-indigo-50 dark:bg-indigo-950/20 text-indigo-700 dark:text-indigo-300 border-l-4 border-l-indigo-500",
      "bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-300 border-l-4 border-l-amber-500",
      "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-300 border-l-4 border-l-emerald-500",
      "bg-cyan-50 dark:bg-cyan-950/20 text-cyan-700 dark:text-cyan-300 border-l-4 border-l-cyan-500",
      "bg-purple-50 dark:bg-purple-950/20 text-purple-700 dark:text-purple-300 border-l-4 border-l-purple-500",
      "bg-orange-50 dark:bg-orange-950/20 text-orange-700 dark:text-orange-300 border-l-4 border-l-orange-500",
    ];
    return colors[Math.abs(hash) % colors.length];
  };

  return (
    <AdminShell title="Routine Scheduling Console">
      <section className="container py-8 space-y-6 print:p-0 print:m-0">
        {/* Style block for printing */}
        <style
          dangerouslySetInnerHTML={{
            __html: `
          @page {
            size: landscape;
            margin: 5mm 10mm;
          }
          @media print {
            body {
              background: white !important;
              color: black !important;
            }
            body * {
              visibility: hidden;
            }
            .print-timetable-area, .print-timetable-area * {
              visibility: visible;
            }
            .print-timetable-area {
              position: absolute;
              left: 0;
              top: 0;
              width: 100% !important;
              max-width: 100% !important;
              padding: 0 !important;
              margin: 0 !important;
              box-shadow: none !important;
              border: none !important;
              background: white !important;
              transform: scale(0.92) !important;
              transform-origin: top center !important;
            }
            .print-timetable-area > div {
              box-shadow: none !important;
              border: none !important;
              background: transparent !important;
              padding: 0 !important;
              margin: 0 !important;
              width: 100% !important;
              max-width: 100% !important;
            }
            .print-timetable-area table {
              min-width: 100% !important;
              width: 100% !important;
              table-layout: fixed !important;
              border-collapse: collapse !important;
              page-break-inside: avoid !important;
            }
            .print-timetable-area tr {
              page-break-inside: avoid !important;
            }
            .print-timetable-area th, .print-timetable-area td {
              border: 1px solid #e2e8f0 !important;
              padding: 3px !important;
              color: #000000 !important;
              font-size: 8px !important;
            }
            .print-timetable-area th {
              background-color: transparent !important;
            }
            .print-timetable-area .print-subject-card {
              background: transparent !important;
              background-color: transparent !important;
              border: none !important;
              border-left: none !important;
              box-shadow: none !important;
              padding: 6px !important;
              min-height: unset !important;
            }
            .print-timetable-area .print-empty-slot {
              background: transparent !important;
              box-shadow: none !important;
              padding: 6px !important;
              min-height: unset !important;
            }
            .print-timetable-area p,
            .print-timetable-area span,
            .print-timetable-area div,
            .print-timetable-area td,
            .print-timetable-area th {
              color: #000000 !important;
            }
            .print-timetable-area th.sticky,
            .print-timetable-area td.sticky {
              position: static !important;
              background-color: transparent !important;
            }
            .print-hide {
              display: none !important;
            }
            .print-title {
              display: block !important;
              text-align: center;
              font-size: 20px;
              font-weight: bold;
              margin-bottom: 20px;
            }
          }
        `,
          }}
        />

        {/* ── Selection Filter Bar (Hidden on print) ── */}
        <Card className="p-6 bg-card border-border shadow-lg rounded-2xl print-hide">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 flex-1">
              {/* Department */}
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Department
                </Label>
                <Select
                  value={selectedDeptId}
                  onValueChange={(val) => {
                    setSelectedDeptId(val);
                    setSelectedYear("");
                    setSelectedSection("");
                    setSelectedSemester("");
                  }}
                  disabled={isEditMode}
                >
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder="Select Department" />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map((d: any) => {
                      const id = String(
                        d.id ?? d.departmentId ?? d.department_id ?? "",
                      );
                      const name =
                        d.name ??
                        d.departmentName ??
                        d.department_name ??
                        "Unknown Dept";
                      return (
                        <SelectItem key={id} value={id}>
                          {name}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              {/* Year */}
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Year
                </Label>
                <Select
                  value={selectedYear}
                  onValueChange={(val) => {
                    setSelectedYear(val);
                    setSelectedSection("");
                    setSelectedSemester("");
                  }}
                  disabled={isEditMode || !selectedDeptId}
                >
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder="Select Year" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableYears.map((y) => (
                      <SelectItem key={y} value={y}>
                        {y}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Section */}
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Section
                </Label>
                <Select
                  value={selectedSection}
                  onValueChange={(val) => {
                    setSelectedSection(val);
                    setSelectedSemester("");
                  }}
                  disabled={isEditMode || !selectedYear}
                >
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder="Select Section" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableSections.map((sec) => (
                      <SelectItem key={sec} value={sec}>
                        {sec}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Semester */}
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Semester
                </Label>
                <Select
                  value={selectedSemester}
                  onValueChange={setSelectedSemester}
                  disabled={isEditMode || !selectedSection}
                >
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder="Select Semester" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableSemesters.map((sem) => (
                      <SelectItem key={sem} value={sem}>
                        Semester {sem}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex gap-2 md:w-64 md:justify-end flex-shrink-0">
              {!isEditMode ? (
                <>
                  {hasRoutineData ? (
                    <Button
                      onClick={() => setIsEditMode(true)}
                      disabled={!selectedClassId}
                      className="h-10 px-4 bg-primary text-primary-foreground hover:bg-primary/95 flex items-center gap-2 font-medium shadow-sm disabled:opacity-50"
                    >
                      <Edit2 className="w-4 h-4" />
                      Edit
                    </Button>
                  ) : null}
                  {hasRoutineData && (
                    <Button
                      variant="outline"
                      onClick={handleExportPDF}
                      disabled={!selectedClassId}
                      className="h-10 px-4 flex items-center gap-2 font-medium disabled:opacity-50"
                    >
                      <FileDown className="w-4 h-4 text-muted-foreground" />
                      Print
                    </Button>
                  )}
                </>
              ) : (
                <>
                  <Button
                    variant="outline"
                    onClick={() => setIsEditMode(false)}
                    className="h-10 px-4 bg-primary text-primary-foreground hover:bg-primary/95 hover:text-primary-foreground flex items-center gap-2 font-medium"
                  >
                    Save
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleCancelEdit}
                    className="h-10 px-4 flex items-center gap-2 font-medium border-destructive hover:bg-destructive/15 text-destructive"
                  >
                    Cancel
                  </Button>
                </>
              )}
            </div>
          </div>
        </Card>

        {/* ── Main Scheduler Work Area ── */}
        <div className="w-full print-timetable-area relative">
          {!selectedClassId ? (
            <Card className="p-12 bg-card border-border shadow-lg rounded-2xl flex flex-col items-center justify-center min-h-[350px] text-center border-dashed">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4 text-primary">
                <Move className="w-8 h-8 animate-pulse text-primary/80" />
              </div>
              <h3 className="text-lg font-black text-foreground mb-1">
                Select Target Class
              </h3>
              <p className="text-xs font-bold text-muted-foreground max-w-sm">
                Please select a Department, Year, Section, and Semester in the
                controls above to load and edit the class routine.
              </p>
            </Card>
          ) : routineLoading ? (
            <Card className="p-12 bg-card border-border shadow-lg rounded-2xl flex flex-col items-center justify-center min-h-[350px]">
              <RefreshCw className="h-8 w-8 text-primary animate-spin mb-3" />
              <p className="text-sm font-semibold text-muted-foreground">
                Fetching routine...
              </p>
            </Card>
          ) : !hasRoutineData && !isEditMode ? (
            <Card className="p-12 bg-card border-border shadow-lg rounded-2xl flex flex-col items-center justify-center min-h-[350px] text-center border-dashed">
              <div className="w-16 h-16 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center mb-4">
                <Layers className="w-8 h-8 text-amber-600 dark:text-amber-400" />
              </div>
              <h3 className="text-lg font-black text-foreground mb-1">
                No Routine Available
              </h3>
              <p className="text-xs font-bold text-muted-foreground max-w-sm mb-4">
                This class does not have a routine scheduled yet. Click the
                "Create" button above to start building a new timetable.
              </p>
              <Button
                onClick={handleCreateRoutine}
                disabled={generating}
                className="h-10 px-6 flex items-center gap-2 font-medium shadow-sm disabled:opacity-50"
              >
                {generating ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Plus className="w-4 h-4" />
                )}
                {generating ? "Creating..." : "Create Routine"}
              </Button>
            </Card>
          ) : (
            <Card className="p-6 bg-card border-border shadow-lg rounded-2xl overflow-hidden overflow-x-auto scrollbar-beautiful">
              {/* Timetable Header */}
              <div className="mb-6 border-b pb-4 text-center">
                <h2 className="text-2xl font-black text-foreground">
                  {departments.find(
                    (d: any) =>
                      String(
                        d.id ?? d.departmentId ?? d.department_id ?? "",
                      ) === selectedDeptId,
                  )?.name || "Class Timetable"}
                </h2>
                <p className="text-sm font-semibold text-muted-foreground mt-1 uppercase tracking-widest">
                  {selectedYear || "N/A"} · Section {selectedSection || "N/A"} ·{" "}
                  {selectedSemester ? `Semester ${selectedSemester}` : "N/A"}
                </p>
              </div>

              {/* Responsive Grid Table */}
              <table className="w-full min-w-[1000px] border-collapse table-fixed select-none">
                <colgroup>
                  {/* Day (MON, TUE) */}
                  <col className="w-24" />

                  {/* Slots I to IV */}
                  <col className="w-[11.25%]" />
                  <col className="w-[11.25%]" />
                  <col className="w-[11.25%]" />
                  <col className="w-[11.25%]" />

                  {/* Lunch Break divider */}
                  <col className="w-16" />

                  {/* Slots V to VIII */}
                  <col className="w-[11.25%]" />
                  <col className="w-[11.25%]" />
                  <col className="w-[11.25%]" />
                  <col className="w-[11.25%]" />
                </colgroup>

                {/* Table Header: time slots */}
                <thead>
                  <tr className="border-b border-border bg-muted/40">
                    <th className="bg-muted p-3 text-center text-xs font-bold text-muted-foreground uppercase border border-border">
                      DAY
                    </th>

                    {dynamicTimeSlotsLeft.map((slot, idx) => (
                      <th
                        key={slot.name}
                        className="p-3 text-center border border-border"
                      >
                        <div className="text-xs font-black text-foreground">
                          {slot.time}
                        </div>
                        <div className="text-[10px] text-muted-foreground font-semibold mt-0.5">
                          ({slot.name})
                        </div>
                      </th>
                    ))}

                    {/* Break header */}
                    <th className="p-3 text-center border border-border bg-orange-50/20 dark:bg-orange-950/10">
                      <div className="text-xs font-black text-orange-600 dark:text-orange-400">
                        {breakIntervalText}
                      </div>
                      <div className="text-[10px] text-orange-500/80 font-bold mt-0.5">
                        BREAK
                      </div>
                    </th>

                    {dynamicTimeSlotsRight.map((slot, idx) => (
                      <th
                        key={slot.name}
                        className="p-3 text-center border border-border"
                      >
                        <div className="text-xs font-black text-foreground">
                          {slot.time}
                        </div>
                        <div className="text-[10px] text-muted-foreground font-semibold mt-0.5">
                          ({slot.name})
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>

                {/* Table Body: Timetable Slots */}
                <tbody>
                  {routineState.map((dayItem, dayIndex) => {
                    const totalTracks = dayItem.tracks.length;

                    return dayItem.tracks.map((track, trackIndex) => {
                      const isFirstTrack = trackIndex === 0;

                      return (
                        <tr
                          key={track.id}
                          className="hover:bg-muted/5 group/row border-b border-border"
                        >
                          {/* DAY Cell: spans all tracks of the day */}
                          {isFirstTrack && (
                            <td
                              rowSpan={totalTracks}
                              className="p-3 font-extrabold text-sm border border-border text-center align-middle bg-card text-foreground"
                            >
                              <div className="w-full text-center flex flex-col items-center justify-center">
                                <span>{dayItem.day}</span>
                                {isEditMode && (
                                  <div className="mt-3 flex flex-col items-center gap-1 print-hide">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-6 w-16 text-[9px] font-bold rounded bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20"
                                      onClick={() => handleAddTrack(dayIndex)}
                                    >
                                      + Split
                                    </Button>
                                  </div>
                                )}
                              </div>
                            </td>
                          )}

                          {/* LEFT SIDE TIME SLOTS (Slot I-IV) */}
                          {track.left.map((cell, cellIndex) => {
                            const cellKey = `${dayIndex}-${trackIndex}-left-${cellIndex}`;
                            const isHovered = hoveredCell === cellKey;

                            return (
                              <td
                                key={cell.id}
                                colSpan={cell.colSpan}
                                className={`p-1 border border-border align-top relative transition-all min-h-[90px] duration-150 ${isHovered
                                  ? "bg-primary/10 ring-2 ring-primary ring-inset"
                                  : ""
                                  }`}
                                onDragOver={(e) =>
                                  handleDragOverCell(
                                    e,
                                    dayIndex,
                                    trackIndex,
                                    "left",
                                    cellIndex,
                                  )
                                }
                                onDragLeave={handleDragLeaveCell}
                                onDrop={(e) =>
                                  handleDropOnCell(
                                    e,
                                    dayIndex,
                                    trackIndex,
                                    "left",
                                    cellIndex,
                                  )
                                }
                              >
                                <div
                                  draggable={isEditMode && !!cell.subject}
                                  onDragStart={(e) =>
                                    handleDragStartFromCell(
                                      e,
                                      dayIndex,
                                      trackIndex,
                                      "left",
                                      cellIndex,
                                    )
                                  }
                                  onDragEnd={handleDragEnd}
                                  className={`group relative rounded-xl p-2 h-full flex flex-col justify-between text-xs font-semibold ${isEditMode
                                    ? "cursor-grab active:cursor-grabbing"
                                    : "cursor-default"
                                    } ${cell.subject || isEditMode
                                      ? "shadow-sm"
                                      : "shadow-none"
                                    } transition-all duration-200 ${cell.subject
                                      ? getSubjectColorClass(cell.subject)
                                      : isEditMode
                                        ? getSubjectColorClass("")
                                        : "bg-white dark:bg-zinc-900"
                                    } ${!cell.subject && !isEditMode ? "print-empty-slot" : "print-subject-card"}`}
                                >
                                  {cell.subject ? (
                                    <>
                                      {/* Subject text content */}
                                      <div className="space-y-1">
                                        <p className="font-black text-sm tracking-tight leading-tight line-clamp-2">
                                          {cell.subject}
                                        </p>
                                        {(cell.code || cell.teacher) && (
                                          <p className="text-[10px] opacity-80 flex flex-wrap gap-1 leading-none font-bold">
                                            <span>{cell.code}</span>
                                            {cell.code && cell.teacher && (
                                              <span>·</span>
                                            )}
                                            <span className="text-black dark:text-white font-black">
                                              {cell.teacher}
                                            </span>
                                          </p>
                                        )}
                                        {cell.room && (
                                          <p className="text-[9px] opacity-75 font-medium leading-none">
                                            🏢 {cell.room}
                                          </p>
                                        )}
                                      </div>

                                      {/* Action Menu (Visible on hover, hidden on print) */}
                                      {isEditMode && (
                                        <div className="flex justify-end gap-1 mt-2 border-t border-border/10 pt-1.5 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity print-hide">
                                          <CustomTooltip content="Clear Slot">
                                            <button
                                              onClick={() =>
                                                handleClearCell(
                                                  dayIndex,
                                                  trackIndex,
                                                  "left",
                                                  cellIndex,
                                                )
                                              }
                                              className="p-1 rounded hover:bg-muted/40 hover:text-destructive text-muted-foreground"
                                            >
                                              <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                          </CustomTooltip>
                                        </div>
                                      )}

                                      {/* Resize Handle */}
                                      {isEditMode && (
                                        <CustomTooltip content="Drag edge to resize">
                                          <div
                                            draggable
                                            onDragStart={(e) =>
                                              handleResizeStart(
                                                e,
                                                dayIndex,
                                                trackIndex,
                                                "left",
                                                cellIndex,
                                              )
                                            }
                                            onDragEnd={handleResizeEnd}
                                            className="absolute right-0 top-0 bottom-0 w-2 hover:w-3 bg-primary/15 hover:bg-primary/35 cursor-ew-resize rounded-r-xl transition-all duration-150 flex items-center justify-center group/resize print-hide"
                                          >
                                            <div className="w-[1.5px] h-4 bg-primary/45 group-hover/resize:h-6 transition-all duration-150 rounded" />
                                          </div>
                                        </CustomTooltip>
                                      )}
                                    </>
                                  ) : (
                                    // Empty state cell
                                    <div className="flex flex-col items-center justify-center py-6 h-full w-full">
                                      {isEditMode ? (
                                        <div className="flex flex-col items-center justify-center text-muted-foreground/35 hover:text-muted-foreground/80 transition-colors">
                                          <Move className="w-4 h-4 stroke-[1.5]" />
                                          <span className="text-[9px] mt-1 uppercase font-bold tracking-wider">
                                            Empty
                                          </span>
                                          {/* <div className="flex justify-center gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity print-hide">
                                            <button
                                              onClick={() =>
                                                handleOpenEditCell(
                                                  dayIndex,
                                                  trackIndex,
                                                  "left",
                                                  cellIndex,
                                                )
                                              }
                                              className="text-[9px] font-bold text-primary hover:underline"
                                            >
                                              + Add Subject
                                            </button>
                                          </div> */}
                                        </div>
                                      ) : (
                                        <span className="text-xs font-semibold text-muted-foreground/45">
                                          No Class
                                        </span>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </td>
                            );
                          })}

                          {/* LUNCH BREAK Cell: Spans all tracks of the day */}
                          {isFirstTrack && (
                            <td
                              rowSpan={totalTracks}
                              className="p-2 border border-border text-center align-middle font-black text-orange-600 dark:text-orange-400 bg-orange-50/10 dark:bg-orange-950/10 tracking-widest text-xs uppercase"
                              style={{
                                writingMode: "vertical-rl",
                                textOrientation: "mixed",
                              }}
                            >
                              BREAK
                            </td>
                          )}

                          {/* RIGHT SIDE TIME SLOTS (Slot V-VIII) */}
                          {track.right.map((cell, cellIndex) => {
                            const cellKey = `${dayIndex}-${trackIndex}-right-${cellIndex}`;
                            const isHovered = hoveredCell === cellKey;

                            return (
                              <td
                                key={cell.id}
                                colSpan={cell.colSpan}
                                className={`p-1 border border-border align-top relative transition-all min-h-[90px] duration-150 ${isHovered
                                  ? "bg-primary/10 ring-2 ring-primary ring-inset"
                                  : ""
                                  }`}
                                onDragOver={(e) =>
                                  handleDragOverCell(
                                    e,
                                    dayIndex,
                                    trackIndex,
                                    "right",
                                    cellIndex,
                                  )
                                }
                                onDragLeave={handleDragLeaveCell}
                                onDrop={(e) =>
                                  handleDropOnCell(
                                    e,
                                    dayIndex,
                                    trackIndex,
                                    "right",
                                    cellIndex,
                                  )
                                }
                              >
                                <div
                                  draggable={isEditMode && !!cell.subject}
                                  onDragStart={(e) =>
                                    handleDragStartFromCell(
                                      e,
                                      dayIndex,
                                      trackIndex,
                                      "right",
                                      cellIndex,
                                    )
                                  }
                                  onDragEnd={handleDragEnd}
                                  className={`group relative rounded-xl p-2 h-full flex flex-col justify-between text-xs font-semibold ${isEditMode
                                    ? "cursor-grab active:cursor-grabbing"
                                    : "cursor-default"
                                    } ${cell.subject || isEditMode
                                      ? "shadow-sm"
                                      : "shadow-none"
                                    } transition-all duration-200 ${cell.subject
                                      ? getSubjectColorClass(cell.subject)
                                      : isEditMode
                                        ? getSubjectColorClass("")
                                        : "bg-white dark:bg-zinc-900"
                                    } ${!cell.subject && !isEditMode ? "print-empty-slot" : "print-subject-card"}`}
                                >
                                  {cell.subject ? (
                                    <>
                                      {/* Subject text content */}
                                      <div className="space-y-1">
                                        <p className="font-black text-sm tracking-tight leading-tight line-clamp-2">
                                          {cell.subject}
                                        </p>
                                        {(cell.code || cell.teacher) && (
                                          <p className="text-[10px] opacity-80 flex flex-wrap gap-1 leading-none font-bold">
                                            <span>{cell.code}</span>
                                            {cell.code && cell.teacher && (
                                              <span>·</span>
                                            )}
                                            <span className="text-black dark:text-white font-black">
                                              {cell.teacher}
                                            </span>
                                          </p>
                                        )}
                                        {cell.room && (
                                          <p className="text-[9px] opacity-75 font-medium leading-none">
                                            🏢 {cell.room}
                                          </p>
                                        )}
                                      </div>

                                      {/* Action Menu (Visible on hover, hidden on print) */}
                                      {isEditMode && (
                                        <div className="flex justify-end gap-1 mt-2 border-t border-border/10 pt-1.5 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity print-hide">
                                          <CustomTooltip content="Clear Slot">
                                            <button
                                              onClick={() =>
                                                handleClearCell(
                                                  dayIndex,
                                                  trackIndex,
                                                  "right",
                                                  cellIndex,
                                                )
                                              }
                                              className="p-1 rounded hover:bg-muted/40 hover:text-destructive text-muted-foreground"
                                            >
                                              <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                          </CustomTooltip>
                                        </div>
                                      )}

                                      {/* Resize Handle */}
                                      {isEditMode && (
                                        <CustomTooltip content="Drag edge to resize">
                                          <div
                                            draggable
                                            onDragStart={(e) =>
                                              handleResizeStart(
                                                e,
                                                dayIndex,
                                                trackIndex,
                                                "right",
                                                cellIndex,
                                              )
                                            }
                                            onDragEnd={handleResizeEnd}
                                            className="absolute right-0 top-0 bottom-0 w-2 hover:w-3 bg-primary/15 hover:bg-primary/35 cursor-ew-resize rounded-r-xl transition-all duration-150 flex items-center justify-center group/resize print-hide"
                                          >
                                            <div className="w-[1.5px] h-4 bg-primary/45 group-hover/resize:h-6 transition-all duration-150 rounded" />
                                          </div>
                                        </CustomTooltip>
                                      )}
                                    </>
                                  ) : (
                                    // Empty state cell
                                    <div className="flex flex-col items-center justify-center py-6 h-full w-full">
                                      {isEditMode ? (
                                        <div className="flex flex-col items-center justify-center text-muted-foreground/35 hover:text-muted-foreground/80 transition-colors">
                                          <Move className="w-4 h-4 stroke-[1.5]" />
                                          <span className="text-[9px] mt-1 uppercase font-bold tracking-wider">
                                            Empty
                                          </span>
                                          <div className="flex justify-center gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity print-hide">
                                            <button
                                              onClick={() =>
                                                handleOpenEditCell(
                                                  dayIndex,
                                                  trackIndex,
                                                  "right",
                                                  cellIndex,
                                                )
                                              }
                                              className="text-[9px] font-bold text-primary hover:underline"
                                            >
                                              + Add Subject
                                            </button>
                                          </div>
                                        </div>
                                      ) : (
                                        <span className="text-xs font-semibold text-muted-foreground/45">
                                          No Class
                                        </span>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </td>
                            );
                          })}

                          {/* Track Management Delete Button (Right sidebar helper) */}
                          <td className="w-8 border border-transparent align-middle text-center print-hide">
                            {isEditMode && totalTracks > 1 && (
                              <CustomTooltip content="Remove parallel row">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 w-7 p-0 rounded-full text-destructive hover:bg-destructive/10 hover:text-destructive"
                                  onClick={() =>
                                    handleRemoveTrack(dayIndex, trackIndex)
                                  }
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </Button>
                              </CustomTooltip>
                            )}
                          </td>
                        </tr>
                      );
                    });
                  })}
                </tbody>
              </table>
            </Card>
          )}

          {/* Routine Saving Overlay */}
          {/* {routineLoading && (
              <div className="absolute inset-0 z-50 flex items-center justify-center bg-background/50 backdrop-blur-sm rounded-2xl">
                <div className="flex flex-col items-center gap-2">
                  <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                  <p className="text-xs font-bold text-primary">Saving Routine...</p>
                </div>
              </div>
            )} */}
        </div>
      </section>

      {/* ── CELL DETAIL EDIT DIALOG (Hidden on print) ── */}
      <Dialog
        open={editingCell !== null}
        onOpenChange={(open) => !open && setEditingCell(null)}
      >
        <DialogContent
          className="sm:max-w-[425px] admin-white-modal print-hide"
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle className="text-lg font-black text-foreground flex items-center gap-2">
              <Edit2 className="w-5 h-5 text-primary" />
              Configure Timetable Slot
            </DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label
                htmlFor="edit-subject"
                className="text-right text-xs font-black"
              >
                Subject
              </Label>
              <Input
                id="edit-subject"
                value={editForm.subject}
                onChange={(e) =>
                  setEditForm({ ...editForm, subject: e.target.value })
                }
                className="col-span-3 h-10 text-xs rounded-lg"
                placeholder="Subject name"
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label
                htmlFor="edit-code"
                className="text-right text-xs font-black"
              >
                Code
              </Label>
              <Input
                id="edit-code"
                value={editForm.code}
                onChange={(e) =>
                  setEditForm({ ...editForm, code: e.target.value })
                }
                className="col-span-3 h-10 text-xs rounded-lg"
                placeholder="e.g. PE-CS602B"
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label
                htmlFor="edit-teacher"
                className="text-right text-xs font-black"
              >
                Teacher
              </Label>
              <Input
                id="edit-teacher"
                value={editForm.teacher}
                onChange={(e) =>
                  setEditForm({ ...editForm, teacher: e.target.value })
                }
                className="col-span-3 h-10 text-xs rounded-lg"
                placeholder="e.g. MaS"
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label
                htmlFor="edit-room"
                className="text-right text-xs font-black"
              >
                Room
              </Label>
              <Input
                id="edit-room"
                value={editForm.room}
                onChange={(e) =>
                  setEditForm({ ...editForm, room: e.target.value })
                }
                className="col-span-3 h-10 text-xs rounded-lg"
                placeholder="e.g. Room A317"
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setEditingCell(null)}
              className="h-10 text-xs font-bold cancel-gray-btn"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveEditCell}
              className="h-10 bg-primary text-primary-foreground text-xs font-bold"
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Create Routine Dialog — input number of groups */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="sm:max-w-[420px] rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-black">
              Create Schedule Routine
            </DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <p className="text-sm text-muted-foreground">
              Enter the number of groups for this class. This will be used to
              generate the schedule routine.
            </p>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label
                htmlFor="create-groups"
                className="text-right text-xs font-black"
              >
                No. of Groups
              </Label>
              <Input
                id="create-groups"
                type="number"
                min={1}
                max={20}
                value={createGroupCount}
                onChange={(e) =>
                  setCreateGroupCount(
                    Math.max(1, parseInt(e.target.value) || 1),
                  )
                }
                className="col-span-3 h-10 text-xs rounded-lg"
                placeholder="e.g. 2"
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setShowCreateDialog(false)}
              className="h-10 text-xs font-bold"
            >
              Cancel
            </Button>
            <Button
              onClick={confirmCreateRoutine}
              disabled={generating}
              className="h-10 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold"
            >
              {generating ? "Generating..." : "Generate Routine"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <ConfirmModal
        isOpen={clearCellTarget !== null}
        onClose={() => setClearCellTarget(null)}
        onConfirm={confirmClearCell}
        title="Delete Schedule Slot"
        description="Are you sure you want to delete this schedule slot? This will remove it from the routine."
        isLoading={deleteScheduleMutation.isPending}
      />
      <ConfirmModal
        isOpen={removeTrackTarget !== null}
        onClose={() => setRemoveTrackTarget(null)}
        onConfirm={confirmRemoveTrack}
        title="Remove Parallel Row"
        description="Are you sure you want to remove this parallel scheduling row? All slot data in this row will be deleted."
      />
    </AdminShell>
  );
}
