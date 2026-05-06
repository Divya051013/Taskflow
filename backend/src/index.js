const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const projectRoutes = require('./routes/projects');
const taskRoutes = require('./routes/tasks');
const dashboardRoutes = require('./routes/dashboard');

const app = express();

const allowedOrigins = (process.env.FRONTEND_URL || 'http://localhost:3000')
  .split(',')
  .map(origin => origin.trim())
  .filter(Boolean);

app.use(helmet());
app.use(morgan('dev'));
app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);

    const isAllowedOrigin = allowedOrigins.includes(origin);
    const isLocalDevOrigin = process.env.NODE_ENV !== 'production'
      && /^http:\/\/localhost:\d+$/.test(origin);

    if (isAllowedOrigin || isLocalDevOrigin) {
      return callback(null, true);
    }

    return callback(new Error(`CORS blocked for origin: ${origin}`));
  },
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.get('/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/projects/:projectId/tasks', taskRoutes);
app.use('/api/dashboard', dashboardRoutes);

app.use((req, res) => res.status(404).json({ message: 'Route not found' }));
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ message: err.message || 'Internal Server Error' });
});

if (!process.env.MONGODB_URI) {
  console.error('Missing MONGODB_URI. Create backend/.env and set MONGODB_URI to your MongoDB connection string.');
  process.exit(1);
}

const getSafeMongoUriDetails = uri => {
  try {
    const parsed = new URL(uri);
    return `${parsed.protocol}//${parsed.username ? `${parsed.username}:<password>@` : ''}${parsed.host}${parsed.pathname}`;
  } catch (err) {
    return '<invalid MongoDB URI>';
  }
};

const printMongoConnectionHelp = err => {
  const serverMessages = err?.reason?.servers
    ? [...err.reason.servers.entries()].map(([server, description]) => {
      const message = description?.error?.message || description?.error || description?.type;
      return `  - ${server}: ${message}`;
    })
    : [];

  console.error('MongoDB connection failed.');
  console.error(`URI: ${getSafeMongoUriDetails(process.env.MONGODB_URI)}`);
  console.error(`Reason: ${err.message}`);

  if (serverMessages.length) {
    console.error('Atlas server checks:');
    console.error(serverMessages.join('\n'));
  }

  console.error('Check that your current public IP is allowed in MongoDB Atlas Network Access and that the database user/password are correct.');
};

mongoose.connect(process.env.MONGODB_URI, {
  family: 4,
  serverSelectionTimeoutMS: 10000
})
  .then(() => {
    console.log('MongoDB connected');
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch(err => { printMongoConnectionHelp(err); process.exit(1); });

module.exports = app;
