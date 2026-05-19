import { DashboardRoot } from "@/components/dashboard-shell";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <DashboardRoot>{children}</DashboardRoot>;
}
