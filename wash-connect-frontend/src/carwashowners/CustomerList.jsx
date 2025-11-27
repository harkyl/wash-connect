import React, { useEffect, useState } from "react";
import { FaUserCircle, FaMapMarkerAlt, FaEnvelope, FaSearch, FaUsers, FaUser, FaCalendarAlt, FaSignOutAlt, FaRegEnvelope, FaRegUser, FaRegCheckSquare, FaRegFolderOpen, FaTrophy, FaBars } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

// NEW: helpers to normalize avatars and enrich list with fetched avatars
const normalizeAvatarUrl = (url) => {
  if (!url) return "";
  if (url.startsWith("/uploads")) return `http://localhost:3000${url}`;
  return url;
};

const nameFor = (c) =>
  (c.customer_name ||
    `${c.customer_first_name || ""} ${c.customer_last_name || ""}` ||
    "").trim();

async function enrichAvatars(customers, token) {
  const cache = new Map(); // key -> url
  const headers = token ? { Authorization: `Bearer ${token}` } : {};

  const result = await Promise.all(
    customers.map(async (c) => {
      // If avatar already present, just normalize it
      if (c.avatar) {
        return { ...c, avatar: normalizeAvatarUrl(c.avatar) };
      }

      const key = c.user_id || c.userId || c.customer_email || c.email;
      if (!key) {
        return {
          ...c,
          avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(nameFor(c))}`,
        };
      }

      if (cache.has(key)) {
        return { ...c, avatar: cache.get(key) };
      }

      try {
        let res;
        if (c.user_id || c.userId) {
          const id = c.user_id || c.userId;
          res = await fetch(`http://localhost:3000/api/users/${id}`, { headers });
        } else if (c.customer_email || c.email) {
          const email = encodeURIComponent(c.customer_email || c.email);
          res = await fetch(`http://localhost:3000/api/users/by-email?email=${email}`, { headers });
        }

        if (res && res.ok) {
          const user = await res.json();
          const url = normalizeAvatarUrl(user.avatar || user.profileImage || "");
          const finalUrl =
            url || `https://ui-avatars.com/api/?name=${encodeURIComponent(nameFor(c))}`;
          cache.set(key, finalUrl);
          return { ...c, avatar: finalUrl };
        }
      } catch {
        // ignore and use fallback
      }

      const fallback = `https://ui-avatars.com/api/?name=${encodeURIComponent(nameFor(c))}`;
      cache.set(key, fallback);
      return { ...c, avatar: fallback };
    })
  );

  return result;
};

// ...existing code...
const statusColors = {
  "New Customer": "border-blue-400 text-blue-600",
  "Repeat Customer": "border-green-400 text-green-600",
  "Blocked": "border-red-400 text-red-600",
};

// Derive customers from raw bookings: group by user/email and tag repeat vs new
const deriveCustomersFromBookings = (rows = []) => {
  const byKey = new Map();

  const isCompleted = (row) => {
    const s = String(row?.status ?? row?.booking_status ?? "").toLowerCase();
    return s === "completed" || s === "done" || s.includes("complete");
  };

  for (const r of rows) {
    const key = r.user_id ?? r.userId ?? r.customer_email ?? r.email;
    if (!key) continue;

    const latestAny =
      r.latest_booking || r.updated_at || r.created_at || r.schedule_date || r.date || null;

    const first = r.customer_first_name ?? r.first_name ?? "";
    const last = r.customer_last_name ?? r.last_name ?? "";
    const email = r.customer_email ?? r.email ?? "";

    if (!byKey.has(key)) {
      byKey.set(key, {
        user_id: r.user_id ?? r.userId ?? null,
        customer_first_name: first,
        customer_last_name: last,
        customer_email: email,
        address: r.address ?? "",
        avatar: r.avatar ?? r.customer_avatar ?? "",
        totalBookings: 0,
        completedBookings: 0,
        latest_booking: latestAny,          // any status
        latest_completed_booking: null,     // completed-only
      });
    }
    const item = byKey.get(key);
    item.totalBookings += 1;

    if (latestAny) {
      if (!item.latest_booking || new Date(latestAny) > new Date(item.latest_booking)) {
        item.latest_booking = latestAny;
      }
    }

    if (isCompleted(r)) {
      item.completedBookings += 1;
      const when =
        r.completed_at || r.updated_at || r.created_at || r.schedule_date || r.date || null;
      if (when) {
        if (
          !item.latest_completed_booking ||
          new Date(when) > new Date(item.latest_completed_booking)
        ) {
          item.latest_completed_booking = when;
        }
      }
    }
  }

  return Array.from(byKey.values()).map((c) => ({
    ...c,
    status: c.completedBookings >= 2 ? "Repeat Customer" : "New Customer",
    latest_for_sort: c.latest_completed_booking || c.latest_booking || null,
  }));
};

function CustomerList() {
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("date");
  const navigate = useNavigate();
  // NEW: filter by stat box
  const [statusFilter, setStatusFilter] = useState("all"); // all | new | repeat
  // NEW: owner name for header
  const [ownerName, setOwnerName] = useState("Owner");

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/carwash-login");
      return;
    }

    const owner = JSON.parse(localStorage.getItem("carwashOwner"));
    if (!owner || !owner.id) return;

    // Prime name from localStorage
    const initialName = `${owner.owner_first_name || owner.first_name || ""} ${owner.owner_last_name || owner.last_name || ""}`.trim() || "Owner";
    setOwnerName(initialName);

    (async () => {
      try {
        // Fetch latest owner details
        const ownerRes = await fetch(`http://localhost:3000/api/carwash-owners/${owner.id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (ownerRes.status === 401) {
          navigate("/carwash-login");
          return;
        }
        if (ownerRes.ok) {
          const od = await ownerRes.json();
          const freshName = `${od.first_name || od.owner_first_name || ""} ${od.last_name || od.owner_last_name || ""}`.trim() || "Owner";
          setOwnerName(freshName);
        }

        const appRes = await fetch(`http://localhost:3000/api/carwash-applications/by-owner/${owner.id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (appRes.status === 401) {
          navigate("/carwash-login");
          return;
        }
        const app = await appRes.json();
        if (!app?.applicationId) {
          setCustomers([]);
          return;
        }

        // Try aggregated endpoint (counts only Completed/Done)
        const aggRes = await fetch(`http://localhost:3000/api/customers/by-application/${app.applicationId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (aggRes.ok) {
          const agg = await aggRes.json();
          const raw = Array.isArray(agg) ? agg : [];
          const withAvatars = await enrichAvatars(raw, token); // NEW
          setCustomers(withAvatars);
          return;
        }

        // Fallback: fetch bookings and derive on client
        const res = await fetch(`http://localhost:3000/api/bookings/confirmed/${app.applicationId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.status === 401) {
          navigate("/carwash-login");
          return;
        }
        const rows = await res.json();
        const hasStatus = Array.isArray(rows) && rows.some(r => typeof r.status === "string");
        const data = hasStatus ? rows : deriveCustomersFromBookings(rows);
        const withAvatars = await enrichAvatars(Array.isArray(data) ? data : [], token); // NEW
        setCustomers(withAvatars);
      } catch {
        setCustomers([]);
      }
    })();
  }, [navigate]);

  // Filter and sort customers
  const filtered = customers
    // exclude blocked first
    .filter(c => c.status !== "Blocked")
    // NEW: apply stat filter
    .filter(c => {
      if (statusFilter === "new") return c.status === "New Customer";
      if (statusFilter === "repeat") return c.status === "Repeat Customer";
      return true; // all
    })
    // search
    .filter(c =>
      (c.customer_name || `${c.customer_first_name || ""} ${c.customer_last_name || ""}`)
        .toLowerCase()
        .includes(search.toLowerCase()) ||
      (c.customer_email || "").toLowerCase().includes(search.toLowerCase())
    )
    // sort
    .sort((a, b) => {
      if (sort === "date") return new Date(b.latest_for_sort) - new Date(a.latest_for_sort);
      if (sort === "name")
        return (
          (a.customer_name || `${a.customer_first_name || ""} ${a.customer_last_name || ""}`).localeCompare(
            b.customer_name || `${b.customer_first_name || ""} ${b.customer_last_name || ""}`
          )
        );
      return 0;
    });

  const handleLogout = () => {
    localStorage.removeItem("carwashOwner");
    localStorage.removeItem("token");
    navigate("/carwash-login");
  };

  const totalNewCustomers = customers.filter(c => c.status === "New Customer").length;
  const totalRepeatCustomers = customers.filter(c => c.status === "Repeat Customer").length;

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
            onClick={() => setSort("date")}
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
          <button
            className="flex items-center gap-2 mb-1 px-2 py-1 hover:bg-gray-100 rounded cursor-pointer transition-colors duration-200 w-full text-left"
            onClick={() => navigate('/booking-history')}
          >
            <FaRegCheckSquare className="text-lg" />
            <span>Booking History</span>
          </button>
          <div className="flex items-center gap-2 mt-2 px-2 py-1 hover:bg-gray-100 rounded cursor-pointer transition-colors duration-200" onClick={() => navigate('/earning-dashboard')}>
            <FaTrophy className="text-lg" />
            <span>Earnings Dashboard</span>
          </div>
          {/* Request Refund should be here, below Earnings Dashboard */}
          <div className="flex items-center gap-2 mt-2 px-2 py-1 hover:bg-gray-100 rounded cursor-pointer transition-colors duration-200" onClick={() => navigate('/refund-request')}>
            <FaRegFolderOpen className="text-lg" />
            <span>Request Refund</span>
          </div>
          <hr className="my-4 border-gray-300" /> 
        </nav>
        <div className="mt-auto px-4 py-6">
          <button
            className="flex items-center gap-2 text-gray-700 hover:text-red-500 px-2 py-1 rounded hover:bg-gray-100 cursor-pointer transition-colors duration-200"
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
            <FaUserCircle
              className="text-2xl text-gray-600"
              title={ownerName}
              aria-label={ownerName}
            />
            <span className="text-gray-700 font-medium">{ownerName}</span>
          </div>
        </div>
        {/* Tabs and Stats */}
        <div className="bg-white px-8 pt-6 pb-2 border-b flex flex-col gap-4">
          <div className="flex gap-8 items-end">
            <div className="flex gap-4">
              <button className="border-b-2 border-blue-400 text-blue-600 font-semibold pb-1 px-2">Customer</button>
              <button
                className="text-gray-400 pb-1 px-2 hover:text-blue-600"
                onClick={() => navigate("/personnel-list")}
              >
                Personnel
              </button>
            </div>
          </div>
          <div className="flex gap-4 mt-2">
            <button
              className={`rounded-lg px-6 py-3 flex flex-col items-center border transition
                ${statusFilter === "all" ? "bg-blue-600 text-white border-blue-600"
                                         : "bg-blue-50 border-blue-200 text-gray-900"}`}
              onClick={() => setStatusFilter("all")}
              aria-pressed={statusFilter === "all"}
            >
              <span className="text-2xl font-bold">
                {customers.filter(c => c.status !== "Blocked").length}
              </span>
              <span className="text-xs opacity-80">Total Customer</span>
            </button>

            <button
              className={`rounded-lg px-6 py-3 flex flex-col items-center border transition
                ${statusFilter === "new" ? "bg-blue-600 text-white border-blue-600"
                                         : "bg-blue-50 border-blue-200 text-gray-900"}`}
              onClick={() => setStatusFilter("new")}
              aria-pressed={statusFilter === "new"}
            >
              <span className="text-2xl font-bold">{totalNewCustomers}</span>
              <span className="text-xs opacity-80">New Customer</span>
            </button>

            <button
              className={`rounded-lg px-6 py-3 flex flex-col items-center border transition
                ${statusFilter === "repeat" ? "bg-blue-600 text-white border-blue-600"
                                            : "bg-blue-50 border-blue-200 text-gray-900"}`}
              onClick={() => setStatusFilter("repeat")}
              aria-pressed={statusFilter === "repeat"}
            >
              <span className="text-2xl font-bold">{totalRepeatCustomers}</span>
              <span className="text-xs opacity-80">Repeat Customer</span>
            </button>
          </div>
        </div>
        {/* Search and Sort */}
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
          <div>
            <select
              className="border rounded px-2 py-1 text-sm"
              value={sort}
              onChange={e => setSort(e.target.value)}
            >
              <option value="date">Date</option>
              <option value="name">Name</option>
            </select>
          </div>
        </div>
        {/* Customer Cards */}
        <div className="flex-1 overflow-y-auto px-8 py-6 bg-gray-50">
          <h2 className="text-lg font-semibold mb-4">All Customer</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((c, i) => (
              <div
                key={i}
                className="bg-white rounded-xl border border-gray-300 p-4 flex flex-col gap-2 relative"
              >
                <div className="flex items-center gap-3">
                  <img
                    src={
                      c.avatar ||
                      `https://ui-avatars.com/api/?name=${encodeURIComponent(
                        (c.customer_first_name || "") + " " + (c.customer_last_name || "")
                      )}`
                    }
                    alt=""
                    className="w-10 h-10 rounded-full object-cover border"
                  />
                  <div className="flex-1">
                    <div className="font-semibold text-base">
                      {(c.customer_first_name || "") + " " + (c.customer_last_name || "")}
                    </div>
                    <div className="text-xs text-gray-500">Customer</div>
                  </div>
                  {c.status && (
                    <span
                      className={`ml-2 px-2 py-0.5 rounded-full border text-xs font-semibold ${
                        statusColors[c.status] || "border-gray-300 text-gray-500"
                      }`}
                    >
                      {c.status}
                    </span>
                  )}
                </div>
                <div className="mt-2">
                  <div className="flex items-center text-xs text-gray-600 mb-1">
                    <FaMapMarkerAlt className="mr-1 text-gray-400" />
                    <span>{c.address}</span>
                  </div>
                  <div className="flex items-center text-xs text-gray-600">
                    <FaEnvelope className="mr-1 text-gray-400" />
                    <span>{c.customer_email}</span>
                  </div>
                </div>
                {/* Removed three-dots button */}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default CustomerList;