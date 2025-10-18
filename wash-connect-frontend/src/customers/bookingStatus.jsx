import React, { useEffect, useState } from "react";
import { FaClock, FaCarSide, FaCheckCircle, FaTimesCircle } from "react-icons/fa";
import { useLocation, useNavigate } from "react-router-dom";

function BookingStatus() {
  const location = useLocation();
  const navigate = useNavigate();
  const appointment_id = location.state?.appointment_id;

  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [countdown, setCountdown] = useState(3); // NEW

  useEffect(() => {
    if (!appointment_id) return;
    fetch(`http://localhost:3000/api/bookings/is-pending/${appointment_id}`)
      .then(res => res.json())
      .then(data => {
        setBooking(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [appointment_id]);

  // Redirect to booking-confirmation if confirmed
  useEffect(() => {
    if (booking?.status === "Confirmed") {
      const timer = setTimeout(() => {
        navigate("/booking-confirmation", { state: { appointment_id } });
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [booking, navigate, appointment_id]);

  // Redirect to user dashboard if declined
  useEffect(() => {
    if (booking?.status === "Declined") {
      const timer = setTimeout(() => {
        navigate("/user-dashboard");
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [booking, navigate]);

  // NEW: Countdown and redirect for Pending
  useEffect(() => {
    if (booking?.status !== "Pending") {
      setCountdown(3);
      return;
    }
    const interval = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          clearInterval(interval);
          navigate("/user-dashboard");
          return 0;
        }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [booking?.status, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#c8f1ff]">
        <div className="text-gray-500 te    xt-xl">Loading...</div>
      </div>
    );
  }

  if (!booking || !booking.status) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#c8f1ff]">
        <div className="bg-white rounded-2xl shadow-xl p-8 flex flex-col items-center w-full max-w-md">
          <FaTimesCircle className="text-red-400 text-5xl mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Booking Not Found</h2>
          <p className="text-gray-600 mb-6 text-center">
            We couldn't find your booking. Please try again or contact support.
          </p>
        </div>
      </div>
    );
  }

  if (booking.status === "Pending") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#c8f1ff]">
        <div className="bg-white rounded-2xl shadow-xl p-8 flex flex-col items-center w-full max-w-md">
          <FaClock className="text-cyan-500 text-5xl mb-4 animate-spin-slow" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Booking Request Sent</h2>
          <p className="text-gray-600 mb-6 text-center">
            Please wait while the carwash shop reviews your request.<br />
            You will receive a notification once your booking is accepted.
          </p>
          <div className="w-full bg-blue-50 rounded-lg p-4 mb-4">
            <div className="flex items-center mb-2">
              <FaCarSide className="text-cyan-400 mr-2" />
              <span className="font-semibold text-gray-700">{booking.service_name || "Service"}</span>
            </div>
            <div className="text-sm text-gray-600 mb-1">
              <span className="font-semibold">Date:</span> {booking.schedule_date || "—"}
              {booking.schedule_time && (
                <span> at <span className="font-semibold">{booking.schedule_time}</span></span>
              )}
            </div>
            <div className="text-sm text-gray-600">
              <span className="font-semibold">Address:</span> {booking.address || "—"}
            </div>
          </div>
          <div className="mt-2 text-xs text-gray-500 text-center">
            Status: <span className="font-bold text-yellow-600">{booking.status}</span>
          </div>
          <div className="mt-3 text-sm text-gray-600">
            Returning to dashboard in <span className="font-semibold">{countdown}</span>s...
          </div>
        </div>
      </div>
    );
  }

  if (booking.status === "Confirmed") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#c8f1ff]">
        <div className="bg-white rounded-2xl shadow-xl p-8 flex flex-col items-center w-full max-w-md">
          <FaCheckCircle className="text-green-500 text-5xl mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Booking Accepted!</h2>
          <p className="text-gray-600 mb-6 text-center">
            Your booking has been accepted. Redirecting to confirmation page...
          </p>
          <div className="w-full bg-green-50 rounded-lg p-4 mb-4">
            <div className="flex items-center mb-2">
              <FaCarSide className="text-green-400 mr-2" />
              <span className="font-semibold text-gray-700">{booking.service_name || "Service"}</span>
            </div>
            <div className="text-sm text-gray-600 mb-1">
              <span className="font-semibold">Date:</span> {booking.schedule_date || "—"}
              {booking.schedule_time && (
                <span> at <span className="font-semibold">{booking.schedule_time}</span></span>
              )}
            </div>
            <div className="text-sm text-gray-600">
              <span className="font-semibold">Address:</span> {booking.address || "—"}
            </div>
          </div>
          <div className="mt-2 text-xs text-gray-500 text-center">
            Status: <span className="font-bold text-green-600">{booking.status}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#c8f1ff]">
      <div className="bg-white rounded-2xl shadow-xl p-8 flex flex-col items-center w-full max-w-md">
        <FaTimesCircle className="text-red-400 text-5xl mb-4" />
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Booking {booking.status}</h2>
        <p className="text-gray-600 mb-6 text-center">
          Your booking is <b>{booking.status}</b>. Please contact support if you need help.
        </p>
      </div>
    </div>
  );
}

export default BookingStatus;