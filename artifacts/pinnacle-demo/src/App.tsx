import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";

import Home from "@/pages/public/Home";
import About from "@/pages/public/About";
import Courses from "@/pages/public/Courses";
import Faculty from "@/pages/public/Faculty";
import Admissions from "@/pages/public/Admissions";
import Contact from "@/pages/public/Contact";
import Results from "@/pages/public/Results";
import Notices from "@/pages/public/Notices";
import FAQ from "@/pages/public/FAQ";
import FeePayment from "@/pages/public/FeePayment";
import Blog from "@/pages/public/Blog";
import PrivacyPolicy from "@/pages/public/PrivacyPolicy";
import Terms from "@/pages/public/Terms";
import RefundPolicy from "@/pages/public/RefundPolicy";
import Login from "@/pages/Login";

import StudentDashboard from "@/pages/portal/student/Dashboard";
import StudentClasses from "@/pages/portal/student/LiveClasses";
import StudentRecordings from "@/pages/portal/student/Recordings";
import StudentMaterials from "@/pages/portal/student/Materials";
import StudentPapers from "@/pages/portal/student/Papers";
import StudentTimetable from "@/pages/portal/student/Timetable";
import StudentFees from "@/pages/portal/student/Fees";

import ParentDashboard from "@/pages/portal/parent/Dashboard";
import ParentFees from "@/pages/portal/parent/Fees";
import ParentTimetable from "@/pages/portal/parent/Timetable";

import TeacherDashboard from "@/pages/portal/teacher/Dashboard";
import TeacherSchedule from "@/pages/portal/teacher/Schedule";
import TeacherMaterials from "@/pages/portal/teacher/Materials";
import TeacherNotices from "@/pages/portal/teacher/Notices";
import TeacherBatches from "@/pages/portal/teacher/Batches";

import AdminDashboard from "@/pages/portal/admin/Dashboard";
import AdminStudents from "@/pages/portal/admin/Students";
import AdminTeachers from "@/pages/portal/admin/Teachers";
import AdminBatches from "@/pages/portal/admin/Batches";
import AdminFees from "@/pages/portal/admin/Fees";
import AdminNotices from "@/pages/portal/admin/Notices";
import AdminResults from "@/pages/portal/admin/Results";
import AdminEnquiries from "@/pages/portal/admin/Enquiries";
import AdminSettings from "@/pages/portal/admin/Settings";
import ScanDocument from "@/pages/portal/ScanDocument";

const queryClient = new QueryClient();

function Router() {
  return (
    <Switch>
      {/* Public pages */}
      <Route path="/" component={Home} />
      <Route path="/about" component={About} />
      <Route path="/courses" component={Courses} />
      <Route path="/faculty" component={Faculty} />
      <Route path="/admissions" component={Admissions} />
      <Route path="/contact" component={Contact} />
      <Route path="/results" component={Results} />
      <Route path="/notices" component={Notices} />
      <Route path="/faq" component={FAQ} />
      <Route path="/fee-payment" component={FeePayment} />
      <Route path="/blog" component={Blog} />
      <Route path="/privacy-policy" component={PrivacyPolicy} />
      <Route path="/terms" component={Terms} />
      <Route path="/refund-policy" component={RefundPolicy} />
      <Route path="/login" component={Login} />

      {/* Student portal */}
      <Route path="/portal/student" component={StudentDashboard} />
      <Route path="/portal/student/classes" component={StudentClasses} />
      <Route path="/portal/student/recordings" component={StudentRecordings} />
      <Route path="/portal/student/materials" component={StudentMaterials} />
      <Route path="/portal/student/papers" component={StudentPapers} />
      <Route path="/portal/student/timetable" component={StudentTimetable} />
      <Route path="/portal/student/fees" component={StudentFees} />

      {/* Parent portal */}
      <Route path="/portal/parent" component={ParentDashboard} />
      <Route path="/portal/parent/fees" component={ParentFees} />
      <Route path="/portal/parent/timetable" component={ParentTimetable} />

      {/* Teacher portal */}
      <Route path="/portal/teacher" component={TeacherDashboard} />
      <Route path="/portal/teacher/schedule" component={TeacherSchedule} />
      <Route path="/portal/teacher/materials" component={TeacherMaterials} />
      <Route path="/portal/teacher/notices" component={TeacherNotices} />
      <Route path="/portal/teacher/batches" component={TeacherBatches} />

      {/* Shared portal — scan feature for teacher + admin */}
      <Route path="/portal/scan" component={ScanDocument} />

      {/* Admin / Staff portal */}
      <Route path="/portal/admin" component={AdminDashboard} />
      <Route path="/portal/admin/students" component={AdminStudents} />
      <Route path="/portal/admin/teachers" component={AdminTeachers} />
      <Route path="/portal/admin/batches" component={AdminBatches} />
      <Route path="/portal/admin/fees" component={AdminFees} />
      <Route path="/portal/admin/notices" component={AdminNotices} />
      <Route path="/portal/admin/results" component={AdminResults} />
      <Route path="/portal/admin/enquiries" component={AdminEnquiries} />
      <Route path="/portal/admin/settings" component={AdminSettings} />

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster richColors position="top-right" />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
