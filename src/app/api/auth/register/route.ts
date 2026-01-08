
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { z } from "zod"

const registerSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6),
    name: z.string().optional(),
})

export async function POST(req: Request) {
    try {
        const body = await req.json()
        const result = registerSchema.safeParse(body)

        if (!result.success) {
            return NextResponse.json({ error: "Invalid input" }, { status: 400 })
        }

        const { email, password, name } = result.data

        const existingUser = await prisma.user.findUnique({
            where: { email },
        })

        if (existingUser) {
            return NextResponse.json({ error: "User already exists" }, { status: 400 })
        }

        const hashedPassword = await bcrypt.hash(password, 10)

        const user = await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                name,
            },
        })

        // Remove password from response
        const { password: _, ...userWithoutPassword } = user;

        return NextResponse.json(userWithoutPassword, { status: 201 })
    } catch (error) {
        console.error("Registration error:", error)
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}
