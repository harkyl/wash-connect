const express = require('express');
const cors = require('cors');
require('dotenv').config();

const registerRoutes = require('./routes/user');
const loginRoutes = require('./routes/login');
const testTokenRoutes = require('./routes/testToken');
const profileRoutes = require('./routes/profile');
const changePasswordRoutes = require('./routes/changePasswords');
const carwashOwnerRegisterRoutes = require('./routes/carwashOwnerRegisters');
const carwashOwnerLoginRoutes = require('./routes/carwashOwnerLogin');
const adminRegisterRoutes = require('./adminroutes/adminRegister');
const adminApplicationRequestRoutes = require('./adminroutes/adminApplicationRequest');
const adminUserManagementRoutes = require('./adminroutes/adminUserManagement');
const adminApplicationManagementRoutes = require('./adminroutes/adminApplicationManagement');
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
const refundRoutes = require('./routes/refund'); // Add this line
const reviewsRoutes = require('./routes/reviews'); // Add this line
const forgotPasswordRoutes = require('./routes/forgotpassword'); // Add this line
const resetPasswordRoutes = require('./routes/resetpassword'); // Add this line
const ownersRoutes = require('./routes/owners'); // Add this line
const customerRoutes = require('./routes/customers');
const userRoutes = require('./routes/user');

const app = express();
const path = require('path');

// Middleware
app.use(cors());
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
app.use('/api', customerRoutes); // Add this line
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



app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Server error' });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));