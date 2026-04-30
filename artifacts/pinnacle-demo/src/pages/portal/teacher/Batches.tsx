import { teacherNavItems } from "./Dashboard";
import { PortalLayout } from "@/components/layout/PortalLayout";


const batches = [
  {
    name: "JEE 2026 — Evening Batch",
    subject: "Physics",
    students: 24,
    schedule: "Mon, Tue, Thu, Fri 5:00–7:00 PM",
    nextClass: "Today — Thermodynamics",
    completion: 65,
  },
  {
    name: "JEE 2026 — Morning Batch",
    subject: "Physics",
    students: 22,
    schedule: "Mon, Wed, Fri 6:30–8:30 AM",
    nextClass: "Tomorrow — Waves",
    completion: 65,
  },
  {
    name: "Class 12 PCM",
    subject: "Physics",
    students: 26,
    schedule: "Tue, Thu, Sat 4:00–6:00 PM",
    nextClass: "23 Apr — Optics",
    completion: 48,
  },
];

const recentStudents = [
  { name: "Arjun Mehta", batch: "JEE 2026 Evening", attendance: "88%", lastTest: "74%" },
  { name: "Rohan Singh", batch: "JEE 2026 Evening", attendance: "92%", lastTest: "81%" },
  { name: "Priya Kapoor", batch: "JEE 2026 Morning", attendance: "95%", lastTest: "78%" },
  { name: "Karan Verma", batch: "Class 12 PCM", attendance: "80%", lastTest: "69%" },
  { name: "Anjali Rao", batch: "Class 12 PCM", attendance: "91%", lastTest: "85%" },
];

export default function TeacherBatches() {
  return (
    <PortalLayout role="teacher" navItems={teacherNavItems} userName="Dr. Ramesh Kumar" userSub="Physics Faculty">
      <div className="mb-6">
        <h1 className="text-2xl font-serif font-bold text-primary">My Batches</h1>
        <p className="text-muted-foreground text-sm mt-1">Overview of your assigned batches and student performance.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-10">
        {batches.map((b, i) => (
          <div key={i} className="bg-card border border-border rounded-2xl p-5">
            <div className="font-bold text-foreground mb-1">{b.name}</div>
            <div className="text-xs font-semibold text-accent mb-3">{b.subject}</div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Students</span>
                <span className="font-medium">{b.students}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Schedule</span>
                <span className="font-medium text-right text-xs">{b.schedule}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Next Class</span>
                <span className="font-medium text-xs">{b.nextClass}</span>
              </div>
            </div>
            <div className="mt-4">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-muted-foreground">Syllabus Progress</span>
                <span className="font-semibold text-primary">{b.completion}%</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-primary rounded-full" style={{ width: `${b.completion}%` }} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div>
        <h2 className="font-bold text-foreground mb-4">Student Performance Snapshot</h2>
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left px-5 py-3 font-semibold text-xs text-muted-foreground">Student</th>
                  <th className="text-left px-5 py-3 font-semibold text-xs text-muted-foreground">Batch</th>
                  <th className="text-left px-5 py-3 font-semibold text-xs text-muted-foreground">Attendance</th>
                  <th className="text-left px-5 py-3 font-semibold text-xs text-muted-foreground">Last Test</th>
                </tr>
              </thead>
              <tbody>
                {recentStudents.map((s, i) => (
                  <tr key={i} className={i % 2 === 0 ? "bg-background" : "bg-muted/20"}>
                    <td className="px-5 py-4 font-medium">{s.name}</td>
                    <td className="px-5 py-4 text-muted-foreground text-xs">{s.batch}</td>
                    <td className="px-5 py-4 font-semibold text-sm">{s.attendance}</td>
                    <td className="px-5 py-4 font-semibold text-sm">{s.lastTest}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </PortalLayout>
  );
}
