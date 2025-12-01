import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';

import Login from './Login';
import Register from './customers/Register';
import UserDashboard from './customers/UserDashboard';
import LandingPage from './LandingPage';
import CarwashShopPage from './customers/CarwashShopPage';
import BookingPage from './customers/BookingPage';
import CarwashRegister from './carwashowners/carwashRegister';
import CarwashLogin from './carwashowners/carwashLogin';
import CarwashApplicationRegistration from './carwashowners/carwashApplicationRegistration';
import AdminRegister from './admin/adminRegister';
import AdminDashboard from './admin/adminDashboard';
import AdminApplicationRequests from './admin/adminApplicationRequests';
import AdminUserManagement from './admin/adminUserManagement';
import AdminCarwashManagement from './admin/adminCarwashManagement';
import BookForm from './customers/bookForm';
import BookingConfirmation from './customers/bookingConfirmation';
import Payment from './customers/payment';
import CarwashDashboard from './carwashowners/carwashDashboard';
import CustomerList from './carwashowners/CustomerList';
import BannedPage from './customers/BannedPage';
import PersonnelList from './carwashowners/PersonnelList';
import AddEmployee from './carwashowners/AddEmployee';
import PersonnelEdit from './carwashowners/personnelEdit';
import Bookings from './carwashowners/booking';
import AwaitingApproval from './carwashowners/AwaitingApproval';
import BookingHistory from './carwashowners/bookinghistory';
import EarningDashboard from './carwashowners/EarningDashboard';
import BookingStatus from './customers/bookingStatus';
import PersonnelDetails from './carwashowners/personnelDetails';
import StatusUpdate from './carwashowners/statusUpdate';
import TrackStatus from './customers/trackStatus';
import RescheduleForm from './customers/RescheduleForm';
import Feedback from './customers/feedback';
import RefundRequest from './carwashowners/refundRequest';
import ShopBanned from './carwashowners/shopbanned'; 
import ForgotPassword from './forgotPassword'; 
import PasswordReset from './passwordReset';
import AdminShopReports from './admin/AdminShopReports';

function App() {
    return (
        <Router>
            <Routes>
                {/* Customer Routes */}
                <Route path="/" element={<LandingPage />} />
                <Route path="/register" element={<Register />} />
                <Route path="/user-dashboard" element={<UserDashboard />} />
                <Route path="/login" element={<Login />} />
                <Route path="/popular-carwash" element={<CarwashShopPage />} />
                <Route path="/book" element={<BookingPage />} />
                <Route path="/book-form" element={<BookForm />} />
                <Route path="/booking-confirmation" element={<BookingConfirmation />} />
                <Route path="/payment" element={<Payment />} />
                <Route path="/banned" element={<BannedPage />} />
                <Route path="/booking-status" element={<BookingStatus />} />
                <Route path="/reschedule" element={<RescheduleForm />} />
                <Route path="/feedback" element={<Feedback />} /> 
                <Route path="/forgot-password" element={<ForgotPassword />} /> 

                {/* Carwash Owner Routes */}
                <Route path="/carwash-register" element={<CarwashRegister />} />
                <Route path="/carwash-login" element={<CarwashLogin />} />
                <Route path="/carwash-application-registration" element={<CarwashApplicationRegistration />} /> 
                <Route path="/carwash-dashboard" element={<CarwashDashboard />} />
                <Route path="/customer-list" element={<CustomerList />} />
                <Route path="/personnel-list" element={<PersonnelList />} />
                <Route path="/add-employee" element={<AddEmployee />} />
                <Route path="/personnel-edit" element={<PersonnelEdit />} />
                <Route path="/bookings" element={<Bookings />} />
                <Route path="/awaiting-approval" element={<AwaitingApproval />} />
                <Route path="/booking-history" element={<BookingHistory />} />
                <Route path="/earning-dashboard" element={<EarningDashboard />} />
                <Route path="/personnel-details" element={<PersonnelDetails />} />
                <Route path="/personnel-details/:personnelId" element={<PersonnelDetails />} />
                <Route path="/status-update" element={<StatusUpdate />} />
                <Route path="/track-status" element={<TrackStatus />} />
                <Route path="/refund-request" element={<RefundRequest />} />
                <Route path="/shop-banned" element={<ShopBanned />} />

                {/* Admin Routes */}
                <Route path="/admin-register" element={<AdminRegister />} />
                <Route path="/admin-dashboard" element={<AdminDashboard />} />
                <Route path="/admin-application-requests" element={<AdminApplicationRequests />} />
                <Route path="/admin-customer-management" element={<AdminUserManagement />} />
                <Route path="/admin-carwash-management" element={<AdminCarwashManagement />} />
                <Route path="/admin/shops/:shopId/reports" element={<AdminShopReports />} />

                <Route path="/password-reset" element={<PasswordReset />} />

            </Routes>
        </Router>
    );
}

export default App;