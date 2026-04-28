import {Suspense} from "react";
import LoginContent from "@/src/app/auth/login/LoginContent";


export default function LoginPage() {
  return (
      <Suspense fallback={<div />}>
        <LoginContent />
      </Suspense>
  );
}