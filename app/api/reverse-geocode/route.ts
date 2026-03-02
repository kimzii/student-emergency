import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const lat = searchParams.get("lat");
  const lon = searchParams.get("lon");

  if (!lat || !lon) {
    return NextResponse.json({ error: "Missing lat or lon" }, { status: 400 });
  }
  // Simple in-memory cache: { "lat,lon": result }
  const locationCache: { [key: string]: any } = {};

  const cacheKey = `${lat},${lon}`;
  if (locationCache[cacheKey]) {
    return NextResponse.json(locationCache[cacheKey]);
  }

  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`;
    const response = await fetch(url, {
      headers: {
        "User-Agent": "student-emergency-app/1.0",
        "Accept-Language": "en",
      },
    });
    if (!response.ok) {
      const text = await response.text();
      console.error("Nominatim fetch failed:", response.status, text);
      return NextResponse.json(
        { error: `Failed to fetch location: ${response.status} ${text}` },
        { status: 500 },
      );
    }
    const data = await response.json();
    locationCache[cacheKey] = data;
    return NextResponse.json(data);
  } catch (error) {
    console.error("Reverse geocode server error:", error);
    return NextResponse.json(
      { error: `Server error: ${error}` },
      { status: 500 },
    );
  }
}
