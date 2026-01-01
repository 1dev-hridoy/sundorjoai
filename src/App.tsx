import { Routes, Route } from "react-router-dom";
import { Toaster } from "sonner";
import Layout from "./components/layout";
import Home from "./pages/home";
import Login from "./pages/login";
import Chat from "./pages/chat";
import Signup from "./pages/signup";
import { AuthProvider } from "./context/AuthContext";

export default function App() {
    return (
        <AuthProvider>
            <Routes>
                <Route element={<Layout />}>
                    <Route path="/" element={<Home />} />
                </Route>

                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
                <Route path="/chat" element={<Chat />} />
                <Route path="/chat/:chatId" element={<Chat />} />
            </Routes>
            <Toaster position="top-center" richColors />
        </AuthProvider>
    );
}
