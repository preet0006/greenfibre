import Link from "next/link";

export const metadata = {
  title: "Page Not Found",
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4 text-center">
      <p className="text-sm font-semibold uppercase tracking-wider text-green-700">
        404
      </p>
      <h1 className="font-[family-name:var(--font-cormorant)] text-4xl font-semibold text-gray-900">
        Page not found
      </h1>
      <p className="max-w-md text-sm text-gray-600">
        The page you are looking for does not exist or has been moved.
      </p>
      <div className="mt-2 flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/"
          className="rounded-full bg-green-600 px-6 py-3 text-sm font-semibold text-white hover:bg-green-700"
        >
          Go Home
        </Link>
        <Link
          href="/shop"
          className="rounded-full border border-green-600 px-6 py-3 text-sm font-semibold text-green-700 hover:bg-green-50"
        >
          Browse Shop
        </Link>
      </div>
    </div>
  );
}
