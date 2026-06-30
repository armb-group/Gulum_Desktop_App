import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useGetAttendancePercentage } from "@/services/studentAttendanceAPI";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, isToday, startOfWeek, endOfWeek } from "date-fns";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, CheckCircle2, XCircle, Clock, AlertCircle } from "lucide-react";

interface AttendanceCalendarModalProps {
  isOpen: boolean;
  onClose: () => void;
  courseId: string;
  courseName: string;
}

const AttendanceCalendarModal: React.FC<AttendanceCalendarModalProps> = ({ isOpen, onClose, courseId, courseName }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  
  // Get student ID from local storage
  const userStr = localStorage.getItem("gulum-user");
  const studentId = userStr ? JSON.parse(userStr).id : null;

  // Fetch attendance data
  const { data, isLoading, isError } = useGetAttendancePercentage(studentId, courseId, {
    enabled: isOpen && !!studentId && !!courseId,
  });

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

  // Build calendar days
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 1 }); // Start on Monday
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const dateFormat = "d";
  const days = eachDayOfInterval({ start: startDate, end: endDate });

  // History mapping
  // data["Attendance History"] usually contains { date: "YYYY-MM-DD", status: "present" | "absent" | "late" }
  const getStatusForDate = (date: Date) => {
    if (!data || !data["Attendance History"]) return null;
    const dateStr = format(date, "yyyy-MM-dd");
    const record = data["Attendance History"].find((h: any) => h.date.startsWith(dateStr));
    return record ? record.status.toLowerCase() : null;
  };

  const getColorClassForStatus = (status: string | null) => {
    switch (status) {
      case "present": return "bg-success/20 text-success border-success/30 font-bold";
      case "absent": return "bg-destructive/20 text-destructive border-destructive/30 font-bold";
      case "late": return "bg-warning/20 text-warning-foreground border-warning/30 font-bold";
      default: return "bg-surface text-muted-foreground border-transparent";
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="admin-white-modal sm:max-w-[500px] w-[95vw] p-0 overflow-hidden rounded-2xl flex flex-col max-h-[90vh]">
        <DialogHeader className="p-6 pb-4 border-b border-border/50 bg-muted/20">
          <DialogTitle className="text-xl flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-brand" />
            Attendance Calendar
          </DialogTitle>
          <DialogDescription className="text-sm">
            {courseName}
          </DialogDescription>
        </DialogHeader>

        <div className="p-6 overflow-y-auto scrollbar-beautiful">
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand"></div>
            </div>
          ) : isError || !data ? (
            <div className="flex flex-col justify-center items-center h-64 text-center space-y-3">
              <AlertCircle className="w-10 h-10 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground font-medium">No attendance records found for this subject.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Stats Bar */}
              <div className="grid grid-cols-3 gap-2 bg-muted/30 p-3 rounded-xl border border-border/40">
                <div className="text-center">
                  <p className="text-2xl font-bold text-brand">{data.attendancePercentage}%</p>
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Attendance</p>
                </div>
                <div className="text-center border-x border-border/50">
                  <p className="text-2xl font-bold text-success">{data.presentCount}</p>
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Attended</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-foreground">{data.totalClasses}</p>
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Total</p>
                </div>
              </div>

              {/* Calendar Container */}
              <div className="border border-border/60 rounded-xl overflow-hidden bg-surface shadow-sm">
                {/* Month Navigation */}
                <div className="flex justify-between items-center p-4 bg-muted/10 border-b border-border/50">
                  <button onClick={prevMonth} className="p-1.5 rounded-md hover:bg-muted text-muted-foreground transition-colors">
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <h3 className="font-semibold text-foreground">
                    {format(currentMonth, "MMMM yyyy")}
                  </h3>
                  <button onClick={nextMonth} className="p-1.5 rounded-md hover:bg-muted text-muted-foreground transition-colors">
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>

                {/* Days Header */}
                <div className="grid grid-cols-7 text-center py-2 bg-muted/20 border-b border-border/40">
                  {["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"].map((day) => (
                    <div key={day} className="text-xs font-bold text-muted-foreground">
                      {day}
                    </div>
                  ))}
                </div>

                {/* Calendar Grid */}
                <div className="grid grid-cols-7 p-2 gap-1 bg-surface">
                  {days.map((day, i) => {
                    const status = getStatusForDate(day);
                    const colorClass = getColorClassForStatus(status);
                    const isCurrentMonth = isSameMonth(day, monthStart);
                    const todayMarker = isToday(day) ? "ring-2 ring-brand ring-offset-1" : "";
                    
                    return (
                      <div 
                        key={day.toString()} 
                        className={`
                          aspect-square flex items-center justify-center rounded-lg text-sm transition-all border
                          ${isCurrentMonth ? "opacity-100" : "opacity-30"}
                          ${colorClass}
                          ${todayMarker}
                        `}
                      >
                        {format(day, dateFormat)}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Legend */}
              <div className="flex flex-wrap justify-center gap-4 pt-2">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                  <CheckCircle2 className="w-4 h-4 text-success" /> Present
                </div>
                <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                  <XCircle className="w-4 h-4 text-destructive" /> Absent
                </div>
                <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                  <Clock className="w-4 h-4 text-warning" /> Late
                </div>
                <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                  <div className="w-3.5 h-3.5 rounded-full border border-border/60 bg-muted/30" /> No Class
                </div>
              </div>

            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AttendanceCalendarModal;
