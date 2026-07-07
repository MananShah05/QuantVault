"use client";

import * as React from "react"
import { cn } from '@/lib/utils'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Menu, X, Sun, Moon } from 'lucide-react'
import { useTheme } from 'next-themes'

const menuItems = [
    { name: 'Features', href: '#features' },
    { name: 'Analytics', href: '/analytics' },
    { name: 'Risk Stress', href: '/risk-stress' },
    { name: 'About', href: '#' },
]

/* ── Tech Stack Items with CDN logos ────────────────── */

const techStack = [
    { name: "Next.js", logo: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/nextjs/nextjs-original.svg", invert: true },
    { name: "React", logo: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/react/react-original.svg", invert: false },
    { name: "TypeScript", logo: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/typescript/typescript-original.svg", invert: false },
    { name: "Tailwind CSS", logo: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/tailwindcss/tailwindcss-original.svg", invert: false },
    { name: "Python", logo: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/python/python-original.svg", invert: false },
    { name: "FastAPI", logo: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/fastapi/fastapi-original.svg", invert: false },
    { name: "Supabase", logo: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/supabase/supabase-original.svg", invert: false },
    { name: "Framer Motion", logo: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/framermotion/framermotion-original.svg", invert: true },
    { name: "PostgreSQL", logo: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/postgresql/postgresql-original.svg", invert: false },
]

export const HeroSection = ({ onLoginClick }: { onLoginClick: () => void }) => {
    const [menuState, setMenuState] = React.useState(false)
    const { theme, setTheme } = useTheme()
    const [mounted, setMounted] = React.useState(false)

    React.useEffect(() => {
        setMounted(true)
    }, [])

    return (
        <div className="relative min-h-screen bg-transparent select-none font-sans text-foreground">
            <header>
                <nav
                    data-state={menuState && 'active'}
                    className="group fixed z-20 w-full border-b border-subtle bg-surface/80 backdrop-blur md:relative">
                    <div className="m-auto max-w-5xl px-6">
                        <div className="flex flex-wrap items-center justify-between gap-6 py-3 lg:gap-0 lg:py-4">
                            <div className="flex items-center gap-3 w-full justify-between lg:w-auto">
                                <Link
                                    href="/"
                                    aria-label="home"
                                    className="flex items-center gap-3">
                                    <div className="w-2.5 h-2.5 bg-accent" />
                                    <span className="font-sans font-bold text-[13px] tracking-[0.2em] text-foreground">RISKMATRIX</span>
                                </Link>

                                <button
                                    onClick={() => setMenuState(!menuState)}
                                    aria-label={menuState === true ? 'Close Menu' : 'Open Menu'}
                                    className="relative z-20 -m-2.5 -mr-4 block cursor-pointer p-2.5 lg:hidden text-muted-foreground hover:text-foreground">
                                    <Menu className="group-data-[state=active]:rotate-180 group-data-[state=active]:scale-0 group-data-[state=active]:opacity-0 m-auto size-5 duration-200" />
                                    <X className="group-data-[state=active]:rotate-0 group-data-[state=active]:scale-100 group-data-[state=active]:opacity-100 absolute inset-0 m-auto size-5 -rotate-180 scale-0 opacity-0 duration-200" />
                                </button>
                            </div>

                            <div className="bg-surface lg:bg-transparent group-data-[state=active]:block lg:group-data-[state=active]:flex mb-6 hidden w-full flex-wrap items-center justify-end space-y-8 rounded-xl border border-subtle lg:border-transparent p-6 lg:p-0 shadow-none md:flex-nowrap lg:m-0 lg:flex lg:w-fit lg:gap-6 lg:space-y-0">
                                <div className="lg:pr-4">
                                    <ul className="space-y-6 text-base lg:flex lg:gap-8 lg:space-y-0 lg:text-[13px]">
                                        {menuItems.map((item, index) => (
                                            <li key={index}>
                                                <Link
                                                    href={item.href}
                                                    className="text-muted-foreground hover:text-foreground block duration-150 font-medium">
                                                    <span>{item.name}</span>
                                                </Link>
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                <div className="flex w-full flex-wrap items-center gap-3 md:w-fit lg:border-l lg:border-subtle lg:pl-6">
                                    <Button
                                        onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                                        variant="ghost"
                                        size="sm"
                                        className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground transition-all"
                                        title="Toggle Theme"
                                    >
                                        {mounted ? (
                                            theme === 'dark' ? <Sun className="size-4" /> : <Moon className="size-4" />
                                        ) : (
                                            <div className="w-4 h-4" />
                                        )}
                                    </Button>

                                    <Button
                                        onClick={onLoginClick}
                                        variant="outline"
                                        size="sm"
                                        className="h-8 text-muted-foreground hover:text-foreground hover:bg-elevated border-default transition-all"
                                    >
                                        <span>Sign In</span>
                                    </Button>
                                    <Button
                                        onClick={onLoginClick}
                                        size="sm"
                                        className="h-8 bg-accent hover:bg-accent-hover text-[var(--accent-foreground)] transition-all border-none"
                                    >
                                        <span>Create Account</span>
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                </nav>
            </header>

            <main>
                <div
                    aria-hidden
                    className="z-[2] absolute inset-0 pointer-events-none isolate opacity-10 dark:opacity-30 contain-strict hidden lg:block">
                    <div className="w-[35rem] h-[80rem] -translate-y-87.5 absolute left-0 top-0 -rotate-45 rounded-full bg-[radial-gradient(68.54%_68.72%_at_55.02%_31.46%,hsla(217,89%,60%,.05)_0,hsla(217,89%,40%,.01)_50%,transparent_80%)]" />
                </div>

                <section className="overflow-hidden bg-transparent">
                    <div className="relative mx-auto max-w-5xl px-6 py-28 lg:py-24">
                        <div className="relative z-10 mx-auto max-w-3xl text-center space-y-6">
                            <span className="font-mono text-[10px] text-accent tracking-[0.3em] uppercase block">
                                RISKMATRIX GLOBAL RISK SUITE
                            </span>
                            <h1 className="text-balance text-4xl font-serif italic md:text-5xl lg:text-6xl text-foreground leading-[1.1]">
                              Multi-Asset Portfolio <br />
                              <span className="text-accent">Risk Analytics Reimagined</span>
                            </h1>
                            <p className="mx-auto max-w-2xl text-[15px] font-sans text-muted-foreground leading-relaxed">
                              Decompose return attributions, compute realized rolling volatilities, and stress test multi-asset allocations under unified, institutional-grade risk models.
                            </p>

                            <div className="pt-4">
                                <Button
                                    onClick={onLoginClick}
                                    size="lg"
                                    className="bg-accent hover:bg-accent-hover text-[var(--accent-foreground)] font-sans text-sm font-medium px-8 h-11 rounded-[6px] transition-all border-none"
                                >
                                    <span className="btn-label">Start Building Portfolio</span>
                                </Button>
                            </div>
                        </div>
                    </div>
                </section>
                
                {/* Tech Stack Section */}
                <section id="features" className="bg-transparent relative z-10 py-16 border-t border-subtle">
                    <div className="m-auto max-w-5xl px-6">
                        <h2 className="text-center font-sans text-[11px] font-medium tracking-[0.15em] text-muted-foreground/60 uppercase">
                          BUILT WITH
                        </h2>
                        <div className="mx-auto mt-12 flex max-w-4xl flex-wrap items-center justify-center gap-x-10 gap-y-8">
                            {techStack.map(({ name, logo, invert }) => (
                                <div key={name} className="flex flex-col items-center gap-2.5 group transition-all duration-200">
                                    <div className="rounded-xl border border-subtle bg-surface/60 p-3.5 shadow-sm group-hover:border-accent/30 group-hover:shadow-accent/5 group-hover:shadow-md transition-all duration-200 group-hover:scale-110">
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img
                                            src={logo}
                                            alt={`${name} logo`}
                                            className={cn(
                                                "w-7 h-7 object-contain transition-all duration-200 opacity-70 group-hover:opacity-100",
                                                invert && "dark:invert"
                                            )}
                                            width={28}
                                            height={28}
                                        />
                                    </div>
                                    <span className="font-mono text-[10px] text-muted-foreground/70 group-hover:text-foreground transition-colors tracking-wide">
                                        {name}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            </main>
        </div>
    )
}

export const Logo = ({ className }: { className?: string }) => {
    return (
        <svg
            viewBox="0 0 78 18"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={cn('h-5 w-auto', className)}>
            <path
                d="M3 0H5V18H3V0ZM13 0H15V18H13V0ZM18 3V5H0V3H18ZM0 15V13H18V15H0Z"
                fill="currentColor"
                className="text-accent"
            />
        </svg>
    )
}
