async function loadPoliceStations() {
    try {
        const response = await fetch('/api/police_stations');
        const policeStations = await response.json();

        const policeStationList = document.getElementById('police-station-list');
        policeStationList.innerHTML = ''; // Clear existing content

        policeStations.forEach(station => {
            const stationItem = document.createElement('div');
            stationItem.className = 'station-item';
            stationItem.innerHTML = `
                <h3>${station.station_name}</h3>
                <p>Inspector: ${station.inspector_name}</p>
                <p>Mobile: ${station.mobile_number}</p>
                <p>Address: ${station.address}</p>
                <p>Email: ${station.email_id}</p>
            `;
            policeStationList.appendChild(stationItem);
        });
    } catch (error) {
        console.error('Error loading police stations:', error);
    }
}

// Call the function to load police stations when the resources tab is clicked
document.getElementById('resources-tab').addEventListener('click', loadPoliceStations);

$(function () {
    $('[data-toggle="tooltip"]').tooltip();
});

// Show guidance modal on page load
$(document).ready(function() {
    $('#guidance-modal').modal('show');
});
