/**
 * Profile Page (Protected)
 *
 * WHY: Manage user profile settings, preferences, and account information
 * HOW: Coming soon page with proper layout and navigation
 *
 * FEATURES:
 * - Consistent with dashboard design
 * - Proper navigation and layout
 * - Type-safe implementation
 * - Only visible in Personal org + default workspace
 */

import { useNavigate } from "react-router-dom";
import { User } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { ComingSoon } from "@/components/shared/ComingSoon";

export function ProfilePage() {
  const navigate = useNavigate();

  const handleBackToDashboard = () => {
    navigate("/dashboard");
  };

  return (
    <DashboardLayout>
      <ComingSoon
        title="Profile Settings"
        description="Manage your personal account settings, preferences, authentication methods, and profile information. Customize your Privexbot experience."
        icon={User}
        iconColor="text-blue-600 dark:text-blue-400"
        expectedDate="Soon"
        onBackToDashboard={handleBackToDashboard}
      />
    </DashboardLayout>
  );
}