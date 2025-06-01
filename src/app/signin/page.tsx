import { SignInForm } from "@/app/signin/sign-in-form";

export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-md">
        <SignInForm />
      </div>
    </div>
  );
}
