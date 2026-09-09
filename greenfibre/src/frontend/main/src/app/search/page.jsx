"use client";

import { Suspense, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import useProductStore from "@/store/useProductStore";
import { Search, Loader2, ArrowRight, PackageSearch } from "lucide-react";

function SearchContent() {
  const searchParams = useSearchParams();

  const query = searchParams.get("q") || "";

  const products = useProductStore((s) => s.searchResults);
  const loading = useProductStore((s) => s.searchLoading);
  const searchProducts = useProductStore((s) => s.searchProducts);
  const clearSearchResults = useProductStore((s) => s.clearSearchResults);

  useEffect(() => {
    window.scrollTo(0, 0);

    if (query.trim()) {
      searchProducts(query);
    } else {
      clearSearchResults();
    }

    return () => clearSearchResults();
  }, [query, searchProducts, clearSearchResults]);

  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <div className="relative border-b border-gray-100 bg-linear-to-b from-green-50 to-white">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="inline-flex items-center gap-2 rounded-full bg-green-100 px-4 py-2 text-sm font-medium text-green-700 mb-6"
            >
              <Search className="h-4 w-4" />
              Search Results
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-4xl sm:text-5xl lg:text-6xl font-semibold text-gray-900 leading-tight"
              style={{
                fontFamily:
                  "var(--font-cormorant, 'Cormorant Garamond', serif)",
              }}
            >
              Results for <span className="text-green-600">"{query}"</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="mt-6 text-lg text-gray-600"
            >
              Discover eco-friendly products and sustainable collections
              matching your search.
            </motion.p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="h-10 w-10 animate-spin text-green-600" />
          </div>
        )}

        {/* Empty */}
        {!loading && products.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-24 text-center"
          >
            <div className="flex h-24 w-24 items-center justify-center rounded-full bg-green-50">
              <PackageSearch className="h-12 w-12 text-green-600" />
            </div>

            <h2
              className="mt-8 text-3xl font-semibold text-gray-900"
              style={{
                fontFamily:
                  "var(--font-cormorant, 'Cormorant Garamond', serif)",
              }}
            >
              No products found
            </h2>

            <p className="mt-4 max-w-md text-gray-600">
              We couldn't find any sustainable products matching your search.
            </p>

            <Link
              href="/shop"
              className="mt-8 inline-flex items-center gap-2 rounded-xl bg-green-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-green-700"
            >
              Browse Products
              <ArrowRight className="h-4 w-4" />
            </Link>
          </motion.div>
        )}

        {/* Products */}
        {!loading && products.length > 0 && (
          <>
            <div className="mb-10">
              <p className="text-sm text-gray-500">
                Showing{" "}
                <span className="font-semibold text-gray-900">
                  {products.length}
                </span>{" "}
                {products.length === 1 ? "result" : "results"}
              </p>
            </div>

            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {products.map((product, index) => {
                const image =
                  product.colors?.[0]?.images?.[0]?.card ||
                  product.colors?.[0]?.images?.[0]?.original;

                return (
                  <motion.div
                    key={product._id}
                    initial={{ opacity: 0, y: 18 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      duration: 0.45,
                      delay: index * 0.05,
                    }}
                  >
                    <Link
                      href={`/shop/${product.slug}`}
                      className="group block overflow-hidden rounded-3xl border border-gray-200 bg-white transition-all duration-300 hover:-translate-y-1 hover:border-green-200 hover:shadow-xl hover:shadow-green-100/40"
                    >
                      <div className="relative aspect-square overflow-hidden bg-gray-100">
                        {image && (
                          <Image
                            src={image}
                            alt={product.name}
                            fill
                            className="object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                        )}
                      </div>

                      <div className="p-5">
                        {product.category?.name && (
                          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-green-600">
                            {product.category.name}
                          </p>
                        )}

                        <h2
                          className="line-clamp-2 text-xl font-semibold text-gray-900 transition-colors group-hover:text-green-600"
                          style={{
                            fontFamily:
                              "var(--font-cormorant, 'Cormorant Garamond', serif)",
                          }}
                        >
                          {product.name}
                        </h2>

                        <div className="mt-4 flex items-center gap-3">
                          <span className="text-lg font-bold text-green-600">
                            ₹{product.discountedPrice}
                          </span>

                          {product.originalPrice > product.discountedPrice && (
                            <span className="text-sm text-gray-400 line-through">
                              ₹{product.originalPrice}
                            </span>
                          )}
                        </div>

                        <div className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-green-600">
                          View Product
                          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-white">
          <Loader2 className="h-10 w-10 animate-spin text-green-600" />
        </div>
      }
    >
      <SearchContent />
    </Suspense>
  );
}
