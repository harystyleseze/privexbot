/**
 * Invitation Accept Page
 *
 * WHY: Allow users to accept or reject organization/workspace invitations
 * HOW: Public page that fetches invitation details by token, shows accept/reject options
 *
 * SUPPORTS:
 * - Viewing invitation details (org/workspace name, role, inviter)
 * - Accepting invitations (requires authentication)
 * - Rejecting invitations (public)
 * - Handling expired/invalid invitations
 * - Redirecting unauthenticated users to login
 */

import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { invitationApi } from "@/api/invitation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Loader2, Mail, AlertCircle, CheckCircle, XCircle, Building, Users } from "lucide-react";
import type { InvitationDetails } from "@/types/tenant";

export function InvitationAcceptPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, isAuthenticated } = useAuth();

  const [token, setToken] = useState<string | null>(null);
  const [invitation, setInvitation] = useState<InvitationDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processResult, setProcessResult] = useState<"accepted" | "rejected" | null>(null);

  useEffect(() => {
    const tokenParam = searchParams.get("token");
    if (!tokenParam) {
      setError("No invitation token provided");
      setIsLoading(false);
      return;
    }

    setToken(tokenParam);
    loadInvitationDetails(tokenParam);
  }, [searchParams]);

  const loadInvitationDetails = async (invitationToken: string) => {
    try {
      setIsLoading(true);
      setError(null);
      const details = await invitationApi.getInvitationDetails(invitationToken);
      setInvitation(details);
    } catch (err: any) {
      console.error("[InvitationAcceptPage] Error loading invitation:", err);
      const errorMessage = err.response?.data?.detail || "Failed to load invitation details";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAccept = async () => {
    if (!token) return;

    // Require authentication to accept
    if (!isAuthenticated || !user) {
      // Store token in sessionStorage and redirect to login
      sessionStorage.setItem("pendingInvitationToken", token);
      navigate("/login?redirect=/invitations/accept");
      return;
    }

    try {
      setIsProcessing(true);
      setError(null);
      await invitationApi.acceptInvitation(token);
      setProcessResult("accepted");

      // Redirect to dashboard after 2 seconds
      setTimeout(() => {
        navigate("/dashboard");
      }, 2000);
    } catch (err: any) {
      console.error("[InvitationAcceptPage] Error accepting invitation:", err);
      const errorMessage = err.response?.data?.detail || "Failed to accept invitation";
      setError(errorMessage);
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!token) return;

    try {
      setIsProcessing(true);
      setError(null);
      await invitationApi.rejectInvitation(token);
      setProcessResult("rejected");

      // Redirect to home after 2 seconds
      setTimeout(() => {
        navigate("/");
      }, 2000);
    } catch (err: any) {
      console.error("[InvitationAcceptPage] Error rejecting invitation:", err);
      const errorMessage = err.response?.data?.detail || "Failed to reject invitation";
      setError(errorMessage);
      setIsProcessing(false);
    }
  };

  // Success/Rejection state
  if (processResult) {
    return (
      <div className="min-h-screen bg-[#1E1F22] flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-[#2B2D31] border-[#26272B]">
          <CardHeader className="text-center">
            {processResult === "accepted" ? (
              <>
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-500/10">
                  <CheckCircle className="h-6 w-6 text-green-500" />
                </div>
                <CardTitle className="text-white">Invitation Accepted!</CardTitle>
                <CardDescription className="text-gray-400">
                  You are now a member. Redirecting to dashboard...
                </CardDescription>
              </>
            ) : (
              <>
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-500/10">
                  <XCircle className="h-6 w-6 text-red-500" />
                </div>
                <CardTitle className="text-white">Invitation Rejected</CardTitle>
                <CardDescription className="text-gray-400">
                  The invitation has been declined. Redirecting...
                </CardDescription>
              </>
            )}
          </CardHeader>
        </Card>
      </div>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#1E1F22] flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-[#2B2D31] border-[#26272B]">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600 mb-4" />
              <p className="text-gray-400">Loading invitation details...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Error state (no invitation or invalid)
  if (error || !invitation) {
    return (
      <div className="min-h-screen bg-[#1E1F22] flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-[#2B2D31] border-[#26272B]">
          <CardHeader>
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-500/10">
              <AlertCircle className="h-6 w-6 text-red-500" />
            </div>
            <CardTitle className="text-center text-white">Invalid Invitation</CardTitle>
            <CardDescription className="text-center text-gray-400">
              {error || "This invitation link is invalid or has expired"}
            </CardDescription>
          </CardHeader>
          <CardFooter className="flex justify-center">
            <Button asChild variant="outline">
              <Link to="/">Go to Home</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // Expired invitation
  if (invitation.is_expired) {
    return (
      <div className="min-h-screen bg-[#1E1F22] flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-[#2B2D31] border-[#26272B]">
          <CardHeader>
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-yellow-500/10">
              <AlertCircle className="h-6 w-6 text-yellow-500" />
            </div>
            <CardTitle className="text-center text-white">Invitation Expired</CardTitle>
            <CardDescription className="text-center text-gray-400">
              This invitation has expired. Please contact the organization administrator for a new invitation.
            </CardDescription>
          </CardHeader>
          <CardFooter className="flex justify-center">
            <Button asChild variant="outline">
              <Link to="/">Go to Home</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // Valid invitation - show details and actions
  return (
    <div className="min-h-screen bg-[#1E1F22] flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-[#2B2D31] border-[#26272B]">
        <CardHeader>
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-500/10">
            <Mail className="h-6 w-6 text-blue-500" />
          </div>
          <CardTitle className="text-center text-white">You've Been Invited!</CardTitle>
          <CardDescription className="text-center text-gray-400">
            {invitation.inviter_name ? (
              <>
                <strong>{invitation.inviter_name}</strong> invited you to join
              </>
            ) : (
              <>You've been invited to join</>
            )}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Invitation Details */}
          <div className="bg-[#1E1F22] rounded-lg p-4 space-y-3">
            {/* Resource Type and Name */}
            <div className="flex items-center gap-3">
              {invitation.resource_type === "organization" ? (
                <Building className="h-5 w-5 text-blue-400 flex-shrink-0" />
              ) : (
                <Users className="h-5 w-5 text-green-400 flex-shrink-0" />
              )}
              <div className="flex-1">
                <p className="text-xs text-gray-400 uppercase tracking-wide">
                  {invitation.resource_type}
                </p>
                <p className="text-white font-semibold">{invitation.resource_name}</p>
              </div>
            </div>

            {/* Role */}
            <div className="flex items-center justify-between pt-2 border-t border-[#26272B]">
              <span className="text-sm text-gray-400">Your Role</span>
              <Badge className="bg-blue-500 text-white capitalize">
                {invitation.invited_role}
              </Badge>
            </div>

            {/* Expiration */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">Expires</span>
              <span className="text-sm text-white">
                {new Date(invitation.expires_at).toLocaleDateString()}
              </span>
            </div>
          </div>

          {/* Authentication Notice */}
          {!isAuthenticated && (
            <Alert className="bg-blue-500/10 border-blue-500/50">
              <AlertCircle className="h-4 w-4 text-blue-400" />
              <AlertDescription className="text-sm text-blue-400">
                You need to be logged in to accept this invitation. You'll be redirected to login.
              </AlertDescription>
            </Alert>
          )}

          {/* Error Message */}
          {error && (
            <Alert className="bg-red-500/10 border-red-500/50">
              <AlertCircle className="h-4 w-4 text-red-400" />
              <AlertDescription className="text-sm text-red-400">
                {error}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>

        <CardFooter className="flex gap-3">
          <Button
            onClick={handleReject}
            variant="outline"
            className="flex-1"
            disabled={isProcessing}
          >
            {isProcessing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              "Decline"
            )}
          </Button>
          <Button
            onClick={handleAccept}
            className="flex-1 bg-blue-600 hover:bg-blue-700"
            disabled={isProcessing}
          >
            {isProcessing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              "Accept Invitation"
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
