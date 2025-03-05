import React, { useState, useEffect } from "react";
import axios from "axios";
import { Line, Pie, Radar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  RadialLinearScale,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  RadialLinearScale
);

const Weather = () => {
  const [city, setCity] = useState("");
  const [weather, setWeather] = useState(null);
  const [forecast, setForecast] = useState(null);
  const [error, setError] = useState("");

  const API_KEY = "6be22578aa5dad675e4eee8caf2e1e5f";

  const fetchWeather = async () => {
    if (!city) {
      setError("Please enter a city name.");
      return;
    }

    try {
      const weatherResponse = await axios.get(
        `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${API_KEY}&units=metric`
      );
      setWeather(weatherResponse.data);

      const forecastResponse = await axios.get(
        `https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${API_KEY}&units=metric`
      );
      setForecast(forecastResponse.data);

      setError("");
    } catch (error) {
      setError("City not found! Try another one.");
      setWeather(null);
      setForecast(null);
    }
  };

  useEffect(() => {
    if (city) {
      fetchWeather();
    }
  }, [city]);

  const chartData = {
    labels: forecast
      ? forecast.list.slice(0, 5).map((item) => new Date(item.dt * 1000).toLocaleTimeString())
      : [],
    datasets: [
      {
        label: "Temperature (°C)",
        data: forecast ? forecast.list.slice(0, 5).map((item) => item.main.temp) : [],
        borderColor: "rgba(54, 162, 235, 1)",
        backgroundColor: "rgba(54, 162, 235, 0.2)",
        fill: true,
      },
    ],
  };

  const pieData = {
    labels: ["Clear", "Clouds", "Rain", "Snow", "Other"],
    datasets: [
      {
        data: [
          forecast ? forecast.list.filter((item) => item.weather[0].main === "Clear").length : 0,
          forecast ? forecast.list.filter((item) => item.weather[0].main === "Clouds").length : 0,
          forecast ? forecast.list.filter((item) => item.weather[0].main === "Rain").length : 0,
          forecast ? forecast.list.filter((item) => item.weather[0].main === "Snow").length : 0,
          forecast
            ? forecast.list.filter(
                (item) =>
                  !["Clear", "Clouds", "Rain", "Snow"].includes(item.weather[0].main)
              ).length
            : 0,
        ],
        backgroundColor: ["#FF6384", "#36A2EB", "#FFCE56", "#4BC0C0", "#9966FF"],
      },
    ],
  };

  const radarData = {
    labels: ["Temperature", "Humidity", "Wind Speed", "Pressure"],
    datasets: [
      {
        label: "Current Weather",
        data: weather ? [weather.main.temp, weather.main.humidity, weather.wind.speed, weather.main.pressure] : [],
        backgroundColor: "rgba(255, 99, 132, 0.2)",
        borderColor: "rgba(255, 99, 132, 1)",
        pointBackgroundColor: "rgba(255, 99, 132, 1)",
      },
    ],
  };

  return (
    <div className="container">
      <h2>Weather App</h2>

      <input
        type="text"
        placeholder="Enter city name"
        value={city}
        onChange={(e) => setCity(e.target.value)}
        className="city-input"
      />

      {error && <p className="error-message">{error}</p>}

      <div className="row">
        <div className="column">
          {weather && (
            <div className="weather-info">
              <h3>{weather.name}, {weather.sys.country}</h3>
              <p>Temperature: {weather.main.temp}°C</p>
              <p>Weather: {weather.weather[0].description}</p>
              <p>Humidity: {weather.main.humidity}%</p>
              <p>Wind Speed: {weather.wind.speed} m/s</p>
            </div>
          )}

          {forecast && (
            <div className="chart-container">
              <h3>Temperature Forecast</h3>
              <Line data={chartData} options={{ responsive: true }} />
            </div>
          )}
        </div>

        <div className="column">
          {forecast && (
            <div className="chart-container">
              <h3>Weather Conditions Distribution</h3>
              <Pie data={pieData} options={{ responsive: true }} />
            </div>
          )}

          {weather && (
            <div className="chart-container">
              <h3>Current Weather Radar</h3>
              <Radar data={radarData} options={{ responsive: true }} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Weather;
