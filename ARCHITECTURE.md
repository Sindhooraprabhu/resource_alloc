# LifeLink AI - Emergency Allocation Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                        LIFELINK AI - EMERGENCY HEALTHCARE PLATFORM                   │
└─────────────────────────────────────────────────────────────────────────────────────┘

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

---

## Backend Components - Allocation Engine Flow

### 1. SOS Activation (`POST /api/emergencies/sos`)
**File:** `backend/src/controllers/emergencyController.js` → `activateSOS()`

```javascript
// Input: { type, subtype, address, symptoms, patient, severity, contactPerson }
// No auth required - public endpoint

1. Geocode address → coordinates (via routePlanner.geocodeAddress)
   - Handles "Sahyadri Mangalore" → 12.87, 74.84
   - Hospital aliases: "Sahyadri Adyar" → "Fortis Malar Hospital, Adyar, Chennai"
   - Falls back to Mangalore if geocoding fails

2. Create Emergency document
   - emergencyId: "SOS-YYYYMMDD-XXXX"
   - caseStatus: "REQUESTED" → "WAITING FOR CONFIRMATION"
   - requiredResource: { bedType, specialist, equipment }
   - priority: "high" | "medium" | "low" | "critical"

3. Run Allocation Engine
   → allocationEngine.allocateEmergencyResources(emergencyId)
```

### 2. Allocation Engine (`backend/src/services/allocationEngine.js`)

#### Step 1: Determine Required Resources
```javascript
determineRequiredResources({ type, subtype, description, symptoms, severity, patient })
→ Returns: { bedType: "ICU"|"Emergency"|"General", specialist, equipment[], priority, confidence, reasoning }
```

#### Step 2: Evaluate All Hospitals (with Live Traffic)
```javascript
evaluateHospitals(emergency, requirements, { traffic })
→ For EACH hospital in DB:
   a. Calculate route via OSRM: calculateOptimalRoute(origin, destination, traffic)
      - Uses https://router.project-osrm.org/route/v1/driving/
      - Gets: distanceKm, etaMinutes, trafficLevel (light/moderate/heavy/standstill), maneuvers[]
      - Traffic factor from duration vs free-flow speed
   
   b. Score hospital (0-100):
      - Bed availability (ICU/Emergency/General) × 30
      - Specialist available × 20
      - Equipment match × 15
      - Blood type match × 10
      - Distance/ETA × 15
      - Emergency load × 10
      - Rating × 5
   
   c. Filter eligible (score > 0, has required bed/specialist)
   d. Sort by score DESC
```

#### Step 3: Reserve Resources at Best Hospital
```javascript
reserveResources(hospitalId, requirements, emergencyId)
→ Hospital.resources.beds:
   - ICU: icuAvailable--, icuReserved++
   - Emergency: emergencyAvailable--, emergencyReserved++
   - General: occupied--, available++

→ Hospital.resources.equipment:
   - Ventilators, OTs, ECG machines: available--, reserved++

→ Returns: reservations[{ type, quantity, status: "RESERVED" }]
```

#### Step 4: Claim Nearest Ambulance
```javascript
claimNearestAmbulance(location, emergencyId)
→ Finds ambulance: status="available", nearest to emergency location
→ Updates: status="en_route", currentAssignment=emergencyId
```

#### Step 5: Assign Specialist Doctor
```javascript
User.findOne({ role: "doctor", isActive: true, 
  "doctorInfo.hospitalId": hospitalId,
  "doctorInfo.specialization": requirements.specialist,
  "doctorInfo.availabilityStatus": "available" })
→ Updates: doctorInfo.availabilityStatus="assigned", currentAssignment=emergencyId
```

#### Step 6: Return Allocation Result
```javascript
{
  success: true,
  caseStatus: "WAITING FOR CONFIRMATION",
  resourceAllocation: "RESERVED",
  recommendedHospital: { hospital, name, distance, travelTime, route, reasons },
  alternatives: [{ hospital, score, reasons }],
  reservations: [...],
  ambulance: { _id, vehicleNumber },
  doctor: { _id, name, specialty },
  requiresAdminConfirmation: true
}
```

### 3. Admin Confirmation (`POST /api/allocation/:id/confirm`)
**File:** `backend/src/controllers/allocationController.js` → `confirmAllocation()`

```javascript
// Requires: Admin JWT token
// Input: { hospitalId, doctorId?, requirements? }

confirmHospitalAcceptance(emergencyId, hospitalId, { doctorId, manualOverride })

1. If hospital changed from AI recommendation:
   - Release old hospital resources
   - Reserve new hospital resources
   - Re-assign doctor/ambulance

2. Ensure ambulance locked (claim if not already)

3. Ensure resources reserved (reserve if not already)

4. Ensure doctor assigned (find/assign specialist)

5. Recalculate route with live traffic

6. Update Emergency:
   - caseStatus: "HOSPITAL ACCEPTED"
   - status: "dispatching"
   - patientHandover: { vitals, ambulanceLocation, eta, shared: true }
   - resourceAllocation: { status: "RESERVED", resources, reservations }

7. Send Notifications:
   - Patient: Push/Email/SMS "Hospital confirmed: X. Ambulance dispatched. ETA: Y min"
   - Ambulance: Push "New dispatch: Hospital X. Patient: Y"
   - Hospital: Push "Emergency accepted. Resources reserved for Patient Y"

8. Socket.IO Broadcasts:
   - emergency_{id}: emergencyUpdated
   - hospital_{id}: requestStatusChanged
   - ambulance_{id}: ambulanceDispatched
```

### 4. Emergency Completion (`POST /api/allocation/:id/complete`)
**File:** `backend/src/services/allocationEngine.js` → `completeEmergencyResources()`

```javascript
completeEmergencyResources(emergencyId, cancel=false)

1. Release hospital resources:
   - ICU: icuReserved--, icuAvailable++
   - Emergency: emergencyReserved--, emergencyAvailable++

2. Free ambulance: status="available", unset currentAssignment

3. Free doctor: availabilityStatus="available", unset currentAssignment

4. Update Emergency:
   - caseStatus: "COMPLETED" | "CANCELLED"
   - status: "completed" | "cancelled"
   - resourceAllocation: { status: "COMPLETED"|"RELEASED", releasedAt, resources (PRESERVED) }

5. Update AllocationHistory: status: "completed" | "cancelled"
```

---

## Key Data Models

### Emergency (MongoDB)
```javascript
{
  emergencyId: "SOS-20261003-ABCD",
  intakeChannel: "APP" | "TOLL_FREE_AI",
  type: "medical" | "trauma" | "cardiac" | "obstetric" | "pediatric",
  subtype: "cardiac" | "stroke" | "accident" | ...,
  location: { type: "Point", coordinates: [lng, lat] },
  address: "Sahyadri Mangalore",
  patient: { name, age, gender, allergies[], medications[], conditions[] },
  symptoms: ["chest pain", "shortness of breath"],
  severity: 1-10,
  caseStatus: "REQUESTED" | "WAITING FOR CONFIRMATION" | "HOSPITAL ACCEPTED" | "DISPATCHED" | "AT_HOSPITAL" | "COMPLETED" | "CANCELLED",
  status: "reported" | "dispatching" | "en_route" | "at_hospital" | "completed" | "cancelled",
  requiredResource: { bedType, specialist, equipment, notes },
  assignedHospital: ObjectId,
  assignedAmbulance: ObjectId,
  assignedDoctor: ObjectId,
  routePlan: { distanceKm, etaMinutes, traffic, path: [[lng,lat]], maneuvers[] },
  resourceAllocation: {
    status: "PENDING" | "RESERVED" | "RELEASED" | "COMPLETED" | "FAILED",
    reservedAt, hospital, resources, reservations[], releasedAt
  },
  patientHandover: { shared, sharedAt, vitals, ambulanceLocation, eta },
  timeline: [{ event, description, actor, metadata, timestamp }]
}
```

### Hospital Resources (embedded in Hospital model)
```javascript
resources: {
  beds: { total, available, occupied, icuTotal, icuAvailable, icuReserved, emergencyTotal, emergencyAvailable, emergencyReserved },
  equipment: { ventilatorsTotal, ventilatorsAvailable, ventilatorsReserved, ecgMachinesTotal, ecgMachinesAvailable, operationTheatresTotal, operationTheatresAvailable, operationTheatresReserved, emergencyEquipment },
  blood: { ap, am, bp, bm, op, om, abp, abm },
  staff: { doctorsAvailable, emergencyDoctors, specialistsAvailable, nursesAvailable, emergencyStaff },
  emergencyCapacity: { currentLoad: "LOW"|"MODERATE"|"HIGH", waitingPatients, emergencyRoomCapacity, estimatedWaitingTime, acceptingEmergencyPatients }
}
```

---

## Socket.IO Rooms & Events

### Rooms
- `emergency_{emergencyId}` - All parties tracking this emergency
- `hospital_{hospitalId}` - Hospital staff dashboard
- `ambulance_{ambulanceId}` - Ambulance crew app
- `user_{userId}` - Individual user notifications

### Events Emitted
```javascript
// SOS Created
io.to(`emergency_${id}`).emit('allocationUpdated', allocationResult);
io.to(`hospital_${hospitalId}`).emit('incomingEmergency', { emergencyId, patient, severity, requiredResource, eta, explanation, reservations, ambulance, doctor });

// Admin Confirm
io.to(`emergency_${id}`).emit('emergencyUpdated', { emergencyId, status, caseStatus, resourceAllocation });
io.emit('emergencyUpdated', { emergencyId, status, caseStatus, assignedHospital, resourceAllocation });
io.to(`hospital_${hospitalId}`).emit('requestStatusChanged', { emergencyId, caseStatus: "HOSPITAL ACCEPTED", reservations });
io.to(`ambulance_${ambulanceId}`).emit('ambulanceDispatched', { emergencyId, hospital, patient, eta });

// Ambulance Location Update (from ambulanceController)
io.to(`hospital_${hospitalId}`).emit('ambulanceLocationUpdated', { emergencyId, location, eta });
io.to(`emergency_${emergencyId}`).emit('ambulanceLocationUpdated', { location, eta });

// Patient Notification
io.to(`emergency_${id}`).emit('patientNotification', notification);
```

---

## API Endpoints Summary

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/emergencies/sos` | Public | Activate emergency, auto-allocate |
| GET | `/api/emergencies/active` | Protected | List active emergencies |
| GET | `/api/emergencies/:id` | Protected | Get emergency details |
| POST | `/api/emergencies/:id/push-subscription` | Public | Save push subscription |
| POST | `/api/allocation/:id/confirm` | Admin | Confirm allocation, finalize |
| POST | `/api/allocation/:id/complete` | Admin | Complete emergency, release resources |
| POST | `/api/allocation/:id/reject` | Admin | Reject hospital, reallocate |
| POST | `/api/allocation/:id/manual` | Admin | Manual hospital override |
| GET | `/api/allocation/active` | Admin | All pending confirmations |
| GET | `/api/allocation/:id/status` | Protected | Allocation status |
| POST | `/api/allocation/hospital-call/respond` | Hospital/AI | AI voice agent response |

---

## Frontend Pages Needed (Current State: Components Exist, Pages Missing)

| Page | Route | Components | Status |
|------|-------|------------|--------|
| Emergency SOS | `/emergency` | EmergencySOSWidget, NotificationCenterWidget | ✅ Page exists, needs push integration |
| Admin Dashboard | `/admin` | AdminAllocationConfirmWidget | ❌ Route missing |
| Hospital Dashboard | `/hospital` | IncomingPatientsWidget, HospitalResourcesWidget | ❌ Route missing |
| Ambulance Crew | `/ambulance` | TrackAmbulanceWidget, NavigationWidget | ❌ Route missing |
| Patient History | `/patient/history` | PatientHistoryWidget, CaseTimelineWidget | ❌ Route missing |
| Analytics | `/admin/analytics` | AnalyticsWidget, ResourceUtilizationWidget | ❌ Route missing |
| Live Tracking | `/tracking/:id` | TrackAmbulanceWidget, LiveTrafficWidget | ❌ Route missing |

---

## Traffic & Routing Integration

### OSRM Configuration
```javascript
// backend/src/config/index.js
ROUTING_PROVIDER: "osrm"
ROUTING_BASE_URL: "https://router.project-osrm.org"
```

### Traffic Calculation
```javascript
// routePlanner.getTrafficFactor(origin, destination)
1. Call OSRM with annotations=duration
2. Calculate freeFlowDuration = (distance / 50kmh) * 3600
3. trafficRatio = actualDuration / freeFlowDuration
4. Return: { trafficLevel: "light"|"moderate"|"heavy"|"standstill", factor: 1.0-3.0 }
```

### Route with Traffic
```javascript
// calculateOptimalRoute(origin, destination, trafficOverride)
- Gets full geometry (GeoJSON), steps, maneuvers
- Applies traffic factor to base ETA
- Returns: { distanceKm, etaMinutes, baseEtaMinutes, traffic, trafficFactor, maneuvers[], path[] }
```

---

## Notification System (Zero-Cost)

### Backend: `notificationService.js`
```javascript
// Web Push (VAPID) - self-hosted, works offline
// Email (Nodemailer + Gmail SMTP) - 500/day free
// SMS - Simulation console.log, ready for Twilio/AWS SNS

notifyPatient(emergency, { message, type })
notifyHospital(hospital, { message, data })
notifyAmbulance(ambulance, { message, data })
notifyAdmin(admins, { message, data })
```

### Frontend: `notificationService.js` + `sw.js`
```javascript
// Service Worker registers on app load
// Subscribe to push: navigator.serviceWorker.register('/sw.js') → pushManager.subscribe()
// Store subscription on emergency: POST /api/emergencies/:id/push-subscription
// LocalStorage fallback for offline/revisit
```

---

## Deployment Checklist

- [ ] MongoDB running with indexes on Emergency.location (2dsphere), Hospital.location
- [ ] `.env` with: VAPID keys, JWT_SECRET, EMAIL credentials, CLIENT_URL
- [ ] OSRM accessible (public router.project-osrm.org or self-hosted)
- [ ] Frontend served with HTTPS (required for Push API)
- [ ] Socket.IO configured for production (Redis adapter for scaling)