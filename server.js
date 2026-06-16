require('dotenv').config();
const express = require('express');
const cors = require('cors');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const { connectDB } = require('./config/db');
const { seedAdminUser } = require('./scripts/seedAdmin');

const authRoutes = require('./routes/auth');
const donationRoutes = require('./routes/donations');
const adminRoutes = require('./routes/admin/index');
const adminCmsRoutes = require('./routes/admin/cms');
const queryRoutes = require('./routes/queries');

const app = express();

app.use(
  cors({
    origin: [process.env.CLIENT_URL, process.env.ADMIN_URL].filter(Boolean).length
      ? [process.env.CLIENT_URL, process.env.ADMIN_URL].filter(Boolean)
      : ['http://localhost:5173', 'http://localhost:5174'],
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const startServer = async () => {
  const mongoUri = await connectDB();

  app.use(
    session({
      secret: process.env.SESSION_SECRET || 'hopeconnect_secret',
      resave: false,
      saveUninitialized: false,
      store: MongoStore.create({
        mongoUrl: mongoUri,
        collectionName: 'sessions',
      }),
      cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        maxAge: 1000 * 60 * 60 * 24 * 7,
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      },
    })
  );

  app.get('/api/health', (req, res) => {
    res.json({
      success: true,
      message: 'HopeConnect NGO Platform API is running',
      policy: 'Non-Monetary Donations Only',
    });
  });

  app.use('/api/auth', authRoutes);
  app.use('/api/donations', donationRoutes);
  app.use('/api/queries', queryRoutes);
  app.use('/api/admin', adminRoutes);
  app.use('/api/admin/cms', adminCmsRoutes);

  app.use((req, res) => {
    res.status(404).json({ success: false, message: 'Route not found' });
  });

  app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ success: false, message: 'Internal server error' });
  });

  if (process.env.NODE_ENV !== 'production') {
    await seedAdminUser();
  }

  const PORT = process.env.PORT || 5001;
  app.listen(PORT, () => {
    console.log(`HopeConnect API running on port ${PORT}`);
  });
};

startServer().catch((error) => {
  console.error('Failed to start server:', error.message);
  process.exit(1);
});
