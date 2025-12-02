import React from "react";
import { useNavigate } from "react-router-dom";

function AwaitingApproval() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sky-50 to-cyan-100">
      <div className="bg-white rounded-2xl shadow-lg p-10 border border-gray-200 max-w-md w-full text-center">
        <h1 className="text-3xl font-bold text-cyan-500 mb-4">Application Submitted!</h1>
        <p className="text-gray-700 mb-6">
          Your carwash application has been submitted and is now awaiting admin approval.<br />
          You will be notified once your application is reviewed.
        </p>
        <button
          className="bg-cyan-500 text-white px-6 py-2 rounded font-semibold hover:bg-cyan-600 transition"
          onClick={() => navigate("/login")}
        >
          Back to Login
        </button>
      </div>
    </div>
  );
}

export default AwaitingApproval;