import { internalFeatures } from "@/lib/internal-features";
import { redirect } from "next/navigation";

export default function AdminLoansAliasPage() {
  if (!internalFeatures.loans) redirect("/dashboard");
  redirect("/admin/peminjaman");
}
