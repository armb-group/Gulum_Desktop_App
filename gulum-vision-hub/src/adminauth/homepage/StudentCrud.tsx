import { useMemo, useState } from "react";
import { AdminShell } from "./AdminShell";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import {
  Search,
  Copy,
  Pencil,
  Save,
  Trash2,
  Plus,
} from "lucide-react";

interface Student {
  id: number;
  institution_id: number;
  admission_no: string;
  roll_no: string;
  full_name: string;
  dob: string;
  gender: string;
  metadata: string;
  created_at: string;
  created_by: string;
  email_id: string;
  phone_number: string;
  batch_id: number;
  user_id: number;
  classess_id: number;
  department_id: number;
}

const initialStudents: Student[] = [
  {
    id: 1,
    institution_id: 1,
    admission_no: "ADM-1001",
    roll_no: "ROLL-01",
    full_name: "Amit Kumar",
    dob: "2003-04-12",
    gender: "Male",
    metadata: "Topper",
    created_at: "2026-05-18",
    created_by: "Admin",
    email_id: "amit@example.com",
    phone_number: "9876543210",
    batch_id: 101,
    user_id: 201,
    classess_id: 1,
    department_id: 10,
  },
  {
    id: 2,
    institution_id: 1,
    admission_no: "ADM-1002",
    roll_no: "ROLL-02",
    full_name: "Priya Sharma",
    dob: "2004-08-20",
    gender: "Female",
    metadata: "Class Representative",
    created_at: "2026-05-18",
    created_by: "Admin",
    email_id: "priya@example.com",
    phone_number: "9123456780",
    batch_id: 102,
    user_id: 202,
    classess_id: 2,
    department_id: 11,
  },
];

const emptyStudent: Student = {
  id: 0,
  institution_id: 0,
  admission_no: "",
  roll_no: "",
  full_name: "",
  dob: "",
  gender: "",
  metadata: "",
  created_at: "",
  created_by: "",
  email_id: "",
  phone_number: "",
  batch_id: 0,
  user_id: 0,
  classess_id: 0,
  department_id: 0,
};

const StudentCrud = () => {
  const [students, setStudents] =
    useState<Student[]>(initialStudents);

  const [search, setSearch] =
    useState<string>("");

  const [editingId, setEditingId] =
    useState<number | null>(null);

  const [editedStudent, setEditedStudent] =
    useState<Student | null>(null);

  const [showAddForm, setShowAddForm] =
    useState<boolean>(false);

  const [newStudent, setNewStudent] =
    useState<Student>(emptyStudent);

  const filteredStudents = useMemo(() => {
    return students.filter((student) =>
      Object.values(student)
        .join(" ")
        .toLowerCase()
        .includes(search.toLowerCase())
    );
  }, [students, search]);

  const handleEdit = (student: Student) => {
    setEditingId(student.id);
    setEditedStudent({ ...student });
  };

  const handleSave = () => {
    if (!editedStudent) return;

    setStudents((prev) =>
      prev.map((student) =>
        student.id === editingId
          ? editedStudent
          : student
      )
    );

    setEditingId(null);
    setEditedStudent(null);
  };

  const handleDelete = (id: number) => {
    setStudents((prev) =>
      prev.filter((student) => student.id !== id)
    );
  };

  const handleCopy = (value: string) => {
    navigator.clipboard.writeText(value);
  };

  const handleChange = (
    field: keyof Student,
    value: string
  ) => {
    if (!editedStudent) return;

    setEditedStudent({
      ...editedStudent,
      [field]: value,
    });
  };

  const handleAddStudent = () => {
    const studentToAdd: Student = {
      ...newStudent,
      id: students.length + 1,
      created_at: new Date()
        .toISOString()
        .split("T")[0],
    };

    setStudents((prev) => [
      ...prev,
      studentToAdd,
    ]);

    setNewStudent(emptyStudent);

    setShowAddForm(false);
  };

  return (
    <AdminShell title="Student Management">
      <section className="container py-8 space-y-6">

        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4">

          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-blue-500 bg-clip-text text-transparent">
              Student Management
            </h1>

            <p className="text-muted-foreground mt-2">
              Manage all students with advanced CRUD operations.
            </p>
          </div>

          <Button
            onClick={() =>
              setShowAddForm(!showAddForm)
            }
            className="shadow-md hover:scale-105 transition-transform"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Student
          </Button>

        </div>

        {/* Add Student Form */}
        {showAddForm && (
          <Card className="p-6 rounded-2xl border-0 shadow-xl bg-gradient-to-br from-background to-muted/30">

            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">
                Add New Student
              </h2>

              <Button
                variant="outline"
                onClick={() =>
                  setShowAddForm(false)
                }
              >
                Cancel
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

              <Input
                placeholder="Institution ID"
                value={newStudent.institution_id}
                onChange={(e) =>
                  setNewStudent({
                    ...newStudent,
                    institution_id: Number(
                      e.target.value
                    ),
                  })
                }
              />

              <Input
                placeholder="Admission No"
                value={newStudent.admission_no}
                onChange={(e) =>
                  setNewStudent({
                    ...newStudent,
                    admission_no:
                      e.target.value,
                  })
                }
              />

              <Input
                placeholder="Roll No"
                value={newStudent.roll_no}
                onChange={(e) =>
                  setNewStudent({
                    ...newStudent,
                    roll_no:
                      e.target.value,
                  })
                }
              />

              <Input
                placeholder="Full Name"
                value={newStudent.full_name}
                onChange={(e) =>
                  setNewStudent({
                    ...newStudent,
                    full_name:
                      e.target.value,
                  })
                }
              />

              <Input
                type="date"
                value={newStudent.dob}
                onChange={(e) =>
                  setNewStudent({
                    ...newStudent,
                    dob: e.target.value,
                  })
                }
              />

              <Input
                placeholder="Gender"
                value={newStudent.gender}
                onChange={(e) =>
                  setNewStudent({
                    ...newStudent,
                    gender:
                      e.target.value,
                  })
                }
              />

              <Input
                placeholder="Metadata"
                value={newStudent.metadata}
                onChange={(e) =>
                  setNewStudent({
                    ...newStudent,
                    metadata:
                      e.target.value,
                  })
                }
              />

              <Input
                placeholder="Created By"
                value={newStudent.created_by}
                onChange={(e) =>
                  setNewStudent({
                    ...newStudent,
                    created_by:
                      e.target.value,
                  })
                }
              />

              <Input
                placeholder="Email ID"
                value={newStudent.email_id}
                onChange={(e) =>
                  setNewStudent({
                    ...newStudent,
                    email_id:
                      e.target.value,
                  })
                }
              />

              <Input
                placeholder="Phone Number"
                value={newStudent.phone_number}
                onChange={(e) =>
                  setNewStudent({
                    ...newStudent,
                    phone_number:
                      e.target.value,
                  })
                }
              />

              <Input
                placeholder="Batch ID"
                value={newStudent.batch_id}
                onChange={(e) =>
                  setNewStudent({
                    ...newStudent,
                    batch_id: Number(
                      e.target.value
                    ),
                  })
                }
              />

              <Input
                placeholder="User ID"
                value={newStudent.user_id}
                onChange={(e) =>
                  setNewStudent({
                    ...newStudent,
                    user_id: Number(
                      e.target.value
                    ),
                  })
                }
              />

              <Input
                placeholder="Classess ID"
                value={newStudent.classess_id}
                onChange={(e) =>
                  setNewStudent({
                    ...newStudent,
                    classess_id: Number(
                      e.target.value
                    ),
                  })
                }
              />

              <Input
                placeholder="Department ID"
                value={newStudent.department_id}
                onChange={(e) =>
                  setNewStudent({
                    ...newStudent,
                    department_id: Number(
                      e.target.value
                    ),
                  })
                }
              />

            </div>

            <div className="flex justify-end mt-6">
              <Button
                onClick={handleAddStudent}
                className="shadow-md"
              >
                <Plus className="h-4 w-4 mr-2" />
                Save Student
              </Button>
            </div>

          </Card>
        )}

        {/* Search */}
        <Card className="p-5 rounded-2xl border-0 shadow-md bg-gradient-to-r from-background to-muted/40">

          <div className="relative">

            <Search className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />

            <Input
              placeholder="Search by name, roll no, admission no, email..."
              className="pl-10 h-12 rounded-xl"
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
            />

          </div>

        </Card>

        {/* Table */}
        <Card className="overflow-auto rounded-2xl border-0 shadow-xl">

          <table className="w-full min-w-[1900px] text-sm">

            <thead className="bg-primary text-primary-foreground">

              <tr>
                {[
                  "ID",
                  "Institution ID",
                  "Admission No",
                  "Roll No",
                  "Full Name",
                  "DOB",
                  "Gender",
                  "Metadata",
                  "Created At",
                  "Created By",
                  "Email ID",
                  "Phone Number",
                  "Batch ID",
                  "User ID",
                  "Classess ID",
                  "Department ID",
                  "Actions",
                ].map((head) => (
                  <th
                    key={head}
                    className="px-4 py-4 text-left whitespace-nowrap font-semibold"
                  >
                    {head}
                  </th>
                ))}
              </tr>

            </thead>

            <tbody>

              {filteredStudents.map(
                (student, index) => {
                  const isEditing =
                    editingId === student.id;

                  return (
                    <tr
                      key={student.id}
                      className={`border-b hover:bg-muted/40 transition ${
                        index % 2 === 0
                          ? "bg-background"
                          : "bg-muted/20"
                      }`}
                    >

                      {Object.entries(student).map(
                        ([key, value]) => (
                          <td
                            key={key}
                            className="px-4 py-3 whitespace-nowrap"
                          >

                            <div className="flex items-center gap-2">

                              {isEditing ? (
                                <Input
                                  value={String(
                                    editedStudent?.[
                                      key as keyof Student
                                    ] ?? ""
                                  )}
                                  onChange={(e) =>
                                    handleChange(
                                      key as keyof Student,
                                      e.target.value
                                    )
                                  }
                                  className="h-9"
                                />
                              ) : (
                                <span>
                                  {String(value)}
                                </span>
                              )}

                              <button
                                onClick={() =>
                                  handleCopy(
                                    String(value)
                                  )
                                }
                                className="text-muted-foreground hover:text-primary transition"
                              >
                                <Copy className="h-4 w-4" />
                              </button>

                            </div>

                          </td>
                        )
                      )}

                      {/* Actions */}
                      <td className="px-4 py-3">

                        <div className="flex items-center gap-2">

                          {isEditing ? (
                            <Button
                              size="sm"
                              onClick={handleSave}
                              className="rounded-lg"
                            >
                              <Save className="h-4 w-4" />
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                handleEdit(student)
                              }
                              className="rounded-lg"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                          )}

                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() =>
                              handleDelete(
                                student.id
                              )
                            }
                            className="rounded-lg"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>

                        </div>

                      </td>

                    </tr>
                  );
                }
              )}

            </tbody>

          </table>

        </Card>
      </section>
    </AdminShell>
  );
};

export default StudentCrud;