import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-6">
      <h1 className="text-2xl font-bold">Space not found</h1>
      <p className="text-muted-foreground">The requested Space does not exist in the demo data.</p>
      <Button asChild>
        <Link href="/spaces">View all Spaces</Link>
      </Button>
    </div>
  );
}
