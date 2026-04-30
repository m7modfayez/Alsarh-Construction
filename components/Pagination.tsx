"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

interface Props {
  currentPage: number;
  totalPages: number;
  baseUrl: string;
}

export default function Pagination({ currentPage, totalPages, baseUrl }: Props) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const createPageURL = (pageNumber: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", pageNumber.toString());
    return `${pathname}?${params.toString()}`;
  };

  const getVisiblePages = () => {
    const delta = 2;
    const range: (number | string)[] = [];
    const rangeWithDots: (number | string)[] = [];

    for (let i = 1; i <= totalPages; i++) {
      if (
        i === 1 ||
        i === totalPages ||
        (i >= currentPage - delta && i <= currentPage + delta)
      ) {
        range.push(i);
      }
    }

    let prev = 0;
    for (const i of range) {
      if (typeof i === "number" && prev) {
        if (i - prev === 2) {
          rangeWithDots.push(prev + 1);
        } else if (i - prev !== 1) {
          rangeWithDots.push("...");
        }
      }
      rangeWithDots.push(i);
      if (typeof i === "number") prev = i;
    }

    return rangeWithDots;
  };

  return (
    <nav className="flex items-center justify-center gap-2" aria-label="Pagination">
      {/* Previous */}
      {currentPage > 1 && (
        <Link
          href={createPageURL(currentPage - 1)}
          className="w-10 h-10 flex items-center justify-center rounded-lg border border-[#E5E5E0] text-[#6B6860] hover:border-[#C9A84C] hover:text-[#C9A84C] transition-colors"
          aria-label="الصفحة السابقة"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-5 h-5 rtl:rotate-180"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
      )}

      {/* Page Numbers */}
      {getVisiblePages().map((page, index) => (
        typeof page === "number" ? (
          <Link
            key={index}
            href={createPageURL(page)}
            className={`w-10 h-10 flex items-center justify-center rounded-lg text-sm font-medium transition-colors ${
              page === currentPage
                ? "bg-[#C9A84C] text-white"
                : "border border-[#E5E5E0] text-[#6B6860] hover:border-[#C9A84C] hover:text-[#C9A84C]"
            }`}
          >
            {page}
          </Link>
        ) : (
          <span key={index} className="w-10 h-10 flex items-center justify-center text-[#6B6860]">
            {page}
          </span>
        )
      ))}

      {/* Next */}
      {currentPage < totalPages && (
        <Link
          href={createPageURL(currentPage + 1)}
          className="w-10 h-10 flex items-center justify-center rounded-lg border border-[#E5E5E0] text-[#6B6860] hover:border-[#C9A84C] hover:text-[#C9A84C] transition-colors"
          aria-label="الصفحة التالية"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-5 h-5 rtl:rotate-180"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      )}
    </nav>
  );
}