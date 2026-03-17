import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import type { NextAuthConfig } from "next-auth";

export const authConfig: NextAuthConfig = {
    session: { strategy: "jwt" },
    pages: {
        signIn: "/auth/login",
        error: "/auth/login",
    },
    providers: [
        Credentials({
            name: "credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials) {
                return null; // handled in server auth file
            },
        }),
    ],
};