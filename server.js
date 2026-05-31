const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');

// Load environment variables
dotenv.config();

const { connectDB } = require('./config/db');
const Admin = require('./models/Admin');

// Initialize express app
const app = express();

// Body Parser Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Cookie Parser Middleware
app.use(cookieParser());

// Serve static assets from public folder
app.use(express.static(path.join(__dirname, 'public')));

// API Route Mounts
app.use('/api/auth', require('./routes/auth'));
app.use('/api/donor', require('./routes/donor'));
app.use('/api/request', require('./routes/request'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/payment', require('./routes/payment'));

// Fallback for HTML routing (redirect routes to .html files cleanly)
app.get('/:page', (req, res, next) => {
  const page = req.params.page;
  if (!page.includes('.') && page !== 'api') {
    return res.sendFile(path.join(__dirname, 'public', `${page}.html`), (err) => {
      if (err) next();
    });
  }
  next();
});

// Auto-seed default Administrator credentials if database is empty
const seedDefaultAdmin = async () => {
  try {
    const adminCount = await Admin.countDocuments({});
    if (adminCount === 0) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('admin123', salt);
      
      await Admin.create({
        username: 'admin',
        password: hashedPassword
      });
      console.log('\x1b[35m[Database] Default administrator seeded: username: admin / password: admin123\x1b[0m');
    }
  } catch (err) {
    console.error('Error seeding default admin credentials:', err);
  }
};

// Start application
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  // Connect to database (will automatically set up fallback if MongoDB offline)
  await connectDB();
  
  // Seed admin credentials
  await seedDefaultAdmin();

  app.listen(PORT, () => {
    console.log(`\x1b[32m[Server] Running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode\x1b[0m`);
    console.log(`\x1b[36m[Server] Live dashboard local URL: http://localhost:${PORT}\x1b[0m`);
  });
};

startServer();
