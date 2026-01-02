import { Routes, Route } from "react-router-dom";
import { Toaster } from "sonner";
import Layout from "./components/layout";
import Home from "./pages/home";
import Chat from "./pages/chat";
import NotFound from "./pages/NotFound";
import ServerError from "./pages/ServerError";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";
import CookiePolicy from "./pages/CookiePolicy";
import AboutUs from "./pages/AboutUs";
import Careers from "./pages/Careers";
import ContactUs from "./pages/ContactUs";

export default function App() {
    return (
        <>
            <Routes>
                <Route element={<Layout />}>
                    <Route path="/" element={<Home />} />
                    <Route path="/about" element={<AboutUs />} />
                    <Route path="/careers" element={<Careers />} />
                    <Route path="/contact" element={<ContactUs />} />
                    <Route path="/privacy-policy" element={<PrivacyPolicy />} />
                    <Route path="/terms-of-service" element={<TermsOfService />} />
                    <Route path="/cookie-policy" element={<CookiePolicy />} />
                </Route>

                <Route path="/chat" element={<Chat />} />
                <Route path="/chat/:chatId" element={<Chat />} />
                
                {/* Error routes */}
                <Route path="/404" element={<NotFound />} />
                <Route path="/500" element={<ServerError />} />
                
                {/* Catch-all route for 404 */}
                <Route path="*" element={<NotFound />} />
            </Routes>
            <Toaster position="top-center" richColors />
        </>
    );
}