import SignOutButton from "@/components/SignOutButton";
import { getUser } from "@/lib/lucia";
import Image from "next/image";
import { redirect } from "next/navigation";
import React from "react";

const DashboardPage = async () => {
  const user = await getUser();

  if (!user) {
    redirect("/auth");
  }

  return (
    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
      <div className="flex flex-col justify-center items-center gap-5">
        {user.picture && (
          <Image
            src={user.picture}
            alt="Profile Picture"
            width={100}
            height={100}
            className="rounded-full"
          />
        )}
        <p className="mx-auto">
          You are logged in as{" "}
          <span className="font-semibold">{user.email}</span>
        </p>
        <SignOutButton>Sign Out</SignOutButton>
      </div>
    </div>
  );
};

export default DashboardPage;
