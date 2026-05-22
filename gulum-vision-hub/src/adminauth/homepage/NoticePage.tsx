import { useState } from "react";
import { AdminShell } from "./AdminShell";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import {
  Bell,
  Search,
  CalendarDays,
  User,
  Plus,
  X,
} from "lucide-react";

interface Notice {
  id: number;
  title: string;
  description: string;
  created_by: string;
  created_at: string;
  priority: "High" | "Medium" | "Low";
}

const initialNotices: Notice[] = [
  {
    id: 1,
    title: "Semester Examination Schedule Published",
    description:
      "The semester examination routine for all departments has been published. Students are requested to check the exam portal carefully. The examination will start from June 15 and practical exams will begin one week earlier. Students must carry their admit cards during examinations. Any mismatch in subject code should be immediately reported to the examination department before the examination starts.",
    created_by: "Admin",
    created_at: "2026-05-18",
    priority: "High",
  },
  {
    id: 2,
    title: "Holiday Notice",
    description:
      "College will remain closed on Friday due to maintenance work inside the campus.",
    created_by: "Principal",
    created_at: "2026-05-17",
    priority: "Medium",
  },
  {
    id: 3,
    title: "Hackathon Registration Open",
    description:
      "Students can now register for the annual AI Hackathon event from the student portal. Teams of maximum 4 members are allowed. The hackathon includes AI, ML, Web Development, Cybersecurity, and IoT tracks. Attractive prizes and internship opportunities are available for winners.",
    created_by: "Event Coordinator",
    created_at: "2026-05-16",
    priority: "Low",
  },
];

const NoticePage = () => {
  const [search, setSearch] =
    useState<string>("");

  const [notices] =
    useState<Notice[]>(initialNotices);

  const [selectedNotice, setSelectedNotice] =
    useState<Notice | null>(null);

  const filteredNotices = notices.filter(
    (notice) =>
      notice.title
        .toLowerCase()
        .includes(search.toLowerCase()) ||
      notice.description
        .toLowerCase()
        .includes(search.toLowerCase())
  );

  const getPriorityColor = (
    priority: string
  ) => {
    switch (priority) {
      case "High":
        return "bg-red-500/20 text-red-600 border-red-500/30";

      case "Medium":
        return "bg-yellow-500/20 text-yellow-600 border-yellow-500/30";

      default:
        return "bg-green-500/20 text-green-600 border-green-500/30";
    }
  };

  return (
    <AdminShell title="Notice Board">
      <section className="container py-8 space-y-6">

        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4">

          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-blue-500 bg-clip-text text-transparent">
              Notice Board
            </h1>

            <p className="text-muted-foreground mt-2">
              View all important announcements and notices.
            </p>
          </div>

          <Button className="shadow-md hover:scale-105 transition-transform">
            <Plus className="h-4 w-4 mr-2" />
            Create Notice
          </Button>

        </div>

        {/* Search */}
        <Card className="p-5 rounded-2xl border-0 shadow-md bg-gradient-to-r from-background to-muted/40">

          <div className="relative">

            <Search className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />

            <Input
              placeholder="Search notices..."
              className="pl-10 h-12 rounded-xl"
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
            />

          </div>

        </Card>

        {/* Notice Cards */}
        <div className="grid gap-6">

          {filteredNotices.map((notice) => (
            <Card
              key={notice.id}
              className="p-6 rounded-2xl border-0 shadow-lg hover:shadow-2xl transition-all duration-300 bg-gradient-to-br from-background to-muted/30"
            >

              <div className="flex flex-wrap items-start justify-between gap-4">

                <div className="flex items-start gap-4 flex-1">

                  <div className="p-3 rounded-2xl bg-primary/10">
                    <Bell className="h-6 w-6 text-primary" />
                  </div>

                  <div className="flex-1">
                    <h2 className="text-2xl font-bold">
                      {notice.title}
                    </h2>

                    {/* Short Description */}
                    <p
                      onClick={() =>
                        setSelectedNotice(notice)
                      }
                      className="text-muted-foreground mt-3 leading-7 cursor-pointer hover:text-primary transition"
                    >
                      {notice.description.length > 180
                        ? `${notice.description.substring(
                            0,
                            180
                          )}... Read More`
                        : notice.description}
                    </p>

                    <div className="flex flex-wrap items-center gap-6 mt-5 text-sm text-muted-foreground">

                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        {notice.created_by}
                      </div>

                      <div className="flex items-center gap-2">
                        <CalendarDays className="h-4 w-4" />
                        {notice.created_at}
                      </div>

                    </div>
                  </div>

                </div>

                {/* Priority Badge */}
                <div
                  className={`px-4 py-2 rounded-full border text-sm font-semibold ${getPriorityColor(
                    notice.priority
                  )}`}
                >
                  {notice.priority}
                </div>

              </div>

            </Card>
          ))}

        </div>

        {/* Popup Modal */}
        {selectedNotice && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">

            <div className="w-full max-w-3xl rounded-3xl bg-background shadow-2xl border overflow-hidden animate-in fade-in zoom-in-95">

              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b">

                <div>
                  <h2 className="text-3xl font-bold">
                    {selectedNotice.title}
                  </h2>

                  <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">

                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      {selectedNotice.created_by}
                    </div>

                    <div className="flex items-center gap-2">
                      <CalendarDays className="h-4 w-4" />
                      {selectedNotice.created_at}
                    </div>

                  </div>
                </div>

                <button
                  onClick={() =>
                    setSelectedNotice(null)
                  }
                  className="p-2 rounded-xl hover:bg-muted transition"
                >
                  <X className="h-5 w-5" />
                </button>

              </div>

              {/* Content */}
              <div className="p-6 max-h-[70vh] overflow-y-auto">

                <div
                  className={`inline-flex px-4 py-2 rounded-full border text-sm font-semibold mb-6 ${getPriorityColor(
                    selectedNotice.priority
                  )}`}
                >
                  {selectedNotice.priority} Priority
                </div>

                <p className="text-base leading-8 text-muted-foreground whitespace-pre-line">
                  {selectedNotice.description}
                </p>

              </div>

            </div>

          </div>
        )}

      </section>
    </AdminShell>
  );
};

export default NoticePage;