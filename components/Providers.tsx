"use client";

import { SessionProvider } from "next-auth/react";
import GlobalToast from "./GlobalToast";
import FeedbackModal from "./FeedbackModal";
import { Session } from "next-auth";

export function Providers({ children, session }: { children: React.ReactNode; session?: Session | null }) {
  return (
    <SessionProvider session={session} refetchOnWindowFocus={false}>
      {children}
      <GlobalToast />
      <FeedbackModal />
    </SessionProvider>
  );
}

