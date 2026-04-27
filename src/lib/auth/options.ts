import { PrismaAdapter } from "@next-auth/prisma-adapter";
import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import EmailProvider from "next-auth/providers/email";

import { prisma } from "@/lib/prisma";

const APP_NAME = "Fracture Recovery Companion";
const DEFAULT_EMAIL_FROM = "Fracture Recovery Companion <hello@example.com>";
const DEV_EMAIL_SERVER = "smtp://localhost:1025";

function normalizeEmail(email: string | undefined) {
  return email?.trim().toLowerCase();
}

function createDevUserId(email: string) {
  return `dev-${Buffer.from(email).toString("base64url").slice(0, 24)}`;
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: {
    // CredentialsProvider is development-only and requires JWT sessions in v4.
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
  },
  pages: {
    signIn: "/sign-in",
    error: "/sign-in",
  },
  providers: [
    EmailProvider({
      server: process.env.EMAIL_SERVER ?? DEV_EMAIL_SERVER,
      from: process.env.EMAIL_FROM ?? DEFAULT_EMAIL_FROM,
      async sendVerificationRequest({ identifier, url, provider }) {
        const nodemailer = await import("nodemailer");
        const transport = nodemailer.createTransport(provider.server);
        const result = await transport.sendMail({
          to: identifier,
          from: provider.from,
          subject: `Sign in to ${APP_NAME}`,
          text: [
            `Use this secure link to sign in to ${APP_NAME}:`,
            "",
            url,
            "",
            "This product is educational support and does not replace clinician care.",
            "If you did not request this email, you can safely ignore it.",
          ].join("\n"),
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
              <h1 style="font-size: 22px; color: #111827;">${APP_NAME}</h1>
              <p>Use the secure button below to sign in and continue your recovery companion setup.</p>
              <p style="margin: 28px 0;">
                <a href="${url}" style="background: #111827; color: #ffffff; padding: 12px 18px; border-radius: 8px; text-decoration: none;">
                  Sign in to ${APP_NAME}
                </a>
              </p>
              <p style="color: #4b5563;">If the button does not work, copy and paste this link into your browser:</p>
              <p style="word-break: break-all; color: #2563eb;">${url}</p>
              <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
              <p style="font-size: 13px; color: #6b7280;">
                ${APP_NAME} is educational support, not diagnosis or treatment. If you did not request this email, you can ignore it.
              </p>
            </div>
          `,
        });

        const failed = [...result.rejected, ...result.pending].filter(Boolean);
        if (failed.length > 0) {
          throw new Error(`Magic Link email failed for: ${failed.join(", ")}`);
        }
      },
    }),
    ...(process.env.NODE_ENV !== "production"
      ? [
          CredentialsProvider({
            id: "dev-login",
            name: "Development Login",
            credentials: {
              email: { label: "Email", type: "email" },
            },
            async authorize(credentials) {
              const email = normalizeEmail(credentials?.email);

              if (!email || !email.includes("@")) {
                return null;
              }

              return {
                id: createDevUserId(email),
                email,
                name: "Development User",
                hasPurchase: false,
                activeProgramId: null,
              };
            },
          }),
        ]
      : []),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.hasPurchase = user.hasPurchase ?? false;
        token.activeProgramId = user.activeProgramId ?? null;
      }

      token.hasPurchase = token.hasPurchase ?? false;
      token.activeProgramId = token.activeProgramId ?? null;

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = String(token.id ?? "");
        session.user.email = String(token.email ?? session.user.email ?? "");
        session.user.hasPurchase = token.hasPurchase ?? false;
        session.user.activeProgramId = token.activeProgramId ?? null;
      }

      return session;
    },
  },
};
