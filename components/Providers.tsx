"use client";

import { SessionProvider } from "next-auth/react";
import GlobalToast from "./GlobalToast";
import FeedbackModal from "./FeedbackModal";
import { Session } from "next-auth";
import FluentTheme from './FluentTheme';
import ConfirmationProvider from './ConfirmationProvider';

export function Providers({ children, session }: { children: React.ReactNode; session?: Session | null }) {
  return (
    <SessionProvider session={session} refetchOnWindowFocus={false}>
      <FluentTheme>
      <ConfirmationProvider>
      {children}
      <GlobalToast />
      <FeedbackModal />
      </ConfirmationProvider>
      </FluentTheme>
    </SessionProvider>
  );
}

