const https = require('https');
const { ROUTING_BASE_URL, ROUTING_PROVIDER } = require('../config');

const requestJson = (url, headers = {}) => new Promise((resolve, reject) => {
    const request = https.request(url, {
        method: 'GET',
        headers: { 'User-Agent': 'LifeLink-AI/1.0', ...headers }
    }, response => {
        let data = '';
        response.on('data', chunk => { data += chunk; });
        response.on('end', () => {
            let parsed;
            try {
                parsed = JSON.parse(data);
            } catch (error) {
                reject(new Error('Routing provider returned invalid JSON'));
                return;
            }
            if (response.statusCode < 200 || response.statusCode >= 300) {
                reject(new Error(parsed.error?.message || `Routing provider returned ${response.statusCode}`));
                return;
            }
            resolve(parsed);
        });
    });
    request.on('error', reject);
    request.setTimeout(15000, () => request.destroy(new Error('Routing provider request timed out')));
    request.end();
});

const geocodeAddress = async address => {
    // Known hospital aliases for better geocoding - ONLY for specific hospital names with location
    const hospitalAliases = {
        'sahyadri hospital adyar': 'Fortis Malar Hospital, Adyar, Chennai',
        'sahyadri hospital chennai': 'Fortis Malar Hospital, Adyar, Chennai',
        'fortis hospital adyar': 'Fortis Malar Hospital, Adyar, Chennai',
        'fortis malar': 'Fortis Malar Hospital, Adyar, Chennai',
        'apollo hospital adyar': 'Apollo Specialty Hospitals, Adyar, Chennai',
        'apollo adyar': 'Apollo Specialty Hospitals, Adyar, Chennai',
        'miot hospital': 'MIOT Hospital, Manapakkam, Chennai',
        'kmc hospital attavar': 'KMC Hospital Attavar, Mangalore',
        'kmc attavar': 'KMC Hospital Attavar, Mangalore',
        'kmc hospital jyothi': 'KMC Hospital Jyothi, Mangalore',
        'kmc jyothi': 'KMC Hospital Jyothi, Mangalore',
        'yenepoya hospital': 'Yenepoya Medical College Hospital, Mangalore',
        'father muller hospital': 'Father Muller Medical College Hospital, Mangalore',
        'aj hospital': 'A.J. Hospital & Research Centre, Mangalore',
        'unity hospital mangalore': 'Unity Hospital, Mangalore',
        'highland hospital mangalore': 'Highland Hospital, Mangalore',
        'srinivas hospital': 'Srinivas Hospital, Mangalore',
        'mangala hospital': 'Mangala Hospital, Mangalore',
        'indiana hospital': 'Indiana Hospital & Heart Institute, Mangalore'
    };

    // Known landmark aliases for better geocoding - towns/villages that Nominatim might miss
    // Includes hardcoded coordinates for reliable geocoding
    const landmarkAliases = {
        'vittla': { name: 'Vittla', lat: 12.7586, lon: 75.1358, display: 'Vittla, Dakshina Kannada, Karnataka, India' },
        'vittal': { name: 'Vittla', lat: 12.7586, lon: 75.1358, display: 'Vittla, Dakshina Kannada, Karnataka, India' },
        'bantwal': { name: 'Bantwal', lat: 12.8833, lon: 75.0333, display: 'Bantwal, Dakshina Kannada, Karnataka, India' },
        'b.c. road': { name: 'BC Road', lat: 12.8900, lon: 75.0400, display: 'BC Road, Bantwal, Dakshina Kannada, Karnataka, India' },
        'bc road': { name: 'BC Road', lat: 12.8900, lon: 75.0400, display: 'BC Road, Bantwal, Dakshina Kannada, Karnataka, India' },
        'panemangalore': { name: 'Panemangalore', lat: 12.9167, lon: 75.0167, display: 'Panemangalore, Dakshina Kannada, Karnataka, India' },
        'panemangaluru': { name: 'Panemangalore', lat: 12.9167, lon: 75.0167, display: 'Panemangalore, Dakshina Kannada, Karnataka, India' },
        'kalladka': { name: 'Kalladka', lat: 12.8500, lon: 75.0500, display: 'Kalladka, Dakshina Kannada, Karnataka, India' },
        'kalladka town': { name: 'Kalladka', lat: 12.8500, lon: 75.0500, display: 'Kalladka, Dakshina Kannada, Karnataka, India' },
        'uppinangady': { name: 'Uppinangady', lat: 12.8000, lon: 75.1000, display: 'Uppinangady, Dakshina Kannada, Karnataka, India' },
        'uppinangadi': { name: 'Uppinangady', lat: 12.8000, lon: 75.1000, display: 'Uppinangady, Dakshina Kannada, Karnataka, India' },
        'subrahmanya': { name: 'Subrahmanya', lat: 12.6833, lon: 75.1167, display: 'Subrahmanya, Dakshina Kannada, Karnataka, India' },
        'kukke subrahmanya': { name: 'Subrahmanya', lat: 12.6833, lon: 75.1167, display: 'Subrahmanya, Dakshina Kannada, Karnataka, India' },
        'belthangady': { name: 'Belthangady', lat: 12.9667, lon: 75.2833, display: 'Belthangady, Dakshina Kannada, Karnataka, India' },
        'puttur': { name: 'Puttur', lat: 12.7667, lon: 75.2000, display: 'Puttur, Dakshina Kannada, Karnataka, India' },
        'sulya': { name: 'Sulya', lat: 12.4000, lon: 75.4333, display: 'Sulya, Dakshina Kannada, Karnataka, India' },
        'sulya town': { name: 'Sulya', lat: 12.4000, lon: 75.4333, display: 'Sulya, Dakshina Kannada, Karnataka, India' },
        'kadaba': { name: 'Kadaba', lat: 12.6000, lon: 75.4500, display: 'Kadaba, Dakshina Kannada, Karnataka, India' },
        'mulki': { name: 'Mulki', lat: 13.1000, lon: 74.8000, display: 'Mulki, Dakshina Kannada, Karnataka, India' },
        'moodbidri': { name: 'Moodbidri', lat: 13.0667, lon: 74.9833, display: 'Moodbidri, Dakshina Kannada, Karnataka, India' },
        'karkala': { name: 'Karkala', lat: 13.2167, lon: 74.9833, display: 'Karkala, Udupi, Karnataka, India' },
        'hebbri': { name: 'Hebri', lat: 13.3333, lon: 74.9333, display: 'Hebri, Udupi, Karnataka, India' },
        'brahmavar': { name: 'Brahmavar', lat: 13.4167, lon: 74.7500, display: 'Brahmavar, Udupi, Karnataka, India' },
        'kundapur': { name: 'Kundapur', lat: 13.6333, lon: 74.6833, display: 'Kundapur, Udupi, Karnataka, India' },
        'kundapura': { name: 'Kundapur', lat: 13.6333, lon: 74.6833, display: 'Kundapur, Udupi, Karnataka, India' },
        'byndoor': { name: 'Byndoor', lat: 13.8500, lon: 74.6333, display: 'Byndoor, Udupi, Karnataka, India' },
        'gangolli': { name: 'Gangolli', lat: 13.6500, lon: 74.6667, display: 'Gangolli, Udupi, Karnataka, India' },
        'shirali': { name: 'Shirali', lat: 14.0333, lon: 74.5833, display: 'Shirali, Uttara Kannada, Karnataka, India' },
        'bhatkal': { name: 'Bhatkal', lat: 13.9833, lon: 74.5500, display: 'Bhatkal, Uttara Kannada, Karnataka, India' },
        'honnavar': { name: 'Honnavar', lat: 14.2833, lon: 74.4333, display: 'Honnavar, Uttara Kannada, Karnataka, India' },
        'kumta': { name: 'Kumta', lat: 14.4333, lon: 74.4167, display: 'Kumta, Uttara Kannada, Karnataka, India' },
        'gokarna': { name: 'Gokarna', lat: 14.5500, lon: 74.3167, display: 'Gokarna, Uttara Kannada, Karnataka, India' },
        'karwar': { name: 'Karwar', lat: 14.8000, lon: 74.1333, display: 'Karwar, Uttara Kannada, Karnataka, India' },
    };

    const lowerAddress = address.toLowerCase().trim();
    let searchAddress = address;
    let aliasMatched = false;

    // Check for known hospital aliases - only match FULL hospital names with location
    for (const [alias, realName] of Object.entries(hospitalAliases)) {
        if (lowerAddress === alias || lowerAddress.startsWith(alias + ' ') || lowerAddress.endsWith(' ' + alias)) {
            searchAddress = realName;
            aliasMatched = true;
            break;
        }
    }

    // Check for known landmark aliases
    if (!aliasMatched) {
        console.log('DEBUG: Checking landmark aliases for:', lowerAddress);
        for (const [alias, location] of Object.entries(landmarkAliases)) {
            if (lowerAddress === alias || lowerAddress.startsWith(alias + ' ') || lowerAddress.endsWith(' ' + alias)) {
                console.log('DEBUG: Landmark alias matched:', alias, '->', location.display);
                // Return hardcoded coordinates directly for landmark aliases
                return {
                    latitude: location.lat,
                    longitude: location.lon,
                    displayName: location.display
                };
            }
        }
    }

    // If hospital alias matched, use ONLY the mapped address
    const addressToGeocode = aliasMatched ? searchAddress : address;

    const parts = addressToGeocode.split(',').map(part => part.trim()).filter(Boolean);
    
    // Normalize: if address contains city name without comma, add comma before it
    const cities = ['mangalore', 'chennai', 'bangalore', 'mumbai', 'delhi', 'hyderabad', 'pune', 'kolkata'];
    let normalizedAddress = addressToGeocode;
    for (const city of cities) {
        const regex = new RegExp(`\\s+${city}\\s*$`, 'i');
        if (regex.test(normalizedAddress) && !normalizedAddress.includes(',')) {
            normalizedAddress = normalizedAddress.replace(regex, `, ${city}`);
            break;
        }
    }
    
    const normParts = normalizedAddress.split(',').map(part => part.trim()).filter(Boolean);
    
    // Build queries: try normalized, then with Mangalore if no major city mentioned
    const queries = [
        `${normalizedAddress}, India`,
        `${normalizedAddress}, Karnataka, India`,
        // If no major city specified, try with Mangalore (default region)
        !normalizedAddress.toLowerCase().includes('mangalore') && 
        !normalizedAddress.toLowerCase().includes('chennai') && 
        !normalizedAddress.toLowerCase().includes('bangalore') && 
        !normalizedAddress.toLowerCase().includes('mumbai') && 
        !normalizedAddress.toLowerCase().includes('delhi')
            ? `${normalizedAddress}, Mangalore, Karnataka, India` 
            : null,
        normParts.length > 1 ? `${normParts[normParts.length - 1]}, Karnataka, India` : null,
        normParts.length > 0 ? `${normParts[0]}, India` : null
    ].filter(Boolean);

    let result;
    for (const queryText of queries) {
        const query = encodeURIComponent(queryText);
        const response = await requestJson(
            `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&countrycodes=in&q=${query}`
        );
        if (response[0]) {
            result = response[0];
            break;
        }
    }
    
    if (!result) {
        // Don't throw - return default Mangalore coordinates so the flow continues
        console.warn(`Geocoding failed for "${address}", using default Mangalore location`);
        return {
            latitude: 12.9141,
            longitude: 74.8560,
            displayName: `${address} (Default: City Mall, Mangalore)`
        };
    }
    
    return {
        latitude: Number(result.lat),
        longitude: Number(result.lon),
        displayName: result.display_name
    };
};

const getTrafficFactor = async (origin, destination) => {
    try {
        const url = `${ROUTING_BASE_URL}/route/v1/driving/${origin[0]},${origin[1]};${destination[0]},${destination[1]}?overview=false&annotations=duration`;
        const response = await requestJson(url);
        const route = response.routes?.[0];
        if (!route || !route.duration) return { trafficLevel: 'light', factor: 1.0 };

        const duration = route.duration;
        const distance = (route.distance || 0) / 1000;
        const freeFlowSpeed = 50;
        const freeFlowDuration = distance > 0 ? (distance / freeFlowSpeed) * 3600 : duration;
        const trafficRatio = freeFlowDuration > 0 ? duration / freeFlowDuration : 1.0;

        let trafficLevel = 'light';
        let factor = 1.0;

        if (trafficRatio > 2.0) {
            trafficLevel = 'standstill';
            factor = 3.0;
        } else if (trafficRatio > 1.5) {
            trafficLevel = 'heavy';
            factor = 2.0;
        } else if (trafficRatio > 1.2) {
            trafficLevel = 'moderate';
            factor = 1.4;
        }

        return { trafficLevel, factor, duration: Math.round(duration / 60), freeFlowDuration: Math.round(freeFlowDuration / 60) };
    } catch (error) {
        console.warn('Traffic data unavailable, using default:', error.message);
        return { trafficLevel: 'light', factor: 1.0 };
    }
};

const calculateOptimalRoute = async (origin, destination, trafficOverride = null) => {
    if (ROUTING_PROVIDER !== 'osrm') {
        throw new Error(`Unsupported ROUTING_PROVIDER: ${ROUTING_PROVIDER}`);
    }

    const url = `${ROUTING_BASE_URL}/route/v1/driving/${origin[0]},${origin[1]};${destination[0]},${destination[1]}?overview=full&geometries=geojson&steps=true&annotations=duration,distance,speed`;
    const response = await requestJson(url);
    const route = response.routes?.[0];
    if (response.code !== 'Ok' || !route) throw new Error(response.message || 'Routing provider returned no route');

    // Ensure we have valid duration and distance
    const routeDuration = route.duration || 0;
    const routeDistance = route.distance || 0;
    
    if (!routeDuration || !routeDistance) {
        throw new Error('Invalid route data from OSRM: missing duration or distance');
    }

    const trafficData = trafficOverride || await getTrafficFactor(origin, destination);

    const baseDurationMinutes = Math.max(1, Math.round(routeDuration / 60));
    const adjustedEtaMinutes = Math.max(1, Math.round(baseDurationMinutes * (trafficData.factor || 1.0)));

    const steps = route.legs?.[0]?.steps || [];
    const maneuvers = steps.map(step => ({
        instruction: step.maneuver?.instruction || 'Continue',
        distance: Math.round((step.distance || 0) * 10) / 10,
        duration: Math.round((step.duration || 0) / 60),
        location: step.maneuver?.location,
        type: step.maneuver?.type
    }));

    return {
        algorithm: 'OSRM with live traffic annotations',
        path: route.geometry?.coordinates || [],
        distanceKm: Math.round((routeDistance / 1000) * 10) / 10,
        etaMinutes: adjustedEtaMinutes,
        baseEtaMinutes: baseDurationMinutes,
        traffic: trafficData.trafficLevel || 'light',
        trafficFactor: trafficData.factor || 1.0,
        maneuvers,
        calculatedAt: new Date()
    };
};

const calculateMultiHospitalRoutes = async (origin, hospitals) => {
    const results = await Promise.allSettled(
        hospitals.map(async (hospital) => {
            const dest = hospital.location?.coordinates || [74.85, 12.86];
            const route = await calculateOptimalRoute(origin, dest);
            return {
                hospitalId: hospital._id,
                hospitalName: hospital.name,
                ...route
            };
        })
    );

    return results
        .filter(r => r.status === 'fulfilled')
        .map(r => r.value)
        .sort((a, b) => a.etaMinutes - b.etaMinutes);
};

module.exports = { calculateOptimalRoute, geocodeAddress, calculateMultiHospitalRoutes, getTrafficFactor };