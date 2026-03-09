import { redirect } from "next/navigation";
import { LoginForm } from "@/components/auth/login-form";
import { getCurrentUserProfile } from "@/lib/auth";

export default async function LoginPage() {
  const profile = await getCurrentUserProfile();
  if (profile) {
    redirect("/dashboard");
  }

  return (
    <div className="mx-auto max-w-md pt-6">
      <LoginForm />
    </div>
  );
}
