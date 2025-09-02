const https = require("https");
require('dotenv').config();

const weather_API_key = process.env.WEATHER_API_KEY;
const weather_web = process.env.WEATHER_API_HOST;

async function fetchWeather(city) {
  return new Promise((resolve, reject) => {
    let data = '';
    let apiUrl = `${weather_web}/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${weather_API_key}&units=metric`;
    https.get(apiUrl, (apiRes) => {
      apiRes.on('data', (chunk) => {
        data += chunk;
      });

      apiRes.on('end', () => {
        try {
          const weatherData = JSON.parse(data);
          if (weatherData.cod !== 200) {
            if (weatherData.cod == 400) {
              reject(new Error('city not found'));
            } else if (weatherData.cod == 401) {
              reject(new Error('invalid API key'));
            } else {
              reject(new Error('API error: ' + weatherData.message));
            }
            return;
          }

          const formattedData = {
            name: weatherData.name,
            country: weatherData.sys.country,
            main: weatherData.weather[0].main,
            description: weatherData.weather[0].description,
            humidity: weatherData.main.humidity,
            pressure: weatherData.main.pressure,
            wind_speed: weatherData.wind ? weatherData.wind.speed : 0,
            temperature: weatherData.main.temp
          };
          resolve(formattedData);

        } catch (ParseError) {
          reject(new Error('failed to parse data'));
        }
      });

    }).on('error', (error) => {
      reject(new Error('failed to fetch data: ' + error.message));
    });
  });
}

module.exports = async (req, res) => {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const url = new URL(req.url, `http://${req.headers.host}`);
  const city = url.searchParams.get('city');

  if (!city) {
    res.status(400).json({ error: 'city not found' });
    return;
  }

  if (!weather_API_key) {
    res.status(500).json({ error: 'weather services not working' });
    return;
  }

  try {
    const weatherData = await fetchWeather(city);
    res.status(200).json(weatherData);
  } catch (error) {
    console.error('weather API error:', error.message);
    if (error.message.includes('city not found')) {
      res.status(404).json({ error: 'city not found' });
    } else if (error.message.includes('invalid API key')) {
      res.status(401).json({ error: 'weather authentication not found' });
    } else {
      res.status(500).json({ error: 'weather not available' });
    }
  }
};
