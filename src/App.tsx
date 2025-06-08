import React, { useState, useEffect } from 'react';
import { Search, MapPin, Thermometer, Eye, Wind, Droplets, Sun, Cloud, CloudRain, Snowflake, Zap, RefreshCw } from 'lucide-react';

interface WeatherData {
  current: {
    location: string;
    temperature: number;
    feelsLike: number;
    description: string;
    condition: string;
    humidity: number;
    windSpeed: number;
    visibility: number;
    uvIndex: number;
    icon: string;
  };
  forecast: Array<{
    date: string;
    day: string;
    high: number;
    low: number;
    condition: string;
    description: string;
    humidity: number;
    icon: string;
  }>;
}

const API_KEY = '524bd37915bf2e7f2c195569cb7c3648'; // Replace with your actual API key

function App() {
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCelsius, setIsCelsius] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  const getWeatherIcon = (condition: string) => {
    const iconMap: { [key: string]: React.ReactNode } = {
      'clear': <Sun className="w-8 h-8 text-yellow-400" />,
      'clouds': <Cloud className="w-8 h-8 text-gray-400" />,
      'rain': <CloudRain className="w-8 h-8 text-blue-400" />,
      'snow': <Snowflake className="w-8 h-8 text-blue-200" />,
      'thunderstorm': <Zap className="w-8 h-8 text-purple-400" />,
    };
    return iconMap[condition.toLowerCase()] || <Sun className="w-8 h-8 text-yellow-400" />;
  };

  const getBackgroundGradient = (condition: string) => {
    const gradients: { [key: string]: string } = {
      'clear': 'bg-gradient-to-br from-orange-400 via-pink-500 to-red-500',
      'clouds': 'bg-gradient-to-br from-gray-400 via-gray-600 to-gray-800',
      'rain': 'bg-gradient-to-br from-blue-400 via-blue-600 to-blue-800',
      'snow': 'bg-gradient-to-br from-blue-200 via-white to-gray-300',
      'thunderstorm': 'bg-gradient-to-br from-purple-600 via-purple-800 to-gray-900',
    };
    return gradients[condition.toLowerCase()] || 'bg-gradient-to-br from-blue-400 via-blue-600 to-blue-800';
  };

  const convertTemp = (temp: number) => {
    return isCelsius ? Math.round(temp) : Math.round((temp * 9/5) + 32);
  };

  const fetchWeatherData = async (city: string = 'London') => {
    if (API_KEY === 'YOUR_OPENWEATHERMAP_API_KEY') {
      setError('Please add your OpenWeatherMap API key to use the weather app');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Fetch current weather
      const currentResponse = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${API_KEY}&units=metric`
      );
      
      if (!currentResponse.ok) {
        throw new Error('City not found');
      }
      
      const currentData = await currentResponse.json();

      // Fetch 5-day forecast
      const forecastResponse = await fetch(
        `https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${API_KEY}&units=metric`
      );
      
      const forecastData = await forecastResponse.json();

      // Process forecast data (get daily forecasts)
      const dailyForecasts = forecastData.list
        .filter((_: any, index: number) => index % 8 === 0) // Every 24 hours
        .slice(0, 5)
        .map((item: any) => ({
          date: new Date(item.dt * 1000).toLocaleDateString(),
          day: new Date(item.dt * 1000).toLocaleDateString('en-US', { weekday: 'short' }),
          high: item.main.temp_max,
          low: item.main.temp_min,
          condition: item.weather[0].main,
          description: item.weather[0].description,
          humidity: item.main.humidity,
          icon: item.weather[0].icon,
        }));

      setWeatherData({
        current: {
          location: `${currentData.name}, ${currentData.sys.country}`,
          temperature: currentData.main.temp,
          feelsLike: currentData.main.feels_like,
          description: currentData.weather[0].description,
          condition: currentData.weather[0].main,
          humidity: currentData.main.humidity,
          windSpeed: currentData.wind.speed,
          visibility: currentData.visibility / 1000,
          uvIndex: 0, // UV index not available in free tier
          icon: currentData.weather[0].icon,
        },
        forecast: dailyForecasts,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch weather data');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setIsSearching(true);
      await fetchWeatherData(searchQuery.trim());
      setIsSearching(false);
    }
  };

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          try {
            const response = await fetch(
              `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${API_KEY}&units=metric`
            );
            const data = await response.json();
            await fetchWeatherData(data.name);
          } catch (err) {
            console.error('Error getting current location weather:', err);
          }
        },
        (error) => {
          console.error('Geolocation error:', error);
        }
      );
    }
  };

  useEffect(() => {
    fetchWeatherData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-400 via-blue-600 to-blue-800 flex items-center justify-center">
        <div className="text-white text-center">
          <RefreshCw className="w-12 h-12 animate-spin mx-auto mb-4" />
          <p className="text-xl font-semibold">Loading weather data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-400 via-red-600 to-red-800 flex items-center justify-center p-4">
        <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 text-white text-center max-w-md">
          <div className="text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold mb-4">Weather Data Unavailable</h2>
          <p className="mb-6">{error}</p>
          {API_KEY === 'YOUR_OPENWEATHERMAP_API_KEY' && (
            <div className="text-left bg-white/10 rounded-lg p-4 text-sm">
              <p className="font-semibold mb-2">To use this app:</p>
              <ol className="list-decimal list-inside space-y-1">
                <li>Sign up at <a href="https://openweathermap.org/api" target="_blank" rel="noopener noreferrer" className="text-blue-200 underline">OpenWeatherMap</a></li>
                <li>Get your free API key</li>
                <li>Replace 'YOUR_OPENWEATHERMAP_API_KEY' in the code</li>
              </ol>
            </div>
          )}
          <button
            onClick={() => fetchWeatherData()}
            className="mt-4 px-6 py-2 bg-white/20 rounded-full hover:bg-white/30 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!weatherData) return null;

  const bgGradient = getBackgroundGradient(weatherData.current.condition);

  return (
    <div className={`min-h-screen ${bgGradient} p-4 md:p-8`}>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <header className="mb-8">
          <form onSubmit={handleSearch} className="flex gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search for a city..."
                className="w-full pl-12 pr-4 py-3 bg-white/20 backdrop-blur-lg rounded-2xl text-white placeholder-white/70 border border-white/30 focus:outline-none focus:ring-2 focus:ring-white/50"
              />
            </div>
            <button
              type="submit"
              disabled={isSearching}
              className="px-6 py-3 bg-white/20 backdrop-blur-lg rounded-2xl text-white hover:bg-white/30 transition-colors border border-white/30 disabled:opacity-50"
            >
              {isSearching ? <RefreshCw className="w-5 h-5 animate-spin" /> : 'Search'}
            </button>
            <button
              type="button"
              onClick={getCurrentLocation}
              className="px-4 py-3 bg-white/20 backdrop-blur-lg rounded-2xl text-white hover:bg-white/30 transition-colors border border-white/30"
            >
              <MapPin className="w-5 h-5" />
            </button>
          </form>

          <div className="flex justify-between items-center">
            <h1 className="text-3xl md:text-4xl font-bold text-white">Weather App</h1>
            <button
              onClick={() => setIsCelsius(!isCelsius)}
              className="px-4 py-2 bg-white/20 backdrop-blur-lg rounded-full text-white hover:bg-white/30 transition-colors border border-white/30"
            >
              °{isCelsius ? 'C' : 'F'}
            </button>
          </div>
        </header>

        {/* Current Weather */}
        <div className="bg-white/20 backdrop-blur-lg rounded-3xl p-6 md:p-8 mb-8 border border-white/30">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">{weatherData.current.location}</h2>
              <p className="text-white/80 capitalize">{weatherData.current.description}</p>
            </div>
            <div className="text-right">
              <div className="text-5xl md:text-6xl font-bold text-white mb-2">
                {convertTemp(weatherData.current.temperature)}°
              </div>
              <p className="text-white/80">
                Feels like {convertTemp(weatherData.current.feelsLike)}°
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white/10 rounded-2xl p-4 text-center">
              <Wind className="w-6 h-6 text-white/80 mx-auto mb-2" />
              <p className="text-white/80 text-sm">Wind</p>
              <p className="text-white font-semibold">{weatherData.current.windSpeed} m/s</p>
            </div>
            <div className="bg-white/10 rounded-2xl p-4 text-center">
              <Droplets className="w-6 h-6 text-white/80 mx-auto mb-2" />
              <p className="text-white/80 text-sm">Humidity</p>
              <p className="text-white font-semibold">{weatherData.current.humidity}%</p>
            </div>
            <div className="bg-white/10 rounded-2xl p-4 text-center">
              <Eye className="w-6 h-6 text-white/80 mx-auto mb-2" />
              <p className="text-white/80 text-sm">Visibility</p>
              <p className="text-white font-semibold">{weatherData.current.visibility} km</p>
            </div>
            <div className="bg-white/10 rounded-2xl p-4 text-center">
              <Thermometer className="w-6 h-6 text-white/80 mx-auto mb-2" />
              <p className="text-white/80 text-sm">Pressure</p>
              <p className="text-white font-semibold">1013 hPa</p>
            </div>
          </div>
        </div>

        {/* 5-Day Forecast */}
        <div className="bg-white/20 backdrop-blur-lg rounded-3xl p-6 md:p-8 border border-white/30">
          <h3 className="text-2xl font-bold text-white mb-6">5-Day Forecast</h3>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {weatherData.forecast.map((day, index) => (
              <div
                key={index}
                className="bg-white/10 rounded-2xl p-4 text-center hover:bg-white/20 transition-colors"
              >
                <p className="text-white font-semibold mb-2">{day.day}</p>
                <div className="flex justify-center mb-3">
                  {getWeatherIcon(day.condition)}
                </div>
                <p className="text-white/80 text-sm capitalize mb-2">{day.description}</p>
                <div className="text-white">
                  <span className="font-bold">{convertTemp(day.high)}°</span>
                  <span className="text-white/60 ml-2">{convertTemp(day.low)}°</span>
                </div>
                <p className="text-white/60 text-xs mt-2">{day.humidity}% humidity</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;