import { redirect } from "next/navigation";
import Dashboard from "@/components/dashboard";
import { getCurrentAdmin } from "@/lib/auth";

export const runtime = "nodejs";

export default async function Home() {
  const admin = await getCurrentAdmin();

  if (!admin) {
    redirect("/login");
  }

  return <Dashboard />;
}