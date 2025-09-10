const axios = require('axios');

// Function to get nearby hospitals
async function getNearbyHospitals(userLat, userLng) {
    // This would be your Google Places API Key
    const API_KEY = process.env.GOOGLE_PLACES_API_KEY;
    
    try {
        const url = "https://maps.googleapis.com/maps/api/place/nearbysearch/json";
        const params = {
            location: `${userLat},${userLng}`,
            radius: 5000,  // Search within 5km
            type: "hospital",
            key: API_KEY
        };
        
        const response = await axios.get(url, { params });
        const hospitals = response.data.results || [];
        
        // Filter out unnecessary hospitals
        const filteredHospitals = hospitals.filter(hospital => {
            const name = hospital.name.toLowerCase();
            return !["dental", "ayurved", "clinic", "homeopathy", "diabetes", "nursing home"]
                .some(keyword => name.includes(keyword));
        });
        
        return filteredHospitals;
    } catch (error) {
        console.error("Error fetching nearby hospitals:", error);
        return [];
    }
}

// Function to find the closest hospital
function findClosestHospital(userLat, userLng, hospitals) {
    let closestHospital = null;
    let minDistance = Infinity;
    
    for (const hospital of hospitals) {
        const hospitalLat = hospital.geometry.location.lat;
        const hospitalLng = hospital.geometry.location.lng;
        
        // Calculate distance using Haversine formula
        const distance = calculateDistance(
            userLat, userLng,
            hospitalLat, hospitalLng
        );
        
        if (distance < minDistance) {
            minDistance = distance;
            closestHospital = hospital;
        }
    }
    
    return { closestHospital, distance: minDistance };
}

// Function to calculate distance between two points (Haversine formula)
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Radius of the Earth in km
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
        Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c; // Distance in km
    return distance;
}

function deg2rad(deg) {
    return deg * (Math.PI/180);
}

// Function to get hospital type and specialty
function getHospitalDetails(hospital) {
    const hospitalName = hospital.name || "Unknown";
    const privateKeywords = ["apollo", "sahyadri", "noble", "spectra", "jehangir"];
    const hospitalType = privateKeywords.some(keyword => 
        hospitalName.toLowerCase().includes(keyword)) ? "Private" : "Government";
    
    // Default specialty - this could be enhanced with more logic
    const specialty = "General Hospital";
    
    return { hospitalType, specialty };
}

module.exports = {
    getNearbyHospitals,
    findClosestHospital,
    getHospitalDetails
}; 