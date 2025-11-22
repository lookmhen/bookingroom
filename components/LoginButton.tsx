"use client";

import { signIn, signOut, useSession } from "next-auth/react";

export default function LoginButton() {
    const { data: session } = useSession();

    if (session) {
        return (
            <div className="flex items-center gap-4">
                <p className="text-sm text-zinc-500">Signed in as {session.user?.email}</p>
                <button
                    onClick={() => signOut()}
                    className="rounded-md bg-red-500 px-4 py-2 text-sm font-medium text-white hover:bg-red-600"
                >
                    Sign out
                </button>
            </div>
        );
    }

    return (
        <button
            onClick={() => signIn("azure-ad")}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
            Sign in with Microsoft 365
        </button>
    );
}
