import { useEffect, useRef } from 'react';
import L from 'leaflet';
import { Item, LocationData } from '../types';

interface InteractiveMapProps {
  items?: Item[];
  center?: [number, number];
  zoom?: number;
  userLocation?: { lat: number; lng: number };
  onSelectItem?: (item: Item) => void;
  // Picker mode props
  isPickerMode?: boolean;
  selectedLocation?: LocationData | null;
  onLocationSelect?: (loc: { lat: number; lng: number }) => void;
  heightClass?: string;
  showRadiusCircle?: boolean;
  radiusKm?: number;
}

export function InteractiveMap({
  items = [],
  center = [28.6139, 77.2090],
  zoom = 14,
  userLocation,
  onSelectItem,
  isPickerMode = false,
  selectedLocation,
  onLocationSelect,
  heightClass = 'h-[500px]',
  showRadiusCircle = false,
  radiusKm = 2
}: InteractiveMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const pickerMarkerRef = useRef<L.Marker | null>(null);
  const radiusCircleRef = useRef<L.Circle | null>(null);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center,
        zoom,
        zoomControl: true,
        scrollWheelZoom: true,
      });

      // Standard OSM Tile layer
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(map);

      const markersLayer = L.layerGroup().addTo(map);
      markersLayerRef.current = markersLayer;
      mapInstanceRef.current = map;

      // Handle click in picker mode
      map.on('click', (e: L.LeafletMouseEvent) => {
        if (isPickerMode && onLocationSelect) {
          onLocationSelect({ lat: e.latlng.lat, lng: e.latlng.lng });
        }
      });
    }

    return () => {
      // Clean up map instance on unmount
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update center when center prop changes
  useEffect(() => {
    if (mapInstanceRef.current && center) {
      mapInstanceRef.current.setView(center, zoom, { animate: true });
    }
  }, [center[0], center[1], zoom]);

  // Handle items markers
  useEffect(() => {
    const map = mapInstanceRef.current;
    const layer = markersLayerRef.current;
    if (!map || !layer) return;

    layer.clearLayers();

    // User location marker
    if (userLocation) {
      const userIcon = L.divIcon({
        className: 'custom-user-marker',
        html: `
          <div class="relative flex items-center justify-center">
            <span class="animate-ping absolute inline-flex h-7 w-7 rounded-full bg-blue-400 opacity-60"></span>
            <div class="h-4 w-4 rounded-full bg-blue-600 border-2 border-white shadow-md"></div>
          </div>
        `,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      });

      const userMarker = L.marker([userLocation.lat, userLocation.lng], { icon: userIcon });
      userMarker.bindTooltip('Your Location', { direction: 'top', offset: [0, -10] });
      layer.addLayer(userMarker);

      // Radius circle around user
      if (showRadiusCircle) {
        if (radiusCircleRef.current) {
          radiusCircleRef.current.remove();
        }
        radiusCircleRef.current = L.circle([userLocation.lat, userLocation.lng], {
          radius: radiusKm * 1000,
          color: '#3B82F6',
          fillColor: '#3B82F6',
          fillOpacity: 0.08,
          weight: 1.5,
          dashArray: '4, 4'
        }).addTo(map);
      }
    }

    // Add items markers
    items.forEach((item) => {
      const isLost = item.type === 'lost';
      const bgColor = isLost ? 'bg-amber-600' : 'bg-emerald-600';
      const ringColor = isLost ? 'ring-amber-200' : 'ring-emerald-200';
      const label = isLost ? 'LOST' : 'FOUND';

      const iconHtml = `
        <div class="relative group cursor-pointer">
          <div class="flex items-center gap-1.5 px-2 py-1 ${bgColor} text-white text-[11px] font-semibold tracking-wider rounded-md shadow-lg ring-2 ${ringColor} transition-transform hover:scale-110">
            <span>${label}</span>
          </div>
          <div class="w-2 h-2 ${bgColor} rotate-45 mx-auto -mt-1 shadow-sm"></div>
        </div>
      `;

      const customIcon = L.divIcon({
        className: 'custom-item-marker',
        html: iconHtml,
        iconSize: [60, 32],
        iconAnchor: [30, 32],
        popupAnchor: [0, -32],
      });

      const marker = L.marker([item.location.lat, item.location.lng], { icon: customIcon });

      // Clean popup markup
      const popupContainer = document.createElement('div');
      popupContainer.className = 'p-1 text-neutral-800 dark:text-neutral-100 text-left';
      popupContainer.innerHTML = `
        <div class="flex items-start gap-2.5">
          ${item.imageUrl ? `<img src="${item.imageUrl}" class="w-14 h-14 rounded-lg object-cover shrink-0 border border-neutral-200 dark:border-neutral-700" alt="${item.title}" />` : ''}
          <div class="overflow-hidden">
            <div class="text-[11px] font-semibold ${isLost ? 'text-amber-700 dark:text-amber-400' : 'text-emerald-700 dark:text-emerald-400'} uppercase tracking-wider">
              ${isLost ? 'Lost Item' : 'Found Item'}
            </div>
            <h4 class="text-xs font-bold text-neutral-900 dark:text-neutral-100 leading-tight truncate mt-0.5" title="${item.title}">
              ${item.title}
            </h4>
            <p class="text-[11px] text-neutral-500 dark:text-neutral-400 truncate mt-0.5">
              ${item.location.name}
            </p>
          </div>
        </div>
        <div class="mt-2.5 pt-2 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
          <span class="text-[11px] text-neutral-400 dark:text-neutral-500">${new Date(item.date).toLocaleDateString()}</span>
          <button id="view-item-${item.id}" class="text-xs font-semibold px-2 py-1 bg-neutral-900 dark:bg-white text-white dark:text-neutral-950 rounded hover:bg-neutral-800 dark:hover:bg-neutral-200 transition cursor-pointer">
            View Details
          </button>
        </div>
      `;

      marker.bindPopup(popupContainer);

      marker.on('popupopen', () => {
        const btn = document.getElementById(`view-item-${item.id}`);
        if (btn && onSelectItem) {
          btn.onclick = () => {
            onSelectItem(item);
          };
        }
      });

      layer.addLayer(marker);
    });
  }, [items, userLocation, showRadiusCircle, radiusKm, onSelectItem]);

  // Handle Location Picker marker
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !isPickerMode) return;

    if (selectedLocation) {
      if (pickerMarkerRef.current) {
        pickerMarkerRef.current.setLatLng([selectedLocation.lat, selectedLocation.lng]);
      } else {
        const pickerIcon = L.divIcon({
          className: 'picker-pin-marker',
          html: `
            <div class="flex flex-col items-center">
              <div class="w-7 h-7 rounded-full bg-rose-600 text-white flex items-center justify-center shadow-xl ring-4 ring-rose-200 animate-bounce">
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
            </div>
          `,
          iconSize: [28, 36],
          iconAnchor: [14, 36],
        });

        const newMarker = L.marker([selectedLocation.lat, selectedLocation.lng], {
          icon: pickerIcon,
          draggable: true
        }).addTo(map);

        newMarker.on('dragend', (e) => {
          const latlng = e.target.getLatLng();
          if (onLocationSelect) {
            onLocationSelect({ lat: latlng.lat, lng: latlng.lng });
          }
        });

        pickerMarkerRef.current = newMarker;
      }
    } else if (pickerMarkerRef.current) {
      pickerMarkerRef.current.remove();
      pickerMarkerRef.current = null;
    }
  }, [isPickerMode, selectedLocation, onLocationSelect]);

  return (
    <div className={`relative w-full ${heightClass} rounded-xl overflow-hidden border border-neutral-200 dark:border-neutral-800 shadow-sm bg-neutral-100 dark:bg-neutral-900`}>
      <div ref={mapContainerRef} className="w-full h-full" />
      {isPickerMode && (
        <div className="absolute top-3 left-3 z-[400] bg-white/95 dark:bg-neutral-900/95 backdrop-blur px-3 py-1.5 rounded-md border border-neutral-200 dark:border-neutral-800 text-xs font-medium text-neutral-700 dark:text-neutral-300 shadow-sm flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
          <span>Click anywhere on the map or drag the pin to set the exact spot</span>
        </div>
      )}
    </div>
  );
}
