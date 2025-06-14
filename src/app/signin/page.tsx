import { SignInForm } from "@/app/signin/sign-in-form";
import K from "@/components/icons/k";
import Link from "next/link";

export default function Home() {
  return (
    <div className="relative flex min-h-screen items-center justify-center bg-background">
      <Link href={"./"}>
        <div className="absolute top-4 left-4 flex items-center gap-2">
          <K className="h-6 w-6 text-primary" />
          <span className="text-xl font-bold text-foreground">Komunikasi</span>
        </div>
      </Link>

      <div className="w-full max-w-md">
        <SignInForm />
      </div>
    </div>
  );
}
