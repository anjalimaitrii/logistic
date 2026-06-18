import { ClientNotificationProvider } from "@/context/ClientNotificationContext";

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  return <ClientNotificationProvider>{children}</ClientNotificationProvider>;
}
