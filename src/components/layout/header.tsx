'use client'

import { useSession } from 'next-auth/react'
import { User } from 'lucide-react'
import { MobileSidebar } from './mobile-sidebar'

interface HeaderProps {
  title: string
  description?: string
}

export function Header({ title, description }: HeaderProps) {
  const { data: session } = useSession()

  return (
    <div className="flex items-center justify-between bg-white px-4 sm:px-6 py-4 sm:py-5 border-b border-gray-100">
      <div className="flex items-center gap-3">
        <MobileSidebar />
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">{title}</h1>
          {description && (
            <p className="text-xs sm:text-sm text-gray-500 mt-0.5 hidden sm:block">{description}</p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-3">
        <div className="text-right hidden sm:block">
          <p className="text-sm font-medium text-gray-900">
            {session?.user?.name || 'User'}
          </p>
          <p className="text-xs text-gray-500">{session?.user?.email}</p>
        </div>
        <div className="w-9 h-9 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
          <User className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
        </div>
      </div>
    </div>
  )
}
