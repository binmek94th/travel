import {Suspense} from "react";
import ResetPassword from "@/src/app/auth/reset-password/ResetPassword";

export default function ResetPasswordPage() {
    return (
        <Suspense fallback={<div />}>
            <ResetPassword />
        </Suspense>
    );
}