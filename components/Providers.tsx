"use client";

import { SessionProvider } from "next-auth/react";
import GlobalToast from "./GlobalToast";
import FeedbackModal from "./FeedbackModal";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider refetchOnWindowFocus={false}>
      {children}
      <GlobalToast />
      <FeedbackModal />
    </SessionProvider>
  );
}

