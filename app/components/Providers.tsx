"use client";

import { SessionProvider, signOut } from "next-auth/react";
import { ReactNode, useEffect } from "react";

function ReloadLogoutHandler() {
    useEffect(() => {
        if (typeof window !== "undefined" && window.performance) {
            const navEntries = window.performance.getEntriesByType("navigation");
            if (navEntries.length > 0 && (navEntries[0] as PerformanceNavigationTiming).type === "reload") {
                signOut({ redirect: false });
            }
        }
    }, []);
    return null;
}

export default function Providers({ children }: { children: ReactNode }) {
    return (
        <SessionProvider>
            <ReloadLogoutHandler />
            {children}
        </SessionProvider>
    );
}
