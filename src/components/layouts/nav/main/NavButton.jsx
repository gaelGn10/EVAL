import { FanIcon } from "lucide-react";
import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";

const NavButton = ({ to, label, icon }) => {
    const location = useLocation();
    const [active, setActive] = useState(false);

    useEffect(() => {
        setActive(location.pathname === to);
    }, [location, to]);

    return (
        <Link to={to}>
            <div className={`flex gap-3 items-center px-2 py-2 rounded hover:bg-neutral-300 hover:text-neutral-800 active:bg-neutral-800 active:text-neutral-200 ${active ? "bg-neutral-800 text-neutral-200" : "text-neutral-800 bg-transparent"} transition-all`}>
                <div className="flex items-center justify-center w-4 h-4 ml-1">
                    {icon ? icon : <FanIcon />}
                </div>
                <div className="flex text-sm capitalize font-inter-l">
                    {label}
                </div>
            </div>
        </Link>
    );
};

export default NavButton;