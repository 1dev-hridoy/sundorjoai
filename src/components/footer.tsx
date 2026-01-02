import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { SyntexService } from "../lib/syntex";
import type { AppInfo } from "../lib/syntex";

export default function Footer() {
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
    const appDescription = appInfo?.app?.description?.short;
    const copyrightText = appInfo?.copyright;

    return (
        <footer className="relative overflow-hidden px-6 md:px-16 lg:px-24 xl:px-32 w-full text-sm text-slate-500 bg-white pt-10">
            {appLogo && (
                <img
                    src={appLogo}
                    alt={appName}
                    width={400}
                    height={400}
                    className="hidden md:block absolute -bottom-30 -left-80 opacity-5 w-full h-full pointer-events-none"
                />
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-14">
                <div className="sm:col-span-2 lg:col-span-1">
                    {appName && appLogo ? (
                        <Link to="/" className="flex items-center gap-2">
                            <img
                                src={appLogo}
                                alt={appName}
                                width={68}
                                height={26}
                                className="h-7 w-auto"
                            />
                            <span className="font-bold text-gray-900 hidden md:block">{appName}</span>
                        </Link>
                    ) : (
                        <div className="h-7 w-20"></div> 
                    )}
                    <p className="text-sm/7 mt-6">{appDescription || "Sundorjo AI is a specialized innovation by ScriptySphere."}</p>
                </div>
                <div className="flex flex-col lg:items-center lg:justify-center">
                    <div className="flex flex-col text-sm space-y-2.5">
                        <h2 className="font-semibold mb-5 text-gray-800">Company</h2>
                        <Link to="/about" className="hover:text-slate-600 transition">About us</Link>
                        <Link to="/careers" className="hover:text-slate-600 transition">Careers</Link>
                        <Link to="/contact" className="hover:text-slate-600 transition">Contact us</Link>
                        <Link to="/privacy-policy" className="hover:text-slate-600 transition">Privacy policy</Link>
                    </div>
                </div>
                <div>
                    <h2 className="font-semibold text-gray-800 mb-5">Subscribe to our newsletter</h2>
                    <div className="text-sm space-y-6 max-w-sm">
                        <p>The latest news, articles, and resources, sent to your inbox weekly.</p>
                        <div className="flex items-center">
                            <input className="rounded-l-md bg-gray-100 outline-none w-full max-w-64 h-11 px-3" type="email" placeholder="Enter your email" />
                            <button className="bg-linear-to-b from-gray-600 to-gray-800 hover:from-gray-700 hover:to-gray-900 transition px-4 h-11 text-white rounded-r-md">Subscribe</button>
                        </div>
                    </div>
                </div>
            </div>
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 py-4 border-t mt-6 border-slate-200">
                <p className="text-center">
                    {copyrightText || "© 2026 Sundorjo AI. A specialized innovation by ScriptySphere."}
                </p>
                <div className="flex items-center gap-4">
                    <Link to="/privacy-policy">
                        Privacy Policy
                    </Link>
                    <Link to="/terms-of-service">
                        Terms of Service
                    </Link>
                    <Link to="/cookie-policy">
                        Cookie Policy
                    </Link>
                </div>
            </div>
        </footer>
    );
};