import { googleOAuthClient } from "@/lib/googleOauth";
import { lucia } from "@/lib/lucia";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

// http://localhost:3000/api/auth/google/callback
export async function GET(req: NextRequest) {
  const url = req.nextUrl;
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");

  if (!code || !state) {
    console.error("Missing code or state parameter");
    console.log(code, state);

    return new Response("Invalid Request", {
      status: 400,
    });
  }

  try {
    const codeVerifier = (await cookies()).get("codeVerifier")?.value;
    const savedState = (await cookies()).get("state")?.value;

    if (!codeVerifier || !savedState) {
      console.error("No state parameter or code verifier");
      console.log(savedState, codeVerifier);

      return new Response("Invalid Request", {
        status: 400,
      });
    }

    if (state !== savedState) {
      console.error("States do not match");
      console.log(state, savedState);

      return new Response("Invalid Request", {
        status: 400,
      });
    }

    const { data } = await googleOAuthClient.validateAuthorizationCode(
      code,
      codeVerifier
    );

    const { access_token } = data as { access_token: string };

    const googleResponse = await fetch(
      "https://www.googleapis.com/oauth2/v3/userinfo",
      {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }
    );

    const googleData = (await googleResponse.json()) as {
      id: string;
      email: string;
      name: string;
      picture: string;
    };

    let userId: string = "";
    // If the email exists in our record, we can create a cookie from them and sign them in
    // If the email doesn't exist in our record, we can create a new user, then create a cookie and sign them in

    const existingUser = await prisma.user.findUnique({
      where: {
        email: googleData.email,
      },
    });

    if (existingUser) {
      userId = existingUser.id;
    } else {
      const user = await prisma.user.create({
        data: {
          name: googleData.name,
          email: googleData.email,
          picture: googleData.picture,
        },
      });

      userId = user.id;
    }

    const session = await lucia.createSession(userId, {});

    const sessionCookie = await lucia.createSessionCookie(session.id);

    (await cookies()).set(
      sessionCookie.name,
      sessionCookie.value,
      sessionCookie.attributes
    );

    return NextResponse.redirect(new URL("/dashboard", req.url), 307);
  } catch (error) {
    console.error(error);
    return new Response("Internal Server Error", {
      status: 500,
    });
  }
}
