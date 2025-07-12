import React, { useEffect, useRef, useState } from "react";

function Pinger() {
  const [active, setActive] = useState(false);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (active) {
      console.log("Backend keep-alive started");
      intervalRef.current = setInterval(() => {
        fetch("https://callicom.onrender.com/api/ping")
          .then((res) => {
            if (!res.ok) throw new Error("Ping failed");
            return res.text();
          })
          .then((data) => console.log("Ping success:", data))
          .catch((err) => console.error("Ping error:", err));
      }, 10 * 60 * 1000); // every 10 minutes
    } else {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
      console.log("Backend keep-alive stopped");
    }

    return () => clearInterval(intervalRef.current); // cleanup on unmount
  }, [active]);

  return (
    <div className="">
      <button
        onClick={() => setActive(!active)}
        className={` ${
          active ? "text-red-500 hover:text-red-600" : "text-white hover:text-orange-600"
        }`}
      >
        {active ? "[ᯤ] Stop Pinging" : "[ᯤ] Start Pinging"}
      </button>
    </div>
  );
}

export default Pinger;