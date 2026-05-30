import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { AdminShell } from "./AdminShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getStudents } from "@/services/studentCrudAPI";
import { getTeachers } from "@/services/teacherCrudAPI";
import { createAssignment } from "@/services/assignmentAPI";
import { ChevronRight } from "lucide-react";
import { initialData as deptData, type Department } from "./departmentsData";

interface StudentOption {
  id: string;
  name: string;
}

interface TeacherOption {
  id: string;
  name: string;
}

const emptyForm = {
  department: "",
  year: "",
  className: "",
  subject: "",
  teacherId: "",
  studentIds: [] as string[],
  title: "",
  notes: "",
};

const AssignWork = () => {
  const [teachers, setTeachers] = useState<TeacherOption[]>([]);
  const [students, setStudents] = useState<StudentOption[]>([]);
  const [form, setForm] = useState(() => ({ ...emptyForm }));
  const [loading, setLoading] = useState(false);
  const [departments, setDepartments] = useState<Department[]>(deptData);

  useEffect(() => {
    getTeachers()
      .then((list) => {
        const options = Array.isArray(list)
          ? list.map((t) => ({ id: String(t.id), name: t.full_name || t.employee_code || `Teacher ${t.id}` }))
          : [];
        setTeachers(options);
      })
      .catch(() => toast.error("Unable to load teachers."));

    getStudents()
      .then((list) => {
        const options = Array.isArray(list)
          ? list.map((s) => ({ id: String(s.id), name: s.full_name || s.admission_no || `Student ${s.id}` }))
          : [];
        setStudents(options);
      })
      .catch(() => toast.error("Unable to load students."));
  }, []);

  const availableYears = useMemo(() => {
    const department = departments.find((d) => d.name === form.department);
    return department?.years ?? [];
  }, [departments, form.department]);

  const availableClasses = useMemo(() => {
    const year = availableYears.find((y) => y.year === form.year);
    return year?.sections ?? [];
  }, [availableYears, form.year]);

  const availableSubjects = useMemo(() => {
    const section = availableClasses.find((c) => c.name === form.className);
    return section?.subjects ?? [];
  }, [availableClasses, form.className]);

  const handleField = (key: keyof typeof emptyForm, value: string | string[]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleStudentSelect = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const selected = Array.from(event.target.selectedOptions).map((option) => option.value);
    setForm((prev) => ({ ...prev, studentIds: selected }));
  };

  const handleSubmit = async () => {
    if (!form.department || !form.year || !form.className || !form.subject || !form.teacherId || form.studentIds.length === 0 || !form.title) {
      toast.error("Please complete all fields and select at least one student.");
      return;
    }

    setLoading(true);
    try {
      await createAssignment({
        title: form.title,
        description: form.notes,
        department: form.department,
        year: form.year,
        className: form.className,
        subject: form.subject,
        teacherId: form.teacherId,
        studentIds: form.studentIds,
        createdAt: new Date().toISOString(),
      });
      toast.success("Work assigned successfully.");
      setForm({ ...emptyForm });
    } catch (error) {
      console.error(error);
      toast.error("Failed to assign work. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminShell title="Assign Work">
      <section className="container py-10 space-y-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Work Assignment</p>
            <h1 className="text-3xl font-semibold">Assign Work to Teachers and Students</h1>
            <p className="max-w-2xl text-sm text-muted-foreground mt-2">
              Choose subject, class, year and department, then connect a teacher and the target
              students for the assignment.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full sm:w-auto">
            <Card className="p-4 bg-white/70 dark:bg-white/10 border border-border">
              <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Teachers</div>
              <div className="text-2xl font-semibold mt-2">{teachers.length}</div>
            </Card>
            <Card className="p-4 bg-white/70 dark:bg-white/10 border border-border">
              <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Students</div>
              <div className="text-2xl font-semibold mt-2">{students.length}</div>
            </Card>
          </div>
        </div>

        <Card className="p-6 space-y-6 bg-white/80 border border-border">
          <div className="grid gap-5 md:grid-cols-2">
            <div className="space-y-4">
              <Field label="Department">
                <Select value={form.department} onValueChange={(value) => handleField("department", value)}>
                  <SelectTrigger className="h-12 rounded-xl">
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map((dept) => (
                      <SelectItem key={dept.id} value={dept.name}>
                        {dept.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>

              <Field label="Year">
                <Select value={form.year} onValueChange={(value) => handleField("year", value)}>
                  <SelectTrigger className="h-12 rounded-xl">
                    <SelectValue placeholder="Select year" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableYears.map((year) => (
                      <SelectItem key={year.year} value={year.year}>
                        {year.year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>

              <Field label="Class">
                <Select value={form.className} onValueChange={(value) => handleField("className", value)}>
                  <SelectTrigger className="h-12 rounded-xl">
                    <SelectValue placeholder="Select class" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableClasses.map((section) => (
                      <SelectItem key={section.name} value={section.name}>
                        {section.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>

              <Field label="Subject">
                <Select value={form.subject} onValueChange={(value) => handleField("subject", value)}>
                  <SelectTrigger className="h-12 rounded-xl">
                    <SelectValue placeholder="Select subject" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableSubjects.map((subject) => (
                      <SelectItem key={subject.code} value={`${subject.name} (${subject.code})`}>
                        {subject.name} ({subject.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            </div>

            <div className="space-y-4">
              <Field label="Teacher">
                <Select value={form.teacherId} onValueChange={(value) => handleField("teacherId", value)}>
                  <SelectTrigger className="h-12 rounded-xl">
                    <SelectValue placeholder="Select teacher" />
                  </SelectTrigger>
                  <SelectContent>
                    {teachers.map((teacher) => (
                      <SelectItem key={teacher.id} value={teacher.id}>
                        {teacher.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>

              <Field label="Students">
                <select
                  multiple
                  value={form.studentIds}
                  onChange={handleStudentSelect}
                  className="min-h-[160px] w-full rounded-xl border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                >
                  {students.map((student) => (
                    <option key={student.id} value={student.id}>
                      {student.name}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-muted-foreground mt-2">
                  Hold Ctrl / Cmd to select multiple students.
                </p>
              </Field>

              <Field label="Assignment Title">
                <Input
                  value={form.title}
                  onChange={(event) => handleField("title", event.target.value)}
                  placeholder="Enter assignment title"
                />
              </Field>

              <Field label="Notes">
                <Textarea
                  value={form.notes}
                  onChange={(event) => handleField("notes", event.target.value)}
                  placeholder="Add assignment instructions or details"
                />
              </Field>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
            <div className="text-sm text-muted-foreground">
              Selected students: {form.studentIds.length}
            </div>
            <Button onClick={handleSubmit} disabled={loading} className="inline-flex items-center gap-2">
              {loading ? "Assigning..." : "Assign Work"}
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </Card>
      </section>
    </AdminShell>
  );
};

const Field = ({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) => (
  <div className="flex flex-col gap-1.5">
    <Label>{label}</Label>
    {children}
  </div>
);

export default AssignWork;
