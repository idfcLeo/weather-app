import React, { useState, useEffect } from 'react';
import { Search, MapPin, Thermometer, Eye, Wind, Droplets, Sun, Cloud, CloudRain, Snowflake, Zap, RefreshCw, Sunrise, Sunset, Gauge } from 'lucide-react';

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
    pressure: number;
    sunrise: number;
    sunset: number;
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

const API_KEY = '524bd37915bf2e7f2c195569cb7c3648';

function App() {
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCelsius, setIsCelsius] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const getWeatherIcon = (condition: string, size: string = "w-8 h-8") => {
    const iconMap: { [key: string]: React.ReactNode } = {
      'clear': <Sun className={`${size} text-yellow-400 drop-shadow-lg`} />,
      'clouds': <Cloud className={`${size} text-gray-300 drop-shadow-lg`} />,
      'rain': <CloudRain className={`${size} text-blue-400 drop-shadow-lg`} />,
      'snow': <Snowflake className={`${size} text-blue-200 drop-shadow-lg`} />,
      'thunderstorm': <Zap className={`${size} text-purple-400 drop-shadow-lg`} />,
    };
    return iconMap[condition.toLowerCase()] || <Sun className={`${size} text-yellow-400 drop-shadow-lg`} />;
  };

  const getBackgroundGradient = (condition: string) => {
    const gradients: { [key: string]: string } = {
      'clear': 'bg-gradient-to-br from-amber-300 via-orange-400 to-pink-500',
      'clouds': 'bg-gradient-to-br from-slate-400 via-slate-600 to-slate-800',
      'rain': 'bg-gradient-to-br from-blue-400 via-indigo-600 to-purple-700',
      'snow': 'bg-gradient-to-br from-blue-100 via-blue-200 to-indigo-300',
      'thunderstorm': 'bg-gradient-to-br from-purple-600 via-indigo-800 to-gray-900',
    };
    return gradients[condition.toLowerCase()] || 'bg-gradient-to-br from-blue-400 via-indigo-600 to-purple-700';
  };

  const convertTemp = (temp: number) => {
    return isCelsius ? Math.round(temp) : Math.round((temp * 9/5) + 32);
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
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

      const currentResponse = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${API_KEY}&units=metric`
      );
      
      if (!currentResponse.ok) {
        throw new Error('City not found');
      }
      
      const currentData = await currentResponse.json();

      const forecastResponse = await fetch(
        `https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${API_KEY}&units=metric`
      );
      
      const forecastData = await forecastResponse.json();

      const dailyForecasts = forecastData.list
        .filter((_: any, index: number) => index % 8 === 0)
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
          uvIndex: 0,
          icon: currentData.weather[0].icon,
          pressure: currentData.main.pressure,
          sunrise: currentData.sys.sunrise,
          sunset: currentData.sys.sunset,
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
      <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-600 to-pink-600 flex items-center justify-center">
        <div className="text-white text-center">
          <div className="relative">
            <div className="w-20 h-20 border-4 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-6"></div>
            <div className="absolute inset-0 w-20 h-20 border-4 border-transparent border-t-white/60 rounded-full animate-spin mx-auto" style={{ animationDirection: 'reverse', animationDuration: '0.8s' }}></div>
          </div>
          <p className="text-2xl font-light tracking-wide">Loading weather data...</p>
          <div className="mt-4 flex justify-center space-x-1">
            <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
            <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
            <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-400 via-red-600 to-red-800 flex items-center justify-center p-4">
        <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 text-white text-center max-w-md border border-white/20 shadow-2xl">
          <div className="text-6xl mb-6 animate-pulse">⚠️</div>
          <h2 className="text-3xl font-bold mb-6 tracking-wide">Weather Data Unavailable</h2>
          <p className="mb-8 text-lg opacity-90">{error}</p>
          {API_KEY === 'YOUR_OPENWEATHERMAP_API_KEY' && (
            <div className="text-left bg-white/10 rounded-xl p-6 text-sm mb-6 border border-white/20">
              <p className="font-semibold mb-3 text-lg">To use this app:</p>
              <ol className="list-decimal list-inside space-y-2 opacity-90">
                <li>Sign up at <a href="https://openweathermap.org/api" target="_blank" rel="noopener noreferrer" className="text-blue-200 underline hover:text-blue-100 transition-colors">OpenWeatherMap</a></li>
                <li>Get your free API key</li>
                <li>Replace the API key in the code</li>
              </ol>
            </div>
          )}
          <button
            onClick={() => fetchWeatherData()}
            className="px-8 py-3 bg-white/20 rounded-full hover:bg-white/30 transition-all duration-300 transform hover:scale-105 border border-white/30 font-semibold"
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
    <div className={`min-h-screen ${bgGradient} p-4 md:p-8 relative overflow-hidden`}>
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-white/5 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-white/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-white/3 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '4s' }}></div>
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Header */}
        <header className="mb-8">
          <form onSubmit={handleSearch} className="flex gap-4 mb-8">
            <div className="flex-1 relative group">
              <Search className="absolute left-5 top-1/2 transform -translate-y-1/2 text-white/60 w-5 h-5 group-focus-within:text-white transition-colors" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search for a city..."
                className="w-full pl-14 pr-6 py-4 bg-white/15 backdrop-blur-xl rounded-2xl text-white placeholder-white/60 border border-white/20 focus:outline-none focus:ring-2 focus:ring-white/40 focus:border-white/40 transition-all duration-300 text-lg"
              />
            </div>
            <button
              type="submit"
              disabled={isSearching}
              className="px-8 py-4 bg-white/15 backdrop-blur-xl rounded-2xl text-white hover:bg-white/25 transition-all duration-300 border border-white/20 disabled:opacity-50 transform hover:scale-105 font-semibold"
            >
              {isSearching ? <RefreshCw className="w-5 h-5 animate-spin" /> : 'Search'}
            </button>
            <button
              type="button"
              onClick={getCurrentLocation}
              className="px-6 py-4 bg-white/15 backdrop-blur-xl rounded-2xl text-white hover:bg-white/25 transition-all duration-300 border border-white/20 transform hover:scale-105"
            >
              <MapPin className="w-5 h-5" />
            </button>
          </form>

          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold text-white mb-2 tracking-tight">Weather</h1>
              <p className="text-white/80 text-lg">{currentTime.toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}</p>
            </div>
            <button
              onClick={() => setIsCelsius(!isCelsius)}
              className="px-6 py-3 bg-white/15 backdrop-blur-xl rounded-full text-white hover:bg-white/25 transition-all duration-300 border border-white/20 font-semibold text-lg transform hover:scale-105"
            >
              °{isCelsius ? 'C' : 'F'}
            </button>
          </div>
        </header>

        {/* Current Weather - Enhanced */}
        <div className="bg-white/15 backdrop-blur-xl rounded-3xl p-8 md:p-10 mb-8 border border-white/20 shadow-2xl">
          <div className="flex items-center justify-between mb-8">
            <div className="flex-1">
              <div className="flex items-center mb-4">
                <MapPin className="w-6 h-6 text-white/80 mr-3" />
                <h2 className="text-3xl font-bold text-white">{weatherData.current.location}</h2>
              </div>
              <p className="text-white/90 capitalize text-xl font-medium mb-2">{weatherData.current.description}</p>
              <p className="text-white/70 text-lg">{currentTime.toLocaleTimeString('en-US', { 
                hour: '2-digit', 
                minute: '2-digit',
                hour12: true 
              })}</p>
            </div>
            <div className="text-right">
              <div className="flex items-center justify-end mb-4">
                {getWeatherIcon(weatherData.current.condition, "w-16 h-16")}
                <div className="text-7xl md:text-8xl font-bold text-white ml-4">
                  {convertTemp(weatherData.current.temperature)}°
                </div>
              </div>
              <p className="text-white/80 text-xl">
                Feels like {convertTemp(weatherData.current.feelsLike)}°
              </p>
            </div>
          </div>

          {/* Weather Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="bg-white/10 rounded-2xl p-6 text-center backdrop-blur-sm border border-white/10 hover:bg-white/15 transition-all duration-300 transform hover:scale-105">
              <Wind className="w-8 h-8 text-white/80 mx-auto mb-3" />
              <p className="text-white/70 text-sm font-medium mb-1">Wind Speed</p>
              <p className="text-white font-bold text-xl">{weatherData.current.windSpeed} m/s</p>
            </div>
            <div className="bg-white/10 rounded-2xl p-6 text-center backdrop-blur-sm border border-white/10 hover:bg-white/15 transition-all duration-300 transform hover:scale-105">
              <Droplets className="w-8 h-8 text-white/80 mx-auto mb-3" />
              <p className="text-white/70 text-sm font-medium mb-1">Humidity</p>
              <p className="text-white font-bold text-xl">{weatherData.current.humidity}%</p>
            </div>
            <div className="bg-white/10 rounded-2xl p-6 text-center backdrop-blur-sm border border-white/10 hover:bg-white/15 transition-all duration-300 transform hover:scale-105">
              <Eye className="w-8 h-8 text-white/80 mx-auto mb-3" />
              <p className="text-white/70 text-sm font-medium mb-1">Visibility</p>
              <p className="text-white font-bold text-xl">{weatherData.current.visibility} km</p>
            </div>
            <div className="bg-white/10 rounded-2xl p-6 text-center backdrop-blur-sm border border-white/10 hover:bg-white/15 transition-all duration-300 transform hover:scale-105">
              <Gauge className="w-8 h-8 text-white/80 mx-auto mb-3" />
              <p className="text-white/70 text-sm font-medium mb-1">Pressure</p>
              <p className="text-white font-bold text-xl">{weatherData.current.pressure} hPa</p>
            </div>
          </div>

          {/* Sun Times */}
          <div className="grid grid-cols-2 gap-6 mt-6">
            <div className="bg-white/10 rounded-2xl p-6 text-center backdrop-blur-sm border border-white/10">
              <Sunrise className="w-8 h-8 text-yellow-300 mx-auto mb-3" />
              <p className="text-white/70 text-sm font-medium mb-1">Sunrise</p>
              <p className="text-white font-bold text-xl">{formatTime(weatherData.current.sunrise)}</p>
            </div>
            <div className="bg-white/10 rounded-2xl p-6 text-center backdrop-blur-sm border border-white/10">
              <Sunset className="w-8 h-8 text-orange-300 mx-auto mb-3" />
              <p className="text-white/70 text-sm font-medium mb-1">Sunset</p>
              <p className="text-white font-bold text-xl">{formatTime(weatherData.current.sunset)}</p>
            </div>
          </div>
        </div>

        {/* 5-Day Forecast - Enhanced */}
        <div className="bg-white/15 backdrop-blur-xl rounded-3xl p-8 md:p-10 border border-white/20 shadow-2xl">
          <h3 className="text-3xl font-bold text-white mb-8 flex items-center">
            <Thermometer className="w-8 h-8 mr-3" />
            5-Day Forecast
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
            {weatherData.forecast.map((day, index) => (
              <div
                key={index}
                className="bg-white/10 rounded-2xl p-6 text-center hover:bg-white/20 transition-all duration-300 transform hover:scale-105 border border-white/10 backdrop-blur-sm"
              >
                <p className="text-white font-bold mb-3 text-lg">{day.day}</p>
                <div className="flex justify-center mb-4">
                  {getWeatherIcon(day.condition, "w-12 h-12")}
                </div>
                <p className="text-white/80 text-sm capitalize mb-4 font-medium">{day.description}</p>
                <div className="text-white mb-3">
                  <span className="font-bold text-xl">{convertTemp(day.high)}°</span>
                  <span className="text-white/60 ml-3 text-lg">{convertTemp(day.low)}°</span>
                </div>
                <div className="flex items-center justify-center text-white/60 text-sm">
                  <Droplets className="w-4 h-4 mr-1" />
                  <span>{day.humidity}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;