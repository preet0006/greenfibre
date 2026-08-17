import { Suspense } from "react";
import VerifyOtpClient from "../verify-otp/VerifyOtpClient";
import { Loader2 } from "lucide-react";

export const metadata = {
  title: "Verify Your Email",
  description:
    "Enter the OTP sent to your email to verify your Green Fibre account.",
};

function Loading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-white">
      <Loader2 className="h-8 w-8 animate-spin text-green-600" />
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<Loading />}>
      <VerifyOtpClient />
    </Suspense>
  );
}
