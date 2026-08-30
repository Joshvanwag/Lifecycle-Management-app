import { StatusBadge } from "@/components/design-system/status-badge";
import { workflowLabel } from "@/lib/import/fields";
import type { FileImportWorkflow } from "@/lib/data/import-jobs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export interface ImportHistoryJob {
  id: string;
  workflow: string;
  source_filename: string | null;
  status: string;
  spaces_created: number;
  spaces_updated?: number;
  assets_created: number;
  assets_updated: number;
  assets_retired: number;
  error_message: string | null;
  created_at: string;
  userLabel?: string;
}

export function ImportHistory({ jobs }: { jobs: ImportHistoryJob[] }) {
  return (
    <div className="rounded-xl border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Workflow Type</TableHead>
            <TableHead>User</TableHead>
            <TableHead className="text-right">Spaces Affected</TableHead>
            <TableHead className="text-right">Assets Added</TableHead>
            <TableHead className="text-right">Assets Retired</TableHead>
            <TableHead>File Name</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {jobs.map((job) => (
            <TableRow key={job.id}>
              <TableCell className="whitespace-nowrap text-sm">
                {new Date(job.created_at).toLocaleString()}
              </TableCell>
              <TableCell className="text-sm">
                {workflowLabel(job.workflow as FileImportWorkflow)}
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">{job.userLabel ?? "—"}</TableCell>
              <TableCell className="text-right text-sm">
                {(job.spaces_created ?? 0) + (job.spaces_updated ?? 0)}
              </TableCell>
              <TableCell className="text-right text-sm">{job.assets_created}</TableCell>
              <TableCell className="text-right text-sm">{job.assets_retired}</TableCell>
              <TableCell className="max-w-[14rem] truncate text-sm text-muted-foreground">
                {job.source_filename ?? "—"}
              </TableCell>
              <TableCell>
                <StatusBadge
                  status={job.status === "failed" ? "failed" : "completed"}
                  title={job.error_message ?? undefined}
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
