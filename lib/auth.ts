import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

export const authOptions: NextAuthOptions = {
    providers: [
        CredentialsProvider({
            name: "Admin Login",
            credentials: {
                username: { label: "Username", type: "text" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials) {
                const adminUsername = process.env.ADMIN_USERNAME;
                const adminPassword = process.env.ADMIN_PASSWORD;

                if (
                    credentials?.username === adminUsername &&
                    credentials?.password === adminPassword
                ) {
                    return {
                        id: "1",
                        name: "Admin",
                        email: "admin@studytracker.app",
                    };
                }
                return null;
            },
        }),
    ],
    pages: {
        signIn: "/", // Use custom login modal instead of NextAuth page
    },
    session: {
        strategy: "jwt",
        maxAge: 7 * 24 * 60 * 60, // 7 days
    },
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.isAdmin = true;
            }
            return token;
        },
        async session({ session, token }) {
            if (session.user) {
                (session.user as { isAdmin?: boolean }).isAdmin = token.isAdmin as boolean;
            }
            return session;
        },
    },
    secret: process.env.NEXTAUTH_SECRET,
};
