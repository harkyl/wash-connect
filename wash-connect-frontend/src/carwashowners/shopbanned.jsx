import React, { useEffect, useState } from "react";
import { FaBan } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

export default function ShopBanned() {
  const navigate = useNavigate();
  const [secondsLeft, setSecondsLeft] = useState(3);

  useEffect(() => {
    const tick = setInterval(() => setSecondsLeft(s => (s > 0 ? s - 1 : 0)), 1000);
    const to = setTimeout(() => navigate("/carwash-login", { replace: true }), 3000);
    return () => {
      clearInterval(tick);
      clearTimeout(to);
    };
  }, [navigate]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
      <div className="bg-white shadow-lg rounded-2xl p-8 flex flex-col items-center border border-red-200">
        <FaBan className="text-6xl text-red-500 mb-4" />
        <h1 className="text-2xl font-bold text-red-700 mb-2">Carwash Shop Banned</h1>
        <p className="text-gray-700 mb-2 text-center">
          Your carwash shop account has been banned.<br />
          Please contact support if you believe this is a mistake.
        </p>
        <p className="text-sm text-gray-500 mb-6">
          Redirecting to login in {secondsLeft}s...
        </p>
        <button
          className="bg-red-500 hover:bg-red-600 text-white font-semibold px-6 py-2 rounded shadow"
          onClick={() => navigate("/carwash-login", { replace: true })}
        >
          Back to Login
        </button>
      </div>
    </div>
  );
}