import { useLocation } from "wouter";
import { GraduationCap, Users, BookOpen, ShieldCheck } from "lucide-react";

const roles = [
  {
    key: "student",
    label: "Student Login",
    description: "Access your timetable, study materials, practice papers, recorded classes, and fee status.",
    icon: GraduationCap,
    color: "bg-primary",
    route: "/portal/student",
  },
  {
    key: "parent",
    label: "Parent Login",
    description: "Monitor your child's timetable, track fee dues, and stay updated with institute notices.",
    icon: Users,
    color: "bg-secondary",
    route: "/portal/parent",
  },
  {
    key: "teacher",
    label: "Teacher Login",
    description: "Manage your batches, schedule live classes, upload study materials, and post notices.",
    icon: BookOpen,
    color: "bg-[#8B1A1A]",
    route: "/portal/teacher",
  },
  {
    key: "admin",
    label: "Admin / Staff Login",
    description: "Full control panel — manage students, batches, fees, enquiries, results, and institute settings.",
    icon: ShieldCheck,
    color: "bg-[#1a3a5c]",
    route: "/portal/admin",
  },
];

export default function Login() {
  const [, navigate] = useLocation();

  function handleSelect(role: { key: string; route: string }) {
    localStorage.setItem("pinnacle_role", role.key);
    navigate(role.route);
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="h-16 border-b border-border flex items-center px-6">
        <a href="/" className="font-serif text-2xl font-bold text-primary">PINNACLE</a>
        <span className="ml-4 text-xs font-semibold uppercase tracking-widest text-muted-foreground border border-border rounded-full px-3 py-1">
          Demo Mode
        </span>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-serif font-bold text-primary mb-3">
            Welcome Back
          </h1>
          <p className="text-muted-foreground max-w-sm mx-auto">
            Select your role to enter the demo portal. No password required in demo mode.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 w-full max-w-5xl">
          {roles.map((role) => {
            const Icon = role.icon;
            return (
              <button
                key={role.key}
                onClick={() => handleSelect(role)}
                className="group text-left rounded-2xl border border-border bg-card p-6 hover:border-primary/40 hover:shadow-lg transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <div className={`${role.color} w-12 h-12 rounded-xl flex items-center justify-center mb-4 text-white group-hover:scale-110 transition-transform`}>
                  <Icon className="w-6 h-6" />
                </div>
                <h2 className="font-bold text-lg text-foreground mb-2">{role.label}</h2>
                <p className="text-sm text-muted-foreground leading-relaxed">{role.description}</p>
                <div className="mt-5 text-sm font-semibold text-primary flex items-center gap-1 group-hover:gap-2 transition-all">
                  Enter Portal <span>→</span>
                </div>
              </button>
            );
          })}
        </div>

        <div className="mt-12 text-center">
          <a href="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            ← Back to Website
          </a>
        </div>
      </main>

      <footer className="py-6 text-center text-xs text-muted-foreground border-t border-border">
        © {new Date().getFullYear()} Pinnacle Academic Classes · Demo Platform
      </footer>
    </div>
  );
}
