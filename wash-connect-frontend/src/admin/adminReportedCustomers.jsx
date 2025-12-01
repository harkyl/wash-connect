import React, { useState, useEffect } from 'react';
import { Trophy, Eye, Star, FileText, LogOut, UserCircle, ShieldAlert, Users } from "lucide-react";

const AdminReportedCustomers = () => {
    const [reportedCustomers, setReportedCustomers] = useState([]);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchReportedCustomers = async () => {
            setLoading(true);
            try {
                const response = await fetch('http://localhost:3000/api/reports/customer');
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                const data = await response.json();
                const formattedData = data.map(report => ({
                    id: report.report_id,
                    reportedCustomerName: `${report.first_name} ${report.last_name}`,
                    reportedByName: `${report.owner_first_name} ${report.owner_last_name}`,
                    reason: report.reason,
                    createdAt: report.report_date,
                    status: report.report_status
                }));
                setReportedCustomers(formattedData.filter(report => report.status !== 'RESOLVED'));
            } catch (error) {
                setError(error.message);
            } finally {
                setLoading(false);
            }
        };

        fetchReportedCustomers();
    }, []);

    return (
        <div className="min-h-screen flex bg-white">
            {/* Sidebar */}
            <aside className="w-72 bg-white border-r border-gray-200 flex flex-col min-h-screen">
                <div className="flex items-center px-8 py-8 border-b border-gray-100">
                    <span className="text-3xl" style={{ fontFamily: "Brush Script MT, cursive" }}>
                        <span className="text-black-500">Wash</span> <span className="text-red-500">Connect</span>
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
                    <button
                        className="flex items-center w-full px-4 py-3 rounded-lg bg-cyan-100 text-cyan-700 font-semibold"
                        disabled
                    >
                        <ShieldAlert className="mr-3 w-5 h-5" />
                        Reported Customers
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
                        <ShieldAlert className="w-6 h-6 text-gray-700 mr-4" />
                        <span className="text-2xl font-bold">Reported Customers</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <span className="text-sm text-gray-700">SuperAdmin</span>
                        <UserCircle className="w-7 h-7 text-gray-700" />
                    </div>
                </header>

                {/* Reports Table */}
                <div className="p-10">
                    <div className="bg-white rounded-xl shadow-md overflow-hidden">
                        <div className="px-6 py-4">
                            <h2 className="text-2xl font-bold text-gray-800">Shop Owner Reports</h2>
                            <p className="text-sm text-gray-500">List of Reported customers.</p>
                        </div>
                        {loading ? (
                            <div className="text-center py-20 text-gray-500">Loading reports...</div>
                        ) : error ? (
                            <div className="text-center py-20 text-red-500">Error: {error}</div>
                        ) : reportedCustomers.length === 0 ? (
                            <div className="text-center py-20 text-gray-500">No pending reports found.</div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left text-gray-600">
                                    <thead className="bg-gray-50 text-xs text-gray-700 uppercase">
                                        <tr>
                                            <th scope="col" className="px-6 py-3">Reported Customer</th>
                                            <th scope="col" className="px-6 py-3">Reported By</th>
                                            <th scope="col" className="px-6 py-3">Reason</th>
                                            <th scope="col" className="px-6 py-3">Date</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {reportedCustomers.map((report) => (
                                            <tr key={report.id} className="bg-white border-b hover:bg-gray-50">
                                                <td className="px-6 py-4 font-medium text-gray-900">{report.reportedCustomerName}</td>
                                                <td className="px-6 py-4">{report.reportedByName}</td>
                                                <td className="px-6 py-4">{report.reason}</td>
                                                <td className="px-6 py-4">{new Date(report.createdAt).toLocaleDateString()}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
};

export default AdminReportedCustomers;