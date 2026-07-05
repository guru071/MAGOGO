import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="text-center max-w-lg">
        <div className="text-7xl font-black text-[#2874F0] mb-4">404</div>
        <h1 className="text-2xl font-bold text-[#212121] mb-2">Page Not Found</h1>
        <p className="text-[#878787] mb-8">The page you&apos;re looking for doesn&apos;t exist or has been moved.</p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 bg-[#2874F0] text-white px-6 py-3 font-medium hover:bg-[#1a5dc7] transition-colors"
        >
          Go Home
        </Link>
      </div>
    </div>
  )
}
