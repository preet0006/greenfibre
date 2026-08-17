import { redirect } from "next/navigation";

export default async function VerifyOtpRedirect({ searchParams }) {
  const params = await searchParams;
  const email = params?.email ? `?email=${encodeURIComponent(params.email)}` : "";
  redirect(`/verify-email${email}`);
}
