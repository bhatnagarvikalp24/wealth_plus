'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard,
  Wallet,
  CreditCard,
  PiggyBank,
  Settings,
  LogOut,
  TrendingUp,
  Menu,
} from 'lucide-react'
import { signOut } from 'next-auth/react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from '@/components/ui/sheet'

const navItems = [
  {
    title: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
  },
  {
    title: 'Income',
    href: '/income',
    icon: Wallet,
    color: 'text-emerald-500',
    bgColor: 'bg-emerald-500/10',
  },
  {
    title: 'Expenses',
    href: '/expenses',
    icon: CreditCard,
    color: 'text-red-500',
    bgColor: 'bg-red-500/10',
  },
  {
    title: 'Savings',
    href: '/savings',
    icon: PiggyBank,
    color: 'text-amber-500',
    bgColor: 'bg-amber-500/10',
  },
  {
    title: 'Settings',
    href: '/settings',
    icon: Settings,
    color: 'text-gray-500',
    bgColor: 'bg-gray-500/10',
  },
]

export function MobileSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [open, setOpen] = useState(false)

  const handleSignOut = async () => {
    setOpen(false)
    await signOut({ redirect: false })
    router.push('/login')
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="lg:hidden">
          <Menu className="h-6 w-6" />
          <span className="sr-only">Toggle menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-72 p-0">
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-16 items-center px-6 border-b border-gray-100">
            <Link href="/dashboard" className="flex items-center gap-3" onClick={() => setOpen(false)}>
              <div className="p-2 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl shadow-lg shadow-blue-600/20">
                <TrendingUp className="h-5 w-5 text-white" />
              </div>
              <div>
                <span className="text-lg font-bold text-gray-900">Wealth</span>
                <span className="text-lg font-bold text-blue-600">Pulse</span>
              </div>
            </Link>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1">
            <p className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">
              Menu
            </p>
            {navItems.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    'flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200',
                    isActive
                      ? 'bg-blue-50 text-blue-700 shadow-sm'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  )}
                >
                  <div
                    className={cn(
                      'p-2 rounded-lg transition-colors',
                      isActive ? 'bg-blue-100' : item.bgColor
                    )}
                  >
                    <item.icon
                      className={cn('h-5 w-5', isActive ? 'text-blue-600' : item.color)}
                    />
                  </div>
                  {item.title}
                  {isActive && (
                    <div className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-600" />
                  )}
                </Link>
              )
            })}
          </nav>

          {/* User Section */}
          <div className="p-4 border-t border-gray-100">
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-xl px-4 py-3 h-auto"
              onClick={handleSignOut}
            >
              <div className="p-2 bg-gray-100 rounded-lg">
                <LogOut className="h-5 w-5" />
              </div>
              Sign Out
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
