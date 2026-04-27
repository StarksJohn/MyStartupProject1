import { SignInForm } from "@/components/auth/sign-in-form";

interface SignInPageProps {
  searchParams: Promise<{
    callbackUrl?: string;
  }>;
}

function normalizeCallbackUrl(callbackUrl: string | undefined) {
  if (!callbackUrl || !callbackUrl.startsWith("/") || callbackUrl.startsWith("//")) {
    return "/onboarding";
  }

  return callbackUrl;
}

export default async function SignInPage({ searchParams }: SignInPageProps) {
  const { callbackUrl } = await searchParams;

  return (
    <SignInForm
      callbackUrl={normalizeCallbackUrl(callbackUrl)}
      showDevLogin={process.env.NODE_ENV !== "production"}
    />
  );
}
