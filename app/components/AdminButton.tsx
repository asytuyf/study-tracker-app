"use client";

import { useState } from "react";
import { signIn, signOut, useSession } from "next-auth/react";

interface AdminButtonProps {
    onAddCourse: () => void;
}

export default function AdminButton({ onAddCourse }: AdminButtonProps) {
    const { data: session, status } = useSession();
    const [showDropdown, setShowDropdown] = useState(false);
    const [signingIn, setSigningIn] = useState(false);

    const isAuthenticated = status === "authenticated" && session;
    const isLoading = status === "loading";

    const handleGoogleSignIn = async () => {
        setSigningIn(true);
        await signIn("google", { redirect: false });
        setSigningIn(false);
    };

    const handleLogout = async () => {
        await signOut({ redirect: false });
        setShowDropdown(false);
    };

    if (isLoading) {
        return (
            <div className="w-full p-4 rounded-2xl glass border border-dashed border-zinc-700/50">
                <div className="flex items-center justify-center gap-3">
                    <div className="w-5 h-5 border-2 border-zinc-600 border-t-zinc-300 rounded-full animate-spin" />
                </div>
            </div>
        );
    }

    if (isAuthenticated) {
        return (
            <div className="relative">
                <button
                    onClick={() => setShowDropdown(!showDropdown)}
                    className="w-full p-4 rounded-2xl glass border border-dashed border-zinc-700/50 hover:border-emerald-500/50 hover:bg-emerald-500/5 transition-all duration-300 group"
                >
                    <div className="flex items-center justify-center gap-3">
                        {session.user?.image ? (
                            <img
                                src={session.user.image}
                                alt=""
                                className="w-8 h-8 rounded-full"
                            />
                        ) : (
                            <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center">
                                <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                                </svg>
                            </div>
                        )}
                        <span className="text-sm font-medium text-zinc-400 group-hover:text-white transition-colors">
                            Add New Course
                        </span>
                        <svg className="w-4 h-4 text-zinc-500 ml-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                    </div>
                </button>

                {showDropdown && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden shadow-xl z-50">
                        <button
                            onClick={() => {
                                onAddCourse();
                                setShowDropdown(false);
                            }}
                            className="w-full px-4 py-3 text-left text-sm text-zinc-300 hover:bg-zinc-800 transition-colors flex items-center gap-3"
                        >
                            <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            Add Course
                        </button>
                        <div className="px-4 py-2 border-t border-zinc-800">
                            <p className="text-xs text-zinc-500 truncate">{session.user?.email}</p>
                        </div>
                        <button
                            onClick={handleLogout}
                            className="w-full px-4 py-3 text-left text-sm text-zinc-400 hover:bg-zinc-800 hover:text-red-400 transition-colors flex items-center gap-3 border-t border-zinc-800"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                            Sign Out
                        </button>
                    </div>
                )}
            </div>
        );
    }

    return (
        <button
            onClick={handleGoogleSignIn}
            disabled={signingIn}
            className="w-full p-4 rounded-2xl glass border border-dashed border-zinc-700/50 hover:border-blue-500/50 hover:bg-blue-500/5 transition-all duration-300 group disabled:opacity-50"
        >
            <div className="flex items-center justify-center gap-3">
                {signingIn ? (
                    <div className="w-5 h-5 border-2 border-zinc-600 border-t-zinc-300 rounded-full animate-spin" />
                ) : (
                    <>
                        <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center group-hover:bg-white/10 transition-colors">
                            <svg className="w-4 h-4" viewBox="0 0 24 24">
                                <path
                                    fill="#4285F4"
                                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                />
                                <path
                                    fill="#34A853"
                                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                />
                                <path
                                    fill="#FBBC05"
                                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                />
                                <path
                                    fill="#EA4335"
                                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                />
                            </svg>
                        </div>
                        <span className="text-sm font-medium text-zinc-400 group-hover:text-white transition-colors">
                            Sign in with Google
                        </span>
                    </>
                )}
            </div>
        </button>
    );
}
