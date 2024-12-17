import { PrismaAdapter } from "@lucia-auth/adapter-prisma";
import { Lucia } from "lucia";
import { cookies } from "next/headers";
import { prisma } from "./prisma";

const adapter = new PrismaAdapter(prisma.session, prisma.user);

export const lucia = new Lucia(adapter, {
  sessionCookie: {
    name: "test-auth-cookie",
    expires: false,
    attributes: {
      secure: process.env.NODE_ENV === "production",
    },
  },
});

export const getUser = async () => {
  const sessionId =
    (await cookies()).get(lucia.sessionCookieName)?.value || null;

  if (!sessionId) {
    return null;
  }

  const { session, user } = await lucia.validateSession(sessionId);

  try {
    if (session && session.fresh) {
      // refreshing their session cookie
      const sessionCookie = await lucia.createSessionCookie(session.id);
      (await cookies()).set(
        sessionCookie.name,
        sessionCookie.value,
        sessionCookie.attributes
      );

      if (!session) {
        const sessionCookie = await lucia.createBlankSessionCookie();
        (await cookies()).set(
          sessionCookie.name,
          sessionCookie.value,
          sessionCookie.attributes
        );
      }
    }
  } catch (error) {
    console.error(error);
  }

  const dbUser = await prisma.user.findUnique({
    where: {
      id: user?.id,
    },
    select: {
      name: true,
      email: true,
      picture: true,
    },
  });

  return dbUser;
};
