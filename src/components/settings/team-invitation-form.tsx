import { createInvitation } from "@/lib/admin/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface TeamInvitationFormProps {
  organizationId: string;
}

export function TeamInvitationForm({ organizationId }: TeamInvitationFormProps) {
  return (
    <form action={createInvitation} className="max-w-md space-y-4">
      <div>
        <h3 className="text-sm font-medium">Invite team member</h3>
        <p className="mt-1 text-xs text-muted-foreground">
          The invited user must sign up or sign in with that exact email to join.
        </p>
      </div>
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
          className="flex h-10 w-full cursor-pointer rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          <option value="admin">Admin</option>
          <option value="member">Member</option>
          <option value="read_only">Read only</option>
        </select>
      </div>
      <Button type="submit">Send invitation</Button>
    </form>
  );
}
