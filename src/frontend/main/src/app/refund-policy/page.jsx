"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import ReplacementPolicyPage from "../replacement-policy/page";

export default function RefundPolicyRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/replacement-policy");
  }, [router]);

  return <ReplacementPolicyPage />;
}
