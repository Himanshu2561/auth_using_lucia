"use client";

import { getGoogleOauthConsentUrl } from "@/app/auth/auth.action";
import { Button } from "./ui/button";
import { RiGoogleFill } from "@remixicon/react";
import { toast } from "sonner";

const GoogleOAuthButton = () => {
  return (
    <Button
      onClick={async () => {
        const res = await getGoogleOauthConsentUrl();
        if (res.url) {
          window.location.href = res.url;
        } else {
          toast.error(res.error);
          console.error(res.error);
        }
      }}
    >
      <RiGoogleFill /> Continue with Google
    </Button>
  );
};

export default GoogleOAuthButton;
