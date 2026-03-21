import { useMemo } from 'react'
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

function MapCenter({ images }: { images: Image[] }) {
  const map = useMap()
  const validImages = images.filter((i) => i.latitude != null && i.longitude != null)
  if (validImages.length > 0) {
    const bounds = L.latLngBounds(validImages.map((i) => [i.latitude!, i.longitude!]))
    map.fitBounds(bounds, { padding: [50, 50] })
  }
  return null
}

export function ImageMapView({ images }: ImageMapViewProps) {
  const validImages = useMemo(() => images.filter((i) => i.latitude != null && i.longitude != null), [images])

  if (validImages.length === 0) {
    return (
      <div style={{ height: 400, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f5f5', borderRadius: 8 }}>
        No geo-tagged images to display on map
      </div>
    )
  }

  return (
    <div style={{ height: 400, borderRadius: 8, overflow: 'hidden' }}>
      <MapContainer center={[40.7128, -74.006]} zoom={10} style={{ height: '100%', width: '100%' }}>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; OpenStreetMap' />
        <MapCenter images={validImages} />
        {validImages.map((img) => (
          <Marker key={img.id} position={[img.latitude!, img.longitude!]}>
            <Popup>
              <div><strong>{img.fileName || img.filePath}</strong></div>
              {img.capturedAt && (
                <div>Taken: {new Date(img.capturedAt).toLocaleString()}</div>
              )}
              {(img.uploadedAt || img.timestamp) && (
                <div>
                  Uploaded:{' '}
                  {new Date((img.uploadedAt || img.timestamp) as string).toLocaleString()}
                </div>
              )}
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  )
}
