'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Database, Settings, RefreshCw } from 'lucide-react';
import clsx from 'clsx';

const navItems = [
    { name: 'Dashboard', href: '/', icon: Home },
    { name: 'Questions', href: '/questions', icon: Database },
    //   { name: 'Import Data', href: '/import', icon: RefreshCw },
    //   { name: 'Settings', href: '/settings', icon: Settings },
];

export function AppSidebar() {
    const pathname = usePathname();
    // Using searchParams to check for active state on same route with different query params
    // But usePathname doesn't give query params in Next.js client component directly easily without useSearchParams
    // stick to simple matching for now or just checking pathname

    return (
        <div className="flex h-full w-64 flex-col bg-gray-900 text-white">
            <div className="flex h-16 items-center justify-center border-b border-gray-800">
                <h1 className="text-xl font-bold">TalkBingo Admin</h1>
            </div>
            <nav className="flex-1 space-y-1 p-4 overflow-y-auto">
                <Link
                    href="/"
                    className={clsx(
                        'flex items-center space-x-3 rounded-md px-4 py-3 text-sm font-medium transition-colors',
                        pathname === '/' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                    )}
                >
                    <Home className="h-5 w-5" />
                    <span>Dashboard</span>
                </Link>

                <Link
                    href="/questions/new"
                    className={clsx(
                        'flex items-center space-x-3 rounded-md px-4 py-3 text-sm font-medium transition-colors',
                        pathname === '/questions/new' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                    )}
                >
                    <RefreshCw className="h-5 w-5" />
                    <span>Create_TBM</span>
                </Link>

                <div className="pt-4">
                    <div className="px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                        Questions
                    </div>
                    <div className="space-y-1">
                        <Link
                            href="/questions?type=B"
                            className={clsx(
                                'flex items-center space-x-3 rounded-md px-4 py-2 text-sm font-medium transition-colors',
                                // Simple active check - technically url params check needed for perfect active state but this is okay for now
                                'text-gray-400 hover:bg-gray-800 hover:text-white'
                            )}
                        >
                            <span className="w-5 text-center text-xs">B</span>
                            <span>Balances</span>
                        </Link>
                        <Link
                            href="/questions?type=T"
                            className={clsx(
                                'flex items-center space-x-3 rounded-md px-4 py-2 text-sm font-medium transition-colors',
                                'text-gray-400 hover:bg-gray-800 hover:text-white'
                            )}
                        >
                            <span className="w-5 text-center text-xs">T</span>
                            <span>Truths</span>
                        </Link>
                        <Link
                            href="/questions?type=M"
                            className={clsx(
                                'flex items-center space-x-3 rounded-md px-4 py-2 text-sm font-medium transition-colors',
                                'text-gray-400 hover:bg-gray-800 hover:text-white'
                            )}
                        >
                            <span className="w-5 text-center text-xs">M</span>
                            <span>Mini Games</span>
                        </Link>
                    </div>
                </div>
            </nav>
            <div className="border-t border-gray-800 p-4">
                <div className="text-xs text-gray-500">v1.1.0</div>
            </div>
        </div>
    );
}
