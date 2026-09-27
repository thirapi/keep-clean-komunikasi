import { SignInForm } from "@/app/signin/sign-in-form";
import { BrandLogo } from "@/components/brand-logo";
import Link from "next/link";
import { Suspense } from "react";
import { CircleNotch } from "@phosphor-icons/react/dist/ssr";

export default function House() {
  return (
    <div className="relative flex min-h-screen items-center justify-center bg-background">
      <Link href={"./"}>
        <div className="absolute top-4 left-4 flex items-center gap-2">
          <BrandLogo size={24} />
          <span className="text-xl font-bold text-foreground">Komunikasi</span>
        </div>
      </Link>

      <div className="w-full max-w-md">
        <Suspense fallback={<div className="flex items-center justify-center py-12"><CircleNotch weight="duotone" className="h-8 w-8 animate-spin text-primary" /></div>}>
          <SignInForm />
        </Suspense>
      </div>
    </div>
  );
}
