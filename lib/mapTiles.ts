// The basemap under every Leaflet map in the panel, kept in one place.
//
// CARTO's basemaps (basemaps.cartocdn.com) now refuse requests without an API
// key — every tile came back stamped "API KEY REQUIRED" and the maps showed
// markers on a blank grid. OpenStreetMap's standard tiles need no key. Their
// usage policy asks for visible credit, so each map shows a small attribution.
export const TILE_URL = "https://tile.openstreetmap.org/{z}/{x}/{y}.png";
export const TILE_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a>';

type AddTo = { addTo: (map: unknown) => unknown };
type LeafletLike = {
  tileLayer: (url: string, options: Record<string, unknown>) => AddTo;
  control: { attribution: (options: Record<string, unknown>) => AddTo };
};

// Lays the basemap and its credit onto a map. Maps are created with
// attributionControl: false, so the credit is added here, where its corner can
// be chosen to stay clear of each map's own overlays.
export function addBaseTiles(
  L: LeafletLike,
  map: unknown,
  attributionPosition: "bottomright" | "bottomleft" | "topright" | "topleft" = "bottomright"
): void {
  L.tileLayer(TILE_URL, { maxZoom: 19, attribution: TILE_ATTRIBUTION }).addTo(map);
  L.control.attribution({ prefix: false, position: attributionPosition }).addTo(map);
}
