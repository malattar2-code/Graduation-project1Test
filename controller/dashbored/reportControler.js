const { db } = require("../../config/firebase-admin"); // Firestore
const fs = require("fs");
const path = require("path");
const express = require("express");
const router = express.Router();

    
// Load local data files
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

// Convert GeoPoint to readable location string
function getLocationFromGeoPoint(location) {
    try {
        if (!location || (!location._latitude && !location.latitude) || (!location._longitude && !location.longitude)) {
            return "Country: Unknown, Region: Unknown, City: Unknown";
        }

        const lat = location._latitude || location.latitude;
        const lng = location._longitude || location.longitude;

        // Find the closest city
        let closestCity = { name: "Unknown", country_code: "", admin1_code: "", lat: 0, lng: 0, distance: Infinity };

        for (const city of cities) {
            if (!city.lat || !city.lng) continue;
            const dist = haversine(lat, lng, parseFloat(city.lat), parseFloat(city.lng));
            if (dist < closestCity.distance) {
                closestCity = { ...city, distance: dist };
            }
        }

        // Find country and region with fallback
        const country = countries.find((c) => c.code === closestCity.country_code);
        const region = regions.find((r) => r.code === `${closestCity.country_code}.${closestCity.admin1_code}`);

        const countryName = country ? country.name : closestCity.country_code || "Unknown";
        const regionName = region ? region.name : closestCity.admin1_code || "Unknown";
        const cityName = closestCity.name || "Unknown";

        return `Country: ${countryName}, Region: ${regionName}, City: ${cityName}`;
    } catch (err) {
        console.error("⚠️ Error converting GeoPoint:", err);
        return "Country: Unknown, Region: Unknown, City: Unknown";
    }
}

// Safe function to extract coordinates from Firestore user data
function safeGetLocation(data) {
    if (!data.location) return "Country: Unknown, Region: Unknown, City: Unknown";

    const lat = data.location._latitude || data.location.latitude;
    const lng = data.location._longitude || data.location.longitude;

    if (lat == null || lng == null) return "Country: Unknown, Region: Unknown, City: Unknown";

    return getLocationFromGeoPoint({ _latitude: lat, _longitude: lng });
}

// Fetch donor users and add readable location
exports.donorUsers = async (req, res) => {
    try {
        const snapshot = await db.collection("users").where("userType", "==", "donor").get();
        let index = 1;

        const list = snapshot.docs.map((doc) => {
            const data = doc.data();
            const location = safeGetLocation(data);

            return {
                number: index++,
                id: doc.id,
                ...data,
                location // ready-to-display string
            };
        });

        res.status(200).json(list);
    } catch (error) {
        console.error("Error fetching donors:", error);
        res.status(500).json({ message: "Error fetching donors", error });
    }
};

// 1: عدد المتبرعين 
// exports.donorUsers = async (req, res) => {
//     try {
//         const snapshot = await db.collection('users').where('userType', '==', 'donor').get();
//         let index = 1;

//         const list = snapshot.docs.map(doc => {
//             const data = doc.data();
//             let location = "غير معروف";

//             try {
//                 location = getLocationFromCoordinates(data.location);
//             } catch (err) {
//                 console.error("خطأ في doc.id =", doc.id, err);
//             }

//             return {
//                 number: index++,
//                 id: doc.id,
//                 ...data,
//                 location
//             };
//         });

//         res.status(200).json(list);
//     } catch (error) {
//         console.error("خطأ في جلب المتبرعين:", error);
//         res.status(500).json({ message: "خطأ في جلب المتبرعين", error });
//     }
// };

// 2: عدد طالبي المساعدة
exports.requesterUsers = async (req, res) => {
    try {
        const snapshot = await db.collection('users').where('userType', '==', 'requester').get();
        res.status(200).json({ count: snapshot.size });
    } catch (error) {
        console.error("خطأ في جلب طالبي المساعدة:", error);
        res.status(500).json({ message: "خطأ في جلب طالبي المساعدة", error });
    }
};

// 3: عدد الحملات المالية الحالية
exports.financialCampaigns = async (req, res) => {
    try {
        const snapshot = await db.collection('fundraisers').get();
        res.status(200).json({ count: snapshot.size });
    } catch (error) {
        console.error("خطأ في جلب الحملات المالية:", error);
        res.status(500).json({ message: "خطأ في جلب الحملات المالية", error });
    }
};

// 4: عدد الطلبات غير المالية الحالية
exports.nonFinancialRequests = async (req, res) => {
    try {
        const snapshot = await db.collection('requests').get();
        res.status(200).json({ count: snapshot.size });
    } catch (error) {
        console.error("خطأ في جلب الطلبات غير المالية:", error);
        res.status(500).json({ message: "خطأ في جلب الطلبات غير المالية", error });
    }
};

// 5: عدد الحملات المالية المكتملة
exports.completedFinancialCampaigns = async (req, res) => {
    try {
        const snapshot = await db.collection('fundraisers').where('status', '==', 'completed').get();
        res.status(200).json({ count: snapshot.size });
    } catch (error) {
        console.error("خطأ في جلب الحملات المالية المكتملة:", error);
        res.status(500).json({ message: "خطأ في جلب الحملات المالية المكتملة", error });
    }
};

// 6: عدد الطلبات غير المالية المكتملة
exports.completedNonFinancialCampaigns = async (req, res) => {
    try {
        const snapshot = await db.collection('requests').where('status', '==', 'completed').get();
        res.status(200).json({ count: snapshot.size });
    } catch (error) {
        console.error("خطأ في جلب الطلبات غير المالية المكتملة:", error);
        res.status(500).json({ message: "خطأ في جلب الطلبات غير المالية المكتملة", error });
    }
};

// 7: عدد الحملات المالية المعلقة
exports.pendingFinancialCampaigns = async (req, res) => {
    try {
        const snapshot = await db.collection('fundraisers').where('status', '==', 'pending').get();
        res.status(200).json({ count: snapshot.size });
    } catch (error) {
        console.error("خطأ في جلب الحملات المالية المعلقة:", error);
        res.status(500).json({ message: "خطأ في جلب الحملات المالية المعلقة", error });
    }
};

// 8: عدد الطلبات غير المالية المعلقة
exports.pendingNonFinancialCampaigns = async (req, res) => {
    try {
        const snapshot = await db.collection('requests').where('status', '==', 'pending').get();
        res.status(200).json({ count: snapshot.size });
    } catch (error) {
        console.error("خطأ في جلب الطلبات غير المالية المعلقة:", error);
        res.status(500).json({ message: "خطأ في جلب الطلبات غير المالية المعلقة", error });
    }
};

// 9: مجموع التبرعات على الموقع
exports.totalDonations = async (req, res) => {
    try {
        const snapshot = await db.collection('donations').get();
        let total = 0;

        snapshot.forEach(doc => {
            const donation = doc.data();
            total += donation.amount || 0;
        });

        res.status(200).json({ totalDonations: total });
    } catch (error) {
        console.error("خطأ في جلب مجموع التبرعات:", error);
        res.status(500).json({ message: "خطأ في جلب مجموع التبرعات", error });
    }
};

// 10: أكبر المتبرعين
exports.topDonors = async (req, res) => {
    try {
        const snapshot = await db.collection('donations').get();
        const donorsDonations = {};

        snapshot.forEach(doc => {
            const donation = doc.data();
            if (donation.donorId) {
                donorsDonations[donation.donorId] = (donorsDonations[donation.donorId] || 0) + donation.amount;
            }
        });

        const topDonors = Object.entries(donorsDonations)
            .sort(([, a], [, b]) => b - a)
            .map(([donorId, total]) => ({ donorId, total }));

        res.status(200).json(topDonors);
    } catch (error) {
        console.error("خطأ في جلب أكبر المتبرعين:", error);
        res.status(500).json({ message: "خطأ في جلب أكبر المتبرعين", error });
    }
};
