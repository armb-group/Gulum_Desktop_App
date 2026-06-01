import { useState } from "react";
import { AdminShell } from "./AdminShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Bell, Search, CalendarDays, User, Plus, X } from "lucide-react";

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
    description: "College will remain closed on Friday due to maintenance work inside the campus.",
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

const priorityClass = (p: string) => {
  if (p === "High") return "bg-red-500/20 text-red-600 border-red-500/30";
  if (p === "Medium") return "bg-yellow-500/20 text-yellow-600 border-yellow-500/30";
  return "bg-green-500/20 text-green-600 border-green-500/30";
};

const NoticePage = () => {
  const [search, setSearch] = useState("");
  const [notices] = useState<Notice[]>(initialNotices);
  const [selectedNotice, setSelectedNotice] = useState<Notice | null>(null);

  const filtered = notices.filter(
    (n) =>
      n.title.toLowerCase().includes(search.toLowerCase()) ||
      n.description.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AdminShell title="Notice Board">
      <section className="container py-8 space-y-6">

        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Notice Board</h1>
            <p className="text-sm text-muted-foreground mt-1">View all important announcements and notices.</p>
          </div>
          <Button className="gap-2 shadow-md">
            <Plus className="h-4 w-4" /> Create Notice
          </Button>
        </div>

        {/* Search */}
<<<<<<< Updated upstream
        <Card className="p-5 rounded-2xl border border-border shadow-md bg-card">

=======
        <Card className="p-5 rounded-2xl admin-glass">
>>>>>>> Stashed changes
          <div className="relative">
            <Search className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search notices..."
              className="pl-10 h-12 rounded-xl"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </Card>

        {/* Notice Cards */}
        <div className="grid gap-4">
          {filtered.map((notice) => (
            <Card
              key={notice.id}
<<<<<<< Updated upstream
              className="p-6 rounded-2xl border border-border shadow-md hover:shadow-lg transition-all duration-300 bg-card"
=======
              className="p-6 rounded-2xl admin-glass transition-all duration-300 hover:-translate-y-0.5"
>>>>>>> Stashed changes
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex items-start gap-4 flex-1">
                  <div className="p-3 rounded-2xl bg-primary/10 shrink-0">
                    <Bell className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="text-base font-bold text-foreground">{notice.title}</h2>
                    <p
                      onClick={() => setSelectedNotice(notice)}
                      className="text-sm text-muted-foreground mt-2 leading-6 cursor-pointer hover:text-primary transition line-clamp-2"
                    >
                      {notice.description.length > 180
                        ? `${notice.description.substring(0, 180)}… Read More`
                        : notice.description}
                    </p>
                    <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1.5"><User className="h-3.5 w-3.5" />{notice.created_by}</span>
                      <span className="flex items-center gap-1.5"><CalendarDays className="h-3.5 w-3.5" />{notice.created_at}</span>
                    </div>
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full border text-xs font-semibold shrink-0 ${priorityClass(notice.priority)}`}>
                  {notice.priority}
                </span>
              </div>
            </Card>
          ))}
        </div>

        {/* Modal */}
        {selectedNotice && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="w-full max-w-2xl rounded-2xl overflow-hidden animate-in fade-in zoom-in-95 admin-glass-modal">
              <div className="flex items-center justify-between px-6 py-4 border-b border-white/20 dark:border-white/10">
                <div>
                  <h2 className="text-lg font-bold text-foreground">{selectedNotice.title}</h2>
                  <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1.5"><User className="h-3.5 w-3.5" />{selectedNotice.created_by}</span>
                    <span className="flex items-center gap-1.5"><CalendarDays className="h-3.5 w-3.5" />{selectedNotice.created_at}</span>
                  </div>
                </div>
                <button onClick={() => setSelectedNotice(null)} className="p-2 rounded-xl hover:bg-muted transition">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="p-6 max-h-[65vh] overflow-y-auto">
                <span className={`inline-flex px-3 py-1 rounded-full border text-xs font-semibold mb-4 ${priorityClass(selectedNotice.priority)}`}>
                  {selectedNotice.priority} Priority
                </span>
                <p className="text-sm leading-7 text-muted-foreground whitespace-pre-line">{selectedNotice.description}</p>
              </div>
            </div>
          </div>
        )}

      </section>
    </AdminShell>
  );
};

export default NoticePage;
