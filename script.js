let map;
let markers = [];
let infoWindow;
let activeButton = null;

function initMap() {
  map = new google.maps.Map(document.getElementById('map'), {
    center: { lat: 16.8409, lng: 96.1735 },
    zoom: 12,
    gestureHandling: "greedy",
    disableDefaultUI: true,
    zoomControl: true
  });

  infoWindow = new google.maps.InfoWindow();
  initSearch();
  initButtons();
  initPanels();

  document.getElementById('clear-search').addEventListener('click', () => {
    document.getElementById('search-input').value = '';
    document.getElementById('clear-search').style.opacity = '0';
    clearMarkers();
  });

  document.getElementById('search-input').addEventListener('input', e => {
    document.getElementById('clear-search').style.opacity = e.target.value ? '1' : '0';
  });
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
    places.forEach(place => {
      if (!place.geometry) return;

      const marker = new google.maps.Marker({
        map,
        position: place.geometry.location,
        title: place.name
      });
      markers.push(marker);

      marker.addListener('click', () => {
        infoWindow.setContent(`<strong>${place.name}</strong><br>${place.formatted_address || ''}`);
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
  document.querySelectorAll('.location-button').forEach(button => {
    button.addEventListener('click', () => {
      const id = button.dataset.location;

      if (activeButton) activeButton.classList.remove('active');
      button.classList.add('active');
      activeButton = button;

      document.querySelectorAll('.location-info').forEach(panel => {
        panel.style.display = panel.id === `location-info-${id}` ? 'block' : 'none';
      });

      clearMarkers();
    });
  });
}

function initPanels() {
  document.querySelectorAll('.location-info .close-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      btn.parentElement.style.display = 'none';
      if (activeButton) {
        activeButton.classList.remove('active');
        activeButton = null;
      }
    });
  });

  document.querySelectorAll('.location-line').forEach(line => {
    line.addEventListener('click', () => {
      // Close ALL panels when a location is clicked
      document.querySelectorAll('.location-info').forEach(panel => {
        panel.style.display = 'none';
      });
      if (activeButton) {
        activeButton.classList.remove('active');
        activeButton = null;
      }

      searchPlace(line.dataset.place);
    });
  });
}

function searchPlace(placeName) {
  const service = new google.maps.places.PlacesService(map);
  service.findPlaceFromQuery({
    query: `${placeName}, Yangon, Myanmar`,
    fields: ['name', 'geometry', 'formatted_address']
  }, (results, status) => {
    if (status === google.maps.places.PlacesServiceStatus.OK) {
      clearMarkers();
      const place = results[0];
      const marker = new google.maps.Marker({
        map,
        position: place.geometry.location,
        title: place.name
      });
      markers.push(marker);

      infoWindow.setContent(`<strong>${place.name}</strong><br>${place.formatted_address || ''}`);
      infoWindow.open(map, marker);
      map.setCenter(place.geometry.location);
      map.setZoom(15);
    } else {
      alert(`Could not find: ${placeName}`);
    }
  });
}

function clearMarkers() {
  markers.forEach(marker => marker.setMap(null));
  markers = [];
  infoWindow.close();
}
window.addEventListener('load', () => {
    const intro = document.getElementById('intro-overlay');
    // Remove intro div after animation finished to free DOM
    intro.addEventListener('animationend', () => {
      intro.style.display = 'none';
    });
  });
  