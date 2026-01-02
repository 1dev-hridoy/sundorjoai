import { useState } from "react";
import { Button } from "./ui/button";

interface ContactFormData {
    name: string;
    email: string;
    message: string;
}

export default function ContactForm() {
    const [formData, setFormData] = useState<ContactFormData>({
        name: "",
        email: "",
        message: ""
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitSuccess, setSubmitSuccess] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        
        
        if (name === "name" && value.length > 100) {
            return; 
        }
        if (name === "message" && value.length > 1000) {
            return; 
        }
        
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };


    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setSubmitError(null);

        try {
            const response = await fetch('/api/contact/submit', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData)
            });

       
            if (!response.ok) {
          
                
                let errorMessage = 'Failed to submit form. Please try again.';
                try {
                    const errorData = await response.json();
                    errorMessage = errorData.message || errorMessage;
                } catch (parseError) {
                  
                    

                    errorMessage = response.statusText || errorMessage;
                }
                setSubmitError(errorMessage);
                return;
            }

            const result = await response.json();

            if (result.success) {
                setSubmitSuccess(true);
                setFormData({ name: "", email: "", message: "" });
                
           
                setTimeout(() => {
                    setSubmitSuccess(false);
                }, 3000);
            } else {
                setSubmitError(result.message || "Failed to submit form. Please try again.");
            }
        } catch (error) {
            console.error("Error submitting contact form:", error);
            setSubmitError("An error occurred. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="w-full max-w-2xl mx-auto">
            <form onSubmit={handleSubmit} className="space-y-6">
                {submitSuccess && (
                    <div className="p-4 mb-4 text-sm text-green-700 bg-green-100 rounded-lg">
                        Thank you for your message! We'll get back to you soon.
                    </div>
                )}
                
                {submitError && (
                    <div className="p-4 mb-4 text-sm text-red-700 bg-red-100 rounded-lg">
                        {submitError}
                    </div>
                )}

                <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                        Name <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="text"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                        maxLength={100}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition"
                        placeholder="Enter your name (max 100 characters)"
                    />
                    <div className="text-xs text-gray-500 mt-1 text-right">{formData.name.length}/100</div>
                </div>

                <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                        Email <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition"
                        placeholder="Enter your email"
                    />
                </div>

                <div>
                    <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
                        Message <span className="text-red-500">*</span>
                    </label>
                    <textarea
                        id="message"
                        name="message"
                        value={formData.message}
                        onChange={handleChange}
                        required
                        rows={5}
                        maxLength={1000}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition resize-none"
                        placeholder="Enter your message (max 1000 characters)"
                    />
                    <div className="text-xs text-gray-500 mt-1 text-right">{formData.message.length}/1000</div>
                </div>

                <div className="pt-4">
                    <Button 
                        type="submit" 
                        disabled={isSubmitting || formData.name.length === 0 || formData.email.length === 0 || formData.message.length === 0}
                        className="w-full bg-gray-900 hover:bg-black text-white px-6 py-3 rounded-lg transition-all shadow-md hover:shadow-lg active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isSubmitting ? "Sending..." : "Send Message"}
                    </Button>
                </div>
            </form>
        </div>
    );
}