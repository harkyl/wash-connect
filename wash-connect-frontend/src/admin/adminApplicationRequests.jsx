import React, { useState, useEffect } from "react";
import { FileText, Eye, Check, X, MapPin, Filter, Trophy, Users, Inbox, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";

function AdminApplicationRequests() {
  const [applications, setApplications] = useState([]);
  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedApp, setSelectedApp] = useState(null);
  const [viewLoading, setViewLoading] = useState(false);
  const navigate = useNavigate();

  // Pagination
  const [page, setPage] = useState(1);
  const pageSize = 5;

  useEffect(() => {
    fetchApplications();
    // eslint-disable-next-line
  }, []);

  const fetchApplications = async () => {
    setLoading(true);
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }
    try {
      const res = await fetch("http://localhost:3000/api/admin/applications", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.status === 401) {
        navigate("/login");
        return;
      }
      const data = await res.json();
      setApplications(data);
    } catch {
      setApplications([]);
    }
    setLoading(false);
  };

  const handleApprove = async (id) => {
    setActionLoading(id + "-approve");
    const token = localStorage.getItem("token");
    await fetch(`http://localhost:3000/api/admin/applications/${id}/approve`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    await fetchApplications();
    setActionLoading(null);
  };

  const handleDecline = async (id) => {
    setActionLoading(id + "-decline");
    const token = localStorage.getItem("token");
    await fetch(`http://localhost:3000/api/admin/applications/${id}/decline`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    await fetchApplications();
    setActionLoading(null);
  };

  const handleView = async (app) => {
    setViewLoading(true);
    setModalOpen(true);
    setSelectedApp(app); // Show basic data immediately
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`http://localhost:3000/api/applications/${app.applicationId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.ok) {
        const fullAppDetails = await res.json();
        setSelectedApp(fullAppDetails); // Update with full data
      }
    } catch (error) {
      console.error("Failed to fetch application details", error);
      // Optionally handle error, e.g., show a message
    }
    setViewLoading(false);
  };

  // Normalize status (case-insensitive, trims, defaults to "Pending" if empty)
  const normalizeStatus = (v) => {
    const s = String(v || "").trim().toLowerCase();
    if (!s) return "Pending";
    if (s === "pending" || s === "approved" || s === "declined") {
      return s.charAt(0).toUpperCase() + s.slice(1);
    }
    return s.charAt(0).toUpperCase() + s.slice(1);
  };

  // Filtering and searching
  const filtered = applications.filter((app) => {
    const appStatus = normalizeStatus(app.status);
    const matchesStatus = statusFilter ? appStatus === statusFilter : true;
    const matchesSearch =
      (app.owner_first_name || "").toLowerCase().includes(search.toLowerCase()) ||
      (app.owner_last_name || "").toLowerCase().includes(search.toLowerCase()) ||
      (app.carwashName || "").toLowerCase().includes(search.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  // Pagination logic
  const totalPages = Math.ceil(filtered.length / pageSize);
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className="min-h-screen flex bg-white">
      {/* Sidebar */}
      <aside className="w-72 bg-white border-r border-gray-200 flex flex-col min-h-screen">
        <div className="flex items-center px-8 py-8 border-b border-gray-100">
          <span className="text-3xl" style={{ fontFamily: "Brush Script MT, cursive" }}>
            <span className="text-black-500">Wash</span>{" "}
            <span className="text-red-500">Connect</span>
          </span>
        </div>
        <nav className="flex-1 px-4 py-6 space-y-2">
          <button
            className="flex items-center w-full px-4 py-3 rounded-lg hover:bg-gray-100 text-gray-700"
            onClick={() => window.location.href = "/admin-dashboard"}
          >
            <Trophy className="mr-3 w-5 h-5" />
            Earnings Dashboard
          </button>
          <button
            className="flex items-center w-full px-4 py-3 rounded-lg hover:bg-gray-100 text-gray-700"
            onClick={() => window.location.href = "/admin-carwash-management"}
          >
            <Eye className="mr-3 w-5 h-5" />
            Carwash Shops
          </button>
          <button
            className="flex items-center w-full px-4 py-3 rounded-lg hover:bg-gray-100 text-gray-700"
            onClick={() => window.location.href = "/admin-customer-management"}
          >
            <Users className="mr-3 w-5 h-5" />
            Customers
          </button>
          <hr className="my-4" />
          <button
            className="flex items-center w-full px-4 py-3 rounded-lg bg-cyan-100 text-cyan-700 font-semibold"
            disabled
          >
            <FileText className="mr-3 w-5 h-5" />
            Application Request
          </button>
        </nav>
        <div className="px-8 pb-8 mt-auto">
          <button className="flex items-center text-gray-700 hover:text-red-500"
            onClick={() => window.location.href = "/login"}
          >
            <LogOut className="mr-2 w-5 h-5" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 bg-[#e6faff] min-h-screen">
        {/* Header */}
        <header className="flex items-center justify-between px-10 py-6 bg-cyan-100 border-b border-gray-200">
          <div className="flex items-center">
            <Inbox className="w-6 h-6 text-gray-700 mr-4" />
            <span className="text-lg font-semibold">Lead Details</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-700">SuperAdmin</span>
            <svg className="w-7 h-7 text-gray-700" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="2" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5.5 21a7.5 7.5 0 0 1 13 0" />
            </svg>
          </div>
        </header>

        <div className="p-10">
          <h2 className="text-2xl font-bold mb-6">Carwash Owner Applications</h2>
          {/* Filter and Search */}
          <div className="flex items-center gap-4 mb-4">
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <select
                className="pl-9 pr-4 py-2 rounded-full border border-gray-300 bg-white text-gray-700 focus:outline-none"
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              >
                <option value="">All Status..</option>
                <option value="Pending">Pending</option>
                <option value="Approved">Approved</option>
                <option value="Declined">Declined</option>
              </select>
            </div>
            <input
              type="text"
              className="pl-4 pr-4 py-2 rounded-full border border-gray-300 bg-white text-gray-700 focus:outline-none"
              placeholder="Search by owner or carwash name..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            />
          </div>
          {/* Table */}
          <div className="bg-white rounded-xl shadow p-4 border border-gray-100">
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="text-left text-gray-600 font-semibold">
                    <th className="py-3 px-4">Owner</th>
                    <th className="py-3 px-4">Carwash Name</th>
                    <th className="py-3 px-4">Location</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="text-center py-8 text-gray-400">Loading...</td>
                    </tr>
                  ) : paginated.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-8 text-gray-400">No applications found.</td>
                    </tr>
                  ) : (
                    paginated.map((app) => {
                      const s = normalizeStatus(app.status);
                      return (
                        <tr key={app.applicationId} className="border-t border-gray-100 hover:bg-gray-50">
                          <td className="py-3 px-4 flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-cyan-100 flex items-center justify-center text-cyan-700 font-bold text-lg">
                              {(app.owner_first_name || "?")[0]}
                            </div>
                            <div>
                              <div className="font-semibold">{app.owner_first_name} {app.owner_last_name}</div>
                              <div className="text-xs text-gray-500">{app.owner_email}</div>
                            </div>
                          </td>
                          <td className="py-3 px-4">{app.carwashName}</td>
                          <td className="py-3 px-4 flex items-center gap-1">
                            <MapPin className="w-4 h-4 text-cyan-500" />
                            {app.location}
                          </td>
                          <td className="py-3 px-4">
                            {s === "Pending" && (
                              <span className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-xs font-semibold">Pending</span>
                            )}
                            {s === "Approved" && (
                              <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-semibold">Approved</span>
                            )}
                            {s === "Declined" && (
                              <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-semibold">Declined</span>
                            )}
                            {s !== "Pending" && s !== "Approved" && s !== "Declined" && (
                              <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-xs font-semibold">{s}</span>
                            )}
                          </td>
                          <td className="py-3 px-4 flex gap-2">
                            {s === "Pending" && (
                              <>
                                <button
                                  className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 disabled:opacity-50"
                                  disabled={actionLoading === app.applicationId + "-approve"}
                                  onClick={() => handleApprove(app.applicationId)}
                                >
                                  <Check className="w-4 h-4" /> Approve
                                </button>
                                <button
                                  className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 disabled:opacity-50"
                                  disabled={actionLoading === app.applicationId + "-decline"}
                                  onClick={() => handleDecline(app.applicationId)}
                                >
                                  <X className="w-4 h-4" /> Decline
                                </button>
                              </>
                            )}
                            <button
                              className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1"
                              onClick={() => handleView(app)}
                            >
                              <Eye className="w-4 h-4" /> View
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
            {/* Pagination */}
            <div className="flex justify-end items-center gap-2 mt-4">
              <button
                className="px-3 py-1 rounded bg-gray-100 text-gray-700"
                disabled={page === 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Prev
              </button>
              {Array.from({ length: totalPages }, (_, i) => (
                <button
                  key={i}
                  className={`px-3 py-1 rounded ${page === i + 1 ? "bg-cyan-500 text-white" : "bg-gray-100 text-gray-700"}`}
                  onClick={() => setPage(i + 1)}
                >
                  {i + 1}
                </button>
              ))}
              <button
                className="px-3 py-1 rounded bg-gray-100 text-gray-700"
                disabled={page === totalPages || totalPages === 0}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                Next
              </button>
            </div>
          </div>
        </div>

        {/* Modal for Application Details */}
        {modalOpen && selectedApp && (
          <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md relative">
              <button
                className="absolute top-2 right-2 text-gray-500 hover:text-red-500 text-xl"
                onClick={() => setModalOpen(false)}
              >
                &times;
              </button>
              <h2 className="text-xl font-bold mb-4">Application Details</h2>
              {viewLoading ? (
                <div className="text-center py-10">Loading details...</div>
              ) : (
                <>
                  <div className="mb-2"><strong>Owner:</strong> {selectedApp.owner_first_name || selectedApp.owner?.first_name} {selectedApp.owner_last_name || selectedApp.owner?.last_name}</div>
                  <div className="mb-2"><strong>Email:</strong> {selectedApp.owner_email || selectedApp.owner?.email}</div>
                  <div className="mb-2"><strong>Carwash Name:</strong> {selectedApp.carwashName}</div>
                  <div className="mb-2"><strong>Location:</strong> {selectedApp.location}</div>
                  <div className="mb-2"><strong>Status:</strong> {selectedApp.status}</div>
                  <div className="mb-2">
                    <strong>Logo:</strong><br />
                    {selectedApp.logo ? (
                      <img
                        src={`http://localhost:3000/uploads/logos/${selectedApp.logo}`}
                        alt="Logo"
                        style={{ maxWidth: "120px", maxHeight: "120px", marginTop: "8px", borderRadius: "8px" }}
                      />
                    ) : (
                      <span className="text-gray-400">No logo uploaded</span>
                    )}
                  </div>
                  <div className="mb-2">
                    <strong>Requirements:</strong><br />
                    {selectedApp.requirements ? (
                      <a
                        href={`http://localhost:3000/uploads/requirements/${selectedApp.requirements}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-cyan-600 underline"
                        download
                      >
                        Download requirements file
                      </a>
                    ) : (
                      <span className="text-gray-400">No requirements uploaded</span>
                    )}
                  </div>
                  <div className="mt-4 flex justify-end">
                    <button
                      className="px-4 py-2 rounded bg-cyan-500 text-white"
                      onClick={() => setModalOpen(false)}
                    >
                      Close
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default AdminApplicationRequests;