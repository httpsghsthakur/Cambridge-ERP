import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { SettingsProvider } from './context/SettingsContext';
import ProtectedRoute from './components/common/ProtectedRoute';

import LoginPage from './pages/LoginPage';

import AdminLayout from './pages/admin/AdminLayout';
import Dashboard from './pages/admin/Dashboard';
import Students from './pages/admin/Students';
import Staff from './pages/admin/Staff';
import Attendance from './pages/admin/Attendance';
import Fees from './pages/admin/Fees';
import Marks from './pages/admin/Marks';
import Timetable from './pages/admin/Timetable';
import Promotion from './pages/admin/Promotion';
import Notifications from './pages/admin/Notifications';
import FeeStructure from './pages/admin/FeeStructure';
import Events from './pages/admin/Events';
import AdminTeacherAttendance from './pages/admin/TeacherAttendance';
import Settings from './pages/admin/Settings';
import CentralIntegration from './pages/admin/CentralIntegration';
import StaffLeaveManagement from './pages/admin/StaffLeaveManagement';
import AdminLeaveManagement from './pages/admin/LeaveManagement';
import AdminDatesheets from './pages/admin/AdminDatesheets';
import ActivityLogs from './pages/admin/ActivityLogs';
import SecurityLogs from './pages/admin/SecurityLogs';

import Admin2Layout from './pages/admin2/Admin2Layout';
import Admin2Dashboard from './pages/admin2/Admin2Dashboard';
import ResultApprovals from './pages/admin2/ResultApprovals';
import ClassInchargeManager from './pages/admin2/ClassInchargeManager';
import Admin2TeacherAttendance from './pages/admin2/TeacherAttendance';
import FCAdmissions from './pages/feecollector/FCAdmissions';

import TeacherLayout from './pages/teacher/TeacherLayout';
import TeacherDashboard from './pages/teacher/TeacherDashboard';
import MarkAttendance from './pages/teacher/MarkAttendance';
import EnterMarks from './pages/teacher/EnterMarks';
import TeacherOwnAttendance from './pages/teacher/TeacherOwnAttendance';
import TeacherLeaveManagement from './pages/teacher/LeaveManagement';
import InchargeResults from './pages/teacher/InchargeResults';
import InchargeDatesheet from './pages/teacher/InchargeDatesheet';
import InchargeAchievements from './pages/teacher/InchargeAchievements';

import ParentLayout from './pages/parent/ParentLayout';
import ParentDashboard from './pages/parent/ParentDashboard';
import MyTimetable from './pages/parent/MyTimetable';
import MyAttendance from './pages/parent/MyAttendance';
import MyExams from './pages/parent/MyExams';
import ReportCard from './pages/parent/ReportCard';
import MyAchievements from './pages/parent/MyAchievements';
import FeeStatus from './pages/parent/FeeStatus';
import MyNotifications from './pages/parent/MyNotifications';

import MyProfilePage from './pages/common/MyProfilePage';
import BulkUploadStudents from './pages/common/BulkUploadStudents';
import StudentPerformance from './pages/common/StudentPerformance';

import FCLayout from './pages/feecollector/FCLayout';
import FCDashboard from './pages/feecollector/FCDashboard';
import FCCollect from './pages/feecollector/FCCollect';
import FCAdmission from './pages/feecollector/FCAdmission';
import CredentialManagement from './pages/CredentialManagement';

export default function App() {
  return (
    <AuthProvider>
      <SettingsProvider>
        <BrowserRouter>
          <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/" element={<Navigate to="/login" replace />} />

          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="students" element={<Students />} />
            <Route path="student-performance" element={<StudentPerformance />} />
            <Route path="teachers" element={<Staff />} />
            <Route path="incharge" element={<ClassInchargeManager />} />
            <Route path="teacher-attendance" element={<AdminTeacherAttendance />} />
            <Route path="leaves" element={<AdminLeaveManagement />} />
            <Route path="staff-attendance/:id/leaves" element={<StaffLeaveManagement />} />
            <Route path="attendance" element={<Attendance />} />
            <Route path="fees" element={<Fees />} />
            <Route path="fee-structure" element={<FeeStructure />} />
            <Route path="marks" element={<Marks />} />
            <Route path="results" element={<ResultApprovals />} />
            <Route path="datesheets" element={<AdminDatesheets />} />
            <Route path="timetable" element={<Timetable />} />
            <Route path="promotion" element={<Promotion />} />
            <Route path="notifications" element={<Notifications />} />
            <Route path="events" element={<Events />} />
            <Route path="credentials" element={<CredentialManagement />} />
            <Route path="profile" element={<MyProfilePage />} />
            <Route path="bulk-upload" element={<BulkUploadStudents />} />
            <Route path="admissions" element={<FCAdmissions />} />
            <Route path="settings" element={<Settings />} />
            <Route path="central-integration" element={<CentralIntegration />} />
            <Route path="logs" element={<ActivityLogs />} />
            <Route path="security-logs" element={<SecurityLogs />} />
          </Route>

          <Route
            path="/admin2"
            element={
              <ProtectedRoute allowedRoles={['admin2']}>
                <Admin2Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Admin2Dashboard />} />
            <Route path="student-performance" element={<StudentPerformance />} />
            <Route path="results" element={<ResultApprovals />} />
            <Route path="datesheets" element={<AdminDatesheets />} />
            <Route path="incharge" element={<ClassInchargeManager />} />
            <Route path="teachers" element={<Admin2TeacherAttendance />} />
            <Route path="staff-attendance/:id/leaves" element={<StaffLeaveManagement />} />
            <Route path="admissions" element={<FCAdmissions />} />
            <Route path="credentials" element={<CredentialManagement />} />
            <Route path="profile" element={<MyProfilePage />} />
            <Route path="timetable" element={<Timetable />} />
            <Route path="bulk-upload" element={<BulkUploadStudents />} />
            <Route path="notifications" element={<MyNotifications />} />
            <Route path="events" element={<Events />} />
          </Route>

          <Route
            path="/teacher"
            element={
              <ProtectedRoute allowedRoles={['teacher']}>
                <TeacherLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<TeacherDashboard />} />
            <Route path="student-performance" element={<StudentPerformance />} />
            <Route path="attendance" element={<MarkAttendance />} />
            <Route path="marks" element={<EnterMarks />} />
            <Route path="incharge-results" element={<InchargeResults />} />
            <Route path="datesheet" element={<InchargeDatesheet />} />
            <Route path="achievements" element={<InchargeAchievements />} />
            <Route path="my-attendance" element={<TeacherOwnAttendance />} />
            <Route path="leaves" element={<TeacherLeaveManagement />} />
            <Route path="timetable" element={<Timetable />} />
            <Route path="profile" element={<MyProfilePage />} />
            <Route path="notifications" element={<MyNotifications />} />
          </Route>

          <Route
            path="/parent"
            element={
              <ProtectedRoute allowedRoles={['parent', 'student']}>
                <ParentLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<ParentDashboard />} />
            <Route path="profile" element={<MyProfilePage />} />
            <Route path="timetable" element={<MyTimetable />} />
            <Route path="attendance" element={<MyAttendance />} />
            <Route path="exams" element={<MyExams />} />
            <Route path="report-card" element={<ReportCard />} />
            <Route path="achievements" element={<MyAchievements />} />
            <Route path="events" element={<Events />} />
            <Route path="fees" element={<FeeStatus />} />
            <Route path="notifications" element={<MyNotifications />} />
          </Route>

          <Route
            path="/fc"
            element={
              <ProtectedRoute allowedRoles={['fee_collector']}>
                <FCLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<FCDashboard />} />
            <Route path="collect" element={<FCCollect />} />
            <Route path="search" element={<FCCollect />} />
            <Route path="admission" element={<FCAdmission />} />
            <Route path="admissions" element={<FCAdmissions />} />
            <Route path="credentials" element={<CredentialManagement />} />
            <Route path="profile" element={<MyProfilePage />} />
            <Route path="bulk-upload" element={<BulkUploadStudents />} />
            <Route path="notifications" element={<MyNotifications />} />
            <Route path="events" element={<Events />} />
          </Route>
        </Routes>
        </BrowserRouter>
      </SettingsProvider>
    </AuthProvider>
  );
}
