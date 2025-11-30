import React, { useEffect, useState } from "react";
import {
  FaUserCircle,
  FaMapMarkerAlt,
  FaEnvelope,
  FaSearch,
  FaRegEye,
  FaRegCheckSquare,
  FaRegFolderOpen,
  FaTrophy,
  FaBars,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";

const typeColors = {
  "Full-Time": "bg-green-100 text-green-700 border-green-400",
  "Part-Time": "bg-blue-100 text-blue-700 border-blue-400",
  Contractual: "bg-purple-100 text-purple-700 border-purple-400",
};

function PersonnelList() {
  const [personnel, setPersonnel] = useState([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();
  // NEW: owner name for header
  const [ownerName, setOwnerName] = useState("Owner");

  useEffect(() => {
    // owner name
    const owner = JSON.parse(localStorage.getItem("carwashOwner") || "null");
    const token = localStorage.getItem("token");
    const initialName = `${owner?.first_name || owner?.owner_first_name || ""} ${owner?.last_name || owner?.owner_last_name || ""}`.trim() || "Owner";
    setOwnerName(initialName);
    if (owner?.id && token) {
      fetch(`http://localhost:3000/api/carwash-owners/${owner.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then(r => (r.ok ? r.json() : null))
        .then(od => {
          if (!od) return;
          const fresh = `${od.first_name || od.owner_first_name || ""} ${od.last_name || od.owner_last_name || ""}`.trim() || "Owner";
          setOwnerName(fresh);
        })
        .catch(() => {});
    }
  }, []);

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
          headers: { Authorization: `Bearer ${token}` },
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
    .filter((p) => {
      const fullName = `${p.first_name || ""} ${p.last_name || ""}`.trim();
      const q = search.toLowerCase();
      return (
        fullName.toLowerCase().includes(q) ||
        (p.role || "").toLowerCase().includes(q) ||
        (p.email || "").toLowerCase().includes(q)
      );
    })
    .filter((p) => filter === "All" || p.type === filter);

  const handleLogout = () => {
    localStorage.removeItem("carwashOwner");
    localStorage.removeItem("token");
    navigate("/carwash-login");
  };

  return (
    <div className="flex min-h-screen bg-gray-50 flex-col md:flex-row">
      {/* Sidebar (desktop) */}
      <aside className="hidden md:flex w-64 bg-white border-r flex-col">
        <div className="px-6 py-8">
          <div className="text-3xl flex items-center select-none">
            <span className="text-gray-700" style={{ fontFamily: '"Great Vibes", cursive', fontSize: "2.2rem" }}>
              Wash
            </span>
            <span className="ml-2 text-red-500 font-semibold" style={{ fontFamily: '"Great Vibes", cursive', fontSize: "2.2rem" }}>
              Connect
            </span>
          </div>
        </div>
        <nav className="flex-1 px-4 space-y-2">
          <button className="w-full flex items-center gap-2 px-3 py-2 rounded hover:bg-gray-100" onClick={() => navigate("/carwash-dashboard")}>
            <FaRegEye /> Overview
          </button>
          <button className="w-full flex items-center gap-2 px-3 py-2 rounded bg-blue-100 text-blue-700 font-semibold" onClick={() => navigate("/personnel-list")}>
            <span className="text-lg">★</span> Customers & Employee
          </button>
          <hr className="my-2 border-gray-300" />
          <button className="w-full flex items-center gap-2 px-2 py-1 hover:bg-gray-100 rounded text-left" onClick={() => navigate("/bookings")}>
            <FaRegCheckSquare className="text-lg" />
            <span>Manage Bookings</span>
          </button>
          <button className="w-full flex items-center gap-2 px-2 py-1 hover:bg-gray-100 rounded text-left" onClick={() => navigate("/booking-history")}>
            <FaRegCheckSquare className="text-lg" />
            <span>Booking History</span>
          </button>
          <div className="flex items-center gap-2 mt-2 px-2 py-1 hover:bg-gray-100 rounded cursor-pointer" onClick={() => navigate("/earning-dashboard")}>
            <FaTrophy className="text-lg" />
            <span>Earnings Dashboard</span>
          </div>
          <div className="flex items-center gap-2 mt-2 px-2 py-1 hover:bg-gray-100 rounded cursor-pointer" onClick={() => navigate("/refund-request")}>
            <FaRegFolderOpen className="text-lg" />
            <span>Request Refund</span>
          </div>
          <hr className="my-4 border-gray-300" />
        </nav>
        <div className="mt-auto px-4 py-6">
          <button className="flex items-center gap-2 text-gray-700 hover:text-red-500 px-2 py-1 rounded hover:bg-gray-100" onClick={handleLogout}>
            <FaRegFolderOpen className="text-lg" /> Logout
          </button>
        </div>
      </aside>

      {/* Mobile drawer */}
      <div className={`fixed inset-0 z-40 md:hidden ${isSidebarOpen ? "" : "pointer-events-none"}`}>
        <div className={`absolute top-0 left-0 h-full w-64 bg-white border-r shadow transform transition-transform duration-300 ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
          <div className="px-4 py-4 border-b flex items-center justify-between">
            <span className="text-xl font-semibold">
              Wash <span className="text-red-500">Connect</span>
            </span>
            <button className="p-2 rounded hover:bg-gray-100" onClick={() => setSidebarOpen(false)}>
              ✕
            </button>
          </div>
          <nav className="p-3 space-y-2">
            <button className="w-full flex items-center gap-2 px-3 py-2 rounded hover:bg-gray-100" onClick={() => { setSidebarOpen(false); navigate("/carwash-dashboard"); }}>
              <FaRegEye /> Overview
            </button>
            <button className="w-full flex items-center gap-2 px-3 py-2 rounded bg-blue-100 text-blue-700 font-semibold" onClick={() => setSidebarOpen(false)}>
              <span className="text-lg">★</span> Customers & Employee
            </button>
            <hr className="my-2" />
            <button className="w-full flex items-center gap-2 px-3 py-2 rounded hover:bg-gray-100" onClick={() => { setSidebarOpen(false); navigate("/bookings"); }}>
              <FaRegCheckSquare className="text-lg" /> Manage Bookings
            </button>
            <button className="w-full flex items-center gap-2 px-3 py-2 rounded hover:bg-gray-100" onClick={() => { setSidebarOpen(false); navigate("/booking-history"); }}>
              <FaRegCheckSquare className="text-lg" /> Booking History
            </button>
            <button className="w-full flex items-center gap-2 px-3 py-2 rounded hover:bg-gray-100" onClick={() => { setSidebarOpen(false); navigate("/earning-dashboard"); }}>
              <FaTrophy className="text-lg" /> Earnings Dashboard
            </button>
            <button className="w-full flex items-center gap-2 px-3 py-2 rounded hover:bg-gray-100" onClick={() => { setSidebarOpen(false); navigate("/refund-request"); }}>
              <FaRegFolderOpen className="text-lg" /> Request Refund
            </button>
            <hr className="my-2" />
            <button className="w-full flex items-center gap-2 px-3 py-2 rounded hover:bg-gray-100" onClick={handleLogout}>
              <FaRegFolderOpen className="text-lg" /> Logout
            </button>
          </nav>
        </div>
        <div className={`absolute inset-0 bg-black/30 transition-opacity duration-300 ${isSidebarOpen ? "opacity-100" : "opacity-0"}`} onClick={() => setSidebarOpen(false)} />
      </div>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-4 md:px-8 py-3 md:py-4 bg-blue-100 border-b">
          <button className="md:hidden p-2 rounded hover:bg-blue-200" onClick={() => setSidebarOpen(true)}>
            <FaBars />
          </button>
          <div className="flex items-center gap-4">
            <h1 className="text-xl md:text-2xl font-semibold">Customers & Employee</h1>
          </div>
          <div className="flex items-center gap-2">
            <FaUserCircle
              className="text-2xl text-gray-600"
              title={ownerName}
              aria-label={ownerName}
            />
            <span className="text-gray-700 font-medium">{ownerName}</span>
          </div>
        </div>

        {/* Tabs and Stats */}
        <div className="bg-white px-4 md:px-8 pt-4 md:pt-6 pb-2 border-b flex flex-col gap-4">
          <div className="flex gap-8 items-end">
            <div className="flex gap-4">
              <button className="text-gray-400 pb-1 px-2 hover:text-blue-600" onClick={() => navigate("/customer-list")} type="button">
                Customer
              </button>
              <button className="border-b-2 border-blue-400 text-blue-600 font-semibold pb-1 px-2">Personnel</button>
            </div>
          </div>
          <div className="flex gap-3 mt-2 overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0">
            <button
              className={`rounded-lg px-6 py-3 flex flex-col items-center border transition cursor-pointer select-none ${
                filter === "All" ? "bg-blue-600 text-white border-blue-600" : "bg-blue-50 border-blue-200 text-gray-900"
              }`}
              onClick={() => setFilter("All")}
              aria-pressed={filter === "All"}
              type="button"
            >
              <span className="text-2xl font-bold">{personnel.length}</span>
              <span className="text-xs opacity-80">All Employee</span>
            </button>

            <button
              className={`rounded-lg px-6 py-3 flex flex-col items-center border transition cursor-pointer select-none ${
                filter === "Full-Time" ? "bg-blue-600 text-white border-blue-600" : "bg-blue-50 border-blue-200 text-gray-900"
              }`}
              onClick={() => setFilter("Full-Time")}
              aria-pressed={filter === "Full-Time"}
              type="button"
            >
              <span className="text-2xl font-bold">{personnel.filter((p) => p.type === "Full-Time").length}</span>
              <span className="text-xs opacity-80">Full-time</span>
            </button>

            <button
              className={`rounded-lg px-6 py-3 flex flex-col items-center border transition cursor-pointer select-none ${
                filter === "Part-Time" ? "bg-blue-600 text-white border-blue-600" : "bg-blue-50 border-blue-200 text-gray-900"
              }`}
              onClick={() => setFilter("Part-Time")}
              aria-pressed={filter === "Part-Time"}
              type="button"
            >
              <span className="text-2xl font-bold">{personnel.filter((p) => p.type === "Part-Time").length}</span>
              <span className="text-xs opacity-80">Part-time</span>
            </button>

            <button
              className={`rounded-lg px-6 py-3 flex flex-col items-center border transition cursor-pointer select-none ${
                filter === "Contractual" ? "bg-blue-600 text-white border-blue-600" : "bg-blue-50 border-blue-200 text-gray-900"
              }`}
              onClick={() => setFilter("Contractual")}
              aria-pressed={filter === "Contractual"}
              type="button"
            >
              <span className="text-2xl font-bold">{personnel.filter((p) => p.type === "Contractual").length}</span>
              <span className="text-xs opacity-80">Contractual</span>
            </button>
          </div>
        </div>

        {/* Search and Actions */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between px-4 md:px-8 py-3 md:py-4 bg-white border-b gap-3">
          <div className="flex items-center gap-2">
            <FaSearch className="text-gray-400" />
            <input
              type="text"
              placeholder="Search"
              className="border rounded px-3 py-2 text-sm w-full md:w-64"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <select className="border rounded px-3 py-2 text-sm" value={filter} onChange={(e) => setFilter(e.target.value)}>
              <option value="All">Employee Type</option>
              <option value="Full-Time">Full-time</option>
              <option value="Part-Time">Part-time</option>
              <option value="Contractual">Contractual</option>
            </select>
            <button
              className="bg-blue-500 text-white px-3 py-2 rounded flex items-center gap-1 text-sm font-medium hover:bg-blue-600"
              onClick={() => (window.location.href = "/add-employee")}
            >
              Add Employee <span className="text-lg">+</span>
            </button>
          </div>
        </div>

        {/* Personnel List */}
        <div className="flex-1 overflow-y-auto px-4 md:px-8 py-4 md:py-6 bg-gray-50">
          <h2 className="text-lg font-semibold mb-4">All personnel</h2>
          {filtered.length === 0 ? (
            <div className="text-center text-gray-400 mt-12 text-lg">No personnel available. Please add personnel.</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {filtered.map((p) => (
                <div key={p.personnelId} className="bg-white rounded-xl border border-gray-300 p-3 md:p-4 flex flex-col gap-2">
                  <div className="flex items-center gap-3">
                    <img
                      src={
                        p.avatar
                          ? p.avatar.startsWith("/uploads")
                            ? `http://localhost:3000${p.avatar}`
                            : p.avatar
                          : `https://ui-avatars.com/api/?name=${encodeURIComponent(`${p.first_name || ""} ${p.last_name || ""}`.trim())}`
                      }
                      alt=""
                      className="w-10 h-10 md:w-12 md:h-12 rounded-full object-cover border"
                    />
                    <div className="flex-1">
                      <div className="font-semibold text-sm md:text-base">
                        {p.first_name} {p.last_name}
                      </div>
                      <div className="text-[11px] md:text-xs text-blue-500">{p.role}</div>
                    </div>
                    {p.type && (
                      <span className={`ml-2 px-2 py-0.5 rounded-full border text-[11px] md:text-xs font-semibold ${typeColors[p.type] || "border-gray-300 text-gray-500"}`}>
                        {p.type}
                      </span>
                    )}
                  </div>
                  <div className="mt-2">
                    <div className="flex items-center text-[11px] md:text-xs text-gray-600 mb-1">
                      <FaMapMarkerAlt className="mr-1 text-gray-400" />
                      <span>{p.address}</span>
                    </div>
                    <div className="flex items-center text-[11px] md:text-xs text-gray-600">
                      <FaEnvelope className="mr-1 text-gray-400" />
                      <span>{p.email}</span>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-3">
                    <button
                      className="flex-1 bg-blue-500 text-white rounded px-3 py-2 text-xs md:text-sm font-medium hover:bg-blue-600"
                      onClick={() => navigate(`/personnel-details/${p.personnelId}`, { state: { personnel: p } })}
                    >
                      View Details
                    </button>
                    <button className="text-gray-400 hover:text-gray-700 px-2" onClick={() => navigate("/personnel-edit", { state: { personnel: p } })}>
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