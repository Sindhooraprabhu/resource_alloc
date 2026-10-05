const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const helmet = require('helmet');
const morgan = require('morgan');
const cors = require('cors');
const socketIo = require('socket.io');
const http = require('http');

// Load environment variables
dotenv.config();

// Import routes
const authRoutes = require('./routes/auth');
const emergencyRoutes = require('./routes/emergencies');
const hospitalRoutes = require('./routes/hospitals');
const ambulanceRoutes = require('./routes/ambulances');
const patientRoutes = require('./routes/patients');
const userRoutes = require('./routes/users');
const trafficRoutes = require('./routes/traffic');
const allocationRoutes = require('./routes/allocation');
const { seedOperationalResources } = require('./utils/operationalResourceSeeder');

// Import middleware
const { notFound, errorHandler } = require('./middleware/errorMiddleware');

// Initialize app
const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    methods: ['GET', 'POST']
  }
});

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);

  // Join user-specific room
  socket.on('joinRoom', (userId) => {
    socket.join(userId);
    console.log(`User ${userId} joined room`);
  });

  // Join hospital room
  socket.on('joinHospitalRoom', (hospitalId) => {
    socket.join(`hospital_${hospitalId}`);
    console.log(`Joined hospital room: ${hospitalId}`);
  });

  // Join ambulance room
  socket.on('joinAmbulanceRoom', (ambulanceId) => {
    socket.join(`ambulance_${ambulanceId}`);
    console.log(`Joined ambulance room: ${ambulanceId}`);
  });

  socket.on('joinEmergencyRoom', (emergencyId) => {
    socket.join(`emergency_${emergencyId}`);
    console.log(`Joined emergency room: ${emergencyId}`);
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Make io accessible to routes
app.set('io', io);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/emergencies', emergencyRoutes);
app.use('/api/hospitals', hospitalRoutes);
app.use('/api/ambulances', ambulanceRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/users', userRoutes);
app.use('/api/traffic', trafficRoutes);
app.use('/api/allocation', allocationRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// 404 handler
app.use(notFound);

// Error handler
app.use(errorHandler);

// Connect to MongoDB
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/lifelink_ai', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

// Start server
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();
    await seedOperationalResources();
    server.listen(PORT, () => {
      console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
    });
  } catch (error) {
    console.error(`Failed to start server: ${error.message}`);
    process.exit(1);
  }
};

// Only start the server if this file is run directly (prevents double-starts when imported)
if (require.main === module) {
  startServer();
}

// Graceful shutdown for nodemon and other restarts
const shutdown = async (signal) => {
  try {
    console.log(`Received ${signal}. Closing server...`);
    server.close(async (err) => {
      if (err) {
        console.error('Error closing server:', err);
        process.exit(1);
      }
      try {
        await mongoose.disconnect();
        console.log('MongoDB disconnected. Exiting.');
        if (signal === 'SIGUSR2') {
          // Forward the signal to allow nodemon to restart the process
          process.kill(process.pid, 'SIGUSR2');
        } else {
          process.exit(0);
        }
      } catch (discErr) {
        console.error('Error during mongoose disconnect:', discErr);
        process.exit(1);
      }
    });
  } catch (e) {
    console.error('Shutdown failure:', e);
    process.exit(1);
  }
};

process.once('SIGUSR2', () => shutdown('SIGUSR2'));
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

module.exports = { app, server, startServer };