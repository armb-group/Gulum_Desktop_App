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
  Eye,
  X
} from "lucide-react";

interface Teacher {
  id: number;
  user_id: number;
  institution_id: number;
  employee_code: string;
  full_name: string;
  qualification: string;
  specialization: string;
  experience_year: number;
  joining_date: string;
  metadata: string;
  is_active: boolean;
  created_at: string;
  created_by: string;
  email: string;
  phone: string;
}

const initialTeachers: Teacher[] = [
  {
    id: 1,
    user_id: 201,
    institution_id: 1,
    employee_code: "EMP-1001",
    full_name: "Rahul Sharma",
    qualification: "M.Tech",
    specialization: "Artificial Intelligence",
    experience_year: 5,
    joining_date: "2023-01-15",
    metadata: "Class Coordinator",
    is_active: true,
    created_at: "2026-05-18",
    created_by: "Admin",
    email: "rahul@example.com",
    phone: "9876543210",
  },
  {
    id: 2,
    user_id: 202,
    institution_id: 1,
    employee_code: "EMP-1002",
    full_name: "Priya Das",
    qualification: "PhD",
    specialization: "Data Science",
    experience_year: 8,
    joining_date: "2022-08-20",
    metadata: "HOD",
    is_active: true,
    created_at: "2026-05-18",
    created_by: "Admin",
    email: "priya@example.com",
    phone: "9123456780",
  },
];

const emptyTeacher: Teacher = {
  id: 0,
  user_id: 0,
  institution_id: 0,
  employee_code: "",
  full_name: "",
  qualification: "",
  specialization: "",
  experience_year: 0,
  joining_date: "",
  metadata: "",
  is_active: true,
  created_at: "",
  created_by: "",
  email: "",
  phone: "",
};

const TeacherCrud = () => {
  const [teachers, setTeachers] =
    useState<Teacher[]>(initialTeachers);

  const [search, setSearch] =
    useState<string>("");

  const [editingId, setEditingId] =
    useState<number | null>(null);

  const [editedTeacher, setEditedTeacher] =
    useState<Teacher | null>(null);

  const [showAddForm, setShowAddForm] =
    useState<boolean>(false);

  const [newTeacher, setNewTeacher] =
    useState<Teacher>(emptyTeacher);

  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedViewTeacher, setSelectedViewTeacher] = useState<Teacher | null>(null);

  const filteredTeachers = useMemo(() => {
    return teachers.filter((teacher) =>
      Object.values(teacher)
        .join(" ")
        .toLowerCase()
        .includes(search.toLowerCase())
    );
  }, [teachers, search]);

  const handleEdit = (teacher: Teacher) => {
    setEditingId(teacher.id);
    setEditedTeacher({ ...teacher });
  };

  const handleViewDetails = (teacher: Teacher) => {
    setSelectedViewTeacher(teacher);
    setViewModalOpen(true);
  };

  const handleSave = () => {
    if (!editedTeacher) return;

    setTeachers((prev) =>
      prev.map((teacher) =>
        teacher.id === editingId
          ? editedTeacher
          : teacher
      )
    );

    setEditingId(null);
    setEditedTeacher(null);
  };

  const handleDelete = (id: number) => {
    setTeachers((prev) =>
      prev.filter((teacher) => teacher.id !== id)
    );
  };

  const handleCopy = (value: string) => {
    navigator.clipboard.writeText(value);
  };

  const handleChange = (
    field: keyof Teacher,
    value: string
  ) => {
    if (!editedTeacher) return;

    setEditedTeacher({
      ...editedTeacher,
      [field]: value,
    });
  };

  const handleAddTeacher = () => {
    const teacherToAdd: Teacher = {
      ...newTeacher,
      id: teachers.length + 1,
      created_at: new Date()
        .toISOString()
        .split("T")[0],
    };

    setTeachers((prev) => [
      ...prev,
      teacherToAdd,
    ]);

    setNewTeacher(emptyTeacher);

    setShowAddForm(false);
  };

  return (
    <AdminShell title="Teacher Management">
      <section className="container py-8 space-y-6">

        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-blue-500 bg-clip-text text-transparent">
              Teacher Management
            </h1>

            <p className="text-muted-foreground mt-2">
              Manage all teachers with advanced CRUD operations.
            </p>
          </div>

          <Button
            onClick={() =>
              setShowAddForm(!showAddForm)
            }
            className="shadow-md hover:scale-105 transition-transform"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Teacher
          </Button>
        </div>

        {/* Add Teacher Form */}
        {showAddForm && (
          <Card className="p-6 rounded-2xl border-0 shadow-xl bg-gradient-to-br from-background to-muted/30">

            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">
                Add New Teacher
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
                placeholder="User ID"
                value={newTeacher.user_id}
                onChange={(e) =>
                  setNewTeacher({
                    ...newTeacher,
                    user_id: Number(
                      e.target.value
                    ),
                  })
                }
              />

              <Input
                placeholder="Institution ID"
                value={newTeacher.institution_id}
                onChange={(e) =>
                  setNewTeacher({
                    ...newTeacher,
                    institution_id: Number(
                      e.target.value
                    ),
                  })
                }
              />

              <Input
                placeholder="Employee Code"
                value={newTeacher.employee_code}
                onChange={(e) =>
                  setNewTeacher({
                    ...newTeacher,
                    employee_code:
                      e.target.value,
                  })
                }
              />

              <Input
                placeholder="Full Name"
                value={newTeacher.full_name}
                onChange={(e) =>
                  setNewTeacher({
                    ...newTeacher,
                    full_name:
                      e.target.value,
                  })
                }
              />

              <Input
                placeholder="Qualification"
                value={newTeacher.qualification}
                onChange={(e) =>
                  setNewTeacher({
                    ...newTeacher,
                    qualification:
                      e.target.value,
                  })
                }
              />

              <Input
                placeholder="Specialization"
                value={newTeacher.specialization}
                onChange={(e) =>
                  setNewTeacher({
                    ...newTeacher,
                    specialization:
                      e.target.value,
                  })
                }
              />

              <Input
                type="number"
                placeholder="Experience Year"
                value={
                  newTeacher.experience_year
                }
                onChange={(e) =>
                  setNewTeacher({
                    ...newTeacher,
                    experience_year:
                      Number(
                        e.target.value
                      ),
                  })
                }
              />

              <Input
                type="date"
                value={newTeacher.joining_date}
                onChange={(e) =>
                  setNewTeacher({
                    ...newTeacher,
                    joining_date:
                      e.target.value,
                  })
                }
              />

              <Input
                placeholder="Metadata"
                value={newTeacher.metadata}
                onChange={(e) =>
                  setNewTeacher({
                    ...newTeacher,
                    metadata:
                      e.target.value,
                  })
                }
              />

              <Input
                placeholder="Created By"
                value={newTeacher.created_by}
                onChange={(e) =>
                  setNewTeacher({
                    ...newTeacher,
                    created_by:
                      e.target.value,
                  })
                }
              />

              <Input
                placeholder="Email"
                value={newTeacher.email}
                onChange={(e) =>
                  setNewTeacher({
                    ...newTeacher,
                    email:
                      e.target.value,
                  })
                }
              />

              <Input
                placeholder="Phone"
                value={newTeacher.phone}
                onChange={(e) =>
                  setNewTeacher({
                    ...newTeacher,
                    phone:
                      e.target.value,
                  })
                }
              />

            </div>

            <div className="flex justify-end mt-6">
              <Button
                onClick={handleAddTeacher}
                className="shadow-md"
              >
                <Plus className="h-4 w-4 mr-2" />
                Save Teacher
              </Button>
            </div>

          </Card>
        )}

        {/* Search */}
        <Card className="p-5 rounded-2xl border-0 shadow-md bg-gradient-to-r from-background to-muted/40">
          <div className="relative">
            <Search className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />

            <Input
              placeholder="Search by name, employee code, email, specialization..."
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

          <table className="w-full min-w-[1800px] text-xs">

            <thead className="bg-primary text-primary-foreground">
              <tr>
                {[
                  "ID",
                  "User ID",
                  "Institution ID",
                  "Employee Code",
                  "Full Name",
                  "Qualification",
                  "Specialization",
                  "Experience",
                  "Joining Date",
                  "Metadata",
                  "Active",
                  "Created At",
                  "Created By",
                  "Email",
                  "Phone",
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
              {filteredTeachers.map(
                (teacher, index) => {
                  const isEditing =
                    editingId === teacher.id;

                  return (
                    <tr
                      key={teacher.id}
                      className={`border-b hover:bg-muted/40 transition ${
                        index % 2 === 0
                          ? "bg-background"
                          : "bg-muted/20"
                      }`}
                    >

                      {Object.entries(
                        teacher
                      ).map(([key, value]) => (
                        <td
                          key={key}
                          className="px-4 py-3 whitespace-nowrap"
                        >
                          <div className="flex items-center gap-2">

                            {isEditing ? (
                              <Input
                                value={String(
                                  editedTeacher?.[
                                    key as keyof Teacher
                                  ] ?? ""
                                )}
                                onChange={(e) =>
                                  handleChange(
                                    key as keyof Teacher,
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
                      ))}

                      {/* Actions */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Button size="sm" variant="outline" onClick={() => handleViewDetails(teacher)} title="View Details" className="rounded-lg">
                            <Eye className="h-4 w-4" />
                          </Button>

                          {isEditing ? (
                            <Button
                              size="sm"
                              onClick={
                                handleSave
                              }
                              className="rounded-lg"
                            >
                              <Save className="h-4 w-4" />
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                handleEdit(
                                  teacher
                                )
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
                                teacher.id
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

      {/* View Details Modal */}
      {viewModalOpen && selectedViewTeacher && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          onClick={() => setViewModalOpen(false)}
        >
          <div
            className="w-full max-w-2xl rounded-3xl bg-background shadow-2xl border overflow-hidden animate-in fade-in zoom-in-95 flex flex-col max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b">
              <div>
                <h2 className="text-2xl font-bold text-primary">Teacher Profile</h2>
                <p className="text-sm text-muted-foreground">Full professional record</p>
              </div>
              <button
                onClick={() => setViewModalOpen(false)}
                className="p-2 rounded-xl hover:bg-muted transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {Object.entries(selectedViewTeacher).map(([key, value]) => (
                  <div key={key} className="p-3 rounded-xl bg-muted/20 border border-muted/30">
                    <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1">
                      {key.replace(/_/g, " ")}
                    </p>
                    <p className="text-sm font-medium truncate" title={String(value)}>
                      {String(value ?? "—")}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t bg-muted/10 flex justify-end">
              <Button onClick={() => setViewModalOpen(false)}>Close</Button>
            </div>
          </div>
        </div>
      )}
    </AdminShell>
  );
};

export default TeacherCrud;