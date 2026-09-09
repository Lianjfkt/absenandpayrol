/**
 * Menghitung jarak antara 2 titik koordinat (latitude, longitude)
 * menggunakan rumus Haversine (dalam satuan meter)
 */
export function hitungJarakMeter(lat1, lon1, lat2, lon2) {
  if (!lat1 || !lon1 || !lat2 || !lon2) return Infinity

  const R = 6371e3 // Radius bumi dalam meter
  const radLat1 = (lat1 * Math.PI) / 180
  const radLat2 = (lat2 * Math.PI) / 180
  const deltaLat = ((lat2 - lat1) * Math.PI) / 180
  const deltaLon = ((lon2 - lon1) * Math.PI) / 180

  const a =
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(radLat1) *
      Math.cos(radLat2) *
      Math.sin(deltaLon / 2) *
      Math.sin(deltaLon / 2)

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  const jarak = R * c

  return Math.round(jarak * 10) / 10 // Pembulatan 1 desimal (meter)
}

/**
 * Validasi apakah posisi karyawan berada dalam radius geofence kedai
 */
export function isDalamRadius(userLat, userLng, targetLat, targetLng, radiusMeter = 10) {
  const jarak = hitungJarakMeter(userLat, userLng, targetLat, targetLng)
  return {
    isInside: jarak <= radiusMeter,
    jarakMeter: jarak,
  }
}
