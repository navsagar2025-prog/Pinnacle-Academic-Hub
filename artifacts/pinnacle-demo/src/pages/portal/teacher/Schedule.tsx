import { teacherNavItems } from "./Dashboard";
import { PortalLayout } from "@/components/layout/PortalLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";


const schema = z.object({
  batch: z.string().min(1, "Please select a batch"),
  subject: z.string().min(1, "Please select a subject"),
  topic: z.string().min(3, "Topic is required"),
  date: z.string().min(1, "Date is required"),
  startTime: z.string().min(1, "Start time is required"),
  duration: z.string().min(1, "Duration is required"),
});
type FormData = z.infer<typeof schema>;

export default function TeacherSchedule() {
  const { register, handleSubmit, control, reset, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  function onSubmit() {
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        toast.success("Class scheduled! In production, a Zoom meeting link would be auto-generated and shared with students.", { duration: 5000 });
        reset();
        resolve();
      }, 800);
    });
  }

  return (
    <PortalLayout role="teacher" navItems={teacherNavItems} userName="Dr. Ramesh Kumar" userSub="Physics Faculty">
      <div className="mb-6">
        <h1 className="text-2xl font-serif font-bold text-primary">Schedule a Live Class</h1>
        <p className="text-muted-foreground text-sm mt-1">Students will be notified automatically once the class is scheduled.</p>
      </div>

      <div className="max-w-xl">
        <div className="bg-card border border-border rounded-2xl p-6 md:p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <Label>Batch *</Label>
              <Controller control={control} name="batch" render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger className="mt-1.5"><SelectValue placeholder="Select batch" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="jee-2026-eve">JEE 2026 — Evening Batch</SelectItem>
                    <SelectItem value="jee-2026-morn">JEE 2026 — Morning Batch</SelectItem>
                    <SelectItem value="class12-pcm">Class 12 PCM</SelectItem>
                    <SelectItem value="class11-found">Class 11 Foundation</SelectItem>
                  </SelectContent>
                </Select>
              )} />
              {errors.batch && <p className="text-destructive text-xs mt-1">{errors.batch.message}</p>}
            </div>

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
              <Label htmlFor="topic">Topic / Chapter *</Label>
              <Input id="topic" {...register("topic")} placeholder="e.g. Thermodynamics — First Law of Thermodynamics" className="mt-1.5" />
              {errors.topic && <p className="text-destructive text-xs mt-1">{errors.topic.message}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="date">Date *</Label>
                <Input id="date" type="date" {...register("date")} className="mt-1.5" />
                {errors.date && <p className="text-destructive text-xs mt-1">{errors.date.message}</p>}
              </div>
              <div>
                <Label htmlFor="startTime">Start Time *</Label>
                <Input id="startTime" type="time" {...register("startTime")} className="mt-1.5" />
                {errors.startTime && <p className="text-destructive text-xs mt-1">{errors.startTime.message}</p>}
              </div>
            </div>

            <div>
              <Label>Duration *</Label>
              <Controller control={control} name="duration" render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger className="mt-1.5"><SelectValue placeholder="Select duration" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="60">1 hour</SelectItem>
                    <SelectItem value="90">1.5 hours</SelectItem>
                    <SelectItem value="120">2 hours</SelectItem>
                    <SelectItem value="150">2.5 hours</SelectItem>
                  </SelectContent>
                </Select>
              )} />
              {errors.duration && <p className="text-destructive text-xs mt-1">{errors.duration.message}</p>}
            </div>

            <div className="bg-muted/40 rounded-xl p-4 text-xs text-muted-foreground">
              In production: A Zoom meeting will be auto-created and the join link will be shared with all students in the selected batch via the portal and SMS.
            </div>

            <Button type="submit" disabled={isSubmitting} className="w-full" size="lg">
              {isSubmitting ? "Scheduling..." : "Schedule Class"}
            </Button>
          </form>
        </div>
      </div>
    </PortalLayout>
  );
}
