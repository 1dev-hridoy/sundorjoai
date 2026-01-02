import { MenuIcon, XIcon, MessageSquareIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useUser, SignInButton, SignUpButton, UserButton } from "@clerk/clerk-react";
import { SyntexService } from "../lib/syntex";
import type { AppInfo } from "../lib/syntex";

interface NavLink {
    name: string;
    href: string;
}

export default function Navbar() {
    const [isOpen, setIsOpen] = useState(false);
    const [showNavbar, setShowNavbar] = useState(true);
    const { isSignedIn } = useUser();
    const lastScrollY = useRef(0);
    const [appInfo, setAppInfo] = useState<AppInfo | null>(null);

    useEffect(() => {
        const fetchAppInfo = async () => {
            try {
                const info = await SyntexService.getAppInfo();
                setAppInfo(info);
            } catch (error) {
                console.error("Failed to fetch app info:", error);
            }
        };
        fetchAppInfo();
    }, []);

    const appName = appInfo?.app?.name;
    const appLogo = appInfo?.app?.branding?.logo?.png;

    const navLinks: NavLink[] = [
        { name: "Home", href: "/#home" },
        { name: "Features", href: "/#features" },
        { name: "Process", href: "/#process" },
        { name: "Pricing", href: "/#pricing" },
    ];

    useEffect(() => {
        const handleScroll = () => {
            const currentScroll = window.scrollY;

            if (currentScroll > lastScrollY.current && currentScroll > 80) {
                setShowNavbar(false);
            } else {
                setShowNavbar(true);
            }

            lastScrollY.current = currentScroll;
        };

        window.addEventListener("scroll", handleScroll, { passive: true });
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    return (
        <>
            <nav className={`fixed top-0 left-0 w-full z-40 bg-white/60 backdrop-blur-md transition-transform duration-400 ${showNavbar ? "translate-y-0" : "-translate-y-full"}`}>
                <div className="flex items-center justify-between px-4 py-4 md:px-16 lg:px-24 xl:px-32 border-b border-gray-200">
                    {appName && appLogo ? (
                        <Link to="/" className="flex items-center gap-2">
                            <img src={appLogo} alt={appName} width={68} height={26} className="h-7 w-auto md:mr-31" />
                            <span className="font-bold text-gray-900 hidden md:block">{appName}</span>
                        </Link>
                    ) : (
                        <div className="h-7 w-20"></div> // Placeholder to maintain spacing when loading
                    )}

                    <div className="hidden md:flex items-center gap-8 text-gray-600">
                        {navLinks.map((link) => (
                            <Link key={link.name} to={link.href} className="hover:text-gray-800">
                                {link.name}
                            </Link>
                        ))}
                    </div>

                    <div className="hidden md:flex items-center gap-2">
                        {isSignedIn ? (
                            <>
                                <Link to="/chat" className="px-6 py-2.5 hover:bg-gray-100 rounded-lg flex items-center">
                                    <MessageSquareIcon className="h-4 w-4 mr-1" />
                                    Chat
                                </Link>
                                <div className="ml-4">
                                    <UserButton 
                                        appearance={{
                                            elements: {
                                                avatarBox: "h-8 w-8"
                                            }
                                        }}
                                    />
                                </div>
                            </>
                        ) : (
                            <>
                                <SignInButton mode="modal">
                                    <button className="px-6 py-2.5 hover:bg-gray-100 rounded-lg">
                                        Login
                                    </button>
                                </SignInButton>
                                <SignUpButton mode="modal">
                                    <button className="bg-linear-to-b from-gray-600 to-gray-800 hover:from-gray-700 hover:to-gray-900 transition px-5 py-2 text-white rounded-lg">
                                        Sign Up
                                    </button>
                                </SignUpButton>
                            </>
                        )}
                    </div>

                    <button onClick={() => setIsOpen(true)} className="transition active:scale-90 md:hidden">
                        <MenuIcon className="size-6.5" />
                    </button>
                </div>
            </nav>

            <div className={`flex flex-col items-center justify-center gap-6 text-lg font-medium fixed inset-0 bg-white/40 backdrop-blur-md z-50 transition-all duration-300 ${isOpen ? "translate-x-0" : "translate-x-full"}`}>
                {appName && appLogo ? (
                    <Link to="/" className="flex items-center gap-2 mb-4">
                        <img src={appLogo} alt={appName} width={48} height={18} className="h-5 w-auto" />
                        <span className="font-bold text-gray-900">{appName}</span>
                    </Link>
                ) : (
                    <div className="h-5 w-16 mb-4"></div> // Placeholder to maintain spacing when loading
                )}
                
                {navLinks.map((link) => (
                    <Link key={link.name} to={link.href} onClick={() => setIsOpen(false)}>
                        {link.name}
                    </Link>
                ))}

                {isSignedIn ? (
                    <>
                        <Link to="/chat" onClick={() => setIsOpen(false)} className="px-6 py-2.5 flex items-center">
                            <MessageSquareIcon className="h-4 w-4 mr-1" />
                            Chat
                        </Link>
                        <div className="px-6 py-2.5">
                            <UserButton 
                                appearance={{
                                    elements: {
                                        avatarBox: "h-8 w-8"
                                    }
                                }}
                            />
                        </div>
                    </>
                ) : (
                    <>
                        <SignInButton mode="modal">
                            <button className="px-6 py-2.5">
                                Login
                            </button>
                        </SignInButton>
                        <SignUpButton mode="modal">
                            <button className="bg-linear-to-b from-gray-600 to-gray-800 px-5 py-2 text-white rounded-lg">
                                Sign Up
                            </button>
                        </SignUpButton>
                    </>
                )}

                <button
                    onClick={() => setIsOpen(false)}
                    className="rounded-md bg-linear-to-b from-gray-600 to-gray-800 p-2 text-white ring-white active:ring-2"
                >
                    <XIcon />
                </button>
            </div>
            <div className="h-18" />
        </>
    );
}