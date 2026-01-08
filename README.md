# InsightForge – Interactive Data Exploration Tool

## Overview

InsightForge is a browser-based data exploration and visual analytics tool that allows users to upload CSV datasets and explore numeric relationships through interactive visualisation and unsupervised machine learning techniques.

The application focuses on advanced JavaScript programming, reactive UI design, and client-side data processing, reflecting workflows commonly used in data science and machine learning. All computation is performed locally in the browser without external services.

This project was developed for the Web Innovations module and exceeds static website requirements by supporting real-time interaction, dynamic rendering, and performance-aware computation.

---

## Key Features

* CSV file upload using the File API

* Automatic detection of numeric and categorical columns

* Dataset metadata summary (rows, columns, data types)

* Preview of the first six rows of the dataset for usability

* Interactive scatterplot with dynamic X and Y axis selection

* Optional min–max normalisation (0–1) for numeric features

* K-Means clustering on selected numeric features (2–8 recommended)

* Web Worker–based clustering to prevent UI blocking

* Cluster-aware scatterplot colouring and tooltips

* Responsive, dark-themed interface optimised for different screen sizes

* Modular JavaScript architecture separating data, state, and visualisation logic

---

## Technical Implementation

The application is implemented using vanilla JavaScript (ES6 modules) and D3.js for visualisation.

### Architecture

* data/ – CSV parsing, schema detection, numeric coercion, and data transforms

* core/ – central reactive state store and UI update logic

* vis/ – D3-based scatterplot rendering

* workers/ – Web Worker for K-Means clustering

* main.js – application orchestration and event handling

A lightweight reactive store pattern is used so that UI components automatically update when application state changes.

--- 

## Data Processing

* CSV files are parsed client-side without external services

* Numeric columns are detected automatically using a configurable threshold

* Non-numeric values are safely filtered during visualisation

* Optional min–max normalisation rescales numeric values to a 0–1 range, supporting fair comparison across features

* Computationally intensive clustering is executed in a Web Worker to maintain interface responsiveness

---

## K-Means Clustering

InsightForge includes a full implementation of K-Means clustering, executed off the main UI thread.

* Users select 2–8 numeric features for clustering

* The number of clusters (k) can be configured (2–10)

* Clustering runs asynchronously in a Web Worker

* Results include cluster labels, inertia, iteration count, and cluster sizes

* Scatterplot points are coloured dynamically based on cluster membership

This demonstrates performance-aware client-side machine learning using modern web technologies.

--- 

## Dataset Used for Demonstration

The project includes a ready-to-use example dataset:

* student-mat-fixed.csv (included in the repository)

This file is adapted from the Student Performance Dataset provided by the
UCI Machine Learning Repository:

🔗 https://archive.ics.uci.edu/dataset/320/student+performance

The dataset contains numeric features such as G1, G2, G3, studytime, and failures, making it suitable for both scatterplot visualisation and K-Means clustering.

The dataset is used solely for educational and demonstration purposes.

---

## Known Limitations

* CSV files must include a header row

* The application assumes comma-separated values

* Very large datasets may be truncated for performance reasons

* K-Means implementation is intended for exploratory analysis rather than large-scale production use

---

## Future Work

* Additional clustering algorithms

* Dimensionality reduction (e.g. PCA)

* Additional chart types (histograms, box plots)

* Export of clustered datasets

* GPU-accelerated rendering for large datasets

---

## How to Run

1. Clone or download the repository

2. Open the project folder in VS Code

3. Use Live Server (or any local server) to run index.html

4. Upload a CSV file (or use student-mat-fixed.csv) to begin exploring the data