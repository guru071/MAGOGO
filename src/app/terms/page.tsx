'use client'

export default function TermsPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-20 relative z-10">
      <h1 className="text-4xl font-extrabold mb-8 text-foreground">Terms of Service</h1>
      <div className="bg-card border-border p-8 rounded-sm max-w-none space-y-6 text-muted-foreground text-sm leading-relaxed">
        <p><strong className="text-foreground">Last Updated:</strong> July 5, 2026</p>

        <h2 className="text-xl font-bold text-foreground">1. Acceptance of Terms</h2>
        <p>By accessing or using the MAGHGO platform (&ldquo;Service&rdquo;), you agree to be bound by these Terms of Service. If you do not agree, you may not use the Service.</p>

        <h2 className="text-xl font-bold text-foreground">2. User Accounts</h2>
        <p>You are responsible for maintaining the confidentiality of your account credentials. You must be at least 13 years old to create an account. You agree to provide accurate information during registration.</p>

        <h2 className="text-xl font-bold text-foreground">3. Buying &amp; Selling Prompts</h2>
        <p>Sellers grant buyers a non-exclusive, non-transferable license to use purchased prompts for personal or commercial use. Reselling or redistributing purchased prompts is strictly prohibited. MAGHGO retains the right to remove content that violates our quality standards or community guidelines.</p>

        <h2 className="text-xl font-bold text-foreground">4. Payments &amp; Refunds</h2>
        <p>All payments are processed securely through Razorpay. Refund requests must be submitted within 7 days of purchase. MAGHGO reserves the right to deny refund requests that do not meet our refund policy criteria.</p>

        <h2 className="text-xl font-bold text-foreground">5. Platform Commission</h2>
        <p>MAGHGO charges a transparent commission on each sale, which includes platform fees, GST (18%), and payment processing fees. The exact breakdown is visible to sellers before publishing a prompt.</p>

        <h2 className="text-xl font-bold text-foreground">6. Prohibited Conduct</h2>
        <p>Users may not: upload malicious or harmful content; attempt to exploit platform vulnerabilities; engage in fraudulent transactions; impersonate other users; or violate any applicable laws.</p>

        <h2 className="text-xl font-bold text-foreground">7. Intellectual Property</h2>
        <p>Sellers must own or have proper rights to all prompts they upload. MAGHGO does not claim ownership over user-generated content but reserves the right to display, distribute, and promote listed prompts on the platform.</p>

        <h2 className="text-xl font-bold text-foreground">8. Limitation of Liability</h2>
        <p>MAGHGO is provided &ldquo;as is&rdquo; without warranties of any kind. We are not liable for any indirect, incidental, or consequential damages arising from the use of the Service.</p>

        <h2 className="text-xl font-bold text-foreground">9. Contact</h2>
        <p>For questions regarding these terms, please contact <a href="mailto:legal@maghgo.com" className="text-[#2874F0] hover:underline">legal@maghgo.com</a>.</p>
      </div>
    </div>
  )
}
