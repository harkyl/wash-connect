import React, { useState, useEffect } from "react";
import { FaRegEye, FaRegCheckSquare, FaTrophy, FaRegFolderOpen } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

export default function RefundRequest() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    // Try both possible keys to stay backward compatible
    const ownerData =
      JSON.parse(localStorage.getItem("carwashOwner") || "null") ||
      JSON.parse(localStorage.getItem("owner") || "null") ||
      {};

    const applicationId =
      ownerData.applicationId ||
      ownerData.application_id ||
      ownerData.appId ||
      null;

    if (!applicationId) {
      setFetchError("No applicationId found. Please log in again.");
      setLoading(false);
      return;
    }

    const controller = new AbortController();

    fetch(`http://localhost:3000/api/refunds?ownerId=${applicationId}`, {
      signal: controller.signal,
    })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data) => {
        // Ensure array
        setRequests(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch((err) => {
        if (err.name !== "AbortError") {
          setFetchError(err.message || "Failed to load refund requests.");
          setLoading(false);
        }
      });

    return () => controller.abort();
  }, []);

  const handleAction = async (id, action) => {
    try {
      const res = await fetch(`http://localhost:3000/api/refunds/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: action }),
      });
      if (!res.ok) throw new Error("Failed to update status");
      setRequests((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status: action } : r))
      );
    } catch (e) {
      alert(e.message);
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r flex flex-col">
        <div className="px-6 py-8">
          <div className="text-3xl flex items-center select-none">
            <span className="text-gray-700" style={{ fontFamily: '"Great Vibes", cursive', fontSize: "2.2rem" }}>Wash</span>
            <span className="ml-2 text-red-500 font-semibold" style={{ fontFamily: '"Great Vibes", cursive', fontSize: "2.2rem" }}>Connect</span>
          </div>
        </div>
        <nav className="flex-1 px-4 space-y-2">
          <button
            className="w-full flex items-center gap-2 px-3 py-2 rounded transition-colors duration-200 hover:bg-gray-100 cursor-pointer"
            onClick={() => navigate("/carwash-dashboard")}
          >
            <FaRegEye className="text-lg" />
            <span>Overview</span>
          </button>
          <button
            className="w-full flex items-center gap-2 px-3 py-2 rounded transition-colors duration-200 hover:bg-gray-100 cursor-pointer"
            onClick={() => navigate("/customer-list")}
          >
            <span className="text-lg">★</span>
            <span>Customers & Employee</span>
          </button>
          <button
            className="flex items-center gap-2 mb-1 px-2 py-1 hover:bg-gray-100 rounded cursor-pointer transition-colors duration-200 w-full text-left"
            onClick={() => navigate("/status-update")}
          >
            <FaRegCheckSquare className="text-lg" />
            <span>Status Update</span>
          </button>
          <hr className="my-2 border-gray-300" />
          <button
            className="flex items-center gap-2 mb-1 px-2 py-1 hover:bg-gray-100 rounded cursor-pointer transition-colors duration-200 w-full text-left"
            onClick={() => navigate("/bookings")}
          >
            <FaRegCheckSquare className="text-lg" />
            <span>Manage Bookings</span>
          </button>
          <button
            className="flex items-center gap-2 mb-1 px-2 py-1 hover:bg-gray-100 rounded cursor-pointer transition-colors duration-200 w-full text-left"
            onClick={() => navigate("/booking-history")}
          >
            <FaRegCheckSquare className="text-lg" />
            <span>Booking History</span>
          </button>
          <div className="flex items-center gap-2 mt-2 px-2 py-1 hover:bg-gray-100 rounded cursor-pointer transition-colors duration-200" onClick={() => navigate('/earning-dashboard')}>
            <FaTrophy className="text-lg" />
            <span>Earnings Dashboard</span>
          </div>
          {/* Highlight Request Refund tab */}
          <div className="flex items-center gap-2 mt-2 px-2 py-1 bg-blue-100 text-blue-700 font-semibold rounded cursor-pointer transition-colors duration-200" onClick={() => navigate('/refund-request')}>
            <FaRegFolderOpen className="text-lg" />
            <span>Request Refund</span>
          </div>
          <hr className="my-4 border-gray-300" />
        </nav>
        <div className="mt-auto px-4 py-6">
          <button
            className="flex items-center gap-2 text-gray-700 hover:text-red-500 px-2 py-1 rounded hover:bg-gray-100 cursor-pointer transition-colors duration-200"
            onClick={() => {
              localStorage.removeItem("token");
              localStorage.removeItem("carwashOwner");
              navigate("/carwash-login");
            }}
          >
            Logout
          </button>
        </div>
      </aside>
      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center overflow-y-auto">
        <div className="w-full max-w-3xl mx-auto mt-10 p-6 bg-white rounded-lg shadow-lg">
          <h2 className="text-2xl font-bold mb-6 text-gray-800 text-center">
            Refund Requests
          </h2>

          {loading && <div className="text-center text-gray-500">Loading...</div>}

          {!loading && fetchError && (
            <div className="text-center text-red-600 font-medium">{fetchError}</div>
          )}

          {!loading && !fetchError && requests.length === 0 && (
            <p className="text-center text-gray-500">No refund requests.</p>
          )}

          {!loading && !fetchError && requests.length > 0 && (
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white border border-gray-200 rounded-lg">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="py-3 px-4 text-left font-semibold text-gray-700">Customer</th>
                    <th className="py-3 px-4 text-left font-semibold text-gray-700">Amount</th>
                    <th className="py-3 px-4 text-left font-semibold text-gray-700">Reason</th>
                    <th className="py-3 px-4 text-left font-semibold text-gray-700">Status</th>
                    <th className="py-3 px-4 text-left font-semibold text-gray-700">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {requests.map(req => (
                    <tr key={req.id} className="border-t border-gray-200 hover:bg-gray-50">
                      <td className="py-3 px-4">{req.customer}</td>
                      <td className="py-3 px-4">
                        {req.amount ? `₱${Number(req.amount).toFixed(2)}` : "-"}
                      </td>
                      <td className="py-3 px-4">{req.reason}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-semibold ${
                            req.status === "Pending"
                              ? "bg-yellow-100 text-yellow-800"
                              : req.status === "Approved"
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {req.status}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {req.status === "Pending" ? (
                          <div className="flex gap-2">
                            <button
                              className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded transition"
                              onClick={() => handleAction(req.id, "Approved")}
                            >
                              Approve
                            </button>
                            <button
                              className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded transition"
                              onClick={() => handleAction(req.id, "Rejected")}
                            >
                              Reject
                            </button>
                          </div>
                        ) : (
                          <span className="text-gray-500">{req.status}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

