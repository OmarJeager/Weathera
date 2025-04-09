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
  const [dailyForecast, setDailyForecast] = useState([]);
  const [error, setError] = useState("");
  const [unit, setUnit] = useState("metric"); // 'metric' for Celsius, 'imperial' for Fahrenheit
  const [searchHistory, setSearchHistory] = useState([]);
  const [airQuality, setAirQuality] = useState(null);

  const API_KEY = "6be22578aa5dad675e4eee8caf2e1e5f"; // Replace with your OpenWeatherMap API key

  // Fetch weather and forecast data
  const fetchWeather = async () => {
    if (!city) {
      setError("Please enter a city name.");
      return;
    }

    try {
      // Fetch current weather
      const weatherResponse = await axios.get(
        `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${API_KEY}&units=${unit}`
      );
      setWeather(weatherResponse.data);

      // Fetch 5-day forecast (3-hour intervals)
      const forecastResponse = await axios.get(
        `https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${API_KEY}&units=${unit}`
      );
      setForecast(forecastResponse.data);

      // Fetch air quality data
      const airQualityResponse = await axios.get(
        `https://api.openweathermap.org/data/2.5/air_pollution?lat=${weatherResponse.data.coord.lat}&lon=${weatherResponse.data.coord.lon}&appid=${API_KEY}`
      );
      setAirQuality(airQualityResponse.data);

      // Process forecast data to get daily averages
      const processedForecast = processForecastData(forecastResponse.data);
      setDailyForecast(processedForecast);

      setError("");
    } catch (error) {
      setError("City not found! Try another one.");
      setWeather(null);
      setForecast(null);
      setDailyForecast([]);
    }
  };

  // Process forecast data to group by day and calculate averages
  const processForecastData = (forecastData) => {
    const dailyForecast = {};

    forecastData.list.forEach((item) => {
      const date = new Date(item.dt * 1000).toLocaleDateString();
      if (!dailyForecast[date]) {
        dailyForecast[date] = {
          temp: [],
          weather: [],
        };
      }
      dailyForecast[date].temp.push(item.main.temp);
      dailyForecast[date].weather.push(item.weather[0].main);
    });

    return Object.keys(dailyForecast).map((date) => ({
      date,
      avgTemp: (dailyForecast[date].temp.reduce((a, b) => a + b, 0) / dailyForecast[date].temp.length).toFixed(2),
      weather: dailyForecast[date].weather[0], // Take the most frequent weather condition
    }));
  };

  // Fetch weather data when city changes
  useEffect(() => {
    if (city) {
      fetchWeather();
    }
  }, [city, unit]);

  // Fetch weather for current location if available
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        const { latitude, longitude } = position.coords;
        axios
          .get(
            `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${API_KEY}&units=${unit}`
          )
          .then((response) => {
            setCity(response.data.name); // Set city to current location
          })
          .catch(() => setError("Unable to retrieve location data"));
      });
    }
  }, []);

  // Toggle between Celsius and Fahrenheit
  const toggleUnit = () => {
    setUnit(unit === "metric" ? "imperial" : "metric");
  };

  // Chart data for temperature forecast
  const chartData = {
    labels: forecast
      ? forecast.list.slice(0, 5).map((item) => new Date(item.dt * 1000).toLocaleTimeString())
      : [],
    datasets: [
      {
        label: `Temperature (${unit === "metric" ? "°C" : "°F"})`,
        data: forecast ? forecast.list.slice(0, 5).map((item) => item.main.temp) : [],
        borderColor: "rgba(54, 162, 235, 1)",
        backgroundColor: "rgba(54, 162, 235, 0.2)",
        fill: true,
      },
    ],
  };

  // Pie chart data for weather conditions distribution
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

  // Radar chart data for current weather
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

  // Handle city input change
  const handleCityChange = (e) => {
    const newCity = e.target.value;
    setCity(newCity);
    
    // Add the new city to the search history if it's not already there
    if (newCity && !searchHistory.includes(newCity)) {
      setSearchHistory([newCity, ...searchHistory.slice(0, 4)]); // Keep last 5 searches
    }
  };

  // Handle search history city select
  const handleCitySelect = (selectedCity) => {
    setCity(selectedCity);
  };

  return (
    <div className="container">
      <h2>Weather App</h2>

      <input
        type="text"
        placeholder="Enter city name"
        value={city}
        onChange={handleCityChange}
        className="city-input"
      />

      <div className="search-history">
        {searchHistory.map((historyCity, index) => (
          <button key={index} onClick={() => handleCitySelect(historyCity)}>
            {historyCity}
          </button>
        ))}
      </div>

      {error && <p className="error-message">{error}</p>}

      <div>
        <button onClick={toggleUnit}>
          Toggle to {unit === "metric" ? "°F" : "°C"}
        </button>
      </div>

      <div className="row">
        <div className="column">
          {weather && (
            <div className="weather-info">
              <h3>{weather.name}, {weather.sys.country}</h3>
              <p>Temperature: {weather.main.temp}°{unit === "metric" ? "C" : "F"}</p>
              <p>Weather: {weather.weather[0].description}</p>
              <p>Humidity: {weather.main.humidity}%</p>
              <p>Wind Speed: {weather.wind.speed} m/s</p>
              <p>Rain: {weather.rain ? weather.rain["1h"] : "No rain"} mm</p>
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

      {dailyForecast.length > 0 && (
        <div className="forecast-container">
          <h3>7-Day Forecast</h3>
          <div className="forecast-list">
            {dailyForecast.map((day, index) => (
              <div key={index} className="forecast-day">
                <p><strong>Date:</strong> {day.date}</p>
                <p><strong>Avg Temp:</strong> {day.avgTemp}°{unit === "metric" ? "C" : "F"}</p>
                <p><strong>Weather:</strong> {day.weather}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {airQuality && (
        <div className="air-quality">
          <h3>Air Quality</h3>
          <p>AQI: {airQuality.list[0].main.aqi}</p>
        </div>
      )}
    </div>
  );
};

export default Weather;
