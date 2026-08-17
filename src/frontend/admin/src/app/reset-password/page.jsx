import { Suspense } from "react";
import ResetPasswordClient from './ResetPasswordClient'

export const dynamic = "force-dynamic";

export default function VerifyOtpPage() {
  return (
    <Suspense fallback={<div className="p-10">Loading...</div>}>
      <ResetPasswordClient />
    </Suspense>
  );
}