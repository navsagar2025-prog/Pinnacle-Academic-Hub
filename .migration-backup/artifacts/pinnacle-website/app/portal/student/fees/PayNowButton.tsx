"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

declare global {
  interface Window {
    Razorpay: new (options: RazorpayOptions) => RazorpayInstance;
  }
}

interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  prefill: { name: string; email: string; contact: string };
  theme: { color: string };
  handler: (response: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => void;
  modal: { ondismiss: () => void };
}

interface RazorpayInstance {
  open: () => void;
}

interface Props {
  feeId: string;
  amount: number;
  period: string;
}

export default function PayNowButton({ feeId, amount, period }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function handlePay() {
    setLoading(true);
    setError(null);

    try {
      if (!window.Razorpay) {
        await loadRazorpayScript();
      }

      const base = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
      const res = await fetch(`${base}/api/v1/payments/create-order`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ feeId }),
      });
      const json = await res.json();
      if (!json.success) {
        setError(json.error ?? "Failed to create order");
        setLoading(false);
        return;
      }

      const { orderId, amount: rzAmount, currency, keyId, studentName, studentEmail, studentPhone } = json.data;

      const rzp = new window.Razorpay({
        key: keyId,
        amount: rzAmount,
        currency,
        name: "Pinnacle Academic Classes",
        description: `Fee payment — ${period}`,
        order_id: orderId,
        prefill: { name: studentName, email: studentEmail, contact: studentPhone },
        theme: { color: "#0D7377" },
        handler: async (response) => {
          setLoading(true);
          try {
            const verRes = await fetch(`${base}/api/v1/payments/verify`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                feeId,
              }),
            });
            const verJson = await verRes.json();
            if (verJson.success) {
              router.push(`/portal/student/fees/receipt/${feeId}`);
            } else {
              setError(verJson.error ?? "Payment verification failed");
            }
          } catch {
            setError("Payment verification failed. Contact support with your payment ID.");
          } finally {
            setLoading(false);
          }
        },
        modal: {
          ondismiss: () => {
            setLoading(false);
            setError("Payment cancelled. No amount has been charged.");
          },
        },
      });
      rzp.open();
    } catch (e) {
      console.error(e);
      setError("Payment gateway unavailable. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      {error && <p className="text-xs text-[var(--color-maroon)] max-w-xs text-right">{error}</p>}
      <button
        onClick={handlePay}
        disabled={loading}
        className="btn-primary text-xs px-3 py-1.5 disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {loading ? "Processing…" : `Pay ₹${amount.toLocaleString("en-IN")}`}
      </button>
    </div>
  );
}

function loadRazorpayScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (document.getElementById("razorpay-checkout-js")) {
      resolve();
      return;
    }
    const s = document.createElement("script");
    s.id = "razorpay-checkout-js";
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("Failed to load Razorpay SDK"));
    document.body.appendChild(s);
  });
}
