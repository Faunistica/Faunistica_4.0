import type { FC } from "react";
import { Spinner as SpinnerUI } from "@/components/ui/spinner"

const Spinner: FC = () => {
    return (
        <>
            <div className="flex items-center justify-center h-screen">
                <SpinnerUI className="size-10" />
            </div>
        </>
    )
}

export default Spinner