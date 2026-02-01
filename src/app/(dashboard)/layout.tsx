import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { Sidebar } from '@/components/layout/sidebar'
import { KeyboardShortcutsProvider } from '@/components/keyboard-shortcuts-provider'
import { OnboardingCheck } from '@/components/onboarding-check'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getSession()

  if (!session) {
    redirect('/login')
  }

  return (
    <OnboardingCheck>
      <KeyboardShortcutsProvider>
        <div className="flex h-screen overflow-hidden">
          <Sidebar />
          <main className="flex-1 overflow-y-auto bg-muted/30">{children}</main>
        </div>
      </KeyboardShortcutsProvider>
    </OnboardingCheck>
  )
}
