const axios = require('axios');

/**
 * Strip common political/legal suffixes that APIs append to country names.
 * e.g. "Palestine, State of" → "Palestine"
 *      "Iran, Islamic Republic of" → "Iran"
 *      "Korea, Republic of" → "Korea"
 */
function cleanCountryName(country) {
    if (!country) return '';
    return country
        .replace(/,?\s*(State|Republic|Kingdom|Emirate|Province|Territory|Region|Islamic Republic|Democratic Republic|Peoples Republic|People's Republic)\s+of\b.*/i, '')
        .trim();
}

async function geocodeWithBigDataCloud(lat, lng) {
    try {
        const url = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`;
        const response = await axios.get(url, { timeout: 8000 });

        if (response.data) {
            const data = response.data;
            const city = data.city || data.locality || data.principalSubdivision || '';
            const country = cleanCountryName(data.countryName || '');
            
            if (city && country) return `${city}, ${country}`;
            return city || country || null;
        }
        return null;
    } catch (error) {
        console.warn('BigDataCloud geocoding failed:', error.message);
        return null;
    }
}

async function geocodeWithOpenStreetMap(lat, lng) {
    try {
        const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1&accept-language=en`;
        const response = await axios.get(url, {
            timeout: 8000,
            headers: { 'User-Agent': 'SolidarityApp/1.0' }
        });

        if (response.data?.address) {
            const addr = response.data.address;
            const city = addr.city || addr.town || addr.village || addr.county || '';
            const country = addr.country || '';
            
            const cleanedCountry = cleanCountryName(country);
            if (city && cleanedCountry) return `${city}, ${cleanedCountry}`;
            return city || cleanedCountry || null;
        }
        return null;
    } catch (error) {
        console.warn('OpenStreetMap geocoding failed:', error.message);
        return null;
    }
}

/**
 * Parse PostgreSQL GEOGRAPHY(POINT) or various coordinate formats
 * Returns { latitude, longitude } or null
 */
function parseCoordinates(location) {
    if (!location) return null;

    try {
        let latitude, longitude;

        // 1. PostgreSQL GEOGRAPHY(POINT) format: { type: 'Point', coordinates: [lng, lat] }
        if (typeof location === 'object' && location.type === 'Point' && Array.isArray(location.coordinates)) {
            longitude = parseFloat(location.coordinates[0]);
            latitude = parseFloat(location.coordinates[1]);
        }
        // 2. Sequelize raw GEOGRAPHY string: 'POINT(lng lat)'
        else if (typeof location === 'string' && location.startsWith('POINT')) {
            const match = location.match(/POINT\(([^ ]+) ([^)]+)\)/i);
            if (match) {
                longitude = parseFloat(match[1]);
                latitude = parseFloat(match[2]);
            }
        }
        // 3. WKT format variations
        else if (typeof location === 'string' && location.includes(',')) {
            // Try "lat,lng" format
            const parts = location.split(',').map(p => parseFloat(p.trim()));
            if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
                latitude = parts[0];
                longitude = parts[1];
            }
        }
        // 4. Object with x/y properties (some ORMs use this)
        else if (typeof location === 'object' && location.x !== undefined && location.y !== undefined) {
            longitude = parseFloat(location.x);
            latitude = parseFloat(location.y);
        }
        // 5. Object with lat/lng properties
        else if (typeof location === 'object' && location.latitude !== undefined && location.longitude !== undefined) {
            latitude = parseFloat(location.latitude);
            longitude = parseFloat(location.longitude);
        }
        // 6. Legacy Firebase GeoPoint format: { _latitude, _longitude }
        else if (typeof location === 'object' && location._latitude !== undefined && location._longitude !== undefined) {
            latitude = parseFloat(location._latitude);
            longitude = parseFloat(location._longitude);
        }
        // 7. Array format: [lng, lat] or [lat, lng]
        else if (Array.isArray(location) && location.length >= 2) {
            // Assume [lng, lat] (GeoJSON standard) but check values
            const first = parseFloat(location[0]);
            const second = parseFloat(location[1]);
            
            // If first value is > 90, it's definitely longitude
            if (Math.abs(first) > 90) {
                longitude = first;
                latitude = second;
            } else {
                // Ambiguous, but likely [lat, lng] if both are small
                latitude = first;
                longitude = second;
            }
        }

        // Validate parsed coordinates
        if (latitude === undefined || longitude === undefined || 
            isNaN(latitude) || isNaN(longitude)) {
            return null;
        }

        // Sanity check: latitude must be -90 to 90, longitude -180 to 180
        if (Math.abs(latitude) > 90 || Math.abs(longitude) > 180) {
            console.warn('Coordinates out of range:', latitude, longitude);
            return null;
        }

        return { latitude, longitude };
    } catch (error) {
        console.error('Error parsing coordinates:', error);
        return null;
    }
}

/**
 * Get human-readable location from coordinates
 * Tries BigDataCloud first, falls back to OpenStreetMap
 */
async function getLocationFromCoordinates(location) {
    const coords = parseCoordinates(location);
    
    if (!coords) {
        return 'Unknown Location';
    }

    const { latitude, longitude } = coords;

    try {
        // TRY BigDataCloud FIRST (free, no API key needed)
        let locationString = await geocodeWithBigDataCloud(latitude, longitude);

        // If that fails, try OpenStreetMap
        if (!locationString) {
            locationString = await geocodeWithOpenStreetMap(latitude, longitude);
        }

        // Final fallback: show coordinates formatted
        if (!locationString) {
            locationString = `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
        }

        return locationString;

    } catch (error) {
        console.error('Error getting location:', error.message);
        return `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
    }
}

/**
 * NEW: Get detailed location components (city, country, region)
 * Useful when you need separate fields instead of a single string
 */
async function getLocationDetails(location) {
    const coords = parseCoordinates(location);
    
    if (!coords) {
        return { city: null, country: null, region: null, full: 'Unknown Location' };
    }

    const { latitude, longitude } = coords;

    try {
        // Try BigDataCloud first
        const url = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`;
        const response = await axios.get(url, { timeout: 8000 });

        if (response.data) {
            const data = response.data;
            return {
                city: data.city || data.locality || data.principalSubdivision || null,
                country: data.countryName || null,
                region: data.principalSubdivision || data.district || null,
                full: `${data.city || data.locality || ''}, ${data.countryName || ''}`.replace(/^,\s*/, '').replace(/,\s*$/, '') || 'Unknown'
            };
        }
    } catch (error) {
        console.warn('BigDataCloud detailed geocoding failed:', error.message);
    }

    // Fallback to OpenStreetMap
    try {
        const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1&accept-language=en`;
        const response = await axios.get(url, {
            timeout: 8000,
            headers: { 'User-Agent': 'SolidarityApp/1.0' }
        });

        if (response.data?.address) {
            const addr = response.data.address;
            return {
                city: addr.city || addr.town || addr.village || addr.county || null,
                country: addr.country || null,
                region: addr.state || addr.region || null,
                full: `${addr.city || addr.town || ''}, ${addr.country || ''}`.replace(/^,\s*/, '').replace(/,\s*$/, '') || 'Unknown'
            };
        }
    } catch (error) {
        console.warn('OpenStreetMap detailed geocoding failed:', error.message);
    }

    // Final fallback
    return {
        city: null,
        country: null,
        region: null,
        full: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`
    };
}

module.exports = {
    geocodeWithBigDataCloud,
    geocodeWithOpenStreetMap,
    parseCoordinates,
    getLocationFromCoordinates,
    getLocationDetails
};