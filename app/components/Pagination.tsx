'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
    total: number;
    limit: number;
    currentPage: number;
}

export default function Pagination({ total, limit, currentPage }: PaginationProps) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const totalPages = Math.ceil(total / limit);

    // if (totalPages <= 1) return null; // Use standard checking logic below 
    // Always show pagination context if total > 0, or at least show 'Page 1'


    const handlePageChange = (page: number) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set('page', page.toString());
        router.push(pathname + '?' + params.toString());
    };

    return (
        <div className="flex items-center justify-center border-t border-gray-200 bg-white px-4 py-3 sm:px-6 mt-4 rounded-md shadow-sm">
            <div className="flex flex-1 items-center justify-between">
                <div>
                    {/* Optional info text hidden on very small screens? */}
                    {/* <p className="text-sm text-gray-700 hidden md:block"> ... </p> */}
                </div>
                <div className="flex justify-center w-full">
                    <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                        <button
                            onClick={() => handlePageChange(currentPage - 1)}
                            disabled={currentPage === 1}
                            className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50"
                        >
                            <span className="sr-only">Previous</span>
                            <ChevronLeft className="h-5 w-5" aria-hidden="true" />
                        </button>

                        {/* Always show page numbers */}
                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                            let p = i + 1;
                            if (totalPages > 5) {
                                if (currentPage > 3) p = currentPage - 2 + i;
                                if (p > totalPages) p = i + (totalPages - 4); // Clamp at end
                            }
                            // Guard against invalid p (though math should be safe for >0)
                            if (p < 1) p = 1;

                            return p;
                        }).map(p => (
                            <button
                                key={p}
                                onClick={() => handlePageChange(p)}
                                aria-current={currentPage === p ? 'page' : undefined}
                                className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${currentPage === p
                                        ? 'z-10 bg-blue-600 text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600'
                                        : 'text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0'
                                    }`}
                            >
                                {p}
                            </button>
                        ))}

                        <button
                            onClick={() => handlePageChange(currentPage + 1)}
                            disabled={currentPage === totalPages}
                            className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50"
                        >
                            <span className="sr-only">Next</span>
                            <ChevronRight className="h-5 w-5" aria-hidden="true" />
                        </button>
                    </nav>
                </div>
            </div>
        </div>
    );
}
