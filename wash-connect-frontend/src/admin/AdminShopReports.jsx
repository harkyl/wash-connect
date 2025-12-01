import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, FileText, CheckCircle, Trophy, Eye, Users, LogOut } from "lucide-react";

function AdminShopReports() {
  const { shopId } = useParams();
  const navigate = useNavigate();
  const [reports, setReports] = useState([]);
  const [shop, setShop] = useState(null);
  const [loading, setLoading] = useState(true);
  const token = localStorage.getItem("token");

  const fetchReports = async () => {
    setLoading(true);
    try {
      // This endpoint needs to be correctly routed on your backend.
      // Based on your previous code, it might be `/api/admin/shops/${shopId}/reports`
      // I've used a path that matches the routes file provided.
      const res = await fetch(`http://localhost:3000/api/reports/shops/${shopId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setReports(data);
      } else {
        setReports([]);
      }
    } catch (error) {
      console.error("Error fetching reports:", error);
      setReports([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }
    const fetchShopDetails = async () => {
        try {
            const res = await fetch(`http://localhost:3000/api/applications/${shopId}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                const data = await res.json();
                setShop(data);
            }
        } catch (error) {
            console.error("Failed to fetch shop details:", error);
        }
    };

    fetchShopDetails();
    fetchReports();
    // eslint-disable-next-line
  }, [shopId, navigate]);

  const handleResolveReport = async (reportId) => {
    if (!window.confirm("Are you sure you want to mark this report as resolved?")) return;
    try {
      const res = await fetch(`http://localhost:3000/api/reports/${reportId}/resolve`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        alert("Report resolved successfully.");
        fetchReports(); // Refresh the list of reports
      } else {
        alert("Failed to resolve report.");
      }
    } catch (error) {
      console.error("Error resolving report:", error);
      alert("An error occurred while resolving the report.");
    }
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
            onClick={() => navigate("/admin-carwash-management")}
          >
            <Eye className="mr-3 w-5 h-5" />
            Carwash Shops
          </button>
          <button
            className="flex items-center w-full px-4 py-3 rounded-lg hover:bg-gray-100 text-gray-700"
            onClick={() => navigate("/admin-customer-management")}
          >
            <Users className="mr-3 w-5 h-5" />
            Customers
          </button>
          <hr className="my-4" />
          <button
            className="flex items-center w-full px-4 py-3 rounded-lg hover:bg-gray-100 text-gray-700"
            onClick={() => navigate("/admin-application-requests")}
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

      <main className="flex-1 bg-[#e6faff] min-h-screen">
        <header className="flex items-center justify-between px-10 py-6 bg-cyan-100 border-b border-gray-200">
          <div className="flex items-center">
            <FileText className="w-6 h-6 text-gray-700 mr-4" />
            <span className="text-2xl font-bold">
              Reports for {shop ? shop.carwashName : 'Shop'}
            </span>
          </div>
        </header>

        <div className="p-10">
          <button
            onClick={() => navigate("/admin-carwash-management")}
            className="flex items-center gap-2 bg-white text-gray-700 px-4 py-2 rounded-lg shadow hover:bg-gray-100 mb-6"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Shop Management
          </button>

          <div className="bg-white rounded-xl shadow p-4 border border-gray-100">
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="text-left text-gray-600 font-semibold">
                    <th className="py-3 px-4">Reported By</th>
                    <th className="py-3 px-4">Reason</th>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="text-center py-8 text-gray-400">Loading reports...</td>
                    </tr>
                  ) : reports.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-8 text-gray-400">No reports found for this shop.</td>
                    </tr>
                  ) : (
                    reports.map((report) => (
                      <tr key={report.id} className="border-t border-gray-100">
                        <td className="py-3 px-4">{report.customerName}</td>
                        <td className="py-3 px-4">{report.reason}</td>
                        <td className="py-3 px-4">{new Date(report.createdAt).toLocaleDateString()}</td>
                        <td className="py-3 px-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            report.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'
                          }`}>
                            {report.status}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          {report.status === 'pending' && (
                            <button
                              onClick={() => handleResolveReport(report.id)}
                              className="bg-green-100 text-green-700 px-4 py-1 rounded-full font-semibold flex items-center gap-1 hover:bg-green-200"
                            >
                              <CheckCircle className="w-4 h-4" />
                              Resolve
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
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

export default AdminShopReports;