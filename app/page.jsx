"use client";

import { useEffect, useState } from "react";

const defaultCity = "Varanasi";

async function getCoordinates(city) {
  const encoded = encodeURIComponent(city.trim());
  const response = await fetch(
    `https://geocoding-api.open-meteo.com/v1/search?count=1&language=en&name=${encoded}`
  );
  if (!response.ok) {
    throw new Error("Geo lookup failed");
  }
  const data = await response.json();
  if (!data.results || data.results.length === 0) {
    throw new Error("CITY_NOT_FOUND");
  }
  const { latitude, longitude, name, country } = data.results[0];
  return { latitude, longitude, name, country };
}

async function getWeather({ latitude, longitude }) {
  const params = new URLSearchParams({
    latitude: latitude.toString(),
    longitude: longitude.toString(),
    current: "temperature_2m,relative_humidity_2m,precipitation",
    daily: "precipitation_probability_max",
    timezone: "auto"
  });
  const response = await fetch(
    `https://api.open-meteo.com/v1/forecast?${params.toString()}`
  );
  if (!response.ok) {
    throw new Error("Weather fetch failed");
  }
  return response.json();
}

function getSeasonAdvice(tempC, rainChance) {
  if (rainChance >= 70) {
    return "🌧️ कृपया छाता साथ रखें, बारिश की अच्छी संभावना है।";
  }
  if (tempC >= 34) {
    return "🔥 तेज़ गर्मी है, हल्के कपड़े पहनें और पर्याप्त जल पीते रहें।";
  }
  if (tempC >= 24) {
    return "☀️ मौसम सुहावना है, खुले में घूमने का आनंद लें।";
  }
  if (tempC >= 16) {
    return "🍂 हल्की ठंड है, शायद हल्की जैकेट काम आएगी।";
  }
  return "❄️ ठंडी हवा चल रही है, गरम कपड़े पहनना बेहतर रहेगा।";
}

export default function HomePage() {
  const [city, setCity] = useState(defaultCity);
  const [displayName, setDisplayName] = useState("");
  const [weather, setWeather] = useState(null);
  const [rainChance, setRainChance] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    handleFetch(defaultCity);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFetch = async (inputCity) => {
    if (!inputCity.trim()) {
      setError("कृपया शहर का नाम दर्ज करें।");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const coordinates = await getCoordinates(inputCity);
      const weatherData = await getWeather(coordinates);
      const current = weatherData.current;
      const daily = weatherData.daily;
      const chance =
        daily?.precipitation_probability_max?.[0] ??
        current?.precipitation_probability ??
        0;
      setWeather({
        temperature: current?.temperature_2m ?? null,
        humidity: current?.relative_humidity_2m ?? null,
        precipitation: current?.precipitation ?? null
      });
      setDisplayName(
        coordinates.country
          ? `${coordinates.name}, ${coordinates.country}`
          : coordinates.name
      );
      setRainChance(chance);
    } catch (err) {
      if (err.message === "CITY_NOT_FOUND") {
        setError("क्षमा करें, शहर नहीं मिला। कृपया सही नाम दर्ज करें।");
      } else {
        setError("मौसम जानकारी प्राप्त करने में समस्या हुई। पुनः प्रयास करें।");
      }
      setWeather(null);
      setDisplayName("");
      setRainChance(null);
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = (event) => {
    event.preventDefault();
    handleFetch(city);
  };

  const advice =
    weather && typeof weather.temperature === "number"
      ? getSeasonAdvice(weather.temperature, rainChance ?? 0)
      : "";

  return (
    <main className="page">
      <header className="header">
        <span className="icon" role="img" aria-label="Om and Trishul icon">
          🕉️🔱
        </span>
        <h1>Jay Bhole Weather AI</h1>
      </header>
      <section className="card">
        <form className="form" onSubmit={onSubmit}>
          <label htmlFor="city-input" className="visually-hidden">
            शहर का नाम दर्ज करें
          </label>
          <input
            id="city-input"
            type="text"
            value={city}
            placeholder="शहर का नाम..."
            onChange={(event) => setCity(event.target.value)}
            autoComplete="off"
          />
          <button type="submit" disabled={loading}>
            {loading ? "प्रतीक्षा करें..." : "Get Weather"}
          </button>
        </form>
        <div className="results">
          {error && <p className="error">{error}</p>}
          {!error && loading && <p className="status">मौसम जानकारी ला रहे हैं...</p>}
          {!loading && weather && (
            <>
              <h2 className="city">{displayName}</h2>
              <div className="stats">
                <div className="stat">
                  <span className="label">तापमान</span>
                  <span className="value">
                    {weather.temperature != null
                      ? `${weather.temperature.toFixed(1)}°C`
                      : "--"}
                  </span>
                </div>
                <div className="stat">
                  <span className="label">आर्द्रता</span>
                  <span className="value">
                    {weather.humidity != null
                      ? `${Math.round(weather.humidity)}%`
                      : "--"}
                  </span>
                </div>
                <div className="stat">
                  <span className="label">बारिश की संभावना</span>
                  <span className="value">
                    {rainChance != null ? `${Math.round(rainChance)}%` : "--"}
                  </span>
                </div>
              </div>
              <p className="advice">{advice}</p>
            </>
          )}
          {!loading && !weather && !error && (
            <p className="status">कृपया शहर चुनें और मौसम देखें।</p>
          )}
        </div>
      </section>
      <footer className="footer">
        <p>मौसम डेटा Open-Meteo द्वारा प्रदत्त।</p>
      </footer>
    </main>
  );
}
