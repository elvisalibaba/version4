import { redirect } from "next/navigation";
import { LoginForm } from "@/components/auth/login-form";
import { getCurrentUserProfile } from "@/lib/auth";
import Link from "next/link";

export default async function LoginPage() {
  const profile = await getCurrentUserProfile();
  if (profile) {
    redirect("/dashboard");
  }

  return (
    <div className="mx-auto max-w-md pt-6">
      <LoginForm />
      <div className="mt-4 rounded-2xl border border-slate-200 bg-white/70 px-4 py-3 text-center text-sm text-slate-600">
        Pas encore de compte ?{" "}
        <Link href="/register" className="font-semibold text-rose-700 hover:text-rose-600">
          Creer un compte
        </Link>
      </div>
    </div>
  );
}
