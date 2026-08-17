import { Suspense } from "react";
import ResetPasswordClient from "./ResetPasswordClient";
import { Loader2 } from "lucide-react";

export const metadata = {
  title: "Reset Password",
  description:
    "Enter your reset code and choose a new password for your Green Fibre account.",
};

function Loading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#faf8fc]">
      <Loader2 className="h-8 w-8 animate-spin text-green-600" />
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<Loading />}>
      <ResetPasswordClient />
    </Suspense>
  );
}
