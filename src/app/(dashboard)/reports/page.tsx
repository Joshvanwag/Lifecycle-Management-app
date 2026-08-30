import { redirect } from "next/navigation";

/** Reports is no longer a primary product page. Analytical views live on Overview, Forecast, and Benchmark. */
export default function ReportsRedirect() {
  redirect("/");
}
