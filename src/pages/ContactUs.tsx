import { useEffect, useState } from "react";
import ContactForm from "../components/ContactForm";
import { Skeleton } from "../components/ui/skeleton";

export default function ContactUs() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
 
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen bg-white">
      <main className="max-w-7xl mx-auto px-4 py-4 md:px-16 lg:px-24 xl:px-32">
        <div className="text-center mb-12 pt-24">
          <h1 className="text-4xl/17 md:text-5xl/20 font-semibold text-gray-900">Contact Us</h1>
          <p className="text-base text-gray-500 max-w-md mx-auto mt-4">
            We'd love to hear from you. Send us a message and we'll respond as soon as possible.
          </p>
        </div>

        {isLoading ? (
          <div className="space-y-8 max-w-2xl mx-auto">
            {/* Loading skeleton for form */}
            <div className="space-y-4">
              <Skeleton className="h-6 w-1/4 mx-auto" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6 mx-auto" />
            </div>
            
            <div className="space-y-4">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-32 w-full" />
            </div>
            
            <div className="pt-4">
              <Skeleton className="h-12 w-full" />
            </div>
          </div>
        ) : (
          <div className="space-y-12">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              <div className="space-y-8">
                <div>
                  <h2 className="text-2xl font-semibold text-gray-900 mb-4">Get in Touch</h2>
                  <p className="text-gray-700 mb-6">
                    Have questions about our services? Want to learn more about our AI solutions? We're here to help. 
                    Reach out to us using the form, and our team will get back to you as soon as possible.
                  </p>
                </div>

                <div className="space-y-6">
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0 bg-gray-100 p-3 rounded-lg">
                      <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">Email</h3>
                      <p className="text-gray-600">contact@sundorjoai.com</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0 bg-gray-100 p-3 rounded-lg">
                      <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path>
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">Phone</h3>
                      <p className="text-gray-600">+1 (555) 123-4567</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0 bg-gray-100 p-3 rounded-lg">
                      <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">Office</h3>
                      <p className="text-gray-600">123 Innovation Drive, Tech City, TC 12345</p>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <ContactForm />
              </div>
            </div>

            <div className="bg-gray-50 rounded-2xl p-8 mt-12">
              <h2 className="text-2xl font-semibold text-gray-900 mb-6">Frequently Asked Questions</h2>
              <div className="space-y-4">
                <div className="border-b border-gray-200 pb-4">
                  <h3 className="font-medium text-gray-900">How quickly do you respond to inquiries?</h3>
                  <p className="text-gray-600 mt-2">We typically respond to all inquiries within 24 hours during business days.</p>
                </div>
                <div className="border-b border-gray-200 pb-4">
                  <h3 className="font-medium text-gray-900">Do you offer technical support?</h3>
                  <p className="text-gray-600 mt-2">Yes, our technical support team is available to help with any issues related to our services.</p>
                </div>
                <div className="pb-4">
                  <h3 className="font-medium text-gray-900">Can I schedule a demo?</h3>
                  <p className="text-gray-600 mt-2">Absolutely! Contact us to schedule a personalized demo of our platform.</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}