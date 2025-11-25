"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { session } from "../../lib/api";
import Card from "../components/ui/Card";

export default function DashboardHome() {
  const router = useRouter();

  useEffect(() => {
    const s = session.get();
    if (!s.token) {
      router.replace("/login");
      return;
    }
    // Role-based jump; default driver
    const role = s.user?.role;
    if (role === "provider") router.replace("/dashboard/provider");
    else if (role === "admin") router.replace("/dashboard/admin");
    else router.replace("/dashboard/driver");
  }, [router]);

  return (
    <Card>
      Redirecting to your dashboard...
    </Card>
  );
}
