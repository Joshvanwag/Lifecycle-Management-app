import Link from "next/link";
import { signUp } from "@/lib/auth/actions";
import { createClient } from "@/lib/supabase/server";
import { getInvitationPreview } from "@/lib/data/invitations";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default async function SignUpPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; invite?: string }>;
}) {
  const params = await searchParams;
  const inviteToken = params.invite?.trim();

  if (!inviteToken) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/30 p-6">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Invitation required</CardTitle>
            <CardDescription>
              Accounts are created by invitation only. Contact your administrator if you need
              access.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link href="/login">Back to sign in</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const supabase = await createClient();
  const invitation = await getInvitationPreview(supabase, inviteToken);

  if (!invitation?.is_valid) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/30 p-6">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Invalid invitation</CardTitle>
            <CardDescription>
              This invitation link is expired, revoked, or already used. Ask your administrator for
              a new invitation.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link href="/login">Back to sign in</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const errorMessage =
    params.error === "missing-fields"
      ? "Complete all fields to create your account."
      : params.error === "email-mismatch"
        ? "Use the email address this invitation was sent to."
        : params.error === "invalid-invite"
          ? "This invitation is no longer valid."
          : params.error
            ? decodeURIComponent(params.error)
            : null;

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-6">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Accept invitation</CardTitle>
          <CardDescription>
            Create your account to join {invitation.organization_name}.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={signUp} className="space-y-4">
            <input type="hidden" name="inviteToken" value={inviteToken} />
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                defaultValue={invitation.email}
                readOnly
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                minLength={8}
                required
              />
            </div>
            {errorMessage && <p className="text-sm text-destructive">{errorMessage}</p>}
            <Button type="submit" className="w-full">
              Create account
            </Button>
          </form>
          <p className="mt-4 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href="/login" className="font-medium text-primary hover:underline">
              Sign in
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
