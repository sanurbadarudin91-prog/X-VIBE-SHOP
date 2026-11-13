import { Suspense } from "react";
import { LoginForm } from "@/components/auth/login-form";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata = { title: "Masuk" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ redirectTo?: string }>;
}) {
  const { redirectTo } = await searchParams;

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4 py-10">
      <Suspense fallback={<Skeleton className="h-[520px] w-full max-w-md" />}>
        <LoginForm redirectTo={redirectTo ?? "/"} />
      </Suspense>
    </div>
  );
}
