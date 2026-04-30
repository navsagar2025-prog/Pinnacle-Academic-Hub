import { teacherNavItems } from "./Dashboard";
import { PortalLayout } from "@/components/layout/PortalLayout";
import { LayoutDashboard, CalendarPlus, Upload, BellRing, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";


const schema = z.object({
  subject: z.string().min(1, "Select a subject"),
  batch: z.string().min(1, "Select a batch"),
  title: z.string().min(3, "Title is required"),
  file: z.any(),
});
type FormData = z.infer<typeof schema>;

const uploaded = [
  { title: "Thermodynamics — Complete Notes", subject: "Physics", batch: "JEE 2026", date: "20 Apr 2026", size: "3.4 MB" },
  { title: "Waves — Theory & Solved Examples", subject: "Physics", batch: "JEE 2026", date: "16 Apr 2026", size: "2.8 MB" },
  { title: "Current Electricity — Formula Sheet", subject: "Physics", batch: "Class 12 PCM", date: "14 Apr 2026", size: "1.2 MB" },
];

export default function TeacherMaterials() {
  const { register, handleSubmit, control, reset, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  function onSubmit() {
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        toast.success("Study material uploaded successfully! Students can now access it in the portal.");
        reset();
        resolve();
      }, 800);
    });
  }

  return (
    <PortalLayout role="teacher" navItems={teacherNavItems} userName="Dr. Ramesh Kumar" userSub="Physics Faculty">
      <div className="mb-6">
        <h1 className="text-2xl font-serif font-bold text-primary">Upload Study Material</h1>
        <p className="text-muted-foreground text-sm mt-1">Upload notes, formula sheets, and practice materials for your batches.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-card border border-border rounded-2xl p-6 md:p-8">
          <h2 className="font-bold text-foreground mb-5">New Upload</h2>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <Label>Subject *</Label>
              <Controller control={control} name="subject" render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger className="mt-1.5"><SelectValue placeholder="Select subject" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="physics">Physics</SelectItem>
                    <SelectItem value="chemistry">Chemistry</SelectItem>
                    <SelectItem value="mathematics">Mathematics</SelectItem>
                    <SelectItem value="biology">Biology</SelectItem>
                  </SelectContent>
                </Select>
              )} />
              {errors.subject && <p className="text-destructive text-xs mt-1">{errors.subject.message}</p>}
            </div>
            <div>
              <Label>Batch *</Label>
              <Controller control={control} name="batch" render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger className="mt-1.5"><SelectValue placeholder="Select batch" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="jee-2026">JEE 2026 — All Batches</SelectItem>
                    <SelectItem value="class12-pcm">Class 12 PCM</SelectItem>
                    <SelectItem value="class11">Class 11 Foundation</SelectItem>
                  </SelectContent>
                </Select>
              )} />
              {errors.batch && <p className="text-destructive text-xs mt-1">{errors.batch.message}</p>}
            </div>
            <div>
              <Label htmlFor="mat-title">Material Title *</Label>
              <Input id="mat-title" {...register("title")} placeholder="e.g. Thermodynamics — Complete Notes" className="mt-1.5" />
              {errors.title && <p className="text-destructive text-xs mt-1">{errors.title.message}</p>}
            </div>
            <div>
              <Label htmlFor="file">File (PDF) *</Label>
              <Input id="file" type="file" accept=".pdf,.doc,.docx,.pptx" {...register("file")} className="mt-1.5" />
              <p className="text-xs text-muted-foreground mt-1">Max 50MB. Accepted: PDF, Word, PowerPoint.</p>
            </div>
            <Button type="submit" disabled={isSubmitting} className="w-full" size="lg">
              {isSubmitting ? "Uploading..." : "Upload Material"}
            </Button>
          </form>
        </div>

        <div>
          <h2 className="font-bold text-foreground mb-4">Recently Uploaded</h2>
          <div className="space-y-3">
            {uploaded.map((u, i) => (
              <div key={i} className="bg-card border border-border rounded-xl p-4">
                <div className="font-medium text-sm text-foreground">{u.title}</div>
                <div className="text-xs text-muted-foreground mt-1">{u.subject} · {u.batch} · {u.date} · {u.size}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </PortalLayout>
  );
}
