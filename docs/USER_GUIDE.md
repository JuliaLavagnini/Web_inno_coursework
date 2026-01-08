InsightForge is an interactive web application designed to help users explore CSV datasets visually. No installation or backend services are required — everything runs directly in the browser.

## Uploading a Dataset

1. Click “Upload CSV”

2. Select a CSV file with column headers

3. Once uploaded, dataset information (rows, columns, numeric features) will be displayed automatically

## Dataset Preview

* The preview table displays the first six rows of the dataset

* This allows users to quickly inspect the structure and values without overwhelming the interface

## Creating a Scatterplot

1. Select a numeric column for the X axis

2. Select a numeric column for the Y axis

3. Click “Render scatter”

4. The scatterplot will update immediately

Hovering over points displays the exact values for the selected axes.

## Normalising Data

* Tick “Normalise numeric columns (0–1)” to scale values between 0 and 1

* This is useful when comparing variables with very different ranges

* Normalisation is commonly used in data science and machine learning preprocessing

## Clustering Panel

The interface includes a panel for K-Means clustering, allowing users to:

* Select the number of clusters

* Choose multiple numeric features

In this submission, clustering execution is outlined as future work and is not performed.

## Troubleshooting

* Ensure your CSV file includes headers

* Only numeric columns can be plotted

* Refresh the page and re-upload the file if controls appear disabled

* Large datasets may take longer to render
