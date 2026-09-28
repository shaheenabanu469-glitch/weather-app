const cityInput = document.getElementById("city-input");
const weatherDisplay = document.getElementById("weather-display");
const errorMessage = document.getElementById("error-message");
const cityName = document.getElementById("city-name");
const currentDate = document.getElementById("current-date");
const temperature = document.getElementById("temperature");
const description = document.getElementById("description");
const humidity = document.getElementById("humidity");
const wind = document.getElementById("wind");
const pressure = document.getElementById("pressure");
const forecastGrid = document.getElementById("forecast-grid");
const favoritesContainer = document.getElementById("favorites-container");

let favorites = JSON.parse(localStorage.getItem("weatherFavorites")) || ["Mangaluru", "London", "Tokyo"];
renderFavorites();

cityInput.addEventListener("keypress", (e) => { if (e.key === "Enter") getWeather(); });

async function getWeather(targetCity = null) {
    let city = targetCity || cityInput.value.trim();
    if (!city) return;

    try {
        let geoRes = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${city}&count=1`);
        let geoData = await geoRes.json();

        if (!geoData.results) { showErr(); return; }

        let { latitude, longitude, name, country } = geoData.results[0];
        fetchWeatherData(latitude, longitude, `${name}, ${country || ""}`);
        
        addFavorite(name);
    } catch { showErr(); }
}

async function getLocationWeather() {
    if (!navigator.geolocation) { alert("Geolocation is not supported by your browser"); return; }
    navigator.geolocation.getCurrentPosition(async (position) => {
        let lat = position.coords.latitude;
        let lon = position.coords.longitude;
        fetchWeatherData(lat, lon, "Current Location");
    }, () => { alert("Unable to retrieve your location."); });
}

async function fetchWeatherData(lat, lon, label) {
    try {
        let res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,surface_pressure,wind_speed_10m,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min,time`);
        let data = await res.json();

        cityName.innerText = label;
        currentDate.innerText = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
        temperature.innerText = Math.round(data.current.temperature_2m);
        humidity.innerText = `${data.current.relative_humidity_2m}%`;
        wind.innerText = `${data.current.wind_speed_10m} km/h`;
        pressure.innerText = `${data.current.surface_pressure} hPa`;
        description.innerText = getWeatherText(data.current.weather_code);

        renderForecast(data.daily);
        weatherDisplay.classList.remove("hidden");
        errorMessage.classList.add("hidden");
    } catch { showErr(); }
}

function renderForecast(daily) {
    forecastGrid.innerHTML = "";
    for (let i = 1; i <= 3; i++) {
        let dateStr = new Date(daily.time[i]).toLocaleDateString('en-US', { weekday: 'short' });
        let card = document.createElement("div");
        card.className = "forecast-card";
        card.innerHTML = `
            <h4>${dateStr}</h4>
            <div style="font-size: 1.4rem; margin: 5px 0;">${getWeatherEmoji(daily.weather_code[i])}</div>
            <p>${Math.round(daily.temperature_2m_max[i])}° / ${Math.round(daily.temperature_2m_min[i])}°</p>
        `;
        forecastGrid.appendChild(card);
    }
}

function addFavorite(city) {
    if (!favorites.includes(city)) {
        favorites.unshift(city);
        if (favorites.length > 4) favorites.pop();
        localStorage.setItem("weatherFavorites", JSON.stringify(favorites));
        renderFavorites();
    }
}

function renderFavorites() {
    favoritesContainer.innerHTML = "";
    favorites.forEach(fav => {
        let chip = document.createElement("div");
        chip.className = "chip";
        chip.innerText = fav;
        chip.onclick = () => getWeather(fav);
        favoritesContainer.appendChild(chip);
    });
}

function showErr() {
    weatherDisplay.classList.add("hidden");
    errorMessage.classList.remove("hidden");
}

function getWeatherText(code) {
    const map = { 0: "Clear Sky ☀️", 1: "Mainly Clear 🌤️", 2: "Partly Cloudy ⛅", 3: "Overcast ☁️", 45: "Foggy 🌫️", 51: "Drizzle 🌧️", 61: "Rain Showers 🌧️", 95: "Thunderstorm ⚡" };
    return map[code] || "Fair 🌤️";
}

function getWeatherEmoji(code) {
    if (code === 0) return "☀️";
    if (code <= 3) return "⛅";
    if (code <= 55) return "🌧️";
    if (code <= 65) return "🌧️";
    return "⚡";
}