# LifeLink AI - Smart Emergency Healthcare Platform

A comprehensive emergency healthcare platform with AI-powered hospital resource allocation, real-time tracking, and multi-role dashboards.

## 🏗️ Architecture Overview

```
┌─────────────┐     SOS (PUBLIC)      ┌─────────────┐     ALLOCATION ENGINE      ┌─────────────┐
│   CITIZEN   │ ────────────────────► │   BACKEND   │ ─────────────────────────► │  RESOURCES  │
│  (No Auth)  │  POST /emergencies/sos│  (Express)  │  allocateEmergencyResources│  (Reserved) │
└─────────────┘                       └──────┬──────┘                          └──────┬──────┘
                                             │                                      │
                    ┌────────────────────────┼────────────────────────┐              │
                    ▼                        ▼                        ▼              ▼
           ┌───────────────┐         ┌───────────────┐         ┌───────────────┐ ┌────────────┐
           │   HOSPITAL    │         │   AMBULANCE   │         │    DOCTOR     │ │  PATIENT   │
           │  (Socket.IO)  │         │  (Socket.IO)  │         │  (MongoDB)    │ │ (Push/Email│
           │  Room: hosp_  │         │  Room: amb_   │         │  Assigned     │ │  /SMS)     │
           └───────────────┘         └───────────────┘         └───────────────┘ └────────────┘
                    │                        │                        │              │
                    │      ADMIN CONFIRM     │                        │              │
                    │  POST /allocation/:id/ │                        │              │
                    │       /confirm         │                        │              │
                    ▼                        ▼                        ▼              ▼
           ┌─────────────────────────────────────────────────────────────────────────┐
           │                    CONFIRMED - HOSPITAL ACCEPTED                         │
           │  • caseStatus: "HOSPITAL ACCEPTED"  • patientHandover shared           │
           │  • Resources locked (bed, equipment)  • Ambulance dispatched           │
           │  • Doctor assigned  • Notifications sent (Push/Email/SMS)              │
           └─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
                         ┌─────────────────────┐
                         │   EMERGENCY COMPLETE │
                         │  POST /allocation/:id/│
                         │      /complete       │
                         └─────────────────────┘
                                    │
                    ┌───────────────┼───────────────┐
                    ▼               ▼               ▼
           ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
           │  HOSPITAL    │ │  AMBULANCE   │ │   DOCTOR     │
           │  Resources   │ │   Status:    │ │  Status:     │
           │  Released    │ │  Available   │ │  Available   │
           └──────────────┘ └──────────────┘ └──────────────┘
```

## ✨ Features

### Core Functionality
- **Emergency SOS Activation** - Public endpoint, no authentication required
- **AI-Powered Allocation** - Scores hospitals by ICU availability, specialist, equipment, blood, distance, traffic, emergency load
- **Live Traffic Routing** - OSRM integration with real-time traffic factors
- **Resource Locking** - Atomic reservation of ICU beds, ventilators, OTs, ambulances, doctors
- **Admin Confirmation** - Manual override, reallocation, patient notifications
- **Complete Lifecycle** - SOS → Allocation → Confirm → Complete/Cancel/Reject

### Multi-Role Dashboards
- **Admin** - Allocation center, hospital/ambulance/user management, analytics
- **Hospital** - Incoming requests, resource management, current patients
- **Ambulance** - Assigned cases, navigation, patient vitals, location tracking
- **Citizen** - Emergency SOS, case history, notifications
- **Doctor** - Assigned cases, patient monitoring

### Notification System (Zero-Cost)
- **Web Push (VAPID)** - Self-hosted, works offline
- **Email** - Nodemailer + Gmail SMTP (500/day free)
- **SMS** - Simulation mode, ready for Twilio/AWS SNS
- **LocalStorage Fallback** - Works when browser closed

## 📋 Prerequisites

- **Node.js** 18+
- **MongoDB** 5+
- **npm** 9+
- **Git**

## 🚀 Quick Start

### 1. Clone Repository
```bash
git clone https://github.com/Sindhooraprabhu/resource_alloc.git
cd resource_alloc
```

### 2. Backend Setup
```bash
cd backend
npm install

# Copy environment template
cp .env.example .env

# Edit .env with your configuration
# Required: MONGODB_URI, JWT_SECRET, VAPID keys
```

### 3. Generate VAPID Keys (for Push Notifications)
```bash
cd backend
node src/utils/generateVapidKeys.js
# Copy output to .env VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY
```

### 4. Configure Email (Optional)
```bash
# Edit .env with Gmail credentials
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password  # Not your main password!
EMAIL_FROM="LifeLink AI <noreply@lifelink.ai>"
```

### 5. Start MongoDB
```bash
# Local MongoDB
mongod

# Or use MongoDB Atlas - update MONGODB_URI in .env
```

### 6. Start Backend
```bash
cd backend
npm start
# Runs on http://localhost:5000
```

### 7. Frontend Setup
```bash
cd frontend
npm install
npm start
# Runs on http://localhost:3000
```

## 🔧 Environment Variables

### Backend (.env)
```env
# Server
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:3000

# Database
MONGODB_URI=mongodb://localhost:27017/lifelink_ai

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=7d

# AI (Optional - for enhanced reasoning)
AI_PROVIDER=gemini
AI_MODEL=gemini-2.5-flash-lite
AI_API_KEY=your-gemini-api-key

# Routing
ROUTING_PROVIDER=osrm
ROUTING_BASE_URL=https://router.project-osrm.org

# VAPID Keys (Required for Push Notifications)
VAPID_PUBLIC_KEY=your-vapid-public-key
VAPID_PRIVATE_KEY=your-vapid-private-key

# Email (Optional)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
EMAIL_FROM="LifeLink AI <noreply@lifelink.ai>"
```

### Frontend (.env)
```env
REACT_APP_API_URL=http://localhost:5000/api
```

## 📚 API Endpoints

### Emergency (Public)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/emergencies/sos` | Activate emergency (auto-allocates) |
| POST | `/api/emergencies/:id/push-subscription` | Save push subscription |

### Emergency (Protected)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/emergencies/active` | List active emergencies |
| GET | `/api/emergencies/:id` | Get emergency details |
| GET | `/api/emergencies/history` | User's emergency history |
| PATCH | `/api/emergencies/:id/status` | Update emergency status |

### Allocation (Admin)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/allocation/active` | All pending confirmations |
| POST | `/api/allocation/:id/confirm` | Confirm allocation |
| POST | `/api/allocation/:id/reject` | Reject & reallocate |
| POST | `/api/allocation/:id/manual` | Manual hospital override |
| POST | `/api/allocation/:id/complete` | Complete emergency |
| POST | `/api/allocation/:id/notify-patient` | Send patient notification |
| POST | `/api/allocation/:id/refresh-route` | Refresh route with traffic |

### Allocation (Hospital)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/allocation/:id/confirm` | Accept emergency |

## 🔄 Emergency Lifecycle

```
1. CITIZEN triggers SOS
   POST /api/emergencies/sos (no auth)
   ↓
2. SYSTEM auto-allocates
   • Geocodes address (with landmark aliases)
   • Scores all hospitals with live traffic
   • Reserves ICU bed, equipment
   • Claims nearest ambulance
   • Assigns on-duty specialist
   • caseStatus: "WAITING FOR CONFIRMATION"
   ↓
3. ADMIN reviews in Allocation Center
   Sees: hospital recommendation, distance, ETA, resources
   ↓
4. ADMIN confirms
   POST /api/allocation/:id/confirm (admin auth)
   ↓
5. SYSTEM finalizes
   • caseStatus: "HOSPITAL ACCEPTED"
   • Shares patient handover (vitals, location, ETA)
   • Sends push/email/SMS to patient, ambulance, hospital
   • Socket.IO broadcasts to all rooms
   ↓
6. ADMIN completes
   POST /api/allocation/:id/complete (admin auth)
   ↓
7. SYSTEM releases
   • ICU bed, ventilator, OT released
   • Ambulance → available
   • Doctor → available
   • caseStatus: "COMPLETED"
```

## 🗺️ Landmark Geocoding

The system includes hardcoded coordinates for 30+ Karnataka towns/villages that Nominatim might miss:

| Landmark | Coordinates | Region |
|----------|-------------|--------|
| Vittla | 12.7586, 75.1358 | Dakshina Kannada |
| Bantwal | 12.8833, 75.0333 | Dakshina Kannada |
| BC Road | 12.8900, 75.0400 | Dakshina Kannada |
| Kalladka | 12.8500, 75.0500 | Dakshina Kannada |
| Uppinangady | 12.8000, 75.1000 | Dakshina Kannada |
| Subrahmanya | 12.6833, 75.1167 | Dakshina Kannada |
| Belthangady | 12.9667, 75.2833 | Dakshina Kannada |
| Puttur | 12.7667, 75.2000 | Dakshina Kannada |
| Sulya | 12.4000, 75.4333 | Dakshina Kannada |
| Karkala | 13.2167, 74.9833 | Udupi |
| Kundapur | 13.6333, 74.6833 | Udupi |
| Moodbidri | 13.0667, 74.9833 | Dakshina Kannada |
| Mulki | 13.1000, 74.8000 | Dakshina Kannada |

Add more in `backend/src/services/routePlanner.js` → `landmarkAliases` object.

## 🏥 Hospital Resources

Each hospital has these tracked resources:

```javascript
resources: {
  beds: {
    total, available, occupied,
    icuTotal, icuAvailable, icuReserved,
    emergencyTotal, emergencyAvailable, emergencyReserved
  },
  equipment: {
    ventilatorsTotal, ventilatorsAvailable, ventilatorsReserved,
    ecgMachinesTotal, ecgMachinesAvailable,
    operationTheatresTotal, operationTheatresAvailable, operationTheatresReserved,
    emergencyEquipment: 'AVAILABLE'
  },
  blood: { ap, am, bp, bm, op, om, abp, abm },
  staff: { doctorsAvailable, emergencyDoctors, specialistsAvailable, nursesAvailable, emergencyStaff },
  emergencyCapacity: { currentLoad, waitingPatients, emergencyRoomCapacity, estimatedWaitingTime, acceptingEmergencyPatients }
}
```

## 🚑 Ambulance Management

```javascript
// Ambulance statuses
'available' | 'en_route' | 'at_scene' | 'transporting' | 'at_hospital' | 'returning' | 'maintenance'

// Auto-assigned on SOS, released on complete/cancel/reject
```

## 🧪 Testing

### Reset Ambulances (if stuck)
```bash
cd backend
node reset_ambulances.js
```

### Update Hospital Beds
```bash
cd backend
node update_hospital_beds.js
```

### Run Full Flow Test
```bash
cd backend
node test_full_flow.js  # Creates SOS → Confirm → Complete
```

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| "No available ambulance" | Run `node reset_ambulances.js` |
| "Cast to ObjectId failed" | Check for populated documents passed to findById |
| "NaN etaMinutes" | OSRM response missing duration - check routePlanner.js validation |
| "Geocoding failed" | Add landmark to `landmarkAliases` in routePlanner.js |
| Push notification error | Ensure VAPID keys in .env, frontend subscribes on SOS |
| Port 5000 in use | `taskkill /F /IM node.exe` (Windows) or `pkill -f node` (Linux/Mac) |

## 📁 Project Structure

```
resource_alloc/
├── backend/
│   ├── src/
│   │   ├── config/           # Configuration
│   │   ├── controllers/      # Route handlers
│   │   ├── middleware/       # Auth, error handling
│   │   ├── models/           # Mongoose models
│   │   ├── routes/           # API routes
│   │   ├── services/         # Business logic
│   │   │   ├── allocationEngine.js    # Core allocation logic
│   │   │   ├── routePlanner.js        # OSRM + geocoding
│   │   │   ├── notificationService.js # Push/Email/SMS
│   │   │   └── ...
│   │   ├── utils/            # Helpers (VAPID key gen)
│   │   └── server.js         # Entry point
│   ├── reset_ambulances.js   # Utility scripts
│   ├── update_hospital_beds.js
│   └── package.json
├── frontend/
│   ├── public/
│   │   ├── sw.js             # Service Worker
│   │   └── manifest.json     # PWA manifest
│   ├── src/
│   │   ├── components/
│   │   │   ├── ui/           # Reusable UI components
│   │   │   └── widgets/      # Dashboard widgets
│   │   ├── contexts/         # React contexts (Auth)
│   │   ├── pages/            # Page components
│   │   ├── services/         # API clients
│   │   └── AppRouter.js      # Routes with ProtectedRoute
│   └── package.json
├── ARCHITECTURE.md           # Detailed architecture docs
└── README.md
```

## 🔐 Security

- JWT-based authentication with role-based access control
- Helmet.js for HTTP headers
- CORS configured for frontend origin
- Input validation on all endpoints
- No sensitive data in logs

## 🚀 Deployment

### Backend (Production)
```bash
# Build not needed for Node.js
# Set NODE_ENV=production
# Use PM2 or similar process manager
pm2 start src/server.js --name lifelink-backend
```

### Frontend (Production)
```bash
cd frontend
npm run build
# Serve build/ folder with nginx or static hosting
```

### Docker (Optional)
```dockerfile
# Backend
FROM node:18-alpine
WORKDIR /app
COPY backend/package*.json ./
RUN npm ci --only=production
COPY backend/ .
EXPOSE 5000
CMD ["node", "src/server.js"]
```

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
4. Open Pull Request

## 📄 License

MIT License - see LICENSE file for details.

## 👥 Authors

- **Sindhoora Prabhu** - Initial work - [Sindhooraprabhu](https://github.com/Sindhooraprabhu)

## 🙏 Acknowledgments

- OSRM for routing engine
- OpenStreetMap/Nominatim for geocoding
- MongoDB for database
- Socket.IO for real-time communication
- web-push for VAPID notifications