import { useEffect, useRef, useState } from "react";

type Step = {
    title: string;
    description: string;
};

const leftSteps: Step[] = [
    {
        title: "Snap or Describe",
        description:
            "Take a clear photo of your skin concern or describe your symptoms in detail. Our interface is designed to capture all necessary information for an accurate analysis.",
    },
    {
        title: "Receive Treatment Plan",
        description:
            "Get an instant, personalized treatment plan including recommended products, routines, and lifestyle advice tailored to your specific skin needs.",
    },
];

const rightSteps: Step[] = [
    {
        title: "AI Dermatologist Analysis",
        description:
            "Our advanced AI analyzes your input against a vast database of dermatological conditions to identify potential issues and their severity with high accuracy.",
    },
    {
        title: "Track Your Progress",
        description:
            "Save your analysis history and track the improvement of your skin over time. Our AI learns from your feedback to provide even better recommendations.",
    },
];

export default function BuildProcess() {
    const segmentRefs = useRef<HTMLDivElement[]>([]);
    const [progress, setProgress] = useState<number[]>([0, 0, 0]);


    useEffect(() => {
        const handleScroll = () => {
            const updated = segmentRefs.current.map((el) => {
                if (!el) return 0;

                const rect = el.getBoundingClientRect();
                const windowHeight = window.innerHeight;

                const start = windowHeight * 0.6;
                const end = windowHeight * 0.2;

                let percent = (start - rect.top) / (start - end);

                percent = Math.min(Math.max(percent, 0), 1);

                return percent;
            });

            setProgress(updated);
        };

        window.addEventListener("scroll", handleScroll, { passive: true });
        handleScroll();

        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    return (
        <section id="process" className="flex flex-col items-center mt-32">
            <p className="font-domine">Simple 4-Step Process</p>

            <h3 className="text-3xl max-w-sm text-gray-500 text-center mt-5">
                Get Your Diagnosis in Just Four Simple Steps
            </h3>

            <div className="flex flex-col md:flex-row mt-20 md:mt-32">
                <div>
                    {leftSteps.map((step, index) => (
                        <div key={index} className="max-w-lg h-60 md:mt-60">
                            <h3 className="text-xl underline font-domine">{step.title}</h3>
                            <p className="mt-6 text-gray-500 text-sm/6">{step.description}</p>
                        </div>
                    ))}
                </div>

                <div className="hidden md:flex flex-col items-center">
                    <div className="size-4 bg-gray-800" />

                    {[0, 1, 2].map((i) => (
                        <div key={i} className="flex flex-col items-center">
                            <div ref={(el) => { if (el) segmentRefs.current[i] = el; }} data-index={i} className="relative w-0.5 mx-10 h-60 bg-gray-300 overflow-hidden" >
                                <div style={{ height: `${progress[i] * 100}%` }} className="absolute top-0 left-0 w-full bg-gray-800" />
                            </div>
                            <div className={`size-4 ${progress[i] > 0.95 ? "bg-gray-800" : "bg-gray-300"}`} />
                        </div>
                    ))}
                </div>

                <div>
                    {rightSteps.map((step, index) => (
                        <div key={index} className={`max-w-lg h-60 ${index === 0 ? "" : "md:mt-60"}`} >
                            <h3 className="text-xl underline font-domine">{step.title}</h3>
                            <p className="mt-6 text-gray-500 text-sm/6">{step.description}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}