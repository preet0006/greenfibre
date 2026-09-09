"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import useUserStore from "@/store/useUserStore";

export default function Home() {
  const { admin, fetchAdminProfile } = useUserStore();
  const router = useRouter();

  useEffect(() => {
    fetchAdminProfile();
  }, []);

  useEffect(() => {
    if (admin === null) {
      router.replace("/login");
    } else if (admin) {
      router.replace("/dashboard");
    }
  }, [admin]);

  return null;
}
