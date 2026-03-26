import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { Sidebar } from "@/components/layout/sidebar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session) {
    redirect("/login");
  }

  const user = session.user as { role?: string };

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "#000" }}>
      <Sidebar role={user.role} />
      <main className="flex-1 overflow-auto" style={{ background: "#000" }}>{children}</main>
    </div>
  );
}
