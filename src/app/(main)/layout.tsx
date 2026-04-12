import { MainLayout } from "@/components/layouts/main-layout";

export default function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <MainLayout>{children}</MainLayout>;
}
