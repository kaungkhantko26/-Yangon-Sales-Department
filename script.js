let map;
let markers = [];
let infoWindow;
let activeButton = null;

let userLocationMarker = null;
let directionsRenderer = null;
let directionsService = null;

function initMap() {
  map = new google.maps.Map(document.getElementById('map'), {
    center: { lat: 16.8409, lng: 96.1735 },
    zoom: 12,
    gestureHandling: "greedy",
    disableDefaultUI: true,
    zoomControl: true,
  });

  infoWindow = new google.maps.InfoWindow();
  directionsRenderer = new google.maps.DirectionsRenderer({
    map: map,
    suppressMarkers: false,
  });
  directionsService = new google.maps.DirectionsService();

  initSearch();
  initButtons();
  initPanels();
  getUserLocation();

  // Clear search input & markers
  const clearBtn = document.getElementById('clear-search');
  const searchInput = document.getElementById('search-input');

  clearBtn.addEventListener('click', () => {
    searchInput.value = '';
    clearBtn.style.opacity = '0';
    clearMarkers();
    searchInput.focus();
  });

  searchInput.addEventListener('input', (e) => {
    clearBtn.style.opacity = e.target.value ? '1' : '0';
  });
}

function getUserLocation() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const pos = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };

        if (userLocationMarker) {
          userLocationMarker.setMap(null);
        }

        userLocationMarker = new google.maps.Marker({
          position: pos,
          map: map,
          title: "Your Location",
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 8,
            fillColor: "#00f",
            fillOpacity: 0.9,
            strokeColor: "#fff",
            strokeWeight: 2,
          },
        });

        map.setCenter(pos);
        map.setZoom(14);
      },
      () => {
        alert("Permission denied or error getting location.");
      }
    );
  } else {
    alert("Geolocation is not supported by this browser.");
  }
}

function initSearch() {
  const searchInput = document.getElementById('search-input');
  const searchBox = new google.maps.places.SearchBox(searchInput);

  map.addListener('bounds_changed', () => {
    searchBox.setBounds(map.getBounds());
  });

  searchBox.addListener('places_changed', () => {
    const places = searchBox.getPlaces();

    if (!places.length) return;

    clearMarkers();

    const bounds = new google.maps.LatLngBounds();
    places.forEach((place) => {
      if (!place.geometry) return;

      const marker = new google.maps.Marker({
        map,
        position: place.geometry.location,
        title: place.name,
      });
      markers.push(marker);

      marker.addListener('click', () => {
        infoWindow.setContent(
          `<strong>${place.name}</strong><br>${place.formatted_address || ''}`
        );
        infoWindow.open(map, marker);
      });

      if (place.geometry.viewport) {
        bounds.union(place.geometry.viewport);
      } else {
        bounds.extend(place.geometry.location);
      }
    });

    map.fitBounds(bounds);
  });
}

function initButtons() {
  const buttons = document.querySelectorAll('.location-button');

  buttons.forEach((button) => {
    button.setAttribute('role', 'button');
    button.setAttribute('tabindex', '0');
    button.setAttribute('aria-pressed', 'false');

    button.addEventListener('click', () => {
      activateButton(button);
    });

    button.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        activateButton(button);
      }
    });
  });
}

function activateButton(button) {
  const id = button.dataset.location;

  if (activeButton) {
    activeButton.classList.remove('active');
    activeButton.setAttribute('aria-pressed', 'false');
  }

  button.classList.add('active');
  button.setAttribute('aria-pressed', 'true');
  activeButton = button;

  document.querySelectorAll('.location-info').forEach((panel) => {
    panel.style.display = panel.id === `location-info-${id}` ? 'block' : 'none';
    panel.setAttribute('aria-hidden', panel.style.display === 'none' ? 'true' : 'false');
  });

  clearMarkers();
}

function initPanels() {
  document.querySelectorAll('.location-info .close-btn').forEach((btn) => {
    btn.setAttribute('aria-label', 'Close panel');
    btn.addEventListener('click', () => {
      const panel = btn.parentElement;
      panel.style.display = 'none';
      panel.setAttribute('aria-hidden', 'true');

      if (activeButton) {
        activeButton.classList.remove('active');
        activeButton.setAttribute('aria-pressed', 'false');
        activeButton = null;
      }
    });
  });

  document.querySelectorAll('.location-line').forEach((line) => {
    line.setAttribute('tabindex', '0');
    line.setAttribute('role', 'button');
    line.addEventListener('click', () => {
      closeAllPanels();
      searchPlace(line.dataset.place);
    });

    line.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        closeAllPanels();
        searchPlace(line.dataset.place);
      }
    });
  });
}

function closeAllPanels() {
  document.querySelectorAll('.location-info').forEach((panel) => {
    panel.style.display = 'none';
    panel.setAttribute('aria-hidden', 'true');
  });

  if (activeButton) {
    activeButton.classList.remove('active');
    activeButton.setAttribute('aria-pressed', 'false');
    activeButton = null;
  }
}

function searchPlace(placeName) {
  const service = new google.maps.places.PlacesService(map);
  service.findPlaceFromQuery(
    {
      query: `${placeName}, Yangon, Myanmar`,
      fields: ["name", "geometry", "formatted_address"],
    },
    (results, status) => {
      if (
        status === google.maps.places.PlacesServiceStatus.OK &&
        results.length
      ) {
        const place = results[0];
        const destination = place.geometry.location;

        clearMarkers();
        directionsRenderer.set("directions", null);

        if (userLocationMarker) {
          directionsService.route(
            {
              origin: userLocationMarker.getPosition(),
              destination: destination,
              travelMode: google.maps.TravelMode.DRIVING,
            },
            (response, status) => {
              if (status === "OK") {
                directionsRenderer.setDirections(response);
              } else {
                alert("Directions request failed: " + status);
              }
            }
          );
        } else {
          const marker = new google.maps.Marker({
            map,
            position: destination,
            title: place.name,
          });
          markers.push(marker);

          infoWindow.setContent(
            `<strong>${place.name}</strong><br>${place.formatted_address || ""}`
          );
          infoWindow.open(map, marker);

          map.setCenter(destination);
          map.setZoom(15);
        }
      } else {
        alert(`Could not find: ${placeName}`);
      }
    }
  );
}

function clearMarkers() {
  markers.forEach((marker) => marker.setMap(null));
  markers = [];
  infoWindow.close();
  if (directionsRenderer) {
    directionsRenderer.set("directions", null);
  }
}

// Intro overlay animation removal after finished
window.addEventListener('load', () => {
  const intro = document.getElementById('intro-overlay');
  if (intro) {
    intro.addEventListener('animationend', () => {
      intro.style.display = 'none';
    });
  }
});

const locationButtons = document.querySelectorAll('.location-button');
const locationInfos = document.querySelectorAll('.location-info');

locationButtons.forEach((button) => {
  button.addEventListener('click', () => {
    locationInfos.forEach((info) => {
      if (info.style.display === 'block') {
        info.style.display = 'none';
        info.setAttribute('aria-hidden', 'true');
      }
    });
  });
});
