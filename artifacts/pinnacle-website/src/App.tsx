import { useEffect, useRef, useState } from "react";
import { ClerkProvider, SignIn, SignUp, Show, useClerk } from "@clerk/react";
import { publishableKeyFromHost } from "@clerk/react/internal";
import { shadcn } from "@clerk/themes";
import { Switch, Route, useLocation, Router as WouterRouter, Redirect } from "wouter";
import { QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
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
import BlogPage from "@/pages/BlogPage";
import BlogDetailPage from "@/pages/BlogDetailPage";
import GalleryPage from "@/pages/GalleryPage";
import LeaderboardPage from "@/pages/LeaderboardPage";
import StudentPortalPage from "@/pages/portal/StudentPortalPage";
import ParentPortalPage from "@/pages/portal/ParentPortalPage";
import TeacherPortalPage from "@/pages/portal/TeacherPortalPage";
import AdminPortalPage from "@/pages/portal/AdminPortalPage";

const clerkPubKey = publishableKeyFromHost(
  window.location.hostname,
  import.meta.env.VITE_CLERK_PUBLISHABLE_KEY,
);

const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL;

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

function stripBase(path: string): string {
  return basePath && path.startsWith(basePath)
    ? path.slice(basePath.length) || "/"
    : path;
}

if (!clerkPubKey) {
  throw new Error("Missing VITE_CLERK_PUBLISHABLE_KEY");
}

const clerkAppearance = {
  theme: shadcn,
  cssLayerName: "clerk",
  options: {
    logoPlacement: "inside" as const,
    logoLinkUrl: basePath || "/",
    logoImageUrl: `${window.location.origin}${basePath}/logo.png`,
  },
  variables: {
    colorPrimary: "#0A1F5C",
    colorForeground: "#1e293b",
    colorMutedForeground: "#64748b",
    colorDanger: "#8B1A1A",
    colorBackground: "#ffffff",
    colorInput: "#F1F5F9",
    colorInputForeground: "#1e293b",
    colorNeutral: "#e2e8f0",
    fontFamily: "'Plus Jakarta Sans', sans-serif",
    borderRadius: "0.5rem",
  },
  elements: {
    rootBox: "w-full flex justify-center",
    cardBox: "bg-white rounded-2xl w-[440px] max-w-full overflow-hidden shadow-xl",
    card: "!shadow-none !border-0 !bg-transparent !rounded-none",
    footer: "!shadow-none !border-0 !bg-transparent !rounded-none",
    headerTitle: "text-[#0A1F5C] font-bold",
    headerSubtitle: "text-[#64748b]",
    socialButtonsBlockButtonText: "text-[#1e293b] font-medium",
    formFieldLabel: "text-[#1e293b] font-medium",
    footerActionLink: "text-[#0D7377] font-semibold hover:text-[#0A1F5C]",
    footerActionText: "text-[#64748b]",
    dividerText: "text-[#64748b]",
    identityPreviewEditButton: "text-[#0D7377]",
    formFieldSuccessText: "text-[#0D7377]",
    alertText: "text-[#1e293b]",
    logoBox: "flex justify-center mb-2",
    logoImage: "h-12 w-auto",
    socialButtonsBlockButton: "border border-[#e2e8f0] hover:bg-[#F1F5F9]",
    formButtonPrimary: "bg-[#0A1F5C] hover:bg-[#1a3580] text-white",
    formFieldInput: "bg-[#F1F5F9] border-[#e2e8f0] text-[#1e293b]",
    footerAction: "bg-[#F1F5F9]",
    dividerLine: "bg-[#e2e8f0]",
    alert: "bg-[#fff5f5] border-[#fecaca]",
    otpCodeFieldInput: "bg-[#F1F5F9] border-[#e2e8f0]",
    formFieldRow: "gap-2",
    main: "gap-4",
  },
};

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

type Portal = "student" | "parent" | "teacher" | "admin";

const PORTALS: { key: Portal; label: string; icon: string; description: string; color: string; accent: string }[] = [
  {
    key: "student",
    label: "Student",
    icon: "📚",
    description: "Mock tests, study materials, attendance & dashboard",
    color: "bg-blue-50 border-blue-200 hover:border-blue-500",
    accent: "text-blue-700",
  },
  {
    key: "parent",
    label: "Parent",
    icon: "👨‍👩‍👧",
    description: "Child's progress, attendance & fee records",
    color: "bg-green-50 border-green-200 hover:border-green-500",
    accent: "text-green-700",
  },
  {
    key: "teacher",
    label: "Teacher",
    icon: "🎓",
    description: "Batches, assignments, mock tests & performance",
    color: "bg-purple-50 border-purple-200 hover:border-purple-500",
    accent: "text-purple-700",
  },
  {
    key: "admin",
    label: "Administrator",
    icon: "⚙️",
    description: "Full platform management & analytics",
    color: "bg-amber-50 border-amber-200 hover:border-amber-500",
    accent: "text-amber-700",
  },
];

function SignInPage() {
  const searchParams = new URLSearchParams(window.location.search);
  const initialPortal = (searchParams.get("portal") as Portal) || null;
  const [selectedPortal, setSelectedPortal] = useState<Portal | null>(initialPortal);

  if (!selectedPortal) {
    return (
      <div className="min-h-screen bg-[var(--color-slate-light)] flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-lg">
          <div className="text-center mb-8">
            <img
              src={`${basePath}/logo.png`}
              alt="Pinnacle Academic Classes"
              className="h-12 mx-auto mb-5"
            />
            <h1 className="font-[family-name:var(--font-playfair)] text-3xl font-bold text-[var(--color-navy)] mb-2">
              Sign In
            </h1>
            <p className="text-slate-500 text-sm">Select your portal to continue</p>
          </div>

          <div className="space-y-3">
            {PORTALS.map((p) => (
              <button
                key={p.key}
                onClick={() => setSelectedPortal(p.key)}
                className={`w-full text-left border-2 rounded-xl p-4 transition-all cursor-pointer ${p.color} group`}
              >
                <div className="flex items-center gap-4">
                  <span className="text-2xl">{p.icon}</span>
                  <div className="flex-1">
                    <p className={`font-bold text-[var(--color-navy)] text-base`}>{p.label} Portal</p>
                    <p className="text-sm text-slate-500 mt-0.5">{p.description}</p>
                  </div>
                  <svg className={`w-5 h-5 ${p.accent} opacity-0 group-hover:opacity-100 transition-opacity`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </button>
            ))}
          </div>

          <p className="text-center text-sm text-slate-400 mt-6">
            New to Pinnacle?{" "}
            <a href="/admissions" className="text-[var(--color-teal)] font-semibold hover:underline">
              Enquire about admissions
            </a>
          </p>
        </div>
      </div>
    );
  }

  const portal = PORTALS.find((p) => p.key === selectedPortal)!;

  return (
    <div className="min-h-screen bg-[var(--color-slate-light)] flex flex-col items-center justify-center px-4 py-16">
      <button
        onClick={() => setSelectedPortal(null)}
        className="flex items-center gap-2 text-slate-500 hover:text-[var(--color-navy)] text-sm mb-6 self-start max-w-lg w-full transition-colors"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to portal selection
      </button>
      <div className={`flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-full border ${portal.color} ${portal.accent} mb-5`}>
        <span>{portal.icon}</span>
        <span>{portal.label} Portal</span>
      </div>
      <SignIn
        routing="path"
        path={`${basePath}/sign-in`}
        signUpUrl={`${basePath}/sign-up`}
        fallbackRedirectUrl={`${basePath}/portal/${selectedPortal}`}
      />
    </div>
  );
}

function SignUpPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--color-slate-light)] px-4 py-16">
      <SignUp
        routing="path"
        path={`${basePath}/sign-up`}
        signInUrl={`${basePath}/sign-in`}
        fallbackRedirectUrl={`${basePath}/portal/student`}
      />
    </div>
  );
}

function ClerkQueryClientCacheInvalidator() {
  const { addListener } = useClerk();
  const qc = useQueryClient();
  const prevUserIdRef = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    const unsubscribe = addListener(({ user }) => {
      const userId = user?.id ?? null;
      if (prevUserIdRef.current !== undefined && prevUserIdRef.current !== userId) {
        qc.clear();
      }
      prevUserIdRef.current = userId;
    });
    return unsubscribe;
  }, [addListener, qc]);

  return null;
}

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
  }
}

const GA4_ID = import.meta.env.VITE_GA4_MEASUREMENT_ID as string | undefined;

function GA4PageTracker() {
  const [location] = useLocation();

  useEffect(() => {
    if (!GA4_ID) return;
    if (window.gtag) {
      window.gtag("config", GA4_ID, { page_path: location });
      return;
    }
    window.dataLayer = window.dataLayer ?? [];
    window.gtag = function (...args: unknown[]) { window.dataLayer!.push(args); };
    window.gtag("js", new Date());
    window.gtag("config", GA4_ID, { send_page_view: false });
    window.gtag("config", GA4_ID, { page_path: location });
    const s = document.createElement("script");
    s.async = true;
    s.src = `https://www.googletagmanager.com/gtag/js?id=${GA4_ID}`;
    document.head.appendChild(s);
  }, [location]);

  return null;
}

function Router() {
  return (
    <>
    <GA4PageTracker />
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
      <Route path="/blog" component={BlogPage} />
      <Route path="/blog/:slug" component={BlogDetailPage} />
      <Route path="/gallery" component={GalleryPage} />
      <Route path="/leaderboard" component={LeaderboardPage} />

      <Route path="/sign-in/*?" component={SignInPage} />
      <Route path="/sign-up/*?" component={SignUpPage} />

      <Route path="/portal/student" component={StudentPortalPage} />
      <Route path="/portal/student/:rest*" component={StudentPortalPage} />
      <Route path="/portal/parent" component={ParentPortalPage} />
      <Route path="/portal/parent/:rest*" component={ParentPortalPage} />
      <Route path="/portal/teacher" component={TeacherPortalPage} />
      <Route path="/portal/teacher/:rest*" component={TeacherPortalPage} />
      <Route path="/portal/admin" component={AdminPortalPage} />
      <Route path="/portal/admin/:rest*" component={AdminPortalPage} />

      <Route component={NotFound} />
    </Switch>
    </>
  );
}

function ClerkProviderWithRoutes() {
  const [, setLocation] = useLocation();

  return (
    <ClerkProvider
      publishableKey={clerkPubKey}
      proxyUrl={clerkProxyUrl}
      appearance={clerkAppearance}
      signInUrl={`${basePath}/sign-in`}
      signUpUrl={`${basePath}/sign-up`}
      localization={{
        signIn: {
          start: {
            title: "Welcome back",
            subtitle: "Sign in to access your Pinnacle portal",
          },
        },
        signUp: {
          start: {
            title: "Create your account",
            subtitle: "Access your Pinnacle student or parent portal",
          },
        },
      }}
      routerPush={(to) => setLocation(stripBase(to))}
      routerReplace={(to) => setLocation(stripBase(to), { replace: true })}
    >
      <QueryClientProvider client={queryClient}>
        <ClerkQueryClientCacheInvalidator />
        <Router />
      </QueryClientProvider>
    </ClerkProvider>
  );
}

export default function App() {
  return (
    <WouterRouter base={basePath}>
      <ClerkProviderWithRoutes />
    </WouterRouter>
  );
}
