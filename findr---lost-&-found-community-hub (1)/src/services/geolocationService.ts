import { LocationData } from '../types';

export interface GeolocationResult {
  location: LocationData;
  isRealTime: boolean;
  status: 'success' | 'denied' | 'timeout' | 'unavailable' | 'unsupported';
  errorMessage?: string;
}

/**
 * Official default & fallback coordinates: New Delhi, India
 * Latitude: 28.6139, Longitude: 77.2090
 */
export const DEFAULT_FALLBACK_LOCATION: LocationData = {
  name: 'New Delhi, India',
  lat: 28.6139,
  lng: 77.2090,
  address: 'New Delhi, India',
  landmark: 'New Delhi'
};

/**
 * Attempts to fetch a human-readable neighborhood/city name via reverse geocoding
 * with a strict 2.5-second timeout so it never blocks the user.
 */
async function reverseGeocodeCoordinates(lat: number, lng: number): Promise<string | null> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 2500);

  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=14&addressdetails=1`;
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Findr-Lost-And-Found-App/1.0'
      }
    });

    clearTimeout(timeoutId);

    if (!response.ok) return null;
    const data = await response.json();

    if (data && data.address) {
      const parts = [
        data.address.suburb || data.address.neighbourhood || data.address.residential,
        data.address.city || data.address.town || data.address.municipality || data.address.state_district,
        data.address.state,
        data.address.country
      ].filter(Boolean);

      if (parts.length > 0) {
        return parts.slice(0, 2).join(', ');
      }
      if (data.display_name) {
        return data.display_name.split(',').slice(0, 2).join(',').trim();
      }
    }
    return null;
  } catch {
    clearTimeout(timeoutId);
    return null;
  }
}

/**
 * Asynchronously requests the user's real-time position using navigator.geolocation.getCurrentPosition().
 * If permission is denied, times out, or is unsupported, it defaults seamlessly back to New Delhi, India.
 */
export async function determineUserGeolocation(): Promise<GeolocationResult> {
  // Check if browser supports geolocation API
  if (typeof window === 'undefined' || !navigator.geolocation) {
    console.warn('[Geolocation] Geolocation API is unsupported in this browser. Defaulting to New Delhi, India.');
    return {
      location: { ...DEFAULT_FALLBACK_LOCATION },
      isRealTime: false,
      status: 'unsupported',
      errorMessage: 'Geolocation is not supported by your browser.'
    };
  }

  return new Promise<GeolocationResult>((resolve) => {
    // Failsafe timeout in case browser hangs without triggering error callback
    let hasResolved = false;
    const failsafeTimer = setTimeout(() => {
      if (!hasResolved) {
        hasResolved = true;
        console.warn('[Geolocation] Request exceeded timeout boundary. Defaulting to New Delhi, India.');
        resolve({
          location: { ...DEFAULT_FALLBACK_LOCATION },
          isRealTime: false,
          status: 'timeout',
          errorMessage: 'Geolocation request timed out. Using default New Delhi coordinates.'
        });
      }
    }, 10000);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        if (hasResolved) return;
        hasResolved = true;
        clearTimeout(failsafeTimer);

        const lat = Number(position.coords.latitude.toFixed(6));
        const lng = Number(position.coords.longitude.toFixed(6));
        const accuracy = Math.round(position.coords.accuracy);

        console.log(`[Geolocation] Successfully acquired user position: (${lat}, ${lng}) with accuracy ~${accuracy}m`);

        // Optional quick reverse geocode for a friendly location name
        let locationName = 'Current Location';
        try {
          const friendlyName = await reverseGeocodeCoordinates(lat, lng);
          if (friendlyName) {
            locationName = friendlyName;
          }
        } catch {
          // Keep 'Current Location'
        }

        resolve({
          location: {
            name: locationName,
            lat,
            lng,
            address: `GPS (${lat.toFixed(4)}, ${lng.toFixed(4)}) · ±${accuracy}m`
          },
          isRealTime: true,
          status: 'success'
        });
      },
      (error) => {
        if (hasResolved) return;
        hasResolved = true;
        clearTimeout(failsafeTimer);

        let status: 'denied' | 'timeout' | 'unavailable' = 'unavailable';
        let errorMessage = 'Unable to determine user location.';

        switch (error.code) {
          case error.PERMISSION_DENIED:
            status = 'denied';
            errorMessage = 'Location access permission was denied by user. Falling back to New Delhi.';
            break;
          case error.TIMEOUT:
            status = 'timeout';
            errorMessage = 'Location request timed out. Falling back to New Delhi.';
            break;
          case error.POSITION_UNAVAILABLE:
            status = 'unavailable';
            errorMessage = 'Location information is unavailable from network/GPS. Falling back to New Delhi.';
            break;
        }

        console.warn(`[Geolocation] ${errorMessage} (${error.message || 'code ' + error.code})`);

        resolve({
          location: { ...DEFAULT_FALLBACK_LOCATION },
          isRealTime: false,
          status,
          errorMessage
        });
      },
      {
        enableHighAccuracy: true,
        timeout: 8000,
        maximumAge: 60000 // Cache for up to 1 minute
      }
    );
  });
}
