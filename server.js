const https = require("https")
const fs = require('fs')
const path = require('path')
const url = require('url')
require('dotenv').config();

const weather_API_key = process.env.WEATHER_API_KEY;
const weather_web = process.env.WEATHER_API_HOST;

// Content type mapping
const contentTypes = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'text/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

function serveStaticFile(res, filePath) {
  const fullPath = path.join(__dirname, filePath);
  const ext = path.extname(filePath).toLowerCase();
  const contentType = contentTypes[ext] || 'application/octet-stream';

  fs.readFile(fullPath, (err, data) => {
    if (err) {
      res.writeHead(404, {'content-type': 'text/plain'});
      res.end('File not found');
      return;
    }

    res.writeHead(200, {'content-type': contentType});
    res.end(data);
  });
}

async function handleWeatherRequest(req, res, query) {
  try {
    const city = query.city

    if (!city) {
      res.writeHead(400, {'content-type': 'application/json'})
      res.end(JSON.stringify({
        error: "city not found"
      }))
      return
    }

    if (!weather_API_key) {
      res.writeHead(500, {'content-type': 'application/json'})
      res.end(JSON.stringify({
        error: "weather services not working"
      }))
      return
    }

    const weatherData = await fetchWeather(city);
    res.writeHead(200, {'content-type': 'application/json'})
    res.end(JSON.stringify(weatherData))

  } catch (error) {
    console.log('weather API error:', error.message)

    if (error.message.includes('city not found')) {
      res.writeHead(404, {'content-type': 'application/json'})
      res.end(JSON.stringify({
        error: 'city not found'
      }))
    } else if (error.message.includes('invalid API key')) {
      res.writeHead(401, {'content-type': 'application/json'})
      res.end(JSON.stringify({
        error: 'weather authentication not found'
      }))
    } else {
      res.writeHead(500, {'content-type': 'application/json'})
      res.end(JSON.stringify({
        error: 'weather not available'
      }))
    }
  }
}

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
          const weatherData = JSON.parse(data)
          if (weatherData.cod !== 200) {
            if (weatherData.cod == 400) {
              reject(new Error('city not found'))
            } else if (weatherData.cod == 401) {
              reject(new Error('invalid API key'))
            } else {
              reject(new Error('API error: ' + weatherData.message))
            }
            return
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
          resolve(formattedData)

        } catch (ParseError) {
          reject(new Error('failed to parse data'))
        }
      })

    }).on('error', (error) => {
      reject(new Error('failed to fetch data: ' + error.message))
    })
  })
}

// Vercel serverless function handler
module.exports = async (req, res) => {
  console.log(`Request received: ${req.method} ${req.url}`);

  try {
    const parsedUrl = url.parse(req.url, true);
    const pathname = parsedUrl.pathname;
    const query = parsedUrl.query;

    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Method', 'GET, POST, PUT, DELETE');
    res.setHeader('Access-Control-Allow-Header', 'content-type');

    // Serve static files from public directory
    if (pathname === '/' || pathname === '/index.html') {
      serveStaticFile(res, 'public/index.html');
    } else if (pathname.startsWith('/public/')) {
      serveStaticFile(res, pathname);
    } else if (pathname === '/style.css' || pathname === '/script.js') {
      serveStaticFile(res, 'public' + pathname);
    } else if (pathname.startsWith('/images/')) {
      serveStaticFile(res, 'public' + pathname);
    } else if (pathname === '/api/weather') {
      await handleWeatherRequest(req, res, query);
    } else {
      serveStaticFile(res, 'public/404.html');
    }
  } catch (error) {
    console.error('Server error:', error);
    res.writeHead(500, {'content-type': 'text/plain'});
    res.end('Internal Server Error');
  }
};
