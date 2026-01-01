import { SparklesIcon, TrendingUpIcon } from "lucide-react";
import Marquee from "react-fast-marquee";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

interface Prompt {
    label: string;
    prompt: string;
}

export default function HeroSection() {
    const [prompt, setPrompt] = useState("");
    const [selected, setSelected] = useState<string | null>(null);
    const [textIndex, setTextIndex] = useState(0);
    const [charIndex, setCharIndex] = useState(0);
    const [deleting, setDeleting] = useState(false);

    // Auth & Navigation
    const navigate = useNavigate();
    const { user } = useAuth();


    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (!prompt.trim()) return;

        if (!user) {
            // If not logged in, go to login
            navigate("/login");
            return;
        }

        // If logged in, go to chat with the prompt
        navigate(`/chat?initialPrompt=${encodeURIComponent(prompt)}`);
    };

    const placeholders = [
        "acne diagnosis...",
        "skin rash treatment...",
        "anti-aging routine...",
        "dry skin remedy...",
        "sunburn care...",
    ];


    const prompts: Prompt[] = [
        {
            label: "Acne Analysis",
            prompt: "Analyze my acne condition and suggest a treatment plan with suitable products",
        },
        {
            label: "Anti-Aging Routine",
            prompt: "Create a personalized anti-aging skincare routine for reducing fine lines and wrinkles",
        },
        {
            label: "Dry Skin Care",
            prompt: "Recommend a daily routine and products for severe dry and flaky skin",
        },
        {
            label: "Rash Identification",
            prompt: "Help me identify this skin rash and provide immediate relief measures",
        },
        {
            label: "Oily Skin Control",
            prompt: "Suggest a skincare workflow to control excess oil and minimize pores",
        },
        {
            label: "Dark Spot Removal",
            prompt: "What are the most effective treatments for hyperpigmentation and dark spots?",
        },
        {
            label: "Sensitive Skin",
            prompt: "Recommend hypoallergenic products for extremely sensitive and reactive skin",
        },
    ];


    useEffect(() => {
        if (prompt) return;

        const currentWord = placeholders[textIndex];

        if (!deleting && charIndex === currentWord.length) {
            setTimeout(() => setDeleting(true), 2000);
            return;
        }

        if (deleting && charIndex === 0) {
            setDeleting(false);
            setTextIndex((prev) => (prev + 1) % placeholders.length);
            return;
        }

        const timeout = setTimeout(() => {
            setCharIndex((prev) => prev + (deleting ? -1 : 1));
        }, 50);

        return () => clearTimeout(timeout);
    }, [charIndex, deleting, textIndex, prompt]);

    const animatedPlaceholder = placeholders[textIndex].substring(0, charIndex);

    return (
        <section id="home" className="flex flex-col items-center justify-center">
            <div className="flex items-center gap-2 text-gray-500 mt-32">
                <TrendingUpIcon className="size-4.5" />
                <span>Trusted by 2,000+ users for skin health</span>
            </div>

            <h1 className="text-center text-5xl/17 md:text-[64px]/20 font-semibold max-w-2xl m-2">
                Your Personal AI Dermatologist
            </h1>

            <p className="text-center text-base text-gray-500 max-w-md mt-2">
                "Upload an image or describe your skin problem to get instant treatment suggestions from our advanced AI."
            </p>

            <form
                onSubmit={handleSubmit}
                className="relative max-w-2xl w-full mt-8 rounded-2xl group isolate"
            >
                {/* 4-Side Creative Glow Animation */}
                <div className="absolute inset-[-2px] rounded-2xl overflow-hidden pointer-events-none">
                    <div className="absolute inset-[-100%] top-[-50%] left-[-50%] w-[200%] h-[200%] animate-border-spin bg-[conic-gradient(transparent_0deg,rgba(168,85,247,0.4)_60deg,rgba(236,72,153,0.4)_120deg,transparent_180deg,rgba(168,85,247,0.4)_240deg,rgba(236,72,153,0.4)_300deg,transparent_360deg)]" />
                </div>

                {/* Inner Container */}
                <div className="relative rounded-2xl bg-white border border-gray-100 flex flex-col focus-within:ring-4 focus-within:ring-purple-500/20 transition-all duration-300 focus-within:border-purple-500 hover:shadow-lg hover:shadow-purple-500/10">
                    <textarea
                        className="w-full resize-none p-4 md:p-6 outline-none text-gray-700 placeholder:text-gray-400 text-lg rounded-t-xl bg-transparent"
                        placeholder={`Ask about ${animatedPlaceholder}`}
                        rows={3}
                        minLength={10}
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                                e.preventDefault();
                                if (prompt.trim()) {
                                    if (!user) navigate("/login");
                                    else navigate(`/chat?initialPrompt=${encodeURIComponent(prompt)}`);
                                }
                            }
                        }}
                        required
                    />

                    <div className="flex items-center justify-between px-4 pb-4 md:px-6 md:pb-6 pt-0">
                        <div className="text-xs text-gray-400 font-medium hidden sm:block">
                            Press <kbd className="font-sans px-1.5 py-0.5 bg-gray-100 border border-gray-200 rounded text-[10px]">Enter</kbd> to generate
                        </div>
                        <button className="flex items-center bg-gray-900 hover:bg-black text-white px-5 h-10 rounded-xl transition-all shadow-md hover:shadow-lg active:scale-95 ml-auto z-10">
                            <SparklesIcon className="size-4.5" />
                            <span className="ml-2 font-medium">Generate</span>
                        </button>
                    </div>
                </div>
            </form>

            <Marquee gradient speed={30} pauseOnHover className="max-w-2xl w-full mt-3" >
                {prompts.map((item) => {
                    const isSelected = selected === item.label;

                    return (
                        <button key={item.label}
                            onClick={() => {
                                setPrompt(item.prompt);
                                setSelected(item.label);
                            }}
                            className={`px-4 py-1.5 mx-2 border rounded-full transition
                                ${isSelected
                                    ? "bg-gray-200 text-gray-800 border-gray-300 cursor-not-allowed"
                                    : "text-gray-500 bg-gray-50 border-gray-200 hover:bg-gray-100"
                                }
                            `}
                        >
                            {item.label}
                        </button>
                    );
                })}
            </Marquee>
        </section >
    );
}