import { PortalLayout } from "@/components/layout/PortalLayout";
import { LayoutDashboard, CalendarPlus, Upload, BellRing, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

const navItems = [
  { label: "Dashboard", href: "/portal/teacher", icon: LayoutDashboard },
  { label: "Schedule Class", href: "/portal/teacher/schedule", icon: CalendarPlus },
  { label: "Upload Material", href: "/portal/teacher/materials", icon: Upload },
  { label: "Post Notice", href: "/portal/teacher/notices", icon: BellRing },
  { label: "Batches", href: "/portal/teacher/batches", icon: Users },
];

const schema = z.object({
  batch: z.string().min(1, "Select a batch"),
  title: z.string().min(3, "Title is required"),
  content: z.string().min(10, "Notice content must be at least 10 characters"),
});
type FormData = z.infer<typeof schema>;

const posted = [
  { title: "Mock Test — May 1, Full Syllabus", batch: "JEE 2026", date: "20 Apr 2026" },
  { title: "Chapter Test: Thermodynamics on April 28", batch: "JEE 2026", date: "18 Apr 2026" },
  { title: "Updated Notes: Waves Module — Check Portal", batch: "JEE 2026", date: "16 Apr 2026" },
];

export default function TeacherNotices() {
  const { register, handleSubmit, control, reset, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  function onSubmit() {
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        toast.success("Notice posted! All students in the selected batch have been notified.");
        reset();
        resolve();
      }, 800);
    });
  }

  return (
    <PortalLayout role="teacher" navItems={navItems} userName="Dr. Ramesh Kumar" userSub="Physics Faculty">
      <div className="mb-6">
        <h1 className="text-2xl font-serif font-bold text-primary">Post a Notice</h1>
        <p className="text-muted-foreground text-sm mt-1">Post notices visible to students and parents in the selected batch.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-card border border-border rounded-2xl p-6 md:p-8">
          <h2 className="font-bold text-foreground mb-5">New Notice</h2>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <Label>Target Batch *</Label>
              <Controller control={control} name="batch" render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger className="mt-1.5"><SelectValue placeholder="Select batch" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Batches</SelectItem>
                    <SelectItem value="jee-2026">JEE 2026</SelectItem>
                    <SelectItem value="class12-pcm">Class 12 PCM</SelectItem>
                    <SelectItem value="class11">Class 11 Foundation</SelectItem>
                  </SelectContent>
                </Select>
              )} />
              {errors.batch && <p className="text-destructive text-xs mt-1">{errors.batch.message}</p>}
            </div>
            <div>
              <Label htmlFor="notice-title">Notice Title *</Label>
              <Input id="notice-title" {...register("title")} placeholder="e.g. Mock Test on May 1 — Full Syllabus" className="mt-1.5" />
              {errors.title && <p className="text-destructive text-xs mt-1">{errors.title.message}</p>}
            </div>
            <div>
              <Label htmlFor="notice-content">Notice Content *</Label>
              <Textarea id="notice-content" {...register("content")} placeholder="Detailed notice message..." className="mt-1.5 min-h-32" />
              {errors.content && <p className="text-destructive text-xs mt-1">{errors.content.message}</p>}
            </div>
            <Button type="submit" disabled={isSubmitting} className="w-full" size="lg">
              {isSubmitting ? "Posting..." : "Post Notice"}
            </Button>
          </form>
        </div>

        <div>
          <h2 className="font-bold text-foreground mb-4">Recently Posted</h2>
          <div className="space-y-3">
            {posted.map((n, i) => (
              <div key={i} className="bg-card border border-border rounded-xl p-4">
                <div className="font-medium text-sm text-foreground">{n.title}</div>
                <div className="text-xs text-muted-foreground mt-1">{n.batch} · {n.date}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </PortalLayout>
  );
}
