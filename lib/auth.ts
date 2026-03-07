import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";

// List of allowed admin emails
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || "").split(",").map(e => e.trim().toLowerCase());

export const authOptions: NextAuthOptions = {
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        }),
    ],
    callbacks: {
        async signIn({ user }) {
            // Only allow sign in if email is in admin list
            const email = user.email?.toLowerCase();
            if (!email || !ADMIN_EMAILS.includes(email)) {
                return false; // Reject sign in
            }
            return true;
        },
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
    pages: {
        signIn: "/", // Redirect to home page
        error: "/",  // Redirect errors to home page
    },
    secret: process.env.NEXTAUTH_SECRET,
};
