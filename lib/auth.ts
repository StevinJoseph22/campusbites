import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email", placeholder: "student@college.edu" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        // Demo fallback user authentication for prototype mode
        if (credentials.email === "student@campus.edu" && credentials.password === "password123") {
          return {
            id: "demo-student-id",
            name: "Alex Student",
            email: "student@campus.edu",
            role: "STUDENT",
          };
        }

        if (credentials.email === "vendor@campus.edu" && credentials.password === "password123") {
          return {
            id: "demo-vendor-id",
            name: "Campus Grill Owner",
            email: "vendor@campus.edu",
            role: "VENDOR_OWNER",
          };
        }

        return null;
      }
    })
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role;
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).role = token.role;
        (session.user as any).id = token.id;
      }
      return session;
    }
  },
  pages: {
    signIn: "/login",
  },
  secret: process.env.NEXTAUTH_SECRET || "default_super_secret_key_for_campusbites",
};
