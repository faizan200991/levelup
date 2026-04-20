// Weather App
async function getWeather(city) {
  try {
    const res = await fetch(`https://weather-proxy.freecodecamp.rocks/api/city/${encodeURIComponent(city)}`);
    if (!res.ok) throw new Error('API error');
    const data = await res.json();
    return data;
  } catch (err) {
    console.error(err);
    return undefined;
  }
}

async function showWeather(city) {
  const weatherInfo = document.getElementById('weather-info');
  if (!city) return;
  const data = await getWeather(city);
  if (!data) {
    alert('Something went wrong, please try again later.');
    weatherInfo.style.display = 'none';
    return;
  }
  weatherInfo.style.display = 'block';
  document.getElementById('weather-icon').src = data.weather?.[0]?.icon || '';
  document.getElementById('weather-icon').alt = data.weather?.[0]?.main || 'Weather Icon';
  document.getElementById('main-temperature').textContent = 'Temperature: ' + (data.main?.temp ?? 'N/A') + '°C';
  document.getElementById('feels-like').textContent = 'Feels like: ' + (data.main?.feels_like ?? 'N/A') + '°C';
  document.getElementById('humidity').textContent = 'Humidity: ' + (data.main?.humidity ?? 'N/A') + '%';
  document.getElementById('wind').textContent = 'Wind: ' + (data.wind?.speed ?? 'N/A') + ' m/s';
  document.getElementById('wind-gust').textContent = 'Wind Gust: ' + (data.wind?.gust ?? 'N/A') + ' m/s';
  document.getElementById('weather-main').textContent = 'Weather: ' + (data.weather?.[0]?.main ?? 'N/A');
  document.getElementById('location').textContent = 'Location: ' + (data.name ?? 'N/A');
}

document.getElementById('get-weather-btn').addEventListener('click', () => {
  const city = document.getElementById('city-select').value;
  if (!city) return;
  showWeather(city);
});
