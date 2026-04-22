import { PublicLayout } from "@/components/layout/PublicLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { useState } from "react";

const steps = [
  { num: "01", title: "Enquire", desc: "Fill the enquiry form below or call us. Our team will get in touch within 24 hours." },
  { num: "02", title: "Counselling", desc: "Visit us for a free academic counselling session. We'll assess the student's current level and recommend the right course and batch." },
  { num: "03", title: "Demo Class", desc: "Attend a free demo class to experience our teaching methodology firsthand before making any commitment." },
  { num: "04", title: "Enroll", desc: "Complete the enrollment form, submit required documents, and pay the registration fee to secure your seat." },
];

const enquirySchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  phone: z.string().min(10, "Enter a valid 10-digit phone number"),
  email: z.string().email("Enter a valid email address"),
  course: z.string().min(1, "Please select a course"),
  message: z.string().optional(),
});

const demoSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  phone: z.string().min(10, "Enter a valid 10-digit phone number"),
  course: z.string().min(1, "Please select a course"),
  date: z.string().min(1, "Please select a preferred date"),
});

type EnquiryData = z.infer<typeof enquirySchema>;
type DemoData = z.infer<typeof demoSchema>;

function EnquiryForm() {
  const { register, handleSubmit, control, reset, formState: { errors, isSubmitting } } = useForm<EnquiryData>({
    resolver: zodResolver(enquirySchema),
  });

  function onSubmit(data: EnquiryData) {
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        toast.success("Enquiry submitted! We'll call you within 24 hours.", { duration: 5000 });
        reset();
        resolve();
      }, 800);
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div>
          <Label htmlFor="name">Full Name *</Label>
          <Input id="name" {...register("name")} placeholder="Student's full name" className="mt-1.5" />
          {errors.name && <p className="text-destructive text-xs mt-1">{errors.name.message}</p>}
        </div>
        <div>
          <Label htmlFor="phone">Phone Number *</Label>
          <Input id="phone" {...register("phone")} placeholder="+91-XXXXX-XXXXX" className="mt-1.5" />
          {errors.phone && <p className="text-destructive text-xs mt-1">{errors.phone.message}</p>}
        </div>
      </div>
      <div>
        <Label htmlFor="email">Email Address *</Label>
        <Input id="email" type="email" {...register("email")} placeholder="parent@email.com" className="mt-1.5" />
        {errors.email && <p className="text-destructive text-xs mt-1">{errors.email.message}</p>}
      </div>
      <div>
        <Label>Course / Class Interested In *</Label>
        <Controller
          control={control}
          name="course"
          render={({ field }) => (
            <Select onValueChange={field.onChange} value={field.value}>
              <SelectTrigger className="mt-1.5">
                <SelectValue placeholder="Select a course" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="jee">IIT-JEE (Mains + Advanced)</SelectItem>
                <SelectItem value="neet">NEET Preparation</SelectItem>
                <SelectItem value="class12-pcm">Class 12 Boards (PCM)</SelectItem>
                <SelectItem value="class12-pcb">Class 12 Boards (PCB)</SelectItem>
                <SelectItem value="class12-commerce">Class 12 Boards (Commerce)</SelectItem>
                <SelectItem value="class11">Class 11 Foundation</SelectItem>
                <SelectItem value="class10">Class 10 Board Prep</SelectItem>
                <SelectItem value="class9">Class 9 & 8 Foundation</SelectItem>
                <SelectItem value="olympiad">Class 6 & 7 Olympiad</SelectItem>
              </SelectContent>
            </Select>
          )}
        />
        {errors.course && <p className="text-destructive text-xs mt-1">{errors.course.message}</p>}
      </div>
      <div>
        <Label htmlFor="message">Additional Message (Optional)</Label>
        <Textarea id="message" {...register("message")} placeholder="Any specific questions or requirements..." className="mt-1.5 min-h-24" />
      </div>
      <Button type="submit" disabled={isSubmitting} className="w-full" size="lg">
        {isSubmitting ? "Submitting..." : "Submit Enquiry"}
      </Button>
    </form>
  );
}

function DemoForm() {
  const { register, handleSubmit, control, reset, formState: { errors, isSubmitting } } = useForm<DemoData>({
    resolver: zodResolver(demoSchema),
  });

  function onSubmit(data: DemoData) {
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        toast.success("Demo class booked! We'll confirm your slot via phone.", { duration: 5000 });
        reset();
        resolve();
      }, 800);
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div>
          <Label htmlFor="demo-name">Full Name *</Label>
          <Input id="demo-name" {...register("name")} placeholder="Student's full name" className="mt-1.5" />
          {errors.name && <p className="text-destructive text-xs mt-1">{errors.name.message}</p>}
        </div>
        <div>
          <Label htmlFor="demo-phone">Phone Number *</Label>
          <Input id="demo-phone" {...register("phone")} placeholder="+91-XXXXX-XXXXX" className="mt-1.5" />
          {errors.phone && <p className="text-destructive text-xs mt-1">{errors.phone.message}</p>}
        </div>
      </div>
      <div>
        <Label>Course Interested In *</Label>
        <Controller
          control={control}
          name="course"
          render={({ field }) => (
            <Select onValueChange={field.onChange} value={field.value}>
              <SelectTrigger className="mt-1.5">
                <SelectValue placeholder="Select a course" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="jee">IIT-JEE (Mains + Advanced)</SelectItem>
                <SelectItem value="neet">NEET Preparation</SelectItem>
                <SelectItem value="class12">Class 12 Boards</SelectItem>
                <SelectItem value="class11">Class 11 Foundation</SelectItem>
                <SelectItem value="class10">Class 10 Board Prep</SelectItem>
                <SelectItem value="foundation">Class 6–9 Foundation</SelectItem>
              </SelectContent>
            </Select>
          )}
        />
        {errors.course && <p className="text-destructive text-xs mt-1">{errors.course.message}</p>}
      </div>
      <div>
        <Label htmlFor="demo-date">Preferred Date *</Label>
        <Input id="demo-date" type="date" {...register("date")} className="mt-1.5" />
        {errors.date && <p className="text-destructive text-xs mt-1">{errors.date.message}</p>}
      </div>
      <Button type="submit" disabled={isSubmitting} className="w-full bg-secondary hover:bg-secondary/90 text-secondary-foreground" size="lg">
        {isSubmitting ? "Booking..." : "Book Free Demo Class"}
      </Button>
    </form>
  );
}

export default function Admissions() {
  const [activeTab, setActiveTab] = useState<"enquiry" | "demo">("enquiry");

  return (
    <PublicLayout>
      <div className="bg-primary text-primary-foreground py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-serif font-bold mb-4">Admissions Open</h1>
          <p className="text-lg text-primary-foreground/80 max-w-2xl mx-auto">
            Limited seats available for the 2026–27 batch. Secure your child's future today.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-16">
        <div className="mb-16">
          <h2 className="text-2xl md:text-3xl font-serif font-bold text-primary text-center mb-10">Admission Process</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map((step, i) => (
              <div key={i} className="relative">
                {i < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-6 left-full w-full h-0.5 bg-border z-0" style={{ width: "calc(100% - 3rem)", left: "3rem" }} />
                )}
                <div className="bg-card border border-border rounded-2xl p-6 relative z-10">
                  <div className="w-12 h-12 bg-primary text-primary-foreground rounded-xl flex items-center justify-center font-bold mb-4">{step.num}</div>
                  <h3 className="font-bold text-foreground mb-2">{step.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <div className="bg-card border border-border rounded-3xl overflow-hidden shadow-sm">
            <div className="flex border-b border-border">
              <button
                onClick={() => setActiveTab("enquiry")}
                className={`flex-1 px-6 py-4 text-sm font-semibold transition-colors ${activeTab === "enquiry" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"}`}
              >
                Send Enquiry
              </button>
              <button
                onClick={() => setActiveTab("demo")}
                className={`flex-1 px-6 py-4 text-sm font-semibold transition-colors ${activeTab === "demo" ? "bg-secondary text-secondary-foreground" : "text-muted-foreground hover:bg-muted"}`}
              >
                Book Demo Class
              </button>
            </div>
            <div className="p-6 md:p-8">
              {activeTab === "enquiry" ? <EnquiryForm /> : <DemoForm />}
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-primary text-primary-foreground rounded-2xl p-6">
              <h3 className="font-bold text-lg mb-2">Call Us Directly</h3>
              <p className="text-primary-foreground/80 text-sm mb-4">Our admissions team is available Mon–Sat, 9am–7pm.</p>
              <a href="tel:+919876543210" className="flex items-center gap-2 text-xl font-bold text-accent hover:underline">
                +91-98765-43210
              </a>
            </div>
            <div className="bg-card border border-border rounded-2xl p-6">
              <h3 className="font-bold text-lg text-foreground mb-2">WhatsApp Us</h3>
              <p className="text-muted-foreground text-sm mb-4">Quick responses via WhatsApp for course queries.</p>
              <a href="https://wa.me/919876543210" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-[#25D366] font-semibold hover:underline">
                +91-98765-43210 (WhatsApp)
              </a>
            </div>
            <div className="bg-card border border-border rounded-2xl p-6">
              <h3 className="font-bold text-lg text-foreground mb-3">Documents Required</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                {["Last year's mark sheet (photocopy)", "Recent passport-size photographs (2)", "Aadhaar card photocopy (parent + student)", "School leaving / TC (if from different school)", "Registration fee (cheque / UPI / cash)"].map((d, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-accent shrink-0 mt-0.5">✦</span> {d}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}
