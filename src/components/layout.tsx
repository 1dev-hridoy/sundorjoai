import { Outlet } from "react-router-dom";
import Navbar from "./navbar";
import Footer from "./footer";
import LenisScroll from "./lenis";
import { TooltipProvider } from "./ui/tooltip";

const Layout = () => {
    return (
        <TooltipProvider>
            <>
                <Navbar />
                <LenisScroll />

                <main className="px-4 py-4 md:px-16 lg:px-24 xl:px-32">
                    <Outlet />
                </main>

                <Footer />
            </>
        </TooltipProvider>
    );
};

export default Layout;