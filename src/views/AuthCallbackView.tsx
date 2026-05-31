import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export function AuthCallbackView() {
  const [status, setStatus] = useState('Verifying your Google session...');

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Supabase client handles parsing the URL hash/tokens automatically when loaded
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          throw error;
        }

        if (data?.session) {
          setStatus('Authentication successful! Connecting account...');
          if (window.opener) {
            // Signal the parent window
            window.opener.postMessage({ type: 'OAUTH_AUTH_SUCCESS' }, '*');
            // Allow state to propagate before closing
            setTimeout(() => {
              window.close();
            }, 1000);
          } else {
            // Fallback for direct browser redirection
            window.location.href = '/home';
          }
        } else {
          // If session is not immediately available, listen to state change
          const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (session) {
              setStatus('Authentication successful! Connecting...');
              if (window.opener) {
                window.opener.postMessage({ type: 'OAUTH_AUTH_SUCCESS' }, '*');
                setTimeout(() => {
                  authListener.subscription.unsubscribe();
                  window.close();
                }, 1000);
              } else {
                authListener.subscription.unsubscribe();
                window.location.href = '/home';
              }
            }
          });

          // Wait a few seconds, if still no session, show error
          setTimeout(() => {
            authListener.subscription.unsubscribe();
            setStatus('No active session found. Please try logging in again.');
          }, 8000);
        }
      } catch (err: any) {
        setStatus(`Authentication error: ${err.message || err}`);
        console.error('OAuth callback verification error:', err);
      }
    };

    handleAuthCallback();
  }, []);

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6 text-white font-sans" id="auth_callback_root">
      <div className="max-w-md w-full bg-slate-800 rounded-2xl p-8 border border-slate-700 shadow-2xl text-center" id="auth_callback_card">
        <div className="animate-spin inline-flex w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full mb-4" id="auth_callback_spinner"></div>
        <h2 className="font-bold text-xl mb-2 text-white" id="auth_callback_title">Google Login Verification</h2>
        <p className="text-slate-300 text-sm leading-relaxed" id="auth_callback_status">{status}</p>
        <p className="text-[11px] text-slate-500 mt-6" id="auth_callback_info">This window will close automatically once authentication is completed.</p>
      </div>
    </div>
  );
}
