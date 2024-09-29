from flask import Flask, render_template, jsonify, request
from kmeans import KMeans
import numpy as np

app = Flask(__name__)
kmeans = None
dataset = None

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/generate', methods=['GET'])
def generate_dataset():
    global dataset
    dataset = np.random.randn(300, 2) * 10  # Generating a larger spread
    return jsonify({'dataset': dataset.tolist()})

@app.route('/step', methods=['POST'])
def step():
    global kmeans, dataset
    data = request.json
    k = int(data['k'])
    init_method = data['init_method']
    manual_centroids = data.get('manual_centroids')

    if kmeans is None:
        kmeans = KMeans(dataset, k, init_method, manual_centroids)

    if not kmeans.converged():
        kmeans.step()

    return jsonify(kmeans.get_plot_data())

@app.route('/run', methods=['POST'])
def run_to_convergence():
    global kmeans, dataset
    data = request.json
    k = int(data['k'])
    init_method = data['init_method']
    manual_centroids = data.get('manual_centroids')

    if kmeans is None or not kmeans.converged():
        kmeans = KMeans(dataset, k, init_method, manual_centroids)
        kmeans.run_to_convergence()

    return jsonify(kmeans.get_plot_data())

@app.route('/reset', methods=['POST'])
def reset():
    global kmeans
    kmeans = None
    return jsonify({'dataset': dataset.tolist()})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=3000)