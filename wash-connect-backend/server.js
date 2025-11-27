const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({ origin: ['http://localhost:5173', 'https://your-frontend.onrender.com'], credentials: true }));
app.use(express.json());

// Health check
app.get('/api/health', (_, res) => res.json({ ok: true }));

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
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));