import { useMemo, useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import type { Image } from '../../types'

L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
})

interface ImageMapViewProps {
  images: Image[]
}

/** Leaflet must recalc size after the container becomes visible (e.g. Ant Tabs). */
function MapSizeSync() {
  const map = useMap()
  useEffect(() => {
    const fix = () => {
      map.invalidateSize({ animate: false })
    }
    fix()
    const raf = requestAnimationFrame(fix)
    const t1 = window.setTimeout(fix, 100)
    const t2 = window.setTimeout(fix, 400)
    window.addEventListener('resize', fix)
    return () => {
      cancelAnimationFrame(raf)
      window.clearTimeout(t1)
      window.clearTimeout(t2)
      window.removeEventListener('resize', fix)
    }
  }, [map])
  return null
}

function MapCenter({ images }: { images: Image[] }) {
  const map = useMap()
  useEffect(() => {
    if (images.length === 0) return
    const bounds = L.latLngBounds(images.map((i) => [i.latitude!, i.longitude!]))
    map.fitBounds(bounds, { padding: [50, 50] })
    map.invalidateSize({ animate: false })
  }, [map, images])
  return null
}

export function ImageMapView({ images }: ImageMapViewProps) {
  const validImages = useMemo(() => images.filter((i) => i.latitude != null && i.longitude != null), [images])

  if (validImages.length === 0) {
    return (
      <div
        className="rounded-xl border border-[var(--border)] flex items-center justify-center text-[var(--text-secondary)] text-xs sm:text-sm px-3 sm:px-4 text-center"
        style={{ minHeight: 'min(400px, 55vh)', background: 'var(--surface-muted)' }}
      >
        No geo-tagged images to display on the map. GPS coordinates from EXIF are required.
      </div>
    )
  }

  return (
    <div
      className="rounded-xl overflow-hidden border border-[var(--border)] h-[min(400px,55vh)] min-h-[240px] sm:min-h-[320px] sm:h-[400px]"
      style={{ touchAction: 'manipulation' }}
    >
      <MapContainer center={[40.7128, -74.006]} zoom={10} style={{ height: '100%', width: '100%' }} scrollWheelZoom>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapSizeSync />
        <MapCenter images={validImages} />
        {validImages.map((img) => (
          <Marker key={img.id} position={[img.latitude!, img.longitude!]}>
            <Popup>
              <div>
                <strong>{img.fileName || img.filePath}</strong>
              </div>
              {img.capturedAt && <div>Taken: {new Date(img.capturedAt).toLocaleString()}</div>}
              {(img.uploadedAt || img.timestamp) && (
                <div>
                  Uploaded: {new Date((img.uploadedAt || img.timestamp) as string).toLocaleString()}
                </div>
              )}
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  )
}
