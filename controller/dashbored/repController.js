// controllers/dashboardController.js
const fs = require('fs');
const path = require('path');
const { db } = require('../../config/firebase-admin'); // ضبط المسار حسب مشروعك

// Load local data files for geo calculations
const cities = JSON.parse(fs.readFileSync(path.join(__dirname, "../../services/geonames.json"), "utf8"));
const regions = JSON.parse(fs.readFileSync(path.join(__dirname, "../../services/regions.json"), "utf8"));
const countries = JSON.parse(fs.readFileSync(path.join(__dirname, "../../services/countries.json"), "utf8"));

// Haversine formula to calculate distance between two points
function haversine(lat1, lon1, lat2, lon2) {
    const toRad = (angle) => (angle * Math.PI) / 180;
    const R = 6371; // Earth's radius in km
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a = Math.sin(dLat / 2) ** 2 +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

// Convert GeoPoint to country, region, city
function getLocationFromGeoPoint(location) {
    try {
        if (!location || (!location._latitude && !location.latitude) || (!location._longitude && !location.longitude)) {
            return { country: "Unknown", region: "Unknown", city: "Unknown" };
        }

        const lat = location._latitude || location.latitude;
        const lng = location._longitude || location.longitude;

        // Find closest city
        let closestCity = { name: "Unknown", country_code: "", admin1_code: "", lat: 0, lng: 0, distance: Infinity };
        for (const city of cities) {
            if (!city.lat || !city.lng) continue;
            const dist = haversine(lat, lng, parseFloat(city.lat), parseFloat(city.lng));
            if (dist < closestCity.distance) closestCity = { ...city, distance: dist };
        }

        const country = countries.find(c => c.code === closestCity.country_code);
        const region = regions.find(r => r.code === `${closestCity.country_code}.${closestCity.admin1_code}`);

        return {
            country: country ? country.name : closestCity.country_code || "Unknown",
            region: region ? region.name : closestCity.admin1_code || "Unknown",
            city: closestCity.name || "Unknown"
        };
    } catch (err) {
        console.error("⚠️ Error converting GeoPoint:", err);
        return { country: "Unknown", region: "Unknown", city: "Unknown" };
    }
}

// Safe function to extract coordinates
function safeGetLocation(data) {
    if (!data.location) return { country: "Unknown", region: "Unknown", city: "Unknown" };
    const lat = data.location._latitude || data.location.latitude;
    const lng = data.location._longitude || data.location.longitude;
    if (lat == null || lng == null) return { country: "Unknown", region: "Unknown", city: "Unknown" };
    return getLocationFromGeoPoint({ _latitude: lat, _longitude: lng });
}

// Build Firebase statistics
async function buildFirebaseStats({ writeToFile = true } = {}) {
    const stats = {
        totalUsers: 0,
        totalDonors: 0,
        totalHelpSeekers: 0,
        totalNonFinancialRequests: 0,
        totalFinancialRequests: 0,
        nonFinancialRequests: { completed: 0, incomplete: 0, active: 0, inactive: 0, completedPercent: "0%", incompletePercent: "0%" },
        financialRequests: { completed: 0, incomplete: 0, completedPercent: "0%", incompletePercent: "0%" },
        totalDonations: 0,
        totalDonationsValue: 0,
        donorsList: [],
        categoriesCount: 0,
        usersByCountry: {} // عدد المتبرعين وطلبة المساعدة لكل دولة
    };

    // --- users ---
    const usersSnap = await db.collection('users').get();
    stats.totalUsers = usersSnap.size;

    usersSnap.forEach(doc => {
        const d = doc.data();
        const type = (d.userType || '').toString().toLowerCase();

        if (type === 'donor') stats.totalDonors++;
        if (type === 'requester' || type === 'help_seeker' || type === 'seeker' || type === 'beneficiary') {
            stats.totalHelpSeekers++;
        }

        // Get country for this user
        const loc = safeGetLocation(d);
        const country = loc.country || "Unknown";

        if (!stats.usersByCountry[country]) stats.usersByCountry[country] = { donors: 0, requesters: 0 };
        if (type === 'donor') stats.usersByCountry[country].donors++;
        if (type === 'requester' || type === 'help_seeker' || type === 'seeker' || type === 'beneficiary') {
            stats.usersByCountry[country].requesters++;
        }
    });

    // --- requests (non-financial) ---
    const requestsSnap = await db.collection('requests').get();
    stats.totalNonFinancialRequests = requestsSnap.size; // عدد كل الطلبات الغير مالية
    requestsSnap.forEach(doc => {
        const r = doc.data();
        const status = (r.status || '').toString().toLowerCase();
        if (status === 'completed' || status === 'done') stats.nonFinancialRequests.completed++;
        else stats.nonFinancialRequests.incomplete++;

        if (r.isActive === true) stats.nonFinancialRequests.active++;
        else stats.nonFinancialRequests.inactive++;
    });

    // Add percentages with %
    const totalNonFin = stats.nonFinancialRequests.completed + stats.nonFinancialRequests.incomplete;
    if (totalNonFin > 0) {
        stats.nonFinancialRequests.completedPercent = ((stats.nonFinancialRequests.completed / totalNonFin) * 100).toFixed(2) + "%";
        stats.nonFinancialRequests.incompletePercent = ((stats.nonFinancialRequests.incomplete / totalNonFin) * 100).toFixed(2) + "%";
    }

    // --- fundraisers (financial requests) ---
    const fundraisersSnap = await db.collection('fundraisers').get();
    stats.totalFinancialRequests = fundraisersSnap.size; // عدد كل الطلبات المالية
    fundraisersSnap.forEach(doc => {
        const f = doc.data();
        const status = (f.status || '').toString().toLowerCase();
        if (status === 'completed' || status === 'done') stats.financialRequests.completed++;
        else stats.financialRequests.incomplete++;
    });

    // Add percentages with %
    const totalFin = stats.financialRequests.completed + stats.financialRequests.incomplete;
    if (totalFin > 0) {
        stats.financialRequests.completedPercent = ((stats.financialRequests.completed / totalFin) * 100).toFixed(2) + "%";
        stats.financialRequests.incompletePercent = ((stats.financialRequests.incomplete / totalFin) * 100).toFixed(2) + "%";
    }

    // --- donations ---
    const donationsSnap = await db.collection('donations').get();
    stats.totalDonations = donationsSnap.size;

    let totalValue = 0;
    const donorsList = [];
    donationsSnap.forEach(doc => {
        const d = doc.data();
        const rawAmount = d.donationAmount ?? d.amount ?? d.value ?? 0;
        const amount = Number(rawAmount) || 0;
        totalValue += amount;

        donorsList.push({
            donorId: d.donorId || d.userId || d.uid || null,
            donationAmount: amount,
            fundraiserId: d.fundraiserId || null,
            createdAt: d.createdAt ? (d.createdAt.seconds ? new Date(d.createdAt.seconds * 1000).toISOString() : d.createdAt) : null
        });
    });

    stats.totalDonationsValue = totalValue;
    stats.donorsList = donorsList;

    // --- categories ---
    const categoriesSnap = await db.collection('categories').get();
    stats.categoriesCount = categoriesSnap.size;

    // Write to file if needed
    const result = { stats };
    if (writeToFile) {
        const outPath = path.join(__dirname, '../../services/firebase-structure.json');
        fs.writeFileSync(outPath, JSON.stringify(result, null, 2), 'utf8');
    }

    return result;
}

module.exports = { buildFirebaseStats };
