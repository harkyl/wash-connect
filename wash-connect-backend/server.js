const express = require('express');
const cors = require('cors');
const path = require('path'); // add this
require('dotenv').config();

// Import routers
const registerRoutes = require('./routes/user'); // adjust if register is a different file
const loginRoutes = require('./routes/login');
const testTokenRoutes = require('./routes/testToken');

const carwashOwnerRegisterRoutes = require('./routes/carwashOwnerRegisters');
const carwashOwnerLoginRoutes = require('./routes/carwashOwnerLogin');
const carwashApplicationsRequestRoutes = require('./routes/carwashApplications');
const bookingFormRoutes = require('./routes/bookingform');
const personnelRoutes = require('./routes/personnel');
const carwashOwnersRoutes = require('./routes/carwashOwners');
const ownerAvatarUpload = require('./routes/ownerAvatarUpload');
const userAvatarUpload = require('./routes/userAvatarUpload');
const feedbackRoutes = require('./routes/feedback');
const paymentRoutes = require('./routes/payment');
const serviceRoutes = require('./routes/service');
const bookingRoutes = require('./routes/booking');
const refundRoutes = require('./routes/refund');
const reviewsRoutes = require('./routes/reviews');
const forgotPasswordRoutes = require('./routes/forgotpassword');
const resetPasswordRoutes = require('./routes/resetpassword');
const ownersRoutes = require('./routes/owners');
const customersRoutes = require('./routes/customers');
const userRoutes = require('./routes/user');

const adminRegisterRoutes = require('./adminroutes/adminRegister');
const adminApplicationRequestRoutes = require('./adminroutes/adminApplicationRequest');
const adminUserManagementRoutes = require('./adminroutes/adminUserManagement');
const adminApplicationManagementRoutes = require('./adminroutes/adminApplicationManagement');

const profileRoutes = require('./routes/profile');
const changePasswordRoutes = require('./routes/changePasswords');

const app = express();

// Middleware
app.use(cors({
  origin: (origin, cb) => {
    if (!origin || ['http://localhost:5173', 'https://wash-connect-gmim.vercel.app'].includes(origin)) return cb(null, true);
    return cb(new Error('Not allowed by CORS'));
  },
  credentials: true
}));
app.use(express.json());

// user and owner routes
app.use('/api/auth', registerRoutes);
app.use('/api/auth', loginRoutes);
app.use('/api/auth', testTokenRoutes);
app.use('/api/auth', carwashOwnerRegisterRoutes);
app.use('/api/auth', carwashOwnerLoginRoutes);
app.use('/api', carwashApplicationsRequestRoutes);
app.use('/api', bookingFormRoutes);
app.use('/api', personnelRoutes);
app.use('/api', carwashOwnersRoutes);
app.use('/api', ownerAvatarUpload);
app.use('/api', userAvatarUpload);
app.use('/api', feedbackRoutes);
app.use('/api', paymentRoutes);
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/api/services', serviceRoutes);
app.use('/api', bookingRoutes);
app.use('/api/refunds', refundRoutes); // Add this line
app.use('/api', reviewsRoutes); // Add this line
app.use('/api/forgot-password', forgotPasswordRoutes); // Add this line
app.use('/api/reset-password', resetPasswordRoutes); // Add this line
app.use('/api', ownersRoutes); // Add this line
app.use('/api/customers', customersRoutes); // Add this line
app.use('/api/users', userRoutes);

//admin
app.use('/api/admin', adminRegisterRoutes);
app.use('/api/admin', adminApplicationRequestRoutes);
app.use('/api/admin', adminUserManagementRoutes);
app.use('/api/admin', adminApplicationManagementRoutes);


app.use('/api/user', profileRoutes);
app.use('/api/user', changePasswordRoutes);

//uploading for png
app.use('/uploads/logos', express.static(path.join(__dirname, 'uploads/logos')));
app.use('/uploads/avatars', express.static(path.join(__dirname, 'uploads/avatars')));
app.get('/api/health', (req, res) => res.json({ ok: true }));

app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Server error' });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});