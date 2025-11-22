"use client";

import { useRouter } from "next/navigation";
import Card from "./components/ui/Card";
import Button from "./components/ui/Button";

export default function Landing() {
  const router = useRouter();
  return (
    <main className="shell">
      <div className="hero glass card shadow-ring">
        <div className="badge">Parking Chai</div>
        <h1 className="title">Smart Parking for Drivers, Providers, Admins</h1>
        <p className="muted" style={{ maxWidth: 720 }}>
          বুকিং, স্পেস ম্যানেজমেন্ট, অ্যাভেইলেবিলিটি, রোল-ভিত্তিক ড্যাশবোর্ড—সব এক জায়গায়।
        </p>
        <div className="row" style={{ gap: 12 }}>
          <Button onClick={() => router.push("/login")}>Login</Button>
          <Button variant="ghost" onClick={() => router.push("/register")}>
            Register
          </Button>
          <Button variant="ghost" onClick={() => router.push("/dashboard")}>
            Go to Dashboard
          </Button>
        </div>
      </div>

      <section className="grid two" style={{ marginTop: 18 }}>
        <Card>
          <div className="pill">Driver</div>
          <h3 className="section-title">Search & Book</h3>
          <p className="muted">লোকেশন + টাইম উইন্ডো দিয়ে খুঁজুন, সাথেসাথেই বুক করুন, নিজের বুকিং দেখুন/ক্যানসেল।</p>
        </Card>
        <Card>
          <div className="pill">Provider</div>
          <h3 className="section-title">Spaces & Availability</h3>
          <p className="muted">স্পেস তৈরি, অ্যাভেইলেবিলিটি সেট, বুকিং কনফার্ম/চেক-ইন/আউট—একই ড্যাশবোর্ডে।</p>
        </Card>
        <Card>
          <div className="pill">Admin</div>
          <h3 className="section-title">System Oversight</h3>
          <p className="muted">স্পেস ও বুকিং ওভারভিউ; ভবিষ্যতে ইউজার/স্পেস/বুকিং টেবিল যোগ করা যাবে।</p>
        </Card>
      </section>
    </main>
  );
}
