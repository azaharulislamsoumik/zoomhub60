
import { redirect } from "next/navigation";
import { getCurrentAdmin } from "@/lib/auth";
import LoginForm from "@/components/login-form";

export default async function LoginPage() {
  const admin = await getCurrentAdmin();

  if (admin) {
    redirect("/");
  }

  return <LoginForm />;
}
