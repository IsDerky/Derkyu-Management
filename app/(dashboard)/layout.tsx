import { auth } from "@/auth";
import { AppSidebar } from "@/components/app-sidebar";
import { UserNav } from "@/components/user-nav";
import { ThemeToggle } from "@/components/theme-toggle";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  return (
    <SidebarProvider>
      <AppSidebar />
      <main className="w-full">
        <div className="flex items-center justify-between p-4 border-b">
          <SidebarTrigger />
          <div className="flex items-center gap-2">
            <ThemeToggle />
            {session?.user && <UserNav user={session.user} />}
          </div>
        </div>
        {/* Añadido pt-6 para dar espacio superior */}
        <div className="px-6 pt-6 pb-6">{children}</div>
      </main>
    </SidebarProvider>
  );
}