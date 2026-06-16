require('dotenv').config();
const express = require('express');
const cors = require('cors');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const { connectDB } = require('./config/db');
const { seedAdminUser } = require('./scripts/seedAdmin');
const { isProduction, sessionCookieOptions, isAllowedOrigin } = require('./config/env');

const authRoutes = require('./routes/auth');
const donationRoutes = require('./routes/donations');
const adminRoutes = require('./routes/admin/index');
const adminCmsRoutes = require('./routes/admin/cms');
const queryRoutes = require('./routes/queries');

const app = express();

app.set('trust proxy', 1);

app.use(
  cors({
    origin: (origin, callback) => {
      if (isAllowedOrigin(origin)) {
        callback(null, true);
      } else {
        console.warn('CORS blocked origin:', origin);
        callback(null, false);
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
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
      proxy: isProduction,
      cookie: sessionCookieOptions,
    })
  );

  app.get('/api/health', (req, res) => {
    res.json({
      success: true,
      message: 'HopeConnect NGO Platform API is running',
      policy: 'Non-Monetary Donations Only',
      env: isProduction ? 'production' : 'development',
    });
  });

  app.get('/', (req, res) => {
    res.json({
      success: true,
      message: 'HopeConnect API',
      health: '/api/health',
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

  await seedAdminUser();

  const PORT = process.env.PORT || 5001;
  app.listen(PORT, () => {
    console.log(`HopeConnect API running on port ${PORT}`);
  });
};

startServer().catch((error) => {
  console.error('Failed to start server:', error.message);
  process.exit(1);
});
