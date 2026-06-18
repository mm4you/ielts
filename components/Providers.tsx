"use client";

import { SessionProvider } from "next-auth/react";
import GlobalToast from "./GlobalToast";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider refetchOnWindowFocus={false}>
      {children}
      <GlobalToast />
    </SessionProvider>
  );
}

