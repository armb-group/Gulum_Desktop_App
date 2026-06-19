import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { PhoneFrame } from "@/components/PhoneFrame";
import { ProtectedRoute } from "@/components/ProtectedRoute";


import Welcome from "./pages/Welcome";
import SignIn from "./pages/SignIn";
import NotFound from "./pages/NotFound";

import StudentHome from "./studentauth/homepage/StudentHome";
import StudentDashboard from "./studentauth/homepage/StudentDashboard";
import StudentNotifications from "./studentauth/homepage/StudentNotifications";
import StudentProfile from "./studentauth/homepage/StudentProfile";
import StudentAttendance from "./studentauth/homepage/StudentAttendance";
import StudentLectureAudit from "./studentauth/homepage/StudentLectureAudit";
import StudentCalendar from "./studentauth/homepage/StudentCalendar";
import StudentTimetable from "./studentauth/homepage/StudentTimetable";

import TeacherHome from "./teacherauth/homepage/TeacherHome";
import TeacherDashboard from "./teacherauth/homepage/TeacherDashboard";
import TeacherAssignments from "./teacherauth/homepage/TeacherAssignments";
import TeacherNotifications from "./teacherauth/homepage/TeacherNotifications";
import TeacherProfile from "./teacherauth/homepage/TeacherProfile";
import TeacherAttendance from "./teacherauth/homepage/TeacherAttendance";
import TeacherLectureAudit from "./teacherauth/homepage/TeacherLectureAudit";
import TeacherCalendar from "./teacherauth/homepage/TeacherCalendar";
import TeacherTimetable from "./teacherauth/homepage/TeacherTimetable";

import AdminLogin from "./adminauth/homepage/AdminLogin";
import AdminDashboard from "./adminauth/homepage/AdminDashboard";
import BulkUpload from "./adminauth/homepage/BulkUpload";
import AdminCalendar from "./adminauth/homepage/AdminCalendar";
import TeacherCrud from "./adminauth/homepage/TeacherCrud";
import StudentCrud from "./adminauth/homepage/StudentCrud";
import NoticePage from "./adminauth/homepage/NoticePage";
import Departments from "./adminauth/homepage/Departments";
import ClassCrud from "./adminauth/homepage/ClassCrud";
import SubjectCrud from "./adminauth/homepage/SubjectCrud";
import ModuleCrud from "./adminauth/homepage/ModuleCrud";
// import AssignWork from "./adminauth/homepage/AssignWork";
import AssignTeacher from "./adminauth/homepage/AssignTeacher";
import ScheduleRoutine from "./adminauth/homepage/ScheduleRoutine";
import ForgotPassword  from "./pages/ForgotPassword";
import AttendancePage from "./adminauth/homepage/AttendancePage";
import LectureAuditPage from "./adminauth/homepage/LectureAuditPage";
import AssignSubject from "./adminauth/homepage/AssignSubject";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 2 * 60 * 1000 // 2 minutes
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <PhoneFrame>
              <Routes>
                <Route path="/" element={<Navigate to="/login" replace />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/login" element={<SignIn />} />
                
                {/* Student */}
                <Route path="/student/login" element={<SignIn />} />
                <Route path="/student" element={<ProtectedRoute role="student" />}>
                  <Route index element={<StudentHome />} />
                  <Route path="dashboard" element={<StudentDashboard />} />
                  <Route path="calendar" element={<StudentCalendar />} />
                  <Route path="notifications" element={<StudentNotifications />} />
                  <Route path="profile" element={<StudentProfile />} />
                  <Route path="attendance" element={<StudentAttendance />} />
                  <Route path="lecture-audit" element={<StudentLectureAudit />} />
                  <Route path="timetable" element={<StudentTimetable />} />
                </Route>

                {/* Teacher */}
                <Route path="/teacher/login" element={<SignIn />} />
                <Route path="/teacher" element={<ProtectedRoute role="teacher" />}>
                  <Route index element={<TeacherHome />} />
                  <Route path="dashboard" element={<TeacherDashboard />} />
                  <Route path="calendar" element={<TeacherCalendar />} />
                  <Route path="assignments" element={<TeacherAssignments />} />
                  <Route path="notifications" element={<TeacherNotifications />} />
                  <Route path="profile" element={<TeacherProfile />} />
                  <Route path="attendance" element={<TeacherAttendance />} />
                  <Route path="lecture-audit" element={<TeacherLectureAudit />} />
                  <Route path="timetable" element={<TeacherTimetable />} />
                </Route>

                {/* Admin */}
                <Route path="/admin/login" element={<SignIn />} />
                <Route path="/admin" element={<ProtectedRoute role="admin" />}>
                  <Route path="dashboard" element={<AdminDashboard />} />
                  <Route path="bulk-upload" element={<BulkUpload />} />
                  <Route path="calendar" element={<AdminCalendar />} />
                  <Route path="department" element={<Departments />} />
                  <Route path="ClassCrud" element={<ClassCrud />} />
                  <Route path="SubjectCrud" element={<SubjectCrud />} />
                  <Route path="ModuleCrud" element={<ModuleCrud />} />
                  <Route path="TeacherCrud" element={<TeacherCrud />} />
                  <Route path="StudentCrud" element={<StudentCrud />} />
                  <Route path="attendance" element={<AttendancePage />} />
                  <Route path="lecture-audit" element={<LectureAuditPage />} />
                  <Route path="NoticePage" element={<NoticePage />} />
                  <Route path="assign-teacher" element={<AssignTeacher />} />
                  <Route path="routine" element={<ScheduleRoutine />} />
                  <Route path="assign-subject" element={<AssignSubject />} />
                </Route>

                <Route path="*" element={<NotFound />} />
              </Routes>
            </PhoneFrame>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
