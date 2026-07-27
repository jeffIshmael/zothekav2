import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),
    CredentialsProvider({
      name: "Mock Login",
      credentials: {
        email: { label: "Email", type: "email", placeholder: "test@zotheka.com" }
      },
      async authorize(credentials) {
        if (credentials?.email) {
          return { id: "1", name: "Test User", email: credentials.email };
        }
        return null;
      }
    })
  ],
  pages: {
    signIn: "/app/sign-in",
  },
  secret: process.env.NEXTAUTH_SECRET || "zotheka-super-secret",
});

export { handler as GET, handler as POST };
