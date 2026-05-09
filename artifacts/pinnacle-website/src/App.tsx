import { Switch, Route, Router as WouterRouter } from "wouter";
import HomePage from "@/pages/HomePage";
import AboutPage from "@/pages/AboutPage";
import CoursesPage from "@/pages/CoursesPage";
import FacultyPage from "@/pages/FacultyPage";
import AdmissionsPage from "@/pages/AdmissionsPage";
import ResultsPage from "@/pages/ResultsPage";
import NoticesPage from "@/pages/NoticesPage";
import FAQPage from "@/pages/FAQPage";
import FeeStructurePage from "@/pages/FeeStructurePage";
import ContactPage from "@/pages/ContactPage";
import AchievementsPage from "@/pages/AchievementsPage";
import PrivacyPolicyPage from "@/pages/PrivacyPolicyPage";
import TermsPage from "@/pages/TermsPage";
import RefundPolicyPage from "@/pages/RefundPolicyPage";

function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-slate-light)]">
      <div className="text-center">
        <div className="text-8xl font-bold text-[var(--color-navy)] font-[family-name:var(--font-playfair)] mb-4">404</div>
        <h1 className="text-2xl font-bold text-[var(--color-navy)] mb-2">Page Not Found</h1>
        <p className="text-slate-500 mb-6">The page you're looking for doesn't exist.</p>
        <a href="/" className="btn-primary px-6 py-2.5">Go to Home</a>
      </div>
    </div>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={HomePage} />
      <Route path="/about" component={AboutPage} />
      <Route path="/courses" component={CoursesPage} />
      <Route path="/faculty" component={FacultyPage} />
      <Route path="/admissions" component={AdmissionsPage} />
      <Route path="/results" component={ResultsPage} />
      <Route path="/notices" component={NoticesPage} />
      <Route path="/faq" component={FAQPage} />
      <Route path="/fee-structure" component={FeeStructurePage} />
      <Route path="/contact" component={ContactPage} />
      <Route path="/achievements" component={AchievementsPage} />
      <Route path="/privacy-policy" component={PrivacyPolicyPage} />
      <Route path="/terms" component={TermsPage} />
      <Route path="/refund-policy" component={RefundPolicyPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

export default function App() {
  return (
    <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
      <Router />
    </WouterRouter>
  );
}
