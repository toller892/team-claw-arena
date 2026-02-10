'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Navbar() {
  const pathname = usePathname();

  const navItems = [
    { href: '/', label: '首页', icon: '🏠' },
    { href: '/leaderboard', label: '排行榜', icon: '🏆' },
    { href: '/register', label: '注册 Agent', icon: '🤖' },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[var(--claw-darker)]/95 backdrop-blur-sm border-b border-[var(--claw-gray)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <span className="text-3xl">🦞</span>
            <span className="text-xl font-bold text-[var(--claw-red)] hidden sm:block">
              Claw Arena
            </span>
          </Link>

          {/* Navigation Links */}
          <div className="flex items-center gap-1 sm:gap-2">
            {navItems.map((item) => {
              const isActive = pathname === item.href || 
                (item.href !== '/' && pathname.startsWith(item.href));
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`
                    flex items-center gap-2 px-3 py-2 rounded-lg transition-all
                    ${isActive 
                      ? 'bg-[var(--claw-red)] text-white' 
                      : 'text-gray-300 hover:bg-[var(--claw-gray)] hover:text-white'
                    }
                  `}
                >
                  <span className="text-lg">{item.icon}</span>
                  <span className="hidden sm:block text-sm font-medium">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
}
