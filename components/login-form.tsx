"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"

export default function LoginForm() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const router = useRouter()

  const handleSignIn = (e: React.FormEvent) => {
    e.preventDefault()
    // Here you would normally handle authentication
    // For now, let's just navigate to the dashboard selection page
    router.push("/dashboard")
  }

  const handleFeideSignIn = () => {
    // Here you would normally handle Feide authentication
    // For now, let's just navigate to the dashboard selection page
    router.push("/dashboard")
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#d9d9d9]">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-xl">Logg inn</CardTitle>
          <CardDescription>Skriv inn dine opplysninger for å logge inn</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignIn} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="email" className="block text-sm font-medium">
                E-post
              </label>
              <Input
                id="email"
                type="email"
                placeholder="din@epost.no"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="password" className="block text-sm font-medium">
                Passord
              </label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full">
              Logg inn
            </Button>
          </form>
          <Button variant="outline" className="w-full mt-4" onClick={handleFeideSignIn}>
            Logg inn med Feide
          </Button>
          <div className="mt-4 text-center text-sm">
            <Link href="/forgot-password" className="text-blue-600 hover:underline">
              Glemt passord?
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

