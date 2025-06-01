import { SignUpForm } from "./sign-up-form";

export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/20 via-background to-background px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md">
        <SignUpForm />
      </div>
    </div>
  );
}
