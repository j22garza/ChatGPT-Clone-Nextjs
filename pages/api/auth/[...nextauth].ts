import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";

export const authOption = {
  providers: [
    GoogleProvider({
      clientId: process.env.WEB_CLIENT_ID || process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.WEB_CLIENT_SECRET || process.env.WEB_CLIENT_KEY || process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code"
        }
      }
    }),
  ],

  callbacks: {
    async jwt({ token, user, account }) {
      if (user) {
        token.uid = user.id;
      }
      return token;
    },
    async session({ session, token }: any) {
      if (session?.user) {
        session.user.username = session?.user?.name
          ?.split(" ")
          .join("")
          .toLocaleLowerCase();

        session.user.uid = token.sub || token.uid;
      }
      return session;
    },
  },

  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === "development",
};

export default NextAuth(authOption);