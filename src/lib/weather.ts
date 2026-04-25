"use client";

import { useEffect, useState } from "react";

// 福岡（博多区）座標
const LAT = 33.5904;
const LON = 130.4017;

export type WeatherDay = {
  date: string;
  weatherCode: number;
  tempMax: number;
  tempMin: number;
  precipProb: number;
  emoji: string;
  label: string;
};

export type WeatherForecast = {
  today: WeatherDay;
  tomorrow: WeatherDay;
};

const CACHE_KEY = "my-shift:weather-cache-v2";
const CACHE_TTL_MS = 60 * 60 * 1000; // 1時間

function emojiFromCode(code: number): { emoji: string; label: string } {
  if (code === 0) return { emoji: "☀️", label: "晴れ" };
  if (code <= 2) return { emoji: "🌤️", label: "晴れ時々曇り" };
  if (code === 3) return { emoji: "☁️", label: "曇り" };
  if (code === 45 || code === 48) return { emoji: "🌫️", label: "霧" };
  if (code >= 51 && code <= 57) return { emoji: "🌦️", label: "霧雨" };
  if (code >= 61 && code <= 65) return { emoji: "🌧️", label: "雨" };
  if (code === 66 || code === 67) return { emoji: "🌨️", label: "みぞれ" };
  if (code >= 71 && code <= 77) return { emoji: "❄️", label: "雪" };
  if (code >= 80 && code <= 82) return { emoji: "🌦️", label: "にわか雨" };
  if (code >= 85 && code <= 86) return { emoji: "🌨️", label: "にわか雪" };
  if (code >= 95) return { emoji: "⛈️", label: "雷雨" };
  return { emoji: "🌤️", label: "" };
}

function buildDay(
  data: {
    daily: {
      time: string[];
      weather_code: number[];
      temperature_2m_max: number[];
      temperature_2m_min: number[];
      precipitation_probability_max: number[];
    };
  },
  i: number
): WeatherDay {
  const code = data.daily.weather_code[i];
  const { emoji, label } = emojiFromCode(code);
  return {
    date: data.daily.time[i],
    weatherCode: code,
    tempMax: data.daily.temperature_2m_max[i],
    tempMin: data.daily.temperature_2m_min[i],
    precipProb: data.daily.precipitation_probability_max[i] ?? 0,
    emoji,
    label,
  };
}

export function useWeatherForecast(): {
  forecast: WeatherForecast | null;
  loading: boolean;
  error: string | null;
} {
  const [forecast, setForecast] = useState<WeatherForecast | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        if (typeof window !== "undefined") {
          const cached = localStorage.getItem(CACHE_KEY);
          if (cached) {
            const data = JSON.parse(cached) as {
              ts: number;
              forecast: WeatherForecast;
            };
            if (Date.now() - data.ts < CACHE_TTL_MS) {
              setForecast(data.forecast);
              setLoading(false);
              return;
            }
          }
        }

        const res = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${LAT}&longitude=${LON}&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=Asia%2FTokyo&forecast_days=2`
        );
        if (!res.ok) throw new Error("天気取得失敗");
        const data = await res.json();

        const result: WeatherForecast = {
          today: buildDay(data, 0),
          tomorrow: buildDay(data, 1),
        };

        setForecast(result);
        if (typeof window !== "undefined") {
          localStorage.setItem(
            CACHE_KEY,
            JSON.stringify({ ts: Date.now(), forecast: result })
          );
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "天気取得エラー");
      } finally {
        setLoading(false);
      }
    };

    fetchWeather();
  }, []);

  return { forecast, loading, error };
}
