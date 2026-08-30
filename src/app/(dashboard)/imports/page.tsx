import { redirect } from "next/navigation";

/** Import history lives on Update Lifecycles → History. */
export default function ImportsRedirect() {
  redirect("/update-lifecycles?tab=history");
}
