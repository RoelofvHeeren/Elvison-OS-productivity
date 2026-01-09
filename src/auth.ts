
import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import Google from "next-auth/providers/google"
import { z } from "zod"
import bcrypt from "bcryptjs"

import { prisma } from "@/lib/db"

async function getUser(email: string) {
    try {
        const user = await prisma.user.findUnique({
            where: { email },
        })
        return user
    } catch (error) {
        console.error("Failed to fetch user:", error)
        throw new Error("Failed to fetch user.")
    }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
    providers: [
        Google({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        }),
        Credentials({
            async authorize(credentials) {
                const parsedCredentials = z
                    .object({ email: z.string().email(), password: z.string().min(6) })
                    .safeParse(credentials)

                if (parsedCredentials.success) {
                    const { email, password } = parsedCredentials.data
                    const user = await getUser(email)
                    if (!user) return null

                    // If user has no password (e.g. OAuth), valid password check fails
                    if (!user.password) return null;

                    const passwordsMatch = await bcrypt.compare(password, user.password)
                    if (passwordsMatch) return user
                }

                console.log("Invalid credentials")
                return null
            },
        }),
    ],
    pages: {
        signIn: '/login',
    },
    callbacks: {
        async signIn({ user, account }) {
            // Handle Google OAuth sign-in
            if (account?.provider === "google" && user.email) {
                try {
                    // Check if user exists
                    let existingUser = await prisma.user.findUnique({
                        where: { email: user.email },
                    });

                    if (!existingUser) {
                        // Create new user for Google OAuth
                        existingUser = await prisma.user.create({
                            data: {
                                email: user.email,
                                name: user.name || "User",
                                // No password for OAuth users
                            },
                        });
                    }

                    // Store the user ID for the jwt callback
                    user.id = existingUser.id;
                } catch (error) {
                    console.error("Error during Google sign-in:", error);
                    return false;
                }
            }
            return true;
        },
        async session({ session, token }) {
            if (token?.sub && session.user) {
                session.user.id = token.sub; // Ensure userId is passed to session & client
            }
            return session;
        },
        async jwt({ token, user, account }) {
            if (user) {
                token.sub = user.id; // Store user ID in token key
            }
            // For Google OAuth, ensure we have the correct user ID
            if (account?.provider === "google" && user?.email) {
                const dbUser = await prisma.user.findUnique({
                    where: { email: user.email },
                });
                if (dbUser) {
                    token.sub = dbUser.id;
                }
            }
            return token;
        }
    }
})

