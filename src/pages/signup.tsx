import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { useAuth } from "../context/AuthContext";
import { SyntexService } from "../lib/syntex";
import type { AppInfo } from "../lib/syntex";

export default function Signup() {
    const navigate = useNavigate();
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [appInfo, setAppInfo] = useState<AppInfo | null>(null);

    const { signup } = useAuth();

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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            await signup(name, email, password);
            toast.success("Account created successfully!");
            navigate("/chat");
        } catch (error: any) {
            toast.error(error.message || "Failed to create account");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex h-screen w-full">
            {/* Left side - Visual (Same as Login) */}
            {/* Left side - Visual (Same as Login) */}
            <div className="hidden lg:flex w-1/2 relative items-center justify-center overflow-hidden bg-gray-900">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-900 via-purple-900 to-slate-900 z-0" />

                {/* Animated Shapes */}
                <div className="absolute top-0 -left-4 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob" />
                <div className="absolute top-0 -right-4 w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000" />
                <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000" />

                <div className="absolute inset-0 bg-black/20 backdrop-blur-[1px] z-10" />

                <div className="relative z-20 text-center px-10">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                    >
                        <div className="mb-6 flex justify-center">
                            <div className="h-24 w-24 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-xl overflow-hidden p-4">
                                {appInfo?.app?.branding?.logo?.png ? (
                                    <img
                                        src={appInfo.app.branding.logo.png}
                                        alt={appInfo.app.name}
                                        className="w-full h-full object-contain"
                                    />
                                ) : (
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-10 h-10 text-white"><path d="M12 2a10 10 0 1 0 10 10 4 4 0 0 1-5-5 4 4 0 0 1-5-5 4 4 0 0 1-5-5 4 4 0 0 1-5-5 4 4 0 0 1-5-5 4 4 0 0 1-5-5 4 4 0 0 1-5-5" /></svg>
                                )}
                            </div>
                        </div>
                        <h1 className="text-5xl font-bold text-white mb-6 drop-shadow-md">{appInfo?.app?.name || "Join SundorjoAI"}</h1>
                        <p className="text-xl text-gray-200 max-w-md mx-auto leading-relaxed drop-shadow-sm font-light">
                            Create an account to start your journey with the world's most advanced AI skin intelligence.
                        </p>
                    </motion.div>
                </div>
            </div>

            {/* Right side - Form */}
            <div className="flex-1 flex items-center justify-center p-8 bg-white">
                <div className="w-full max-w-md space-y-8">
                    <div className="text-center lg:text-left">
                        <h2 className="text-3xl font-bold tracking-tight text-gray-900">Create an account</h2>
                        <p className="mt-2 text-sm text-gray-600">
                            Enter your details to get started
                        </p>
                    </div>

                    <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-900">Full Name</label>
                                <Input
                                    type="text"
                                    placeholder="John Doe"
                                    className="h-11"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-900">Email</label>
                                <Input
                                    type="email"
                                    placeholder="name@example.com"
                                    className="h-11"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-900">Password</label>
                                <Input
                                    type="password"
                                    placeholder="Create a password"
                                    className="h-11"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        <Button className="w-full h-11 text-base bg-gray-900 hover:bg-gray-800" type="submit" disabled={isLoading}>
                            {isLoading ? "Creating account..." : "Sign up"}
                        </Button>

                        <p className="text-center text-sm text-gray-600">
                            Already have an account?{" "}
                            <Link to="/login" className="font-medium text-gray-900 hover:underline">Sign in</Link>
                        </p>
                    </form>
                </div>
            </div>
        </div>
    );
}