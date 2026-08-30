import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface AuditEventListProps {
  events: Array<{
    id: string;
    action: string;
    created_at: string;
    target_type: string | null;
  }>;
}

export function AuditEventList({ events }: AuditEventListProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent admin activity</CardTitle>
        <CardDescription>Imports, invitations, and settings changes</CardDescription>
      </CardHeader>
      <CardContent>
        {events.length === 0 ? (
          <p className="text-sm text-muted-foreground">No administrative events yet.</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {events.map((event) => (
              <li key={event.id} className="flex justify-between gap-4">
                <span className="capitalize">{event.action.replaceAll("_", " ")}</span>
                <span className="text-muted-foreground">
                  {new Date(event.created_at).toLocaleString()}
                </span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
