"use client"

import { Home, BookOpen, GraduationCap, User, HelpCircle } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { ROUTES } from "@/constants"

interface MainLayoutProps {
  children: React.ReactNode
}

export default function MainLayout({ children }: MainLayoutProps) {
  const pathname = usePathname()
  const isDashboard = pathname === ROUTES.home
  const isLoginPage = pathname === "/"  // Add this line

  // If we're on the login page, return children without the layout
  if (isLoginPage) {
    return <>{children}</>
  }

  const navigationItems = [
    { href: ROUTES.profile, label: "Profile", icon: User },
    { href: ROUTES.home, label: "Front Page", icon: Home },
    { href: ROUTES.questions, label: "My Questions", icon: HelpCircle },
    { href: ROUTES.exams, label: "My Exams", icon: BookOpen },
    { href: ROUTES.subjects, label: "Subjects", icon: GraduationCap },
  ]

  return (
    <div className="flex min-h-screen">
      {/* Sidebar - Only show when not on dashboard */}
      {!isDashboard && (
        <aside className="w-64 bg-[#2B4270] p-6 flex flex-col">
          {/* User Avatar */}
          <div className="flex flex-col items-center mb-8">
            <Avatar className="h-24 w-24 bg-[#E6E1F9]">
              <AvatarFallback className="text-[#2B4270] text-4xl">U</AvatarFallback>
            </Avatar>
          </div>

          {/* Main Navigation */}
          <nav className="space-y-2">
            {navigationItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors
                    ${isActive
                      ? 'bg-[#3B5280] text-white'
                      : 'text-white hover:bg-[#3B5280]'
                    }`}
                >
                  <Icon className="h-5 w-5" />
                  {item.label}
                </Link>
              )
            })}
          </nav>

          {/* Context-specific navigation can be added here */}
          {pathname.includes('/subjects/') && (
            <nav className="mt-8 pt-8 border-t border-[#3B5280] space-y-2">
              <h3 className="px-4 text-sm font-semibold text-white/60 mb-2">Subject Actions</h3>
              {/* Subject specific actions */}
            </nav>
          )}
        </aside>
      )}

      {/* Main Content - Full width on dashboard, otherwise with sidebar */}
      <main className="flex-1 p-8">
        {children}
      </main>
    </div>
  )
}
