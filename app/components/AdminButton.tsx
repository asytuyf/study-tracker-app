"use client";

import { useState } from "react";
import { signIn, signOut, useSession } from "next-auth/react";

interface AdminButtonProps {
    onAddCourse: () => void;
}

export default function AdminButton({ onAddCourse }: AdminButtonProps) {
    const { data: session, status } = useSession();
    const [showLoginModal, setShowLoginModal] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const isAuthenticated = status === "authenticated" && session;

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        const result = await signIn("credentials", {
            username,
            password,
            redirect: false,
        });

        setLoading(false);

        if (result?.error) {
            setError("Invalid credentials");
        } else {
            setShowLoginModal(false);
            setUsername("");
            setPassword("");
        }
    };

    const handleLogout = async () => {
        await signOut({ redirect: false });
        setShowDropdown(false);
    };

    if (isAuthenticated) {
        return (
            <div className="relative">
                <button
                    onClick={() => setShowDropdown(!showDropdown)}
                    className="w-full p-4 rounded-2xl glass border border-dashed border-zinc-700/50 hover:border-emerald-500/50 hover:bg-emerald-500/5 transition-all duration-300 group"
                >
                    <div className="flex items-center justify-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center">
                            <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                            </svg>
                        </div>
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
                        <button
                            onClick={handleLogout}
                            className="w-full px-4 py-3 text-left text-sm text-zinc-400 hover:bg-zinc-800 hover:text-red-400 transition-colors flex items-center gap-3 border-t border-zinc-800"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                            Logout
                        </button>
                    </div>
                )}
            </div>
        );
    }

    return (
        <>
            <button
                onClick={() => setShowLoginModal(true)}
                className="w-full p-4 rounded-2xl glass border border-dashed border-zinc-700/50 hover:border-blue-500/50 hover:bg-blue-500/5 transition-all duration-300 group"
            >
                <div className="flex items-center justify-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center group-hover:bg-blue-500/20 transition-colors">
                        <svg className="w-4 h-4 text-zinc-400 group-hover:text-blue-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                    </div>
                    <span className="text-sm font-medium text-zinc-400 group-hover:text-white transition-colors">
                        Admin Login
                    </span>
                </div>
            </button>

            {/* Login Modal */}
            {showLoginModal && (
                <div
                    className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                    onClick={() => setShowLoginModal(false)}
                >
                    <div
                        className="bg-zinc-900 rounded-3xl p-6 w-full max-w-sm border border-zinc-800 animate-fade-in"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold text-white">Admin Login</h2>
                            <button
                                onClick={() => setShowLoginModal(false)}
                                className="text-zinc-500 hover:text-white transition-colors"
                            >
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <form onSubmit={handleLogin} className="space-y-4">
                            <div>
                                <label className="block text-sm text-zinc-400 mb-2">Username</label>
                                <input
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500 transition-colors"
                                    required
                                    autoComplete="username"
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-zinc-400 mb-2">Password</label>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500 transition-colors"
                                    required
                                    autoComplete="current-password"
                                />
                            </div>

                            {error && (
                                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20">
                                    <p className="text-red-400 text-sm">{error}</p>
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                        </svg>
                                        Logging in...
                                    </span>
                                ) : (
                                    "Login"
                                )}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}
