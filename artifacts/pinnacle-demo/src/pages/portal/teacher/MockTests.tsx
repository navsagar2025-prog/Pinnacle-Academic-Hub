import { PortalLayout } from "@/components/layout/PortalLayout";
import { teacherNavItems } from "./Dashboard";
import { Sparkles, FileQuestion, Clock, Users, Plus } from "lucide-react";
import { useState } from "react";

const mockTestsData = [
  {
    id: "1",
    title: "JEE Main Mock Test 5 — Mechanics",
    subject: "Physics",
    examType: "JEE Main",
    durationMinutes: 60,
    questionCount: 30,
    attemptCount: 18,
    isPublished: true,
    createdAt: "2 days ago",
  },
  {
    id: "2",
    title: "Thermodynamics Practice Test",
    subject: "Physics",
    examType: "JEE Advanced",
    durationMinutes: 45,
    questionCount: 20,
    attemptCount: 12,
    isPublished: true,
    createdAt: "5 days ago",
  },
  {
    id: "3",
    title: "Waves & Optics — Quick Quiz",
    subject: "Physics",
    examType: "NEET",
    durationMinutes: 30,
    questionCount: 15,
    attemptCount: 0,
    isPublished: false,
    createdAt: "1 week ago",
  },
];

export default function TeacherMockTests() {
  const [showCreate, setShowCreate] = useState(false);

  return (
    <PortalLayout role="teacher" navItems={teacherNavItems} userName="Dr. Ramesh Kumar" userSub="Physics Faculty">
      <div className="flex items-center justify-between gap-4 flex-wrap mb-6">
        <div>
          <h1 className="text-2xl font-serif font-bold text-primary">My Mock Tests</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Create and manage MCQ tests for your students
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="px-4 py-2 rounded-lg bg-secondary text-secondary-foreground text-sm font-semibold flex items-center gap-1.5 hover:opacity-90 transition-opacity"
        >
          <Plus size={16} /> Create Test
        </button>
      </div>

      <div className="bg-accent/50 border border-border rounded-xl p-3 mb-6 flex items-center gap-2">
        <Sparkles size={14} className="text-secondary shrink-0" />
        <p className="text-xs text-muted-foreground">
          As a <strong>Physics</strong> teacher, you can create tests for Physics only.
          Teachers with <strong>Examiner</strong> designation can create tests for all subjects.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {mockTestsData.map((t) => (
          <div
            key={t.id}
            className="bg-card border border-border rounded-xl p-5 hover:shadow-md transition-all cursor-pointer"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-primary font-serif line-clamp-2">{t.title}</h3>
                <p className="text-xs text-muted-foreground mt-1">{t.subject} · {t.examType}</p>
              </div>
              <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                t.isPublished
                  ? "bg-secondary/10 text-secondary"
                  : "bg-muted text-muted-foreground"
              }`}>
                {t.isPublished ? "Live" : "Draft"}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2 pt-3 border-t border-border text-xs">
              <div className="text-center">
                <div className="font-bold text-primary flex items-center justify-center gap-1">
                  <FileQuestion size={12} />{t.questionCount}
                </div>
                <div className="text-muted-foreground mt-0.5">Questions</div>
              </div>
              <div className="text-center">
                <div className="font-bold text-primary flex items-center justify-center gap-1">
                  <Clock size={12} />{t.durationMinutes}m
                </div>
                <div className="text-muted-foreground mt-0.5">Duration</div>
              </div>
              <div className="text-center">
                <div className="font-bold text-primary flex items-center justify-center gap-1">
                  <Users size={12} />{t.attemptCount}
                </div>
                <div className="text-muted-foreground mt-0.5">Attempts</div>
              </div>
            </div>
            <p className="text-[10px] text-muted-foreground mt-3">Created {t.createdAt}</p>
          </div>
        ))}
      </div>

      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-card rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-border">
              <h2 className="font-serif font-bold text-primary text-lg">Create Mock Test</h2>
              <button onClick={() => setShowCreate(false)} className="text-muted-foreground hover:text-foreground">✕</button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1">Title</label>
                <input placeholder="JEE Main Mock Test · Mechanics" className="w-full px-3 py-2 rounded-lg border border-border text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1">Subject</label>
                  <select className="w-full px-3 py-2 rounded-lg border border-border text-sm bg-card">
                    <option>Physics</option>
                  </select>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Restricted to your subject</p>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1">Exam Type</label>
                  <select className="w-full px-3 py-2 rounded-lg border border-border text-sm bg-card">
                    <option>JEE Main</option>
                    <option>JEE Advanced</option>
                    <option>NEET</option>
                    <option>CBSE</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1">Duration (min)</label>
                  <input type="number" defaultValue={60} className="w-full px-3 py-2 rounded-lg border border-border text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1">Marks/Q</label>
                  <input type="number" defaultValue={4} className="w-full px-3 py-2 rounded-lg border border-border text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1">Neg %</label>
                  <input type="number" defaultValue={25} className="w-full px-3 py-2 rounded-lg border border-border text-sm" />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button onClick={() => setShowCreate(false)} className="px-4 py-2 rounded-lg border border-border text-sm font-semibold text-muted-foreground hover:bg-accent">Cancel</button>
                <button
                  onClick={() => { alert("Demo mode — test creation is simulated"); setShowCreate(false); }}
                  className="px-4 py-2 rounded-lg bg-secondary text-secondary-foreground text-sm font-semibold hover:opacity-90"
                >
                  Create & Add Questions
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </PortalLayout>
  );
}
