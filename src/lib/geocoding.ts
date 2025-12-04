
export async function geocodeAddress(address: string): Promise<{ lat: number; lng: number } | null> {
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_KEY;
    if (!apiKey) {
        console.error("Google Maps API key is missing");
        return null;
    }

    try {
        const response = await fetch(
            `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}`
        );
        const data = await response.json();

        if (data.status === "OK" && data.results.length > 0) {
            const location = data.results[0].geometry.location;
            return { lat: location.lat, lng: location.lng };
        } else {
            console.error("Geocoding failed:", data.status);
            return null;
        }
    } catch (error) {
        console.error("Error geocoding address:", error);
        return null;
    }
}
