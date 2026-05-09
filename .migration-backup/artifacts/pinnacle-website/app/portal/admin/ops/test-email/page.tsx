import { requirePortalRole } from "@/lib/server/portal-auth";
import { TestEmailForm } from "./TestEmailForm";

export const metadata = { title: "Test Email — Operations" };

export default async function TestEmailPage() {
  const user = await requirePortalRole("admin");
  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="font-[family-name:var(--font-playfair)] text-2xl font-bold text-[var(--color-navy)]">Test Email</h1>
        <p className="text-slate-500 text-sm">
          Send a sample message via Resend to verify email delivery is working. Limited to 10 sends per hour.
        </p>
      </div>
      <TestEmailForm defaultTo={user.email} />
    </div>
  );
}
