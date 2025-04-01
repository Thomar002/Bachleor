"use client"

import { Home, BookOpen, GraduationCap, User, HelpCircle, Globe, Languages } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { ROUTES } from "@/constants"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"

interface MainLayoutProps {
  children: React.ReactNode
}

export default function MainLayout({ children }: MainLayoutProps) {
  const pathname = usePathname()
  const isLoginPage = pathname === "/"

  if (isLoginPage) {
    return <>{children}</>
  }

  const navigationItems = [
    { href: ROUTES.home, label: "Front Page", icon: Home },
    { href: ROUTES.questions, label: "My Questions", icon: HelpCircle },
    { href: ROUTES.exams, label: "My Exams", icon: BookOpen },
    { href: ROUTES.subjects, label: "Subjects", icon: GraduationCap },
    { href: ROUTES.publicExams, label: "Public Exams", icon: Globe },
  ]

  return (
    <div className="flex min-h-screen">
      <aside className="fixed h-screen w-64 bg-[#2B4270] p-6 flex flex-col">
        {/* User Avatar */}
        <div className="flex flex-col items-center mb-8">
          <Avatar className="h-24 w-24 bg-[#E6E1F9]">
            <AvatarFallback className="text-[#2B4270] text-4xl">U</AvatarFallback>
          </Avatar>
        </div>

        {/* Main Navigation */}
        <nav className="space-y-4 flex-1">
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

        {/* Language Selector */}
        <div className="mt-auto pt-4 border-t border-[#3B5280]">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="w-full text-white hover:bg-[#3B5280] flex items-center gap-2"
              >
                <Languages className="h-5 w-5" />
                Language
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[160px]">
              <DropdownMenuItem>
                English
              </DropdownMenuItem>
              <DropdownMenuItem>
                Norsk
              </DropdownMenuItem>
              <DropdownMenuItem>
                Nynorsk
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 pl-64 p-8">
        {children}
      </main>
    </div>
  )
}
