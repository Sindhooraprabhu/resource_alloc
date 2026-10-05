const Emergency = require('../models/Emergency');
const Hospital = require('../models/Hospital');
const AllocationHistory = require('../models/AllocationHistory');
const Ambulance = require('../models/Ambulance');
const User = require('../models/User');
const { calculateOptimalRoute } = require('./routePlanner');
const { getAllocationReasoning } = require('./aiReasoning');

/**
 * ─────────────────────────────────────────────────────────────
 * DYNAMIC EMERGENCY RESOURCE ALLOCATION ENGINE
 * ─────────────────────────────────────────────────────────────
 * This engine is the CORE of the Smart Emergency Healthcare Platform.
 * 
 * It:
 *  1. Determines required resources from emergency details
 *  2. Scores hospitals based on resource availability + distance + load
 *  3. Recommends the best hospital with human-readable reasons
 *  4. Locks/reserves resources for the emergency
 *  5. Handles reallocation when hospitals reject or lose capacity
 *  6. Maintains a complete allocation history for audit
 * 
 * The engine is API-facing and stateless for the most part, so the
 * real AI voice calling agent can later call the same endpoints with
 * the same structured data.
 */

// Helper: Haversine distance
const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
};

// ─────────────────────────────────────────────────────────────
// 1. RESOURCE REQUIREMENT DEDUCTION ENGINE
//    Maps emergency details → required resources
// ─────────────────────────────────────────────────────────────
const RESOURCE_RULES = [
    // Cardiac / Heart emergencies
    {
        patterns: ['cardiac', 'chest pain', 'heart attack', 'heart', 'angina', 'palpitation'],
        resources: {
            bedType: 'ICU',
            specialist: 'Cardiologist',
            equipment: ['ECG Machine'],
            notes: 'Cardiac monitoring required'
        }
    },
    // Respiratory / Breathing
    {
        patterns: ['respiratory', 'breath', 'asthma', 'copd', 'pneumonia', 'oxygen'],
        resources: {
            bedType: 'ICU',
            specialist: 'Pulmonologist',
            equipment: ['Ventilator'],
            notes: 'May require ventilator support'
        }
    },
    // Neurological / Stroke
    {
        patterns: ['neurological', 'stroke', 'paralysis', 'seizure', 'unconscious', 'brain'],
        resources: {
            bedType: 'ICU',
            specialist: 'Neurologist',
            equipment: ['CT Scan', 'ECG Machine'],
            notes: 'Neuro assessment required'
        }
    },
    // Trauma / Accident
    {
        patterns: ['trauma', 'accident', 'fracture', 'bleeding', 'rta', 'fall', 'injury'],
        resources: {
            bedType: 'Emergency',
            specialist: 'Orthopedic specialist',
            equipment: ['X-Ray', 'Operation Theatre'],
            notes: 'Emergency trauma care required'
        }
    },
    // Surgical / General surgery need
    {
        patterns: ['surgery', 'appendicitis', 'hernia', 'stone', 'internal bleeding'],
        resources: {
            bedType: 'General',
            specialist: 'General surgeon',
            equipment: ['Operation Theatre'],
            notes: 'Surgical evaluation required'
        }
    },
    // Obstetric
    {
        patterns: ['obstetric', 'pregnancy', 'delivery', 'labor', 'pregnant'],
        resources: {
            bedType: 'Emergency',
            specialist: 'OB-GYN',
            equipment: ['Operation Theatre'],
            notes: 'Obstetric emergency'
        }
    },
    // Burns
    {
        patterns: ['burn', 'scald', 'chemical burn'],
        resources: {
            bedType: 'ICU',
            specialist: 'General surgeon',
            equipment: ['Ventilator'],
            notes: 'Burn unit may be required'
        }
    },
    // Pediatric
    {
        patterns: ['pediatric', 'child', 'infant', 'baby'],
        resources: {
            bedType: 'Emergency',
            specialist: 'Pediatrician',
            equipment: [],
            notes: 'Pediatric emergency care'
        }
    },
    // Toxicological / Poisoning
    {
        patterns: ['toxicological', 'poison', 'overdose', 'drug'],
        resources: {
            bedType: 'ICU',
            specialist: 'Emergency physician',
            equipment: ['Ventilator'],
            notes: 'Toxicology screening required'
        }
    }
];

const determineRequiredResources = (emergencyDetails = {}) => {
    const {
        type,
        subtype,
        description = '',
        symptoms = [],
        severity = 5,
        patient = {}
    } = emergencyDetails;

    const text = [
        type || '',
        subtype || '',
        description,
        ...(Array.isArray(symptoms) ? symptoms : [])
    ].join(' ').toLowerCase();

    // Default emergency resources
    let resources = {
        bedType: 'Emergency',
        specialist: 'Emergency physician',
        equipment: [],
        notes: 'Emergency care required',
        priority: severity >= 8 ? 'critical' : severity >= 6 ? 'high' : severity >= 4 ? 'medium' : 'low'
    };
    let matchedRule = false;

    // Match against rules
    for (const rule of RESOURCE_RULES) {
        const matched = rule.patterns.some(pattern => text.includes(pattern));
        if (matched) {
            matchedRule = true;
            resources = {
                ...rule.resources,
                priority: severity >= 8 ? 'critical' : severity >= 6 ? 'high' : severity >= 4 ? 'medium' : 'low'
            };
            break;
        }
    }

    // Blood type requirement if specified in patient data
    if (patient.bloodGroup) {
        resources.bloodType = patient.bloodGroup;
    }

    // Add severity-specific notes
    if (severity >= 8) {
        resources.notes = `${resources.notes}. CRITICAL: Immediate ICU stabilization required.`;
    }

    resources.confidence = matchedRule ? (symptoms.length > 0 ? 0.94 : 0.84) : 0.62;
    resources.reasoning = matchedRule
        ? `Matched emergency pattern for ${resources.specialist} and ${resources.bedType} care.`
        : 'No specific clinical pattern matched; default emergency resources selected for Admin review.';

    return resources;
};

// ─────────────────────────────────────────────────────────────
// 2. HOSPITAL SCORING ENGINE
//    Scores each hospital using multiple weighted factors
// ─────────────────────────────────────────────────────────────
const scoreHospital = (hospital, location, requirements, context = {}) => {
    const { lat, lng } = location;
    const { traffic = 'light', routeDistance, routeEtaMinutes } = context;

    const hCoords = hospital.location?.coordinates || [74.85, 12.86];
    const distance = routeDistance ?? calculateDistance(lat, lng, hCoords[1], hCoords[0]);

    // Travel time estimation based on traffic
    let travelSpeedKmh = 45;
    if (traffic === 'heavy') travelSpeedKmh = 20;
    else if (traffic === 'moderate') travelSpeedKmh = 35;
    else if (traffic === 'light') travelSpeedKmh = 55;
    const travelTimeMinutes = routeEtaMinutes ?? Math.round((distance / travelSpeedKmh) * 60);

    // Exclude hospitals that are not operational
    if (hospital.status !== 'operational') {
        return {
            score: 0,
            eligible: false,
            reasons: ['Hospital not operational'],
            distance,
            travelTime: travelTimeMinutes
        };
    }

    // Exclude if not accepting emergency patients
    if (hospital.resources?.emergencyCapacity?.acceptingEmergencyPatients === false) {
        return {
            score: 0,
            eligible: false,
            reasons: ['Emergency department not accepting patients'],
            distance,
            travelTime: travelTimeMinutes
        };
    }

    let score = 100;
    const positiveReasons = [];
    const negativeReasons = [];
    const failedChecks = [];

    // ── FACTOR 1: Required Bed Availability (Weight: 30) ──
    const beds = hospital.resources?.beds || {};
    const bedType = requirements.bedType;

    if (bedType === 'ICU') {
        const icuAvailable = beds.icuAvailable || 0;
        if (icuAvailable > 0) {
            score += 30;
            positiveReasons.push(`ICU bed available (${icuAvailable} vacant)`);
        } else {
            score -= 30;
            failedChecks.push('No ICU beds available');
            negativeReasons.push('No ICU beds available');
        }
    } else if (bedType === 'Emergency') {
        const emergencyAvailable = beds.emergencyAvailable || 0;
        if (emergencyAvailable > 0) {
            score += 30;
            positiveReasons.push(`Emergency bed available (${emergencyAvailable} vacant)`);
        } else {
            score -= 30;
            failedChecks.push('No Emergency beds available');
            negativeReasons.push('No Emergency beds available');
        }
    } else if (bedType === 'General') {
        const available = beds.available || 0;
        if (available > 0) {
            score += 20;
            positiveReasons.push(`General bed available (${available} vacant)`);
        } else {
            score -= 25;
            failedChecks.push('No general beds available');
            negativeReasons.push('No general beds available');
        }
    } else {
        // No specific bed type required - check any availability
        const anyAvailable = (beds.available || 0) + (beds.icuAvailable || 0) + (beds.emergencyAvailable || 0);
        if (anyAvailable > 0) {
            score += 10;
            positiveReasons.push('Beds available for admission');
        }
    }

    // ── FACTOR 2: Required Specialist (Weight: 25) ──
    const requiredSpecialist = requirements.specialist;
    if (requiredSpecialist) {
        const specialistsList = hospital.specialists || [];
        const isSpecialistAvailable = specialistsList.includes(requiredSpecialist);
        // Also check on-duty count
        const onDuty = hospital.resources?.staff?.specialistsAvailable || 0;

        if (isSpecialistAvailable && onDuty > 0) {
            score += 25;
            positiveReasons.push(`Required specialist (${requiredSpecialist}) on duty`);
        } else if (isSpecialistAvailable) {
            score -= 10;
            negativeReasons.push(`Required specialist (${requiredSpecialist}) registered but currently off-duty`);
        } else {
            score -= 25;
            failedChecks.push(`No ${requiredSpecialist} available`);
            negativeReasons.push(`Hospital does not have a ${requiredSpecialist}`);
        }
    } else {
        score += 5;
        positiveReasons.push('No specialist restriction');
    }

    // ── FACTOR 3: Required Equipment (Weight: 20) ──
    const equipment = requirements.equipment || [];
    const equipmentList = Array.isArray(equipment) ? equipment : [equipment];

    if (equipmentList.length > 0) {
        const eq = hospital.resources?.equipment || {};
        let allAvailable = true;
        const missing = [];

        if (equipmentList.some(e => e.toLowerCase().includes('ventilator'))) {
            const ventilators = eq.ventilatorsAvailable || 0;
            if (ventilators > 0) {
                positiveReasons.push(`Ventilator available (${ventilators} vacant)`);
                score += 10;
            } else {
                allAvailable = false;
                missing.push('Ventilator');
                negativeReasons.push('No ventilators available');
                score -= 10;
            }
        }
        if (equipmentList.some(e => e.toLowerCase().includes('operation'))) {
            const ot = eq.operationTheatresAvailable || 0;
            if (ot > 0) {
                positiveReasons.push(`Operation Theatre available (${ot} vacant)`);
                score += 10;
            } else {
                allAvailable = false;
                missing.push('Operation Theatre');
                negativeReasons.push('No Operation Theatre available');
                score -= 10;
            }
        }
        if (equipmentList.some(e => e.toLowerCase().includes('ecg'))) {
            const ecg = eq.ecgMachinesAvailable || 0;
            if (ecg > 0) {
                positiveReasons.push('ECG machine available');
                score += 5;
            } else {
                positiveReasons.push('ECG available at hospital');
                score += 3;
            }
        }
        if (equipmentList.some(e => e.toLowerCase().includes('ct scan') || e.toLowerCase().includes('x-ray'))) {
            if (hospital.details?.equipment?.radiology !== false) {
                positiveReasons.push('Radiology (CT/X-Ray) available');
                score += 5;
            } else {
                missing.push('Radiology');
                score -= 5;
            }
        }

        if (!allAvailable) {
            failedChecks.push(`Missing equipment: ${missing.join(', ')}`);
        }
    } else {
        score += 5;
        positiveReasons.push('No special equipment required');
    }

    // ── FACTOR 4: Blood Availability (Weight: 10) ──
    if (requirements.bloodType) {
        const blood = hospital.resources?.blood || {};
        const bloodKey = requirements.bloodType.toLowerCase().replace('+', 'p').replace('-', 'm');
        const bloodUnits = blood[bloodKey] || 0;
        if (bloodUnits > 0) {
            score += 10;
            positiveReasons.push(`Blood type ${requirements.bloodType} available (${bloodUnits} units)`);
        } else {
            score -= 8;
            negativeReasons.push(`Blood type ${requirements.bloodType} limited`);
        }
    }

    // ── FACTOR 5: Distance & Travel Time (Weight: 15) ──
    if (distance <= 2) {
        score += 15;
        positiveReasons.push(`Very close: ${distance.toFixed(1)} km (${travelTimeMinutes} mins)`);
    } else if (distance <= 5) {
        score += 10;
        positiveReasons.push(`Moderate distance: ${distance.toFixed(1)} km (${travelTimeMinutes} mins)`);
    } else if (distance <= 10) {
        score -= 5;
        negativeReasons.push(`Far: ${distance.toFixed(1)} km (${travelTimeMinutes} mins)`);
    } else if (distance <= 25) {
        score -= 10;
        negativeReasons.push(`Distant: ${distance.toFixed(1)} km (${travelTimeMinutes} mins)`);
    } else if (distance <= 50) {
        score -= 15;
        negativeReasons.push(`Very distant: ${distance.toFixed(1)} km (${travelTimeMinutes} mins)`);
    } else {
        score -= 20;
        negativeReasons.push(`Very far: ${distance.toFixed(1)} km (${travelTimeMinutes} mins)`);
        failedChecks.push('Too far for emergency transport');
    }

    // ── FACTOR 6: Emergency Load & Capacity (Weight: 10) ──
    const cap = hospital.resources?.emergencyCapacity || {};
    const currentLoad = cap.currentLoad || 'LOW';
    const waitingPatients = cap.waitingPatients || 0;

    if (currentLoad === 'HIGH') {
        score -= 10;
        negativeReasons.push(`High emergency load (${waitingPatients} waiting)`);
    } else if (currentLoad === 'MODERATE') {
        score -= 3;
        positiveReasons.push('Moderate emergency room load');
    } else {
        score += 10;
        positiveReasons.push('Low emergency load: quick admission');
    }

    // ── FACTOR 7: Hospital Rating & Reputation (Weight: 5) ──
    const rating = hospital.ratings?.average || 0;
    if (rating >= 4.5) {
        score += 5;
        positiveReasons.push(`Excellent rated hospital (${rating}/5)`);
    } else if (rating >= 4) {
        score += 3;
        positiveReasons.push(`Good rating (${rating}/5)`);
    } else if (rating >= 3) {
        score += 0;
    } else {
        score -= 2;
    }

    // Final: clamp score
    score = Math.max(0, Math.min(150, score));

    const eligible = failedChecks.length === 0 && score > 30;

    return {
        score,
        eligible,
        distance: Math.round(distance * 10) / 10,
        travelTime: travelTimeMinutes,
        reasons: [...positiveReasons, ...negativeReasons],
        failedChecks,
        hospital: {
            _id: hospital._id,
            name: hospital.name,
            code: hospital.code,
            area: hospital.area,
            status: hospital.status,
            currentLoad: hospital.resources?.emergencyCapacity?.currentLoad || 'LOW'
        }
    };
};

// ─────────────────────────────────────────────────────────────
// 3. BEST HOSPITAL SELECTION
//    Evaluates all hospitals and returns ranked list
// ─────────────────────────────────────────────────────────────
const evaluateHospitals = async (emergency, requirements, context = {}) => {
    const location = {
        lat: emergency.location?.coordinates?.[1] || 12.9141,
        lng: emergency.location?.coordinates?.[0] || 74.8560
    };

    const hospitals = await Hospital.find({});
    const evaluated = await Promise.all(hospitals.map(async h => {
        const route = await calculateOptimalRoute(
            [location.lng, location.lat],
            h.location?.coordinates || [74.85, 12.86],
            context.traffic || 'light'
        );
        const score = scoreHospital(h, location, requirements, {
            ...context,
            routeDistance: route.distanceKm,
            routeEtaMinutes: route.etaMinutes
        });
        return {
            hospital: h._id,
            name: h.name,
            code: h.code,
            area: h.area,
            score: score.score,
            eligible: score.eligible,
            distance: score.distance,
            travelTime: route.etaMinutes,
            route,
            reasons: score.reasons,
            failedChecks: score.failedChecks,
            resources: {
                beds: {
                    icuAvailable: h.resources?.beds?.icuAvailable || 0,
                    emergencyAvailable: h.resources?.beds?.emergencyAvailable || 0,
                    available: h.resources?.beds?.available || 0
                },
                equipment: {
                    ventilatorsAvailable: h.resources?.equipment?.ventilatorsAvailable || 0,
                    operationTheatresAvailable: h.resources?.equipment?.operationTheatresAvailable || 0
                },
                emergencyCapacity: h.resources?.emergencyCapacity || {}
            }
        };
    }));

    // Filter to eligible hospitals only, sort by score
    const eligible = evaluated.filter(h => h.eligible);
    eligible.sort((a, b) => b.score - a.score);

    // Fallback: if no eligible hospitals, return the best scoring one anyway
    // (for remote areas where all hospitals are "too far")
    const ranked = eligible.length > 0 ? eligible : evaluated.sort((a, b) => b.score - a.score).slice(0, 1);

    return {
        ranked,
        all: evaluated.sort((a, b) => b.score - a.score)
    };
};

// ─────────────────────────────────────────────────────────────
// 4. RESOURCE RESERVATION / LOCKING
//    Locks resources so other emergencies cannot use them
// ─────────────────────────────────────────────────────────────
const reserveResources = async (hospitalId, requirements, emergencyId) => {
    const hospital = await Hospital.findById(hospitalId);
    if (!hospital) {
        throw new Error('Hospital not found for resource reservation');
    }

    const beds = hospital.resources.beds;
    const equipment = hospital.resources.equipment;
    const reservations = [];

    try {
        // Lock bed
        const bedType = requirements.bedType;
        if (bedType === 'ICU') {
            if (beds.icuAvailable <= 0) {
                throw new Error('Cannot reserve: No ICU beds available');
            }
            beds.icuAvailable -= 1;
            beds.icuReserved += 1;
            reservations.push({ type: 'ICU Bed', quantity: 1, status: 'RESERVED' });
        } else if (bedType === 'Emergency') {
            if (beds.emergencyAvailable <= 0) {
                throw new Error('Cannot reserve: No Emergency beds available');
            }
            beds.emergencyAvailable -= 1;
            beds.emergencyReserved += 1;
            reservations.push({ type: 'Emergency Bed', quantity: 1, status: 'RESERVED' });
        } else if (bedType === 'General') {
            if (beds.available <= 0) {
                throw new Error('Cannot reserve: No General beds available');
            }
            beds.available -= 1;
            // Use occupied to track general bed reservations (occupied + reserved = total used)
            beds.occupied += 1;
            reservations.push({ type: 'General Bed', quantity: 1, status: 'RESERVED' });
        } else {
            reservations.push({ type: 'No specific bed', quantity: 0, status: 'N/A' });
        }

        // Lock equipment
        const equipmentList = requirements.equipment || [];
        const eqList = Array.isArray(equipmentList) ? equipmentList : [equipmentList];

        if (eqList.some(e => e.toLowerCase().includes('ventilator'))) {
            if (equipment.ventilatorsAvailable <= 0) {
                throw new Error('Cannot reserve: No ventilators available');
            }
            equipment.ventilatorsAvailable -= 1;
            equipment.ventilatorsReserved += 1;
            reservations.push({ type: 'Ventilator', quantity: 1, status: 'RESERVED' });
        }
        if (eqList.some(e => e.toLowerCase().includes('operation'))) {
            if (equipment.operationTheatresAvailable <= 0) {
                throw new Error('Cannot reserve: No Operation Theatre available');
            }
            equipment.operationTheatresAvailable -= 1;
            equipment.operationTheatresReserved += 1;
            reservations.push({ type: 'Operation Theatre', quantity: 1, status: 'RESERVED' });
        }

        // Update hospital emergency load approximation
        hospital.currentLoad = Math.min(100, hospital.currentLoad + 5);

        await hospital.save();

        return { hospital, reservations };
    } catch (error) {
        // ROLLBACK: If anything fails after bed reservation, release the bed
        const bedType = requirements.bedType;
        if (bedType === 'ICU' && beds.icuReserved > 0) {
            beds.icuReserved -= 1;
            beds.icuAvailable += 1;
        } else if (bedType === 'Emergency' && beds.emergencyReserved > 0) {
            beds.emergencyReserved -= 1;
            beds.emergencyAvailable += 1;
        } else if (bedType === 'General' && beds.occupied > 0) {
            beds.occupied -= 1;
            beds.available += 1;
        }

        // Also roll back any equipment reserved
        if (equipment.ventilatorsReserved > 0) {
            equipment.ventilatorsReserved -= 1;
            equipment.ventilatorsAvailable += 1;
        }
        if (equipment.operationTheatresReserved > 0) {
            equipment.operationTheatresReserved -= 1;
            equipment.operationTheatresAvailable += 1;
        }

        hospital.currentLoad = Math.max(0, hospital.currentLoad - 5);
        await hospital.save();
        throw error;
    }
};

// ─────────────────────────────────────────────────────────────
// 5. RESOURCE RELEASE
//    Releases locks when emergency cancelled/completed/rejected
// ─────────────────────────────────────────────────────────────
const releaseResources = async (hospitalId, requirements, emergencyId) => {
    const hospital = await Hospital.findById(hospitalId);
    if (!hospital) return;

    const beds = hospital.resources.beds;
    const equipment = hospital.resources.equipment;

    const bedType = requirements.bedType;
    if (bedType === 'ICU') {
        if (beds.icuReserved > 0) {
            beds.icuReserved -= 1;
            beds.icuAvailable += 1;
        }
    } else if (bedType === 'Emergency') {
        if (beds.emergencyReserved > 0) {
            beds.emergencyReserved -= 1;
            beds.emergencyAvailable += 1;
        }
    } else if (bedType === 'General') {
        if (beds.occupied > 0) {
            beds.occupied -= 1;
            beds.available += 1;
        }
    }

    const equipmentList = requirements.equipment || [];
    const eqList = Array.isArray(equipmentList) ? equipmentList : [equipmentList];

    if (eqList.some(e => e.toLowerCase().includes('ventilator'))) {
        if (equipment.ventilatorsReserved > 0) {
            equipment.ventilatorsReserved -= 1;
            equipment.ventilatorsAvailable += 1;
        }
    }
    if (eqList.some(e => e.toLowerCase().includes('operation'))) {
        if (equipment.operationTheatresReserved > 0) {
            equipment.operationTheatresReserved -= 1;
            equipment.operationTheatresAvailable += 1;
        }
    }

    hospital.currentLoad = Math.max(0, hospital.currentLoad - 5);
    await hospital.save();

    return { hospital, released: true };
};

// ─────────────────────────────────────────────────────────────
// 6. NEAREST AVAILABLE AMBULANCE
//    Selects ambulance based on distance and availability
// ─────────────────────────────────────────────────────────────
const findNearestAmbulance = async (location) => {
    const { lat, lng } = location;

    const ambulances = await Ambulance.find({ status: 'available' });
    if (ambulances.length === 0) {
        return null;
    }

    let best = null;
    let bestDistance = Infinity;

    for (const ambulance of ambulances) {
        const coords = ambulance.currentLocation?.coordinates || ambulance.baseLocation?.coordinates;
        if (!coords) continue;

        const distance = calculateDistance(lat, lng, coords[1], coords[0]);
        if (distance < bestDistance) {
            bestDistance = distance;
            best = ambulance;
        }
    }

    if (!best) {
        // Fall back to first available
        best = ambulances[0];
    }

    return best;
};

const claimNearestAmbulance = async (location, emergencyId) => {
    const ambulances = await Ambulance.find({ status: 'available' });
    const candidates = ambulances.map(ambulance => {
        const coords = ambulance.currentLocation?.coordinates || ambulance.baseLocation?.coordinates;
        return {
            ambulance,
            distance: coords ? calculateDistance(location.lat, location.lng, coords[1], coords[0]) : Infinity
        };
    }).sort((a, b) => a.distance - b.distance);

    for (const candidate of candidates) {
        const claimed = await Ambulance.findOneAndUpdate(
            { _id: candidate.ambulance._id, status: 'available' },
            { $set: { status: 'en_route', currentAssignment: emergencyId } },
            { new: true }
        );
        if (claimed) return claimed;
    }

    return null;
};

// ─────────────────────────────────────────────────────────────
// 7. MAIN ALLOCATION FLOW
//    Orchestrates: determine resources → evaluate → recommend → allocate
// ─────────────────────────────────────────────────────────────
const allocateEmergencyResources = async (emergencyId, options = {}) => {
    const emergency = await Emergency.findById(emergencyId).populate('assignedHospital').populate('assignedAmbulance');
    if (!emergency) {
        throw new Error('Emergency case not found');
    }

    // Step 1: Determine required resources
    const requirements = options.requirements || determineRequiredResources({
        type: emergency.type,
        subtype: emergency.subtype,
        description: emergency.description,
        symptoms: emergency.symptoms,
        severity: emergency.severity,
        patient: emergency.patient
    });

    // Store requirements on the emergency case
    emergency.requiredResource = {
        bedType: requirements.bedType,
        specialist: requirements.specialist,
        equipment: Array.isArray(requirements.equipment) ? requirements.equipment.join(', ') : (requirements.equipment || ''),
        notes: requirements.notes
    };
    emergency.priority = requirements.priority;
    emergency.aiAllocation = {
        provider: 'local-resource-ai',
        confidence: requirements.confidence || 0,
        decision: (requirements.confidence || 0) < 0.7 ? 'LOW_CONFIDENCE' : 'RECOMMENDATION',
        reasoning: [requirements.reasoning, 'Hospital selection uses live capacity, specialist availability, blood, equipment, emergency load, live road route and distance.'],
        generatedAt: new Date(),
        humanReviewed: false
    };

    // Step 2: Evaluate hospitals with live traffic data
    const { ranked, all } = await evaluateHospitals(emergency, requirements, {
        traffic: emergency.trafficConditions || 'light'
    });

    const aiReasoning = await getAllocationReasoning({ emergency, requirements, candidates: all });
    if (aiReasoning) {
        emergency.aiAllocation.provider = process.env.AI_PROVIDER || 'external-ai';
        emergency.aiAllocation.reasoning.push(aiReasoning.summary, ...aiReasoning.considerations);
        emergency.aiAllocation.confidence = Math.max(emergency.aiAllocation.confidence, aiReasoning.confidence);
    }

    if (ranked.length === 0) {
        emergency.caseStatus = 'HOSPITAL SEARCH';
        emergency.status = 'reported';
        emergency.aiAllocation.decision = 'NO_CAPACITY';
        await emergency.save();
        return {
            success: false,
            message: 'No suitable hospital found for this emergency',
            requirements,
            evaluated: all
        };
    }

    // Step 3: Select best hospital
    const best = ranked[0];

    // Step 4: Assign hospital
    emergency.assignedHospital = best.hospital;
    emergency.routePlan = best.route;
    emergency.caseStatus = 'WAITING FOR CONFIRMATION';
    emergency.status = 'dispatching';

    // Step 5: Find and assign available ambulance
    const location = {
        lat: emergency.location?.coordinates?.[1] || 12.9141,
        lng: emergency.location?.coordinates?.[0] || 74.8560
    };
    const ambulance = await claimNearestAmbulance(location, emergency._id);
    if (ambulance) {
        emergency.assignedAmbulance = ambulance._id;
    }

    // Step 6: Reserve hospital resources (bed, equipment)
    let reservations = [];
    try {
        const hospitalIdForReserve = emergency.assignedHospital?._id || emergency.assignedHospital;
        ({ reservations } = await reserveResources(hospitalIdForReserve, requirements, emergency._id));
    } catch (reserveError) {
        // If reservation fails, release ambulance and try next hospital
        if (ambulance) {
            await Ambulance.findOneAndUpdate(
                { _id: ambulance._id, currentAssignment: emergency._id },
                { $set: { status: 'available' }, $unset: { currentAssignment: 1 } }
            );
        }
        // Try next best hospital
        for (let i = 1; i < ranked.length; i++) {
            const nextBest = ranked[i];
            emergency.assignedHospital = nextBest.hospital;
            emergency.routePlan = nextBest.route;
            try {
                const nextHospitalId = nextBest.hospital;
                ({ reservations } = await reserveResources(nextHospitalId, requirements, emergency._id));
                const nextAmbulance = await claimNearestAmbulance(location, emergency._id);
                if (nextAmbulance) emergency.assignedAmbulance = nextAmbulance._id;
                break;
            } catch (e) {
                continue;
            }
        }
    }

    // Step 7: Assign doctor
    let doctor = null;
    const hospitalIdForDoctor = emergency.assignedHospital?._id || emergency.assignedHospital;
    if (emergency.assignedHospital) {
        doctor = await User.findOne({
            role: 'doctor',
            isActive: true,
            'doctorInfo.hospitalId': hospitalIdForDoctor,
            'doctorInfo.specialization': requirements.specialist,
            'doctorInfo.availabilityStatus': 'available'
        });
        if (doctor) {
            doctor.doctorInfo.availabilityStatus = 'assigned';
            doctor.doctorInfo.currentAssignment = emergency._id;
            await doctor.save();
            emergency.assignedDoctor = doctor._id;
        }
    }

    await emergency.save();

    // Step 8: Record allocation history
    const alternatives = ranked.slice(1).map(r => ({
        hospital: r.hospital,
        score: r.score,
        reasons: r.reasons
    }));

    const reasonText = `${best.name} selected because: ${best.reasons.join('; ')}` +
        (best.distance <= 5 ? ' and it is within a short distance' : '');

    const allocation = await AllocationHistory.create({
        caseId: emergency._id,
        patientId: emergency.reportedBy,
        recommendedHospital: best.hospital,
        alternativeHospitals: alternatives,
        reason: reasonText,
        resourcesRequired: requirements,
        hospitalResponse: 'PENDING',
        finalHospital: best.hospital,
        travelTime: best.travelTime,
        status: 'requested'
    });

    // Update emergency with resource allocation tracking
    emergency.resourceAllocation = {
        status: 'RESERVED',
        reservedAt: new Date(),
        hospital: emergency.assignedHospital,
        resources: emergency.requiredResource,
        reservations
    };
    await emergency.save();

    // Return full allocation result - resources are RESERVED but need admin confirmation
    return {
        success: true,
        emergency: emergency._id,
        caseStatus: emergency.caseStatus,
        requirements,
        recommendedHospital: best,
        alternatives: alternatives.slice(0, 3).map(a => ({
            hospital: a.hospital,
            name: ranked.find(r => r.hospital.toString() === a.hospital.toString())?.name,
            score: a.score,
            reasons: a.reasons
        })),
        allocationId: allocation._id,
        explanation: reasonText,
        automaticallyReserved: true,
        reservations,
        doctor: doctor ? { _id: doctor._id, name: doctor.name, specialty: doctor.doctorInfo?.specialization } : null,
        ambulance: ambulance ? { _id: ambulance._id, vehicleNumber: ambulance.vehicleNumber } : null,
        requiresAdminConfirmation: true
    };
};

// ─────────────────────────────────────────────────────────────
// 8. REALLOCATION (When hospital rejects or capacity changes)
// ─────────────────────────────────────────────────────────────
const reallocateEmergency = async (emergencyId, rejectedHospitalId = null, reason = '') => {
    const emergency = await Emergency.findById(emergencyId).populate('assignedHospital');
    if (!emergency) {
        throw new Error('Emergency case not found');
    }

    // Release locked resources from rejected hospital if any were locked
    if (emergency.resourceAllocation?.status === 'RESERVED' && emergency.assignedHospital) {
        await releaseResources(emergency.assignedHospital._id || emergency.assignedHospital, emergency.requiredResource, emergency._id);
    }
    if (emergency.assignedDoctor) {
        await User.findByIdAndUpdate(emergency.assignedDoctor, {
            'doctorInfo.availabilityStatus': 'available',
            'doctorInfo.currentAssignment': null
        });
        emergency.assignedDoctor = null;
    }

    // Update allocation history for the rejected hospital
    if (rejectedHospitalId) {
        await AllocationHistory.findOneAndUpdate(
            { caseId: emergency._id, recommendedHospital: rejectedHospitalId },
            { hospitalResponse: 'REJECTED', rejectionReason: reason }
        );
    }

    // Re-evaluate hospitals
    const requirements = determineRequiredResources({
        type: emergency.type,
        subtype: emergency.subtype,
        description: emergency.description,
        symptoms: emergency.symptoms,
        severity: emergency.severity,
        patient: emergency.patient
    });

    const { ranked } = await evaluateHospitals(emergency, requirements, {
        traffic: emergency.trafficConditions || 'light'
    });

    // Exclude rejected hospitals
    const rejectedIds = await AllocationHistory.find({ caseId: emergency._id, hospitalResponse: 'REJECTED' })
        .distinct('recommendedHospital');

    const available = ranked.filter(r =>
        !rejectedIds.includes(r.hospital.toString()) &&
        r.hospital.toString() !== (rejectedHospitalId || '').toString()
    );

    if (available.length === 0) {
        emergency.caseStatus = 'HOSPITAL SEARCH';
        await emergency.save();
        return {
            success: false,
            message: 'No alternative hospitals available',
            requirements
        };
    }

    // Select next best hospital
    const nextBest = available[0];

    // Assign to new hospital (not yet locked - wait for confirmation)
    emergency.assignedHospital = nextBest.hospital;
    emergency.caseStatus = 'WAITING FOR CONFIRMATION';
    emergency.status = 'reported';

    // Reset resource allocation tracking
    emergency.resourceAllocation = {
        status: 'PENDING',
        reservedAt: null,
        hospital: nextBest.hospital,
        resources: emergency.requiredResource
    };

    await emergency.save();

    // Create new allocation history record
    const reasonText = `Reallocated to ${nextBest.name} because: ${nextBest.reasons.join('; ')}`;
    const allocation = await AllocationHistory.create({
        caseId: emergency._id,
        recommendedHospital: nextBest.hospital,
        alternativeHospitals: available.slice(1).map(r => ({ hospital: r.hospital, score: r.score, reasons: r.reasons })),
        reason: reasonText,
        resourcesRequired: emergency.requiredResource,
        hospitalResponse: 'PENDING',
        finalHospital: nextBest.hospital,
        travelTime: nextBest.travelTime,
        status: 'requested'
    });

    // Reassign ambulance to new hospital route
    const location = {
        lat: emergency.location?.coordinates?.[1] || 12.9141,
        lng: emergency.location?.coordinates?.[0] || 74.8560
    };
    const ambulance = await findNearestAmbulance(location);
    if (ambulance) {
        emergency.assignedAmbulance = ambulance._id;
        await emergency.save();
    }

    return {
        success: true,
        emergency: emergency._id,
        caseStatus: emergency.caseStatus,
        requirements,
        recommendedHospital: nextBest,
        allocationId: allocation._id,
        explanation: reasonText
    };
};

// ─────────────────────────────────────────────────────────────
// 9. CONFIRM HOSPITAL ACCEPTANCE & FINALIZE (Admin confirmation)
//    Resources already reserved during allocation - this just finalizes
// ─────────────────────────────────────────────────────────────
const confirmHospitalAcceptance = async (emergencyId, hospitalId, options = {}) => {
    const emergency = await Emergency.findById(emergencyId).populate('assignedHospital').populate('assignedAmbulance').populate('assignedDoctor');
    if (!emergency) {
        throw new Error('Emergency case not found');
    }

    // If already confirmed, return current state
    if (emergency.caseStatus === 'HOSPITAL ACCEPTED' && emergency.resourceAllocation?.status === 'RESERVED') {
        return {
            success: true,
            emergency,
            reservations: emergency.resourceAllocation.reservations || [],
            doctor: emergency.assignedDoctor ? { _id: emergency.assignedDoctor._id, name: emergency.assignedDoctor.name, specialty: emergency.assignedDoctor.doctorInfo?.specialization } : null,
            route: emergency.routePlan,
            ambulance: emergency.assignedAmbulance ? { _id: emergency.assignedAmbulance._id, vehicleNumber: emergency.assignedAmbulance.vehicleNumber } : null,
            alreadyConfirmed: true
        };
    }

    // If admin manually changes hospital, release old resources and re-reserve
    const previousHospitalId = emergency.assignedHospital?._id || emergency.assignedHospital;
    if (hospitalId && previousHospitalId && previousHospitalId.toString() !== hospitalId.toString()
        && emergency.resourceAllocation?.status === 'RESERVED') {
        await releaseResources(previousHospitalId, emergency.requiredResource, emergency._id);
        if (emergency.assignedDoctor) {
            await User.findByIdAndUpdate(emergency.assignedDoctor, {
                'doctorInfo.availabilityStatus': 'available',
                'doctorInfo.currentAssignment': null
            });
            emergency.assignedDoctor = null;
        }
        emergency.resourceAllocation = { status: 'PENDING' };
    }

    // Set assigned hospital if changed
    if (hospitalId) {
        emergency.assignedHospital = hospitalId;
    }

    // Ensure ambulance is assigned
    const location = {
        lat: emergency.location?.coordinates?.[1] || 12.9141,
        lng: emergency.location?.coordinates?.[0] || 74.8560
    };
    let ambulance = emergency.assignedAmbulance
        ? await Ambulance.findOne({
            _id: emergency.assignedAmbulance,
            currentAssignment: emergency._id,
            status: { $in: ['en_route', 'at_scene', 'returning'] }
        })
        : null;
    if (!ambulance) {
        ambulance = await claimNearestAmbulance(location, emergency._id);
    }
    if (!ambulance) {
        throw new Error('No available ambulance could be locked for this emergency');
    }
    emergency.assignedAmbulance = ambulance._id;

    // Ensure resources are reserved
    let reservations = emergency.resourceAllocation?.reservations || [];
    if (emergency.resourceAllocation?.status !== 'RESERVED') {
        const requirements = determineRequiredResources({
            type: emergency.type,
            subtype: emergency.subtype,
            description: emergency.description,
            symptoms: emergency.symptoms,
            severity: emergency.severity,
            patient: emergency.patient
        });
        try {
            // emergency.assignedHospital is populated, extract ID
            const hospitalIdForReserve = emergency.assignedHospital?._id || emergency.assignedHospital;
            ({ reservations } = await reserveResources(hospitalIdForReserve, requirements, emergency._id));
        } catch (error) {
            await Ambulance.findOneAndUpdate(
                { _id: ambulance._id, currentAssignment: emergency._id },
                { $set: { status: 'available' }, $unset: { currentAssignment: 1 } }
            );
            throw error;
        }
    }

    // Ensure doctor is assigned
    // emergency.assignedHospital is already populated from the findById call above
    const hospital = emergency.assignedHospital;
    const hospitalIdForDoctor = hospital?._id || emergency.assignedHospital;
    let doctor = emergency.assignedDoctor
        ? await User.findById(emergency.assignedDoctor)
        : null;
    if (!doctor) {
        doctor = options.doctorId
            ? await User.findOne({ _id: options.doctorId, role: 'doctor', isActive: true })
            : await User.findOne({
                role: 'doctor',
                isActive: true,
                'doctorInfo.hospitalId': hospitalIdForDoctor,
                'doctorInfo.specialization': emergency.requiredResource?.specialist,
                'doctorInfo.availabilityStatus': 'available'
            });
    }
    if (doctor) {
        doctor.doctorInfo.availabilityStatus = 'assigned';
        doctor.doctorInfo.currentAssignment = emergency._id;
        await doctor.save();
        emergency.assignedDoctor = doctor._id;
    }

    // Recalculate route
    emergency.routePlan = await calculateOptimalRoute(
        emergency.location?.coordinates || [74.8560, 12.9141],
        hospital?.location?.coordinates || [74.8560, 12.9141],
        emergency.trafficConditions || 'light'
    );

    // Update emergency - FINAL CONFIRMATION
    emergency.caseStatus = 'HOSPITAL ACCEPTED';
    emergency.status = 'dispatching';
    emergency.requiredResource = {
        bedType: emergency.requiredResource?.bedType,
        specialist: emergency.requiredResource?.specialist,
        equipment: emergency.requiredResource?.equipment,
        notes: emergency.requiredResource?.notes
    };
    emergency.resourceAllocation = {
        status: 'RESERVED',
        reservedAt: emergency.resourceAllocation?.reservedAt || new Date(),
        hospital: emergency.assignedHospital,
        resources: emergency.requiredResource,
        reservations
    };
    emergency.aiAllocation = {
        ...(emergency.aiAllocation || {}),
        decision: options.manualOverride ? 'MANUAL_OVERRIDE' : (emergency.aiAllocation?.decision || 'RECOMMENDATION'),
        humanReviewed: Boolean(options.manualOverride)
    };

    await emergency.save();

    // Update allocation history
    const hospitalIdForHistory = emergency.assignedHospital?._id || emergency.assignedHospital;
    await AllocationHistory.findOneAndUpdate(
        { caseId: emergency._id, recommendedHospital: hospitalIdForHistory },
        { hospitalResponse: 'ACCEPTED', status: 'confirmed' }
    );

    // Share patient handover
    emergency.patientHandover = {
        shared: true,
        sharedAt: new Date(),
        vitals: emergency.initialVitals || {
            heartRate: 92,
            spo2: 96,
            temperature: 98.6,
            bloodPressure: { systolic: 120, diastolic: 80 }
        },
        ambulanceLocation: ambulance?.currentLocation?.coordinates
            ? { latitude: ambulance.currentLocation.coordinates[1], longitude: ambulance.currentLocation.coordinates[0] }
            : { latitude: emergency.location?.coordinates?.[1], longitude: emergency.location?.coordinates?.[0] },
        eta: emergency.routePlan?.etaMinutes || 12
    };
    emergency.timeline.push({
        event: 'ADMIN_CONFIRMED',
        description: 'Admin confirmed allocation. Resources locked, ambulance dispatched, patient data shared with hospital.',
        actor: 'ADMIN',
        metadata: { hospital: emergency.assignedHospital, doctor: emergency.assignedDoctor, ambulance: emergency.assignedAmbulance, route: emergency.routePlan }
    });
    await emergency.save();

    return {
        success: true,
        emergency,
        reservations,
        doctor: doctor ? {
            _id: doctor._id,
            name: doctor.name,
            specialty: doctor.doctorInfo?.specialization
        } : null,
        route: emergency.routePlan,
        ambulance: ambulance ? { _id: ambulance._id, vehicleNumber: ambulance.vehicleNumber } : null
    };
};

const refreshEmergencyRouting = async (emergencyId, traffic = 'light') => {
    const emergency = await Emergency.findById(emergencyId).populate('assignedHospital');
    if (!emergency) throw new Error('Emergency case not found');

    const requirements = determineRequiredResources({
        type: emergency.type,
        subtype: emergency.subtype,
        description: emergency.description,
        symptoms: emergency.symptoms,
        severity: emergency.severity,
        patient: emergency.patient
    });
    const { ranked, all } = await evaluateHospitals(emergency, requirements, { traffic });
    const current = emergency.assignedHospital
        ? all.find(item => item.hospital.toString() === emergency.assignedHospital._id.toString())
        : null;
    const best = ranked[0];

    if (!best) {
        emergency.trafficConditions = traffic;
        emergency.caseStatus = 'HOSPITAL SEARCH';
        await emergency.save();
        return { success: false, message: 'No eligible hospital after route/resource refresh', evaluated: all };
    }

    const changedHospital = !current || (!current.eligible && best.hospital.toString() !== current.hospital.toString());
    if (changedHospital) {
        if (emergency.resourceAllocation?.status === 'RESERVED' && current) {
            await releaseResources(current.hospital, emergency.requiredResource, emergency._id);
        }
        emergency.assignedHospital = best.hospital;
        emergency.resourceAllocation = {
            ...(emergency.resourceAllocation || {}),
            status: 'PENDING',
            hospital: best.hospital,
            releasedAt: new Date()
        };
        emergency.caseStatus = 'WAITING FOR CONFIRMATION';
        emergency.status = 'reported';
    }

    const selectedRoute = changedHospital ? best.route : current.route;
    emergency.trafficConditions = traffic;
    emergency.routePlan = selectedRoute;
    emergency.timeline.push({
        event: changedHospital ? 'HOSPITAL_CHANGED' : 'ROUTE_RECALCULATED',
        description: changedHospital
            ? `Hospital changed after live refresh to ${best.name}`
            : `Live road route recalculated using ${traffic} traffic conditions`,
        actor: 'SYSTEM',
        metadata: { traffic, route: selectedRoute, recommendedHospital: changedHospital ? best.hospital : current?.hospital }
    });
    await emergency.save();

    return { success: true, changedHospital, emergency, recommendedHospital: best, evaluated: all };
};

// ─────────────────────────────────────────────────────────────
// 10. REJECT HOSPITAL → REALLOCATE
// ─────────────────────────────────────────────────────────────
const rejectHospitalAllocation = async (emergencyId, hospitalId, rejectionReason) => {
    // Mark current allocation as rejected
    await AllocationHistory.findOneAndUpdate(
        { caseId: emergencyId, recommendedHospital: hospitalId },
        { hospitalResponse: 'REJECTED', rejectionReason: rejectionReason || 'Hospital declined' }
    );

    // Trigger reallocation
    return reallocateEmergency(emergencyId, hospitalId, rejectionReason);
};

// ─────────────────────────────────────────────────────────────
// 11. COMPLETE/CANCEL → RELEASE RESOURCES
// ─────────────────────────────────────────────────────────────
const completeEmergencyResources = async (emergencyId, cancel = false) => {
    // Explicitly select requiredResource to ensure it's populated
    const emergency = await Emergency.findById(emergencyId)
        .populate('assignedHospital')
        .select('+requiredResource');
    if (!emergency) {
        throw new Error('Emergency case not found');
    }

    // Get resources from multiple possible sources
    const getResources = () => {
        return emergency.resourceAllocation?.resources 
            || emergency.requiredResource 
            || { bedType: 'ICU', specialist: '', equipment: '', notes: '' };
    };
    const existingResources = getResources();

    // Release resources if they were locked
    if (emergency.resourceAllocation?.status === 'RESERVED' && emergency.assignedHospital) {
        await releaseResources(
            emergency.assignedHospital._id || emergency.assignedHospital,
            existingResources,
            emergency._id
        );
    }
    if (emergency.assignedDoctor) {
        await User.findByIdAndUpdate(emergency.assignedDoctor, {
            'doctorInfo.availabilityStatus': 'available',
            'doctorInfo.currentAssignment': null
        });
    }

    if (emergency.assignedAmbulance) {
        await Ambulance.findOneAndUpdate(
            { _id: emergency.assignedAmbulance, currentAssignment: emergency._id },
            { $set: { status: 'available' }, $unset: { currentAssignment: 1 } }
        );
    }

    emergency.caseStatus = cancel ? 'CANCELLED' : 'COMPLETED';
    emergency.status = cancel ? 'cancelled' : 'completed';
    emergency.completedAt = new Date();
    
    // Update resourceAllocation fields individually to avoid Mongoose subdocument casting issues
    emergency.resourceAllocation.status = cancel ? 'RELEASED' : 'COMPLETED';
    emergency.resourceAllocation.releasedAt = new Date();
    emergency.resourceAllocation.resources = existingResources;

    await emergency.save();

    // Update allocation history
    await AllocationHistory.findOneAndUpdate(
        { caseId: emergency._id },
        { status: cancel ? 'cancelled' : 'completed' }
    );

    return { success: true, emergency };
};

module.exports = {
    calculateDistance,
    determineRequiredResources,
    scoreHospital,
    evaluateHospitals,
    reserveResources,
    releaseResources,
    findNearestAmbulance,
    allocateEmergencyResources,
    reallocateEmergency,
    confirmHospitalAcceptance,
    refreshEmergencyRouting,
    rejectHospitalAllocation,
    completeEmergencyResources
};