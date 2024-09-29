import numpy as np

class KMeans:
    def __init__(self, dataset, k, init_method='random', manual_centroids=None):
        self.dataset = dataset
        self.k = k
        self.init_method = init_method
        self.manual_centroids = manual_centroids
        self.centroids = self.initialize_centroids()
        self.assignments = None
        self.previous_centroids = np.zeros_like(self.centroids)

    def initialize_centroids(self):
        if self.init_method == 'manual' and self.manual_centroids is not None:
            return np.array(self.manual_centroids)
        elif self.init_method == 'random':
            return self.dataset[np.random.choice(self.dataset.shape[0], self.k, replace=False)]
        elif self.init_method == 'kmeans++':
            return self.kmeans_plus_plus()
        elif self.init_method == 'farthest_first':
            return self.farthest_first()
        else:
            raise ValueError("Invalid initialization method")

    def kmeans_plus_plus(self):
        centroids = [self.dataset[np.random.choice(self.dataset.shape[0])]]
        for _ in range(1, self.k):
            distances = np.min([np.sum((self.dataset - c) ** 2, axis=1) for c in centroids], axis=0)
            probs = distances / distances.sum()
            cumprobs = probs.cumsum()
            r = np.random.random()
            ind = np.argmax(cumprobs >= r)
            centroids.append(self.dataset[ind])
        return np.array(centroids)

    def farthest_first(self):
        centroids = [self.dataset[np.random.choice(self.dataset.shape[0])]]
        for _ in range(1, self.k):
            distances = np.min([np.sum((self.dataset - c) ** 2, axis=1) for c in centroids], axis=0)
            ind = np.argmax(distances)
            centroids.append(self.dataset[ind])
        return np.array(centroids)

    def assign_clusters(self):
        distances = np.sqrt(((self.dataset[:, np.newaxis] - self.centroids) ** 2).sum(axis=2))
        return np.argmin(distances, axis=1)

    def update_centroids(self):
        new_centroids = np.array([self.dataset[self.assignments == i].mean(axis=0) for i in range(self.k)])
        self.previous_centroids = self.centroids.copy()
        self.centroids = new_centroids

    def step(self):
        self.assignments = self.assign_clusters()
        self.update_centroids()

    def converged(self):
        if np.all(self.previous_centroids == 0):
            return False
        return np.allclose(self.centroids, self.previous_centroids)

    def run_to_convergence(self):
        while not self.converged():
            self.step()

    def get_plot_data(self):
        return {
            'dataset': self.dataset.tolist(),
            'centroids': self.centroids.tolist(),
            'assignments': self.assignments.tolist() if self.assignments is not None else None,
            'converged': self.converged()
        }