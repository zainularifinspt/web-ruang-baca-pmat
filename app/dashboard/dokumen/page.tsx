import { redirect } from "next/navigation";
import { requireStaffRole } from "@/lib/auth-guards";
import { DocumentManager } from "./document-manager";
export default async function DocumentsPage() {
  const auth = await requireStaffRole(["admin"]);
  if (!auth.ok) redirect("/dashboard");
  return <DocumentManager />;
}
