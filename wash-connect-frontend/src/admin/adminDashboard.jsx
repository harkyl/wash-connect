import { Trophy, Eye, Users, FileText, Inbox, LogOut, UserCircle } from "lucide-react";
import { Bar, Doughnut } from "react-chartjs-2";
import Chart from "chart.js/auto"; // auto-registers all needed elements
import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";

function getAnalytics(payments, refunds) {
  const totalIncome = payments.reduce((sum, p) => sum + (p?.amount ? Number(p.amount) : 0), 0);
  const totalRefund = refunds.reduce((sum, r) => sum + (r?.amount ? Number(r.amount) : 0), 0);
  const byMethod = {};
  payments.forEach(p => {
    const method = p?.method || "Unknown";
    byMethod[method] = (byMethod[method] || 0) + (p?.amount ? Number(p.amount) : 0);
  });
  return { totalIncome, totalRefund, byMethod };
}

function AdminDashboard() {
  const [payments, setPayments] = useState([]);
  const [refunds, setRefunds] = useState([]);
  const navigate = useNavigate();

  // NEW: tab state
  const [activeTab, setActiveTab] = useState("payments");

  // NEW: map applicationId -> carwashName
  const [appNames, setAppNames] = useState({});

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    fetch("http://localhost:3000/api/all", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then(res => {
        if (res.status === 401) {
          navigate("/login");
          return [];
        }
        return res.json();
      })
      .then(data => setPayments(data))
      .catch(() => setPayments([]));

    fetch("http://localhost:3000/api/refunds", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then(res => {
        if (res.status === 401) {
          navigate("/login");
          return [];
        }
        return res.json();
      })
      .then(data => setRefunds(data))
      .catch(() => setRefunds([]));
    // eslint-disable-next-line
  }, []);

  // NEW: after payments load, fetch carwash names for each applicationId (fallback to fields in payments)
  useEffect(() => {
    const token = localStorage.getItem("token");
    const getAppId = (p) => p?.applicationId ?? p?.application_id ?? p?.app_id ?? null;

    const uniqueIds = Array.from(
      new Set(payments.map(getAppId).filter((v) => v !== null && v !== undefined))
    );

    if (uniqueIds.length === 0) {
      setAppNames({});
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const entries = await Promise.all(
          uniqueIds.map(async (id) => {
            try {
              const res = await fetch(`http://localhost:3000/api/applications/${id}`, {
                headers: token ? { Authorization: `Bearer ${token}` } : {},
              });
              if (!res.ok) return [id, undefined];
              const data = await res.json();
              const name =
                data?.carwashName || data?.carwash_name || data?.name || undefined;
              return [id, name];
            } catch {
              return [id, undefined];
            }
          })
        );
        if (cancelled) return;
        const map = {};
        entries.forEach(([id, name]) => {
          if (name) map[id] = name;
        });
        setAppNames(map);
      } catch {
        if (!cancelled) setAppNames({});
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [payments]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  const analytics = getAnalytics(payments, refunds);

  // Helper: read many possible keys for applicationId from a payment row
  const getAppId = (p) =>
    p?.applicationId ??
    p?.application_id ??
    p?.applicationid ??
    p?.appId ??
    p?.app_id ??
    null;

  // Resolve shop name for a payment row
  const shopNameForPayment = (p) =>
    p?.carwashName ||
    p?.carwash_name ||
    (getAppId(p) ? appNames[getAppId(p)] : undefined) ||
    "Unknown Shop";

  // NEW: derive tax rows (Paid only), with computed tax and totals
  const paidPayments = useMemo(
    () => payments.filter(p => String(p?.payment_status || p?.status || "").toLowerCase() === "paid"),
    [payments]
  );
  const taxRows = useMemo(
    () => paidPayments.map(p => ({
      ...p,
      shop: shopNameForPayment(p),
      tax: Number(p?.tax ?? (Number(p?.amount || 0) * 0.10)),
    })),
    [paidPayments, appNames]
  );
  const totalTax = useMemo(
    () => taxRows.reduce((sum, r) => sum + (Number(r.tax) || 0), 0),
    [taxRows]
  );

  // NEW: compute Top Selling Shop by count of Paid payments (tie-breaker: higher total amount)
  const topShop = useMemo(() => {
    const paid = payments.filter(
      (p) => String(p?.payment_status || p?.status || "").toLowerCase() === "paid"
    );
    const agg = {};
    for (const p of paid) {
      const key = getAppId(p) ?? `name:${shopNameForPayment(p)}`;
      const name = shopNameForPayment(p);
      if (!agg[key]) agg[key] = { name, count: 0, amount: 0 };
      agg[key].count += 1;
      agg[key].amount += Number(p?.amount || 0);
    }
    const list = Object.values(agg);
    if (list.length === 0) return null;
    list.sort((a, b) => b.count - a.count || b.amount - a.amount);
    return list[0];
  }, [payments, appNames]);

  // Chart data
  const barData = {
    labels: Object.keys(analytics.byMethod),
    datasets: [
      {
        label: "Total by Method",
        data: Object.values(analytics.byMethod),
        backgroundColor: ["#38bdf8", "#fbbf24", "#34d399", "#f87171", "#a78bfa"],
      },
    ],
  };
  const doughnutData = {
    labels: ["Income", "Refund"],
    datasets: [
      {
        data: [analytics.totalIncome, analytics.totalRefund],
        backgroundColor: ["#34d399", "#f87171"],
      },
    ],
  };

  // Prepare tax by method for chart
  const taxByMethod = {};
  payments
    .filter(p => String(p?.payment_status || p?.status || "").toLowerCase() === "paid")
    .forEach(p => {
      const method = p.method || "Unknown";
      const tax = p.tax ? Number(p.tax) : Number(p.amount) * 0.10;
      taxByMethod[method] = (taxByMethod[method] || 0) + tax;
    });

  const taxBarData = {
    labels: Object.keys(taxByMethod),
    datasets: [
      {
        label: "Tax Collected by Method",
        data: Object.values(taxByMethod),
        backgroundColor: ["#60a5fa", "#fbbf24", "#34d399", "#f87171", "#a78bfa"],
      },
    ],
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
            className="flex items-center w-full px-4 py-3 rounded-lg bg-cyan-100 text-cyan-700 font-semibold"
            onClick={() => navigate("/admin-dashboard")}
          >
            <Trophy className="mr-3 w-5 h-5" />
            Earnings Dashboard
          </button>
          <button
            className="flex items-center w-full px-4 py-3 rounded-lg hover:bg-gray-100 text-gray-700"
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
          <button className="flex items-center text-gray-700 hover:text-red-500" onClick={handleLogout}>
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
            <button className="mr-4">
              <Inbox className="w-6 h-6 text-gray-700" />
            </button>
            <span className="text-lg font-semibold">Earnings Dashboard</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-700">SuperAdmin</span>
            <UserCircle className="w-7 h-7 text-gray-700" />
          </div>
        </header>

        <div className="p-10">
          {/* NEW: Top Selling Shop card */}
          <div className="bg-white rounded-xl shadow p-6 border border-gray-100 mb-8">
            <h4 className="font-semibold mb-2">Top Selling Shop</h4>
            {topShop ? (
              <div className="text-gray-800">
                <span className="text-lg font-bold">{topShop.name}</span>
                <span className="ml-2 text-sm text-gray-600">
                  • {topShop.count} paid {topShop.count === 1 ? "payment" : "payments"}
                </span>
                <span className="ml-2 text-sm text-gray-600">
                  • ₱{topShop.amount.toLocaleString()}
                </span>
              </div>
            ) : (
              <div className="text-gray-500">No paid payments yet.</div>
            )}
          </div>

          {/* Analytical Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            <div className="bg-white rounded-xl shadow p-6 border border-gray-100 flex flex-col items-center">
              <h4 className="font-semibold mb-4">Income vs Refund</h4>
              <div style={{ width: "100%", maxWidth: 180, height: 180 }}>
                <Doughnut data={doughnutData} options={{ maintainAspectRatio: false }} />
              </div>
              <div className="mt-4 text-center">
                <div className="text-green-600 font-bold">Income: ₱{analytics.totalIncome.toLocaleString()}</div>
                <div className="text-red-600 font-bold">Refund: ₱{analytics.totalRefund.toLocaleString()}</div>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow p-6 border border-gray-100 flex flex-col items-center">
              <h4 className="font-semibold mb-4">Payments by Method</h4>
              <div style={{ width: "100%", maxWidth: 220, height: 180 }}>
                <Bar data={barData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }} />
              </div>
            </div>
            <div className="bg-white rounded-xl shadow p-6 border border-gray-100 flex flex-col items-center">
              <h4 className="font-semibold mb-4">Tax Collected by Method</h4>
              <div style={{ width: "100%", maxWidth: 220, height: 180 }}>
                <Bar
                  data={taxBarData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: {
                      y: {
                        beginAtZero: true,
                        ticks: { callback: (value) => `₱${value.toLocaleString()}` },
                      },
                    },
                  }}
                />
              </div>
            </div>
          </div>
          {/* Payments / Tax Tabs */}
          <div className="bg-white rounded-xl shadow p-8 border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold">Reports</h3>
              <div className="flex gap-2">
                <button
                  className={`px-3 py-1 rounded-lg text-sm ${activeTab === "payments" ? "bg-cyan-600 text-white" : "bg-gray-100 text-gray-700"}`}
                  onClick={() => setActiveTab("payments")}
                >
                  Payments
                </button>
                <button
                  className={`px-3 py-1 rounded-lg text-sm ${activeTab === "tax" ? "bg-cyan-600 text-white" : "bg-gray-100 text-gray-700"}`}
                  onClick={() => setActiveTab("tax")}
                >
                  Tax Collected
                </button>
              </div>
            </div>

            {activeTab === "payments" ? (
              // PAYMENTS TABLE (existing)
              <div style={{ maxHeight: "340px", overflowY: "auto" }}>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-gray-500">
                      <th className="py-2 text-left">Payment ID</th>
                      <th className="py-2 text-left">Shop</th>
                      <th className="py-2 text-left">Amount</th>
                      <th className="py-2 text-left">Date</th>
                      <th className="py-2 text-left">Method</th>
                      <th className="py-2 text-left">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center text-gray-400 py-4">No payments found.</td>
                      </tr>
                    ) : (
                      payments.map((p) => (
                        <tr key={p.payment_id} className="border-t">
                          <td className="py-2">{p.payment_id}</td>
                          <td className="py-2">{shopNameForPayment(p)}</td>
                          <td className="py-2">₱{Number(p.amount).toLocaleString()}</td>
                          <td className="py-2">{p.date ? String(p.date).slice(0, 16).replace("T", " ") : ""}</td>
                          <td className="py-2">{p.method}</td>
                          <td className="py-2">{p.payment_status || p.status}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            ) : (
              // TAX COLLECTED TAB
              <>
                <div className="flex items-center justify-between mb-3">
                  <div className="text-sm text-gray-700">
                    Total Tax Collected (Paid): <span className="font-semibold">₱{totalTax.toLocaleString()}</span>
                  </div>
                </div>
                <div style={{ maxHeight: "340px", overflowY: "auto" }}>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-gray-500">
                        <th className="py-2 text-left">Payment ID</th>
                        <th className="py-2 text-left">Shop</th>
                        <th className="py-2 text-left">Amount</th>
                        <th className="py-2 text-left">Tax (10%)</th>
                        <th className="py-2 text-left">Method</th>
                        <th className="py-2 text-left">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {taxRows.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="text-center text-gray-400 py-4">No paid transactions found.</td>
                        </tr>
                      ) : (
                        taxRows.map((r) => (
                          <tr key={r.payment_id} className="border-t">
                            <td className="py-2">{r.payment_id}</td>
                            <td className="py-2">{r.shop}</td>
                            <td className="py-2">₱{Number(r.amount).toLocaleString()}</td>
                            <td className="py-2">₱{Number(r.tax).toLocaleString()}</td>
                            <td className="py-2">{r.method || "Unknown"}</td>
                            <td className="py-2">{r.date ? String(r.date).slice(0, 16).replace("T", " ") : ""}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default AdminDashboard;