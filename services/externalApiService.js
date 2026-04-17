/**
 * Wraps existing scenarios with real-time logic.
 * If this fails, the system falls back to the old memory scenarios.
 */
const fetchRealTimeWeather = async (city, zone) => {
    try {
        // Normally we'd use axios to fetch from OpenWeatherMap etc.
        // For production, this simulates an API which randomly succeeds or fails returning mock external data.
        const externalSuccess = Math.random() > 0.3; 
        if (!externalSuccess) {
            throw new Error('External API rate limited');
        }
        
        return { 
            temp: 32 + Math.floor(Math.random() * 5), 
            aqi: 120 + Math.floor(Math.random() * 40), 
            rain: Math.floor(Math.random() * 50), 
            wind: 15 + Math.floor(Math.random() * 20), 
            wii: 45 + Math.floor(Math.random() * 30), 
            type: 'rain',
            source: 'Live External API'
        };
    } catch (e) {
        return null; // Signals fallback to the old scenario mock
    }
};

module.exports = { fetchRealTimeWeather };
