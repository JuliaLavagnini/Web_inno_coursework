## Project Title

InsightForge – Interactive Data Exploration Tool

## Overview

InsightForge is a browser-based web application that allows users to upload CSV datasets and explore numeric relationships through interactive data visualisation. The application focuses on advanced JavaScript programming, reactive UI design, and data preprocessing techniques commonly used in data science and machine learning workflows.

The project was developed for the Web Innovations module and exceeds static website requirements by supporting real-time interaction, dynamic rendering, and client-side data processing.

---

## Key Features

* CSV file upload using the File API

* Automatic detection of numeric and categorical columns

* Dataset metadata summary (rows, columns, data types)

* Preview of the first six rows of the dataset for usability

* Interactive scatterplot with dynamic X and Y axis selection

* Optional min–max normalisation (0–1) for numeric features

* Responsive, dark-themed interface optimised for different screen sizes

* Modular JavaScript architecture separating data, state, and visualisation logic

---

## Technical Implementation

The application is implemented using vanilla JavaScript (ES6 modules) and D3.js for visualisation.

### Architecture

* data/ – CSV parsing, schema detection, numeric coercion, and data transforms

* core/ – central reactive state store and UI update logic

* vis/ – D3-based scatterplot rendering

* main.js – application orchestration and event handling

A simple reactive store pattern is used so that UI components update automatically when application state changes.

--- 

## Data Processing

* CSV files are parsed client-side without external services

* Numeric columns are detected automatically using a configurable threshold

* Non-numeric values are safely filtered during visualisation

* Optional min–max normalisation rescales numeric values to a 0–1 range, supporting fair comparison across features

---

## Dataset Used for Demonstration

The application is demonstrated using the Student Performance Dataset **(UCI Machine Learning Repository)**.
This [dataset] is used solely for educational purposes (https://archive.ics.uci.edu/dataset/320/student+performance).

---

## Known Limitations

* CSV files must include a header row

* Very large datasets may be truncated for performance reasons

* Only numeric columns can be plotted in the scatterplot

* Clustering functionality is outlined in the interface but not executed in this submission build

---

## Future Work

* Full implementation of K-Means clustering on selected numeric features

* Offloading heavy computations to Web Workers

* Additional chart types (e.g., histograms, box plots)

* Enhanced accessibility and keyboard navigation

---

## How to Run

1. Clone or download the repository

2. Open the project folder in VS Code

3. Use Live Server (or any local server) to run index.html

4. Upload a CSV file to begin exploring the data