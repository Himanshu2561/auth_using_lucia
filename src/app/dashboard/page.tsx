import SignOutButton from "@/components/SignOutButton";
import { getUser } from "@/lib/lucia";
import { redirect } from "next/navigation";
import React from "react";

const DashboardPage = async () => {
  const user = await getUser();

  if (!user) {
    redirect("/auth");
  }

  return (
    <div>
      <p>You are logged in as {user.email}</p>
      <SignOutButton>Sign Out</SignOutButton>
    </div>
  );
};

export default DashboardPage;
