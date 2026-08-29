import { createInvitation } from "@/lib/admin/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface TeamInvitationFormProps {
  organizationId: string;
}

export function TeamInvitationForm({ organizationId }: TeamInvitationFormProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Invite team member</CardTitle>
        <CardDescription>
          Send an invitation email address. The user must sign up or sign in with that exact email
          to join your organization.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={createInvitation} className="space-y-4">
          <input type="hidden" name="organizationId" value={organizationId} />
          <div className="space-y-2">
            <Label htmlFor="inviteEmail">Email</Label>
            <Input id="inviteEmail" name="email" type="email" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="inviteRole">Role</Label>
            <select
              id="inviteRole"
              name="role"
              defaultValue="member"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="admin">Admin</option>
              <option value="member">Member</option>
              <option value="read_only">Read only</option>
            </select>
          </div>
          <Button type="submit">Send invitation</Button>
        </form>
      </CardContent>
    </Card>
  );
}
