import { FanIcon, ChevronsUpDown, LogOutIcon, User2Icon } from "lucide-react";

const NavFooterButton = ({ }) => {
    return (
        <div className="dropdown dropdown-right dropdown-end">
            <div tabIndex={0} role="button" className="flex gap-2.5 items-center text-sm font-medium py-2 px-2 rounded-lg cursor-pointer
                text-neutral-700 hover:text-neutral-900 bg-neutral-50 hover:bg-neutral-100 focus:bg-neutral-100">
                <div className="flex items-center justify-center w-8 h-8 bg-emerald-400 rounded-lg">
                    <FanIcon className="w-4 h-4 font-light text-white" />
                </div>
                <div className="flex flex-col text-xs">
                    <div className="font-bold tracking-wide">
                        Ninja
                    </div>
                    <div className="flex font-inter-l tracking-wide">
                        shadow
                    </div>
                </div>
                <div className="flex-1"></div>
                <ChevronsUpDown className="w-4 h-4" />
            </div>
            <div tabIndex="-1" className="dropdown-content left-[102%] menu bg-base-100 rounded-lg z-1 w-48 p-1 shadow-sm border border-neutral-200 bg-neutral-50 transition-all">
                <div className="flex flex-col gap-1">
                    <button className="flex gap-1.5 items-center text-xs font-inter-l capitalize py-0 px-2 relative">
                        <span>
                            <User2Icon className="w-3.5 h-3.5 mr-2 relative -top-px" />
                        </span>
                        <span>
                            profile
                        </span>
                    </button>
                    <button className="flex gap-1.5 items-center text-xs font-inter-l capitalize py-0 px-2 relative">
                        <span>
                            <LogOutIcon className="w-3.5 h-3.5 mr-2 relative -top-px" />
                        </span>
                        <span>
                            deconnexion
                        </span>
                    </button>
                </div>
            </div>
        </div >
    );
};

export default NavFooterButton;