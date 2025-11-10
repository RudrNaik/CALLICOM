import { useEffect, useState } from "react";

function IntelReport({title, image, fluff, content}){

    return (
        <div className="cols-span-3">
            <h1 className="border-orange-500 border-l-8 px-2 text-5xl">{title}</h1>
            <h3 className="border-neutral-400 border-l-4 px-2 mt-2 text-md">{fluff}</h3>
            <p className="text-xs text-neutral-100 whitespace-pre-line mt-2 mb-4">
                {content}
            </p>
        </div>
    )
}

export default IntelReport