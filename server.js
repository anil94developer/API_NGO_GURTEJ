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

app.set('trust proxy', 1);

const PRODUCTION_ORIGINS = [
  'https://admin-gno-gurtej.onrender.com',
  'https://admin-ngo-gurtej.onrender.com',
  'https://frontend-ngo-gurtej.onrender.com',
  'https://ngo-gurtej.onrender.com',
];

const getAllowedOrigins = () => {
  const origins = new Set([
    'http://localhost:5173',
    'http://localhost:5174',
    ...PRODUCTION_ORIGINS,
  ]);

  if (process.env.CLIENT_URL) origins.add(process.env.CLIENT_URL);
  if (process.env.ADMIN_URL) origins.add(process.env.ADMIN_URL);

  if (process.env.ALLOWED_ORIGINS) {
    process.env.ALLOWED_ORIGINS.split(',').forEach((o) => {
      const trimmed = o.trim();
      if (trimmed) origins.add(trimmed);
    });
  }

  return [...origins];
};

app.use(
  cors({
    origin: (origin, callback) => {
      const allowed = getAllowedOrigins();
      if (!origin || allowed.includes(origin)) {
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
      env: process.env.NODE_ENV || 'development',
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
