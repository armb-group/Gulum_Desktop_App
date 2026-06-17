import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
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
      staleTime: 5 * 60 * 1000, // 5 minutes
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
          <BrowserRouter>
            <PhoneFrame>
              <Routes>
                <Route path="/" element={<Welcome />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />


                {/* Student */}
                <Route path="/student/login" element={<SignIn role="student" />} />
                <Route
                  path="/student"
                  element={
                    <ProtectedRoute role="student">
                      <StudentHome />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/student/dashboard"
                  element={
                    <ProtectedRoute role="student">
                      <StudentDashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/student/calendar"
                  element={
                    <ProtectedRoute role="student">
                      <StudentCalendar />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/student/notifications"
                  element={
                    <ProtectedRoute role="student">
                      <StudentNotifications />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/student/profile"
                  element={
                    <ProtectedRoute role="student">
                      <StudentProfile />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/student/attendance"
                  element={
                    <ProtectedRoute role="student">
                      <StudentAttendance />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/student/lecture-audit"
                  element={
                    <ProtectedRoute role="student">
                      <StudentLectureAudit />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/student/timetable"
                  element={
                    <ProtectedRoute role="student">
                      <StudentTimetable />
                    </ProtectedRoute>
                  }
                />

                {/* Teacher */}
                <Route path="/teacher/login" element={<SignIn role="teacher" />} />
                <Route
                  path="/teacher"
                  element={
                    <ProtectedRoute role="teacher">
                      <TeacherHome />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/teacher/dashboard"
                  element={
                    <ProtectedRoute role="teacher">
                      <TeacherDashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/teacher/calendar"
                  element={
                    <ProtectedRoute role="teacher">
                      <TeacherCalendar />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/teacher/assignments"
                  element={
                    <ProtectedRoute role="teacher">
                      <TeacherAssignments />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/teacher/notifications"
                  element={
                    <ProtectedRoute role="teacher">
                      <TeacherNotifications />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/teacher/profile"
                  element={
                    <ProtectedRoute role="teacher">
                      <TeacherProfile />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/teacher/attendance"
                  element={
                    <ProtectedRoute role="teacher">
                      <TeacherAttendance />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/teacher/lecture-audit"
                  element={
                    <ProtectedRoute role="teacher">
                      <TeacherLectureAudit />
                    </ProtectedRoute>
                  }
                />

                {/* Admin (kept) */}
                <Route path="/admin/login" element={<AdminLogin />} />
                <Route
                  path="/admin/dashboard"
                  element={
                    <ProtectedRoute role="admin">
                      <AdminDashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/bulk-upload"
                  element={
                    <ProtectedRoute role="admin">
                      <BulkUpload />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/calendar"
                  element={
                    <ProtectedRoute role="admin">
                      <AdminCalendar />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/admin/department"
                  element={
                    <ProtectedRoute role="admin">
                      <Departments />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/admin/ClassCrud"
                  element={
                    <ProtectedRoute role="admin">
                      <ClassCrud />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/admin/SubjectCrud"
                  element={
                    <ProtectedRoute role="admin">
                      <SubjectCrud />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/admin/ModuleCrud"
                  element={
                    <ProtectedRoute role="admin">
                      <ModuleCrud />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/admin/TeacherCrud"
                  element={
                    <ProtectedRoute role="admin">
                      <TeacherCrud />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/admin/StudentCrud"
                  element={
                    <ProtectedRoute role="admin">
                      <StudentCrud />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/admin/attendance"
                  element={
                    <ProtectedRoute role="admin">
                      <AttendancePage />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/admin/lecture-audit"
                  element={
                    <ProtectedRoute role="admin">
                      <LectureAuditPage />
                    </ProtectedRoute>
                  }
                />


                <Route
                  path="/admin/NoticePage"
                  element={
                    <ProtectedRoute role="admin">
                      <NoticePage />
                    </ProtectedRoute>
                  }
                />
                {/* <Route
                  path="/admin/assign-work"
                  element={
                    <ProtectedRoute role="admin">
                      <AssignWork />
                    </ProtectedRoute>
                  }
                /> */}
                <Route
                  path="/admin/assign-teacher"
                  element={
                    <ProtectedRoute role="admin">
                      <AssignTeacher />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/routine"
                  element={
                    <ProtectedRoute role="admin">
                      <ScheduleRoutine />
                    </ProtectedRoute>
                  }
                />
                <Route
  path="/admin/assign-subject"
  element={<AssignSubject />}
/>

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
