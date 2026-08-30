import { redirect } from "next/navigation";

/** Capital Plan is merged into Forecast. */
export default function CapitalPlanRedirect() {
  redirect("/forecast");
}
