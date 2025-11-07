import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

function BannedPage() {
  const navigate = useNavigate();
  const [secondsLeft, setSecondsLeft] = useState(3);

  useEffect(() => {
    const tick = setInterval(() => setSecondsLeft((s) => (s > 0 ? s - 1 : 0)), 1000);
    const to = setTimeout(() => navigate("/login", { replace: true }), 3000);
    return () => {
      clearInterval(tick);
      clearTimeout(to);
    };
  }, [navigate]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white shadow-lg rounded-lg p-10 text-center">
        <h1 className="text-3xl font-bold text-red-600 mb-4">Access Denied</h1>
        <p className="text-lg text-gray-700 mb-2">You are unable to access this webpage.</p>
        <p className="text-sm text-gray-500 mb-6">
          Redirecting to login in {secondsLeft}s...
        </p>
        <img
          src="https://cdn-icons-png.flaticon.com/512/463/463612.png"
          alt="Banned"
          className="mx-auto w-24 h-24 mb-6"
        />
        <button
          onClick={() => navigate("/login", { replace: true })}
          className="bg-red-500 hover:bg-red-600 text-white font-semibold px-6 py-2 rounded"
        >
          Back to Login
        </button>
      </div>
    </div>
  );
}

export default BannedPage;