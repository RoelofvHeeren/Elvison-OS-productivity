
"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

export default function SignupPage() {
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [name, setName] = useState("")
    const [error, setError] = useState("")
    const router = useRouter()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError("")

        try {
            const res = await fetch("/api/auth/register", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ email, password, name }),
            })

            if (res.ok) {
                router.push("/login")
            } else {
                const data = await res.json()
                setError(data.error || "Registration failed")
            }
        } catch (err) {
            setError("An unexpected error occurred")
        }
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-950 p-4">
            <div className="w-full max-w-md space-y-8 rounded-lg bg-gray-900 p-8 shadow-lg">
                <div>
                    <h2 className="text-center text-3xl font-extrabold text-white">
                        Create your account
                    </h2>
                </div>
                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    {error && (
                        <div className="rounded-md bg-red-500/10 p-4 text-sm text-red-500">
                            {error}
                        </div>
                    )}
                    <div className="-space-y-px rounded-md shadow-sm">
                        <div>
                            <label htmlFor="name" className="sr-only">
                                Name
                            </label>
                            <input
                                id="name"
                                name="name"
                                type="text"
                                required
                                className="relative block w-full rounded-t-md border-0 bg-gray-800 py-3 text-white placeholder-gray-400 focus:z-10 focus:ring-2 focus:ring-teal-500 sm:text-sm"
                                placeholder="Full Name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                            />
                        </div>
                        <div>
                            <label htmlFor="email-address" className="sr-only">
                                Email address
                            </label>
                            <input
                                id="email-address"
                                name="email"
                                type="email"
                                autoComplete="email"
                                required
                                className="relative block w-full border-0 bg-gray-800 py-3 text-white placeholder-gray-400 focus:z-10 focus:ring-2 focus:ring-teal-500 sm:text-sm"
                                placeholder="Email address"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>
                        <div>
                            <label htmlFor="password" className="sr-only">
                                Password
                            </label>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                autoComplete="new-password"
                                required
                                className="relative block w-full rounded-b-md border-0 bg-gray-800 py-3 text-white placeholder-gray-400 focus:z-10 focus:ring-2 focus:ring-teal-500 sm:text-sm"
                                placeholder="Password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>
                    </div>

                    <div>
                        <button
                            type="submit"
                            className="group relative flex w-full justify-center rounded-md border border-transparent bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2"
                        >
                            Sign up
                        </button>
                    </div>
                    <div className="text-center text-sm">
                        <a href="/login" className="font-medium text-teal-400 hover:text-teal-300">
                            Already have an account? Sign in
                        </a>
                    </div>
                </form>
            </div>
        </div>
    )
}
