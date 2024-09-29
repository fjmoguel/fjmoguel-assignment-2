let dataset = [];
let k = 4;
let initMethod = 'random';
let isConverged = false;
let manualCentroids = [];

function generateDataset() {
    fetch('/generate')
        .then(response => response.json())
        .then(data => {
            dataset = data.dataset;
            plotDataset(dataset);
            isConverged = false;
            manualCentroids = [];
            document.getElementById('message').innerText = '';
        });
}

function plotDataset(data) {
    const dataTrace = {
        x: data.map(d => d[0]),
        y: data.map(d => d[1]),
        mode: 'markers',
        type: 'scatter',
        marker: { color: 'blue', size: 5 }
    };
    const centroidTrace = {
        x: [],
        y: [],
        mode: 'markers',
        type: 'scatter',
        marker: { color: 'red', size: 10, symbol: 'x' }
    };
    const layout = {
        title: 'K-Means Clustering',
        xaxis: { title: 'X' },
        yaxis: { title: 'Y' }
    };
    Plotly.newPlot('plot', [dataTrace, centroidTrace], layout);

    if (initMethod === 'manual') {
        document.getElementById('plot').on('plotly_click', selectManualCentroid);
    }
}

function updatePlot(data, animate = false) {
    const dataTrace = {
        x: data.dataset.map(d => d[0]),
        y: data.dataset.map(d => d[1]),
        mode: 'markers',
        type: 'scatter',
        marker: {
            color: data.assignments,
            colorscale: 'Viridis',
            size: 5
        },
        showlegend: false // Hide legend for data points
    };
    const centroidTrace = {
        x: data.centroids.map(c => c[0]),
        y: data.centroids.map(c => c[1]),
        mode: 'markers',
        type: 'scatter',
        marker: {
            color: 'red',
            size: 10,
            symbol: 'x'
        },
        name: 'Centroids' // Add a name for the centroids
    };

    if (animate) {
        Plotly.animate('plot', {
            data: [dataTrace, centroidTrace],
            traces: [0, 1],
            layout: {}
        }, {
            transition: { duration: 500, easing: 'cubic-in-out' },
            frame: { duration: 500 }
        });
    } else {
        Plotly.react('plot', [dataTrace, centroidTrace]);
    }
}

function selectManualCentroid(eventData) {
    if (manualCentroids.length >= k) {
        document.getElementById('message').innerText = 'All centroids have been chosen.';
        return;
    }
    
    const point = eventData.points[0];
    manualCentroids.push([point.x, point.y]);
    
    updatePlot({
        dataset: dataset,
        centroids: manualCentroids,
        assignments: new Array(dataset.length).fill(0)
    });

    document.getElementById('message').innerText = `Selected ${manualCentroids.length} of ${k} centroids.`;
    
    if (manualCentroids.length === k) {
        document.getElementById('plot').removeListener('plotly_click', selectManualCentroid);
    }
}

function stepThroughKMeans() {
    if (isConverged) {
        document.getElementById('message').innerText = 'KMeans has already converged. Reset to run again.';
        return;
    }
    
    k = parseInt(document.getElementById('k-input').value);
    initMethod = document.getElementById('init-method').value;
    
    if (initMethod === 'manual' && manualCentroids.length < k) {
        document.getElementById('message').innerText = `Please select ${k} centroids.`;
        return;
    }
    
    fetch('/step', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ k: k, init_method: initMethod, manual_centroids: manualCentroids })
    })
        .then(response => response.json())
        .then(data => {
            updatePlot(data, true);
            isConverged = data.converged;
            if (isConverged) {
                document.getElementById('message').innerText = 'KMeans has converged.';
            }
        });
}

function runToConvergence() {
    if (isConverged) {
        document.getElementById('message').innerText = 'KMeans has already converged. Reset to run again.';
        return;
    }
    
    k = parseInt(document.getElementById('k-input').value);
    initMethod = document.getElementById('init-method').value;
    
    if (initMethod === 'manual' && manualCentroids.length < k) {
        document.getElementById('message').innerText = `Please select ${k} centroids.`;
        return;
    }
    
    function stepUntilConvergence() {
        fetch('/step', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ k: k, init_method: initMethod, manual_centroids: manualCentroids })
        })
        .then(response => response.json())
        .then(data => {
            updatePlot(data, true);
            if (!data.converged) {
                setTimeout(stepUntilConvergence, 50); // Wait for 50ms before next step to make it fast and dynamic
            } else {
                isConverged = true;
                document.getElementById('message').innerText = 'KMeans has converged.';
            }
        });
    }
    
    stepUntilConvergence();
}

function resetToInitialPlot() {
    fetch('/reset', { method: 'POST' })
        .then(response => response.json())
        .then(data => {
            plotDataset(data.dataset);
            isConverged = false;
            manualCentroids = [];
            document.getElementById('message').innerText = '';
        });
}

document.addEventListener('DOMContentLoaded', (event) => {
    generateDataset();

    document.getElementById('k-input').addEventListener('change', function() {
        k = parseInt(this.value);
        manualCentroids = [];
    });

    document.getElementById('init-method').addEventListener('change', function() {
        initMethod = this.value;
        manualCentroids = [];
        if (initMethod === 'manual') {
            document.getElementById('plot').on('plotly_click', selectManualCentroid);
        } else {
            document.getElementById('plot').removeListener('plotly_click', selectManualCentroid);
        }
    });
});