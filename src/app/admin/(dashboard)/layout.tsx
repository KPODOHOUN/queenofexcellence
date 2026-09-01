import { auth, signOut } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AdminSidebar } from "@/components/admin/AdminSidebar";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) {
    redirect("/admin/login");
  }

  return (
    <div className="min-h-screen flex bg-champagne/30">
      <AdminSidebar
        userEmail={session.user.email ?? ""}
        signOutAction={async () => {
          "use server";
          await signOut({ redirectTo: "/admin/login" });
        }}
      />
      <main className="flex-1 lg:ml-64">
        <div className="p-6 lg:p-10 pt-20 lg:pt-10 animate-fade-in">{children}</div>
      </main>
    </div>
  );
}
