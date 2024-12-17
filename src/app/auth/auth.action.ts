"use server";

import { z } from "zod";
import { signUpSchema } from "./SignUpForm";
import { prisma } from "@/lib/prisma";
import { Argon2id } from "oslo/password";
import { lucia } from "@/lib/lucia";
import { cookies } from "next/headers";
import { signInSchema } from "./SignInForm";
import { redirect } from "next/navigation";
import { generateCodeVerifier, generateState } from "arctic";
import { googleOAuthClient } from "@/lib/googleOauth";

export const signUp = async (values: z.infer<typeof signUpSchema>) => {
  console.log("In server, values: ", values);

  try {
    // if user already exists, throw error
    const existingUser = await prisma.user.findUnique({
      where: {
        email: values.email,
      },
    });

    if (existingUser) {
      return { error: "User already exists", success: false };
    }

    const hashedPassword = await new Argon2id().hash(values.password);

    const user = await prisma.user.create({
      data: {
        name: values.name,
        email: values.email.toLocaleLowerCase(),
        hashedPassword,
      },
    });

    const session = await lucia.createSession(user.id, {});

    const sessionCookie = await lucia.createSessionCookie(session.id);

    (await cookies()).set(
      sessionCookie.name,
      sessionCookie.value,
      sessionCookie.attributes
    );

    return { success: true };
  } catch (error) {
    console.error(error);
    return { error: "Something went wrong", success: false };
  }
};

export const signIn = async (values: z.infer<typeof signInSchema>) => {
  try {
    const user = await prisma.user.findUnique({
      where: {
        email: values.email,
      },
    });

    if (!user || !user.hashedPassword) {
      return { error: "Invalid email or password", success: false };
    }

    const passwordMatch = await new Argon2id().verify(
      user.hashedPassword,
      values.password
    );

    if (!passwordMatch) {
      return { error: "Invalid email or password", success: false };
    }

    const session = await lucia.createSession(user.id, {});

    const sessionCookie = await lucia.createSessionCookie(session.id);

    (await cookies()).set(
      sessionCookie.name,
      sessionCookie.value,
      sessionCookie.attributes
    );

    return { success: true };
  } catch (error) {
    console.error(error);
    return { error: "Something went wrong", success: false };
  }
};

export const logOut = async () => {
  try {
    const sessionCookie = await lucia.createBlankSessionCookie();
    (await cookies()).set(
      sessionCookie.name,
      sessionCookie.value,
      sessionCookie.attributes
    );
    return redirect("/auth");
  } catch (error) {
    console.error(error);
    return { error: "Something went wrong", success: false };
  }
};

export const getGoogleOauthConsentUrl = async () => {
  try {
    const state = generateState();
    const codeVerifier = generateCodeVerifier();

    (await cookies()).set("codeVerifier", codeVerifier, {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
    });

    (await cookies()).set("state", state, {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
    });

    const authUrl = googleOAuthClient.createAuthorizationURL(
      state,
      codeVerifier,
      ["email", "profile"]
    );

    return { success: true, url: authUrl.toString() };
  } catch (error) {
    console.error(error);
    return { error: "Something went wrong", success: false };
  }
};
