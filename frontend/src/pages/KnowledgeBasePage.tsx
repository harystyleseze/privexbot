/**
 * Knowledge Base Page (Protected)
 *
 * WHY: Manage documents and data for RAG-powered AI responses
 * HOW: Coming soon page with proper layout and navigation
 *
 * FEATURES:
 * - Consistent with dashboard design
 * - Proper navigation and layout
 * - Type-safe implementation
 */

import { useNavigate } from "react-router-dom";
import { Database } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { ComingSoon } from "@/components/shared/ComingSoon";

export function KnowledgeBasePage() {
  const navigate = useNavigate();

  const handleBackToDashboard = () => {
    navigate("/dashboard");
  };

  return (
    <DashboardLayout>
      <ComingSoon
        title="Knowledge Base"
        description="Upload and manage documents, websites, and data sources for RAG-powered AI responses. Create intelligent knowledge repositories for your chatbots."
        icon={Database}
        iconColor="text-green-600 dark:text-green-400"
        expectedDate="Soon"
        onBackToDashboard={handleBackToDashboard}
      />
    </DashboardLayout>
  );
}
