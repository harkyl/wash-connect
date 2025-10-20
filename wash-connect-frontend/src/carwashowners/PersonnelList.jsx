import React, { useEffect, useState } from "react";
import { FaUserCircle, FaMapMarkerAlt, FaEnvelope, FaSearch, FaRegEnvelope, FaRegUser, FaRegCheckSquare, FaRegFolderOpen, FaTrophy, FaBars } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

const typeColors = {
  "Full-Time": "bg-green-100 text-green-700 border-green-400",
  "Part-Time": "bg-blue-100 text-blue-700 border-blue-400",
  "Contractual": "bg-purple-100 text-purple-700 border-purple-400",
};

function PersonnelList() {
  const [personnel, setPersonnel] = useState([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const navigate = useNavigate();

  useEffect(() => {
    const controller = new AbortController();
    const load = async () => {
      try {
        const owner = JSON.parse(localStorage.getItem("carwashOwner") || "{}");
        const token = localStorage.getItem("token");
        if (!owner?.id || !token) {
          navigate("/carwash-login");
          return;
        }

        const res = await fetch(`http://localhost:3000/api/personnel/by-owner/${owner.id}`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          signal: controller.signal,
        });

        if (res.status === 401 || res.status === 403) {
          localStorage.removeItem("carwashOwner");
          localStorage.removeItem("token");
          navigate("/carwash-login");
          return;
        }

        const data = await res.json();
        setPersonnel(Array.isArray(data) ? data : []);
      } catch (err) {
        if (err.name !== "AbortError") setPersonnel([]);
      }
    };
    load();
    return () => controller.abort();
  }, [navigate]);

  const filtered = personnel
    .filter(p => {
      const fullName = `${p.first_name || ""} ${p.last_name || ""}`.trim();
      const q = search.toLowerCase();
      return (
        fullName.toLowerCase().includes(q) ||
        (p.role || "").toLowerCase().includes(q) ||
        (p.email || "").toLowerCase().includes(q)
      );
    })
    .filter(p => filter === "All" || p.type === filter);

  const handleLogout = () => {
    localStorage.removeItem("carwashOwner");
    localStorage.removeItem("token");
    navigate("/carwash-login");
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r flex flex-col">
        {/* Logo */}
        <div className="px-6 py-8">
          <div className="text-3xl flex items-center select-none">
            <span
              className="text-gray-700"
              style={{ fontFamily: '"Great Vibes", cursive', fontSize: "2.2rem" }}
            >
              Wash
            </span>
            <span
              className="ml-2 text-red-500 font-semibold"
              style={{ fontFamily: '"Great Vibes", cursive', fontSize: "2.2rem" }}
            >
              Connect
            </span>
          </div>
        </div>
        {/* Navigation */}
        <nav className="flex-1 px-4 space-y-2">
          <button
            className="w-full flex items-center gap-2 px-3 py-2 rounded hover:bg-gray-100 cursor-pointer transition-colors duration-200"
            onClick={() => navigate("/carwash-dashboard")}
          >
            <FaRegUser /> Overview
          </button>
          <button
            className="w-full flex items-center gap-2 px-3 py-2 rounded bg-blue-100 text-blue-700 font-semibold"
            onClick={() => navigate("/personnel-list")}
          >
            <span className="text-lg">★</span> Customers & Employee
          </button>
          <hr className="my-2 border-gray-300" />
          <button
            className="flex items-center gap-2 mb-1 px-2 py-1 hover:bg-gray-100 rounded cursor-pointer transition-colors duration-200 w-full text-left"
            onClick={() => navigate("/bookings")}
          >
            <FaRegCheckSquare className="text-lg" />
            <span>Manage Bookings</span>
          </button>
          <div className="flex items-center gap-2 mb-1 px-2 py-1 hover:bg-gray-100 rounded cursor-pointer transition-colors duration-200">
            <FaRegCheckSquare className="text-lg" />
            <span>Booking History</span>
          </div>
          <div className="flex items-center gap-2 mt-2 px-2 py-1 hover:bg-gray-100 rounded cursor-pointer transition-colors duration-200" onClick={() => navigate('/earning-dashboard')}>
            <FaTrophy className="text-lg" />
            <span>Earnings Dashboard</span>
          </div>
          {/* NEW: Request Refund link below Earnings Dashboard */}
          <div className="flex items-center gap-2 mt-2 px-2 py-1 hover:bg-gray-100 rounded cursor-pointer transition-colors duration-200" onClick={() => navigate('/refund-request')}>
            <FaRegFolderOpen className="text-lg" />
            <span>Request Refund</span>
          </div>
          <hr className="my-4 border-gray-300" />
        </nav>
        <div className="mt-auto px-4 py-6">
          <button className="flex items-center gap-2 text-gray-700 hover:text-red-500 px-2 py-1 rounded hover:bg-gray-100 cursor-pointer transition-colors duration-200"
            onClick={handleLogout}
          >
            <FaRegFolderOpen className="text-lg" /> Logout
          </button>
        </div>
      </aside>
      {/* Main Content */}
      <div className="flex-1 flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between px-8 py-4 bg-blue-100 border-b">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-semibold">Customers & Employee</h1>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-gray-500">Admin</span>
            <FaUserCircle className="text-2xl text-gray-400" />
          </div>
        </div>
        {/* Tabs and Stats */}
        <div className="bg-white px-8 pt-6 pb-2 border-b flex flex-col gap-4">
          <div className="flex gap-8 items-end">
            <div className="flex gap-4">
              <button
                className="text-gray-400 pb-1 px-2 hover:text-blue-600"
                onClick={() => navigate("/customer-list")}
                type="button"
              >
                Customer
              </button>
              <button className="border-b-2 border-blue-400 text-blue-600 font-semibold pb-1 px-2">
                Personnel
              </button>
            </div>
          </div>
          <div className="flex gap-4 mt-2">
            <div className="bg-blue-50 border border-blue-200 rounded-lg px-6 py-3 flex flex-col items-center">
              <span className="text-2xl font-bold">{personnel.length}</span>
              <span className="text-xs text-gray-500">All Employee</span>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg px-6 py-3 flex flex-col items-center">
              <span className="text-2xl font-bold">
                {personnel.filter(p => p.type === "Full-Time").length}
              </span>
              <span className="text-xs text-gray-500">Full-time</span>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg px-6 py-3 flex flex-col items-center">
              <span className="text-2xl font-bold">
                {personnel.filter(p => p.type === "Part-Time").length}
              </span>
              <span className="text-xs text-gray-500">Part-time</span>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg px-6 py-3 flex flex-col items-center">
              <span className="text-2xl font-bold">
                {personnel.filter(p => p.type === "Contractual").length}
              </span>
              <span className="text-xs text-gray-500">Contractual</span>
            </div>
          </div>
        </div>
        {/* Search and Actions */}
        <div className="flex items-center justify-between px-8 py-4 bg-white border-b">
          <div className="flex items-center gap-2">
            <FaSearch className="text-gray-400" />
            <input
              type="text"
              placeholder="Search"
              className="border rounded px-2 py-1 text-sm"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <select
              className="border rounded px-2 py-1 text-sm"
              value={filter}
              onChange={e => setFilter(e.target.value)}
            >
              <option value="All">Employee Type</option>
              <option value="Full-Time">Full-time</option>
              <option value="Part-Time">Part-time</option>
              <option value="Contractual">Contractual</option>
            </select>
            <button className="bg-blue-500 text-white px-3 py-1 rounded flex items-center gap-1 text-sm font-medium hover:bg-blue-600"
                onClick={() => window.location.href = "/add-employee"}
              >
              Add Employee <span className="text-lg">+</span>
            </button>
          </div>
        </div>
        {/* Personnel List */}
        <div className="flex-1 overflow-y-auto px-8 py-6 bg-gray-50">
          <h2 className="text-lg font-semibold mb-4">All personnel</h2>
          {filtered.length === 0 ? (
            <div className="text-center text-gray-400 mt-12 text-lg">
              No personnel available. Please add personnel.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map((p) => (
                <div
                  key={p.personnelId}
                  className="bg-white rounded-xl border border-gray-300 p-4 flex flex-col gap-2 relative"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={
                        p.avatar
                          ? p.avatar.startsWith("/uploads")
                            ? `http://localhost:3000${p.avatar}` // Show uploaded photo from backend
                            : p.avatar // If avatar is a full URL
                          : `https://ui-avatars.com/api/?name=${encodeURIComponent(
                              `${p.first_name || ""} ${p.last_name || ""}`.trim()
                            )}`
                      }
                      alt=""
                      className="w-10 h-10 rounded-full object-cover border"
                    />
                    <div className="flex-1">
                      <div className="font-semibold text-base">
                        {p.first_name} {p.last_name}
                      </div>
                      <div className="text-xs text-blue-500">{p.role}</div>
                    </div>
                    {p.type && (
                      <span
                        className={`ml-2 px-2 py-0.5 rounded-full border text-xs font-semibold ${typeColors[p.type] || "border-gray-300 text-gray-500"}`}
                      >
                        {p.type}
                      </span>
                    )}
                  </div>
                  <div className="mt-2">
                    <div className="flex items-center text-xs text-gray-600 mb-1">
                      <FaMapMarkerAlt className="mr-1 text-gray-400" />
                      <span>{p.address}</span>
                    </div>
                    <div className="flex items-center text-xs text-gray-600">
                      <FaEnvelope className="mr-1 text-gray-400" />
                      <span>{p.email}</span>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-3">
                    <button
                      className="flex-1 bg-blue-500 text-white rounded px-3 py-1 text-xs font-medium hover:bg-blue-600"
                      onClick={() => navigate(`/personnel-details/${p.personnelId}`, { state: { personnel: p } })}
                    >
                      View Details
                    </button>
                    {/* Removed "Assigned to" button */}
                    <button className="text-gray-400 hover:text-gray-700 px-2"
                      onClick={() => navigate("/personnel-edit", { state: { personnel: p } })}
                    >
                      <svg width="20" height="20" fill="currentColor">
                        <circle cx="10" cy="5" r="1.5" />
                        <circle cx="10" cy="10" r="1.5" />
                        <circle cx="10" cy="15" r="1.5" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default PersonnelList;