'use client'

import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 py-8 sm:py-12">
        <Link href="/">
          <Button variant="ghost" size="sm" className="mb-6">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Button>
        </Link>

        <h1 className="text-3xl font-bold text-foreground mb-2">Privacy Policy</h1>
        <p className="text-muted-foreground mb-8">Last updated: February 4, 2026</p>

        <div className="prose prose-neutral dark:prose-invert max-w-none space-y-6">
          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">1. Introduction</h2>
            <p className="text-muted-foreground leading-relaxed">
              Welcome to The Finlog (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;). We are committed to protecting your privacy
              and ensuring the security of your personal and financial information. This Privacy Policy explains
              how we collect, use, disclose, and safeguard your information when you use our personal finance
              tracking application.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">2. Information We Collect</h2>
            <p className="text-muted-foreground leading-relaxed mb-3">We collect the following types of information:</p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li><strong>Account Information:</strong> Name, email address, and password when you create an account.</li>
              <li><strong>Financial Data:</strong> Income entries, expense records, and savings/investment information that you voluntarily enter into the app.</li>
              <li><strong>Usage Data:</strong> Information about how you interact with our app, including features used and preferences.</li>
              <li><strong>Device Information:</strong> Device type, operating system, and browser type for app optimization.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">3. How We Use Your Information</h2>
            <p className="text-muted-foreground leading-relaxed mb-3">We use your information to:</p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Provide and maintain our finance tracking services</li>
              <li>Generate personalized financial insights and recommendations using AI</li>
              <li>Send you important notifications about your account or spending alerts</li>
              <li>Improve and optimize our application</li>
              <li>Respond to your inquiries and provide customer support</li>
              <li>Ensure the security of your account</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">4. Data Storage and Security</h2>
            <p className="text-muted-foreground leading-relaxed">
              Your data is stored securely using industry-standard encryption. We use secure databases
              and implement appropriate technical and organizational measures to protect your personal
              information against unauthorized access, alteration, disclosure, or destruction. Your
              financial data is encrypted both in transit and at rest.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">5. Data Sharing</h2>
            <p className="text-muted-foreground leading-relaxed mb-3">
              We do not sell, trade, or rent your personal information to third parties. We may share
              your information only in the following circumstances:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li><strong>Service Providers:</strong> With trusted third-party services that help us operate our app (e.g., cloud hosting, AI services for insights).</li>
              <li><strong>Legal Requirements:</strong> When required by law or to protect our rights and safety.</li>
              <li><strong>With Your Consent:</strong> When you explicitly authorize us to share your information.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">6. AI-Powered Features</h2>
            <p className="text-muted-foreground leading-relaxed">
              Our app uses artificial intelligence to provide financial insights and recommendations.
              Your financial data may be processed by AI services to generate personalized insights.
              This data is used solely for providing you with better financial analysis and is not
              used to train AI models or shared with third parties for other purposes.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">7. Your Rights</h2>
            <p className="text-muted-foreground leading-relaxed mb-3">You have the right to:</p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Access your personal data stored in our app</li>
              <li>Correct inaccurate or incomplete data</li>
              <li>Export your financial data</li>
              <li>Delete your account and all associated data</li>
              <li>Opt-out of non-essential communications</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">8. Data Retention</h2>
            <p className="text-muted-foreground leading-relaxed">
              We retain your personal information for as long as your account is active or as needed
              to provide you services. If you delete your account, we will delete all your personal
              and financial data within 30 days, except where retention is required by law.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">9. Children&apos;s Privacy</h2>
            <p className="text-muted-foreground leading-relaxed">
              Our app is not intended for children under 13 years of age. We do not knowingly collect
              personal information from children under 13. If you believe we have collected information
              from a child under 13, please contact us immediately.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">10. Changes to This Policy</h2>
            <p className="text-muted-foreground leading-relaxed">
              We may update this Privacy Policy from time to time. We will notify you of any changes
              by posting the new Privacy Policy on this page and updating the &quot;Last updated&quot; date.
              Your continued use of the app after any changes constitutes acceptance of the new policy.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">11. Contact Us</h2>
            <p className="text-muted-foreground leading-relaxed">
              If you have any questions about this Privacy Policy or our data practices, please contact us at:
            </p>
            <p className="text-muted-foreground mt-2">
              <strong>Email:</strong> support@thefinlog.com<br />
              <strong>Website:</strong> https://thefinlog.com
            </p>
          </section>
        </div>

        <div className="mt-12 pt-6 border-t border-border">
          <p className="text-sm text-muted-foreground text-center">
            &copy; {new Date().getFullYear()} The Finlog. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  )
}
