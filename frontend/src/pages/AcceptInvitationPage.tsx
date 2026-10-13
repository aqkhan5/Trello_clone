import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import {
  UserPlus,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowRight,
  LogIn,
  XCircle,
} from 'lucide-react';
import invitationService from '../services/invitationService';
import { authService } from '../services/auth';
import quashaLogo from '../assets/quasha.png';

export const AcceptInvitationPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() =>
    authService.isAuthenticated()
  );
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    setIsAuthenticated(authService.isAuthenticated());
  }, []);

  const handleAccept = async () => {
    if (!token) return;
    setIsProcessing(true);
    setErrorMessage(null);

    try {
      await invitationService.acceptInvitation(token);
      setSuccessMessage('Invitation accepted! You are now a member of this workspace.');
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
    } catch (err: any) {
      console.error('Failed to accept invitation:', err);
      const detail =
        err?.response?.data?.detail ||
        err?.message ||
        'Failed to accept invitation. The invitation may have expired or was issued to another email.';
      setErrorMessage(typeof detail === 'string' ? detail : JSON.stringify(detail));
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDecline = async () => {
    if (!token) return;
    setIsProcessing(true);
    setErrorMessage(null);

    try {
      await invitationService.declineInvitation(token);
      setSuccessMessage('Invitation declined.');
      setTimeout(() => {
        navigate('/dashboard');
      }, 1500);
    } catch (err: any) {
      console.error('Failed to decline invitation:', err);
      navigate('/dashboard');
    } finally {
      setIsProcessing(false);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950 p-4 text-white font-sans">
        <div className="w-full max-w-md p-8 rounded-2xl bg-zinc-900 border border-white/10 text-center shadow-2xl">
          <div className="w-12 h-12 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 mx-auto flex items-center justify-center mb-4">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h1 className="text-xl font-bold mb-2">Invalid Invitation Link</h1>
          <p className="text-xs text-white/60 mb-6">
            No invitation token was found in the link. Please ask the workspace admin to resend your invitation.
          </p>
          <Link
            to="/dashboard"
            className="inline-flex items-center justify-center px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-green-500 text-zinc-950 text-xs font-bold transition"
          >
            Go to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col justify-between bg-zinc-950 p-4 sm:p-6 text-white font-sans select-none">
      {/* Top Navbar Header */}
      <header className="flex items-center justify-between max-w-6xl w-full mx-auto py-2">
        <Link to="/dashboard" className="flex items-center gap-2">
          <img src={quashaLogo} alt="Quasha" className="h-8 w-auto object-contain" />
        </Link>
      </header>

      {/* Main Invitation Box */}
      <main className="flex-1 flex items-center justify-center py-10">
        <div className="w-full max-w-lg p-8 rounded-2xl bg-zinc-900/90 border border-white/10 shadow-2xl backdrop-blur-xl animate-in fade-in zoom-in-95">
          <div className="w-14 h-14 rounded-2xl bg-emerald-500/15 border border-emerald-500/25 text-emerald-400 mx-auto flex items-center justify-center mb-5 shadow-lg shadow-emerald-500/10">
            <UserPlus className="w-7 h-7" />
          </div>

          <h1 className="text-xl font-bold text-center text-white mb-2">
            Workspace Invitation
          </h1>
          <p className="text-xs text-center text-white/60 mb-6 max-w-sm mx-auto">
            You've been invited to join and collaborate on a workspace in Quasha.
          </p>

          {/* Error Message */}
          {errorMessage && (
            <div className="mb-5 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Success Message */}
          {successMessage && (
            <div className="mb-5 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>{successMessage}</span>
            </div>
          )}

          {!isAuthenticated ? (
            /* User not logged in: prompt login/register */
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-center">
                <p className="text-xs text-white/80 font-medium mb-1">
                  Authentication Required
                </p>
                <p className="text-[11px] text-white/50">
                  Please log in to your account with the invited email address to accept this invitation.
                </p>
              </div>

              <div className="flex flex-col gap-2.5">
                <Link
                  to={`/login?redirect=${encodeURIComponent(`/invitations/accept?token=${token}`)}`}
                  className="flex items-center justify-center gap-2 w-full h-11 rounded-xl bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-400 hover:to-green-400 active:scale-95 text-xs font-bold text-zinc-950 shadow-lg shadow-emerald-500/20 transition"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Log In to Accept</span>
                </Link>
                <Link
                  to={`/register?redirect=${encodeURIComponent(`/invitations/accept?token=${token}`)}`}
                  className="flex items-center justify-center gap-2 w-full h-11 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-semibold text-white transition active:scale-95"
                >
                  <span>Create an Account</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          ) : (
            /* User is logged in: Accept or Decline */
            <div className="space-y-3">
              <button
                type="button"
                onClick={handleAccept}
                disabled={isProcessing || Boolean(successMessage)}
                className="flex items-center justify-center gap-2 w-full h-11 rounded-xl bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-400 hover:to-green-400 disabled:opacity-50 text-xs font-bold text-zinc-950 shadow-lg shadow-emerald-500/20 transition cursor-pointer active:scale-95"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Joining workspace...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Accept Invitation & Join</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleDecline}
                disabled={isProcessing || Boolean(successMessage)}
                className="flex items-center justify-center gap-2 w-full h-10 rounded-xl bg-transparent hover:bg-white/5 disabled:opacity-50 text-xs font-semibold text-white/60 hover:text-white transition cursor-pointer"
              >
                <XCircle className="w-4 h-4" />
                <span>Decline Invitation</span>
              </button>
            </div>
          )}
        </div>
      </main>

      <footer className="py-4 text-center text-xs text-white/40">
        Quasha Workspace Collaboration
      </footer>
    </div>
  );
};

export default AcceptInvitationPage;
