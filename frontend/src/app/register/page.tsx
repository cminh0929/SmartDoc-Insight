"use client"

import * as React from "react"
import Link from "next/link"
import { FileText, Loader2, Lock, Mail, User, ShieldCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/context/auth-context"

export default function RegisterPage() {
  const [email, setEmail] = React.useState("")
  const [password, setPassword] = React.useState("")
  const [fullName, setFullName] = React.useState("")
  const [role, setRole] = React.useState("intern")
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [canRegisterAdmin, setCanRegisterAdmin] = React.useState(true)
  const [availableRoles, setAvailableRoles] = React.useState<{ name: string; description: string }[]>([])
  const { login } = useAuth()

  React.useEffect(() => {
    const checkAdminStatus = async () => {
      try {
        const res = await fetch("http://localhost:3001/auth/admin-status")
        const data = await res.json()
        setCanRegisterAdmin(data.canRegisterAdmin)
        if (!data.canRegisterAdmin) {
          setRole("intern")
        }
      } catch (err) {
        console.error("Failed to check admin status:", err)
      }
    }
    const fetchRoles = async () => {
      try {
        const res = await fetch("http://localhost:3001/roles")
        if (res.ok) {
          const data = await res.json()
          setAvailableRoles(data)
        }
      } catch (err) {
        console.error("Failed to fetch roles:", err)
      }
    }
    checkAdminStatus()
    fetchRoles()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const response = await fetch("http://localhost:3001/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, fullName, role }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || "Registration failed")
      }

      login(data.access_token, data.user)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-accent/30 p-4">
      <div className="w-full max-w-md bg-card rounded-2xl border shadow-xl overflow-hidden">
        <div className="p-8 text-center space-y-2 border-b bg-accent/10">
          <div className="bg-primary text-primary-foreground w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <FileText size={28} />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Create Account</h1>
          <p className="text-sm text-muted-foreground">Join the IT DocHub platform</p>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-5">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <div className="relative">
                <Input 
                  id="fullName" 
                  type="text" 
                  placeholder="John Doe" 
                  className="pl-10"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <div className="relative">
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="john@example.com" 
                  className="pl-10"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input 
                  id="password" 
                  type="password" 
                  placeholder="••••••••" 
                  className="pl-10"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Initial Role</Label>
              <div className="relative">
                <select 
                  id="role"
                  className="w-full bg-background border rounded-md h-10 px-10 text-sm focus:ring-2 focus:ring-primary appearance-none"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                >
                  {availableRoles.length > 0 ? (
                    availableRoles
                      .filter(r => r.name !== 'admin' || canRegisterAdmin)
                      .map(r => (
                        <option key={r.name} value={r.name}>
                          {r.name === 'admin' ? 'Admin' : r.name === 'staff' ? 'Staff' : r.name === 'intern' ? 'Intern' : r.name}
                        </option>
                      ))
                  ) : (
                    <>
                      <option value="intern">Intern</option>
                      <option value="staff">Staff</option>
                      {canRegisterAdmin && <option value="admin">Admin</option>}
                    </>
                  )}
                </select>
                <ShieldCheck className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
              </div>
            </div>
          </div>

          {error && (
            <p className="text-sm font-medium text-destructive text-center">{error}</p>
          )}

          <Button type="submit" className="w-full h-11" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating account...
              </>
            ) : (
              "Sign Up"
            )}
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href="/login" className="text-primary font-semibold hover:underline">
              Log in instead
            </Link>
          </p>
        </form>
      </div>
    </div>
  )
}
