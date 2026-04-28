import SignupContent from "@/src/app/auth/signup/signupContent";
import {Suspense} from "react";

export default function SignupPage() {
  return (
      <Suspense fallback={<div />}>
        <SignupContent />
      </Suspense>
  );
}