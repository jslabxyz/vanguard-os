import DashboardPageLayout from "@/components/dashboard/layout";
import AtomIcon from "@/components/icons/atom";
import { AIChat } from "@/components/laboratory/ai-chat";

export default function LaboratoryPage() {
  return (
    <DashboardPageLayout
      header={{
        title: "Laboratory",
        description: "AI-powered command center",
        icon: AtomIcon,
      }}
    >
      <AIChat />
    </DashboardPageLayout>
  );
}
