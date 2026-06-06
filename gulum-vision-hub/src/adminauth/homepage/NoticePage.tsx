import { useEffect, useState } from "react";
import { AdminShell } from "./AdminShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Bell, Search, CalendarDays, User, Plus, X } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { getNoticesByInstitution } from "@/services/noticeAPI";

interface Notice {
  id: string | number;
  title: string;
  description: string;
  createdBy?: string;
  created_by?: string;
  createdAt?: string;
  created_at?: string;
}

const formatDate = (dateStr?: string) => {
  if (!dateStr) return "";
  try {
    return new Date(dateStr).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch (e) {
    return dateStr;
  }
};

const NoticePage = () => {
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [notices, setNotices] = useState<Notice[]>([]);
  const [selectedNotice, setSelectedNotice] = useState<Notice | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.institutionId) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    getNoticesByInstitution(user.institutionId)
      .then((data: any) => {
        const list = data?.responseData ?? data?.data ?? data;
        if (Array.isArray(list)) {
          setNotices(list);
        } else if (Array.isArray(list?.content)) {
          setNotices(list.content);
        } else if (Array.isArray(data)) {
          setNotices(data);
        } else {
          setNotices([]);
        }
        setError(null);
      })
      .catch((err: any) => {
        console.error("Failed to load notices:", err);
        setError("Failed to load notices. Please try again later.");
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [user?.institutionId]);

  const filteredAndSorted = [...notices]
    .filter(
      (n) =>
        n.title?.toLowerCase().includes(search.toLowerCase()) ||
        n.description?.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => {
      const dateA = new Date(a.createdAt ?? a.created_at ?? 0).getTime();
      const dateB = new Date(b.createdAt ?? b.created_at ?? 0).getTime();
      return dateB - dateA;
    });

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
        <Card className="p-5 rounded-2xl admin-glass">
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

        {/* Notice Cards or Loading/Error State */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
            <p className="text-sm text-muted-foreground">Loading notices...</p>
          </div>
        ) : error ? (
          <div className="p-6 rounded-2xl bg-destructive/10 text-destructive text-sm border border-destructive/20 text-center">
            {error}
          </div>
        ) : filteredAndSorted.length === 0 ? (
          <div className="p-12 rounded-2xl border border-dashed border-muted-foreground/20 text-center space-y-3">
            <Bell className="h-8 w-8 text-muted-foreground/40 mx-auto" />
            <h3 className="text-base font-semibold text-foreground">No Notices Found</h3>
            <p className="text-sm text-muted-foreground max-w-xs mx-auto">
              There are no notices published for your institution yet.
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredAndSorted.map((notice) => (
              <Card
                key={notice.id}
                className="p-6 rounded-2xl admin-glass transition-all duration-300 hover:-translate-y-0.5"
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
                        {notice.description && notice.description.length > 180
                          ? `${notice.description.substring(0, 180)}… Read More`
                          : notice.description}
                      </p>
                      <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1.5">
                          <User className="h-3.5 w-3.5" />
                          {notice.createdBy ?? notice.created_by ?? "Unknown"}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <CalendarDays className="h-3.5 w-3.5" />
                          {formatDate(notice.createdAt ?? notice.created_at)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Modal */}
        {selectedNotice && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="w-full max-w-2xl rounded-2xl overflow-hidden animate-in fade-in zoom-in-95 admin-glass-modal">
              <div className="flex items-center justify-between px-6 py-4 border-b border-white/20 dark:border-white/10">
                <div>
                  <h2 className="text-lg font-bold text-foreground">{selectedNotice.title}</h2>
                  <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <User className="h-3.5 w-3.5" />
                      {selectedNotice.createdBy ?? selectedNotice.created_by ?? "Unknown"}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <CalendarDays className="h-3.5 w-3.5" />
                      {formatDate(selectedNotice.createdAt ?? selectedNotice.created_at)}
                    </span>
                  </div>
                </div>
                <button onClick={() => setSelectedNotice(null)} className="p-2 rounded-xl hover:bg-muted transition">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="p-6 max-h-[65vh] overflow-y-auto">
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
