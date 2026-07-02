import { redirect } from "next/navigation";

/**
 * The generic /assessment route no longer exists.
 * Users now pick a language on the home page which links directly
 * to /assessment/es or /assessment/fr.
 */
export default function AssessmentPage() {
  redirect("/");
}
