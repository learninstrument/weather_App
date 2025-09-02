document.addEventListener('DOMContentLoaded', function(){
    //element

    const cityInput = document.getElementById('city-input');
    const search_icon = document.getElementById('search-icon');
    const spinning = document.getElementById('spinning');
    const weather_report = document.getElementById('weather-report')
    const errorMessage = document.getElementById('error-message')

    //weather display element

    const temperature = document.getElementById('temperature')
    const description = document.getElementById('description')
    const pressure = document.getElementById('pressure')
    const humidity = document.getElementById('humidity')
    const windspeed = document.getElementById('windspeed');
    const errorText = document.getElementById('errorText')
    const weatherEmoji = document.getElementById('weather-emoji')
    const cityName = document.getElementById('city-name')

    search_icon.addEventListener('click', function(e) {
        e.preventDefault();
        searchWeather();
    });

    cityInput.addEventListener('keypress', function(e){
        if(e.key === 'Enter'){
            e.preventDefault();
            searchWeather();
        }
    });

    async function searchWeather() {
        const city = cityInput.value.trim()

        if(!city){
          showError('please enter a city name!');
          return;
        }
        try{
          showLoading();
          const response = await fetch(`/api/weather?city=${encodeURIComponent(city)}`);
          if(!response.ok) {
            throw new Error(`HTTPS error! ${response.status}`);
          
          }
          const data = await response.json();
          if(data.error){
            throw new Error(data.error);
          }

          displayWeather(data);
          
        }catch(error){
          showError('failed to get weather data. please try again')
        }
  }
  function displayWeather(data){
    hideLoading();
    hideError();
    cityName.innerHTML = `${data.name}, ${data.country} <span id="weather-emoji">${getWeatherEmoji(data.main)}</span>`;
    temperature.textContent = Math.round(data.temperature) + '°';
    description.textContent = 'Description: ' + data.description;
    humidity.textContent = 'Humidity: ' + data.humidity + '%';
    windspeed.textContent = 'WindSpeed: ' + data.wind_speed + ' m/s';
    pressure.textContent = 'Pressure: ' + data.pressure + ' hPa';
    weather_report.style.display = 'block';
  }
 function getWeatherEmoji(condition) {
  const weatherEmoji = {
    'Clear': '☀️',
      'Clouds': '☁️',
      'Rain': '🌧️',
      'Drizzle': '🌦️',
      'Thunderstorm': '⛈️',
      'Snow': '❄️',
      'Mist': '🌫️',
      'Smoke': '💨',
      'Haze': '🌫️',
      'Dust': '💨',
      'Fog': '🌫️',
      'Sand': '💨',
      'Ash': '💨',
      'Squall': '💨',
      'Tornado': '🌪️'
  }
  return weatherEmoji[condition] || '🌤️';
 }
 function showLoading(){
  spinning.style.display ='block';
  weather_report.style.display = 'none';
  hideError();
 }

 function hideLoading(){
  spinning.style.display = 'none';
 }

  function showError(message) {
    errorText.textContent = message;
    errorMessage.style.display = 'block';
  }

  function hideError() {
    errorMessage.style.display = 'none';
  }
})