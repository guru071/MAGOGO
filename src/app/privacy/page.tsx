'use client'

export default function PrivacyPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-20 relative z-10">
      <h1 className="text-4xl font-extrabold mb-8 text-foreground">Privacy Policy</h1>
      <div className="bg-card border-border p-8 rounded-sm max-w-none space-y-6 text-muted-foreground text-sm leading-relaxed">
        <p><strong className="text-foreground">Last Updated:</strong> July 5, 2026</p>

        <h2 className="text-xl font-bold text-foreground">1. Information We Collect</h2>
        <p>We collect information you provide directly: name, email address, and payment details (processed securely by Razorpay — we never store card or UPI data). We also collect usage data such as pages visited, search queries, and device information to improve your experience.</p>

        <h2 className="text-xl font-bold text-foreground">2. How We Use Your Information</h2>
        <p>Your data is used to: process transactions and deliver purchased prompts; personalize your browsing experience; send order confirmations and important account notifications; detect and prevent fraud using our AI security engine; and improve platform features.</p>

        <h2 className="text-xl font-bold text-foreground">3. Data Security</h2>
        <p>We implement industry-standard security measures including HMAC-SHA256 cryptographic payment verification, encrypted database connections (SSL/TLS), IP-based brute-force protection, and automated fraud detection. All sensitive data is encrypted at rest and in transit.</p>

        <h2 className="text-xl font-bold text-foreground">4. Third-Party Services</h2>
        <p>We use the following trusted third-party services: Razorpay (payment processing, PCI-DSS Level 1 certified), Supabase (authentication), and Vercel (hosting). Each service has its own privacy policy governing data handling.</p>

        <h2 className="text-xl font-bold text-foreground">5. Cookies</h2>
        <p>We use essential cookies for authentication and session management. No third-party advertising cookies are used on this platform.</p>

        <h2 className="text-xl font-bold text-foreground">6. Your Rights</h2>
        <p>You have the right to: access your personal data; request correction of inaccurate data; request deletion of your account and associated data; and opt out of promotional communications. To exercise these rights, contact <a href="mailto:privacy@maghgo.com" className="text-[#2874F0] hover:underline">privacy@maghgo.com</a>.</p>

        <h2 className="text-xl font-bold text-foreground">7. Data Retention</h2>
        <p>We retain your account data for as long as your account is active. Transaction records are kept for 7 years for tax and legal compliance. You may request account deletion at any time.</p>

        <h2 className="text-xl font-bold text-foreground">8. Contact</h2>
        <p>For privacy-related inquiries, contact our Data Protection Officer at <a href="mailto:privacy@maghgo.com" className="text-[#2874F0] hover:underline">privacy@maghgo.com</a>.</p>
      </div>
    </div>
  )
}
