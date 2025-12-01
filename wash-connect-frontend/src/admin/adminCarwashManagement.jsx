import { useEffect, useState } from "react";
import { Trophy, Eye, Users, FileText, Inbox, LogOut, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";

function AdminCarwashManagement() {
  const navigate = useNavigate();
  const [shops, setShops] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }
    fetchShops(token);
    // eslint-disable-next-line
  }, []);

  // Fetch only approved and banned carwash businesses
  const fetchShops = async (token) => {
    setLoading(true);
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
      setShops(data.filter((shop) => shop.status === "Approved" || shop.status === "Banned"));
    } catch {
      setShops([]);
    }
    setLoading(false);
  };

  // Filter by search
  const filtered = shops.filter(
    (s) =>
      s.owner_first_name.toLowerCase().includes(search.toLowerCase()) ||
      s.owner_last_name.toLowerCase().includes(search.toLowerCase()) ||
      s.carwashName.toLowerCase().includes(search.toLowerCase()) ||
      (s.location || "").toLowerCase().includes(search.toLowerCase())
  );

  const handleBan = async (applicationId) => {
    if (!window.confirm("Are you sure you want to ban this carwash shop?")) return;
    try {
      await fetch(`http://localhost:3000/api/admin/shops/${applicationId}/ban`, {
        method: "PATCH",
      });
      fetchShops(); // Refresh list
    } catch {
      alert("Failed to ban shop.");
    }
  };

  const handleUnban = async (applicationId) => {
    if (!window.confirm("Are you sure you want to unban this carwash shop?")) return;
    try {
      await fetch(`http://localhost:3000/api/admin/shops/${applicationId}/enable`, {
        method: "PATCH",
      });
      fetchShops(); // Refresh list
    } catch {
      alert("Failed to unban shop.");
    }
  };

  const handleViewReports = (shopId) => {
    navigate(`/admin/shops/${shopId}/reports`);
  };

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
            onClick={() => navigate("/admin-dashboard")}
          >
            <Trophy className="mr-3 w-5 h-5" />
            Earnings Dashboard
          </button>
          <button
            className="flex items-center w-full px-4 py-3 rounded-lg bg-cyan-100 text-cyan-700 font-semibold"
            disabled
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
            className="flex items-center w-full px-4 py-3 rounded-lg hover:bg-gray-100 text-gray-700"
            onClick={() => window.location.href = "/admin-application-requests"}
          >
            <FileText className="mr-3 w-5 h-5" />
            Application Request
          </button>
        </nav>
        <div className="px-8 pb-8 mt-auto">
          <button className="flex items-center text-gray-700 hover:text-red-500"
            onClick={() => navigate("/login")}
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
            <span className="text-2xl font-bold">Manage Carwash Shops</span>
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
          <h2 className="text-3xl font-bold mb-6">Overall Shops</h2>
          {/* Search */}
          <div className="flex items-center gap-4 mb-4 justify-end">
            <div className="relative w-96">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                className="pl-10 pr-4 py-3 rounded-full border border-gray-300 bg-white text-gray-700 focus:outline-none w-full"
                placeholder="Search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div>
              <span className="text-gray-700">Location</span>
            </div>
          </div>
          {/* Table */}
          <div className="bg-white rounded-xl shadow p-4 border border-gray-100">
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="text-left text-gray-600 font-semibold">
                    <th className="py-3 px-4">Owner</th>
                    <th className="py-3 px-4">Shop Name</th>
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
                  ) : filtered.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-8 text-gray-400">No carwash shops found.</td>
                    </tr>
                  ) : (
                    filtered.map((shop) => {
                      console.log(shop.logoUrl); // Debug: See what value you get
                      return (
                        <tr key={shop.applicationId} className="border-t border-gray-100 hover:bg-gray-50">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-700 font-bold text-lg">
                                {shop.owner_first_name[0]}
                              </div>
                              <div>
                                <div className="font-semibold">{shop.owner_first_name} {shop.owner_last_name}</div>
                                <div className="text-xs text-gray-500">#{shop.owner_id}</div>
                                <div className="text-xs text-gray-500">{shop.owner_email}</div>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <div className="w-10 h-10 rounded bg-white border border-gray-200 flex items-center justify-center overflow-hidden">
                                <img
                                  src={shop.logoUrl || "/default-logo.png"}
                                  alt="Company Logo"
                                  className="w-10 h-10 object-cover rounded"
                                  onError={e => { e.target.src = "/default-logo.png"; }}
                                />
                              </div>
                              <span>{shop.carwashName}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4">{shop.location}</td>
                          <td className="py-3 px-4">
                            {shop.status === "Banned" ? (
                              <>
                                <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-semibold mr-2">Banned</span>
                              </>
                            ) : (
                              <>
                                <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-semibold mr-2">Active</span>
                              </>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              {shop.status === "Banned" ? (
                                <button
                                  className="bg-green-100 text-green-700 px-4 py-1 rounded-full font-semibold flex items-center gap-1 hover:bg-green-200"
                                  onClick={() => handleUnban(shop.applicationId)}
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                  </svg>
                                  Unban
                                </button>
                              ) : (
                                <button
                                  className="bg-red-100 text-red-600 px-4 py-1 rounded-full font-semibold flex items-center gap-1 hover:bg-red-200"
                                  onClick={() => handleBan(shop.applicationId)}
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M18 6L6 18M6 6l12 12" />
                                  </svg>
                                  Ban
                                </button>
                              )}
                              <button
                                className="bg-gray-100 text-gray-600 px-4 py-1 rounded-full font-semibold flex items-center gap-1 hover:bg-gray-200"
                                onClick={() => handleViewReports(shop.applicationId)}
                              >
                                <FileText className="w-4 h-4" />
                                Reports
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default AdminCarwashManagement;