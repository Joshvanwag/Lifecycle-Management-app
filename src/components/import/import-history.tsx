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

interface ImportHistoryProps {
  jobs: Array<{
    id: string;
    workflow: string;
    source_filename: string | null;
    status: string;
    spaces_created: number;
    assets_created: number;
    assets_updated: number;
    assets_retired: number;
    error_message: string | null;
    created_at: string;
  }>;
}

export function ImportHistory({ jobs }: ImportHistoryProps) {
  return (
    <div className="space-y-3">
      <h2 className="text-sm font-medium">Import history</h2>
      {jobs.length === 0 ? (
        <p className="text-sm text-muted-foreground">No file imports have been recorded yet.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>When</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>File</TableHead>
              <TableHead>Result</TableHead>
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
                <TableCell className="text-sm text-muted-foreground">
                  {job.source_filename ?? "—"}
                </TableCell>
                <TableCell className="text-sm">
                  {job.status === "failed" ? (
                    <span className="text-destructive">{job.error_message ?? "Failed"}</span>
                  ) : (
                    `${job.spaces_created} Spaces, ${job.assets_created} assets added, ${job.assets_retired} retired`
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
