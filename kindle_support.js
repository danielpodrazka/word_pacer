const imageElement = document.getElementsByClassName('kg-full-page-img')[0];
// Create a canvas and set its dimensions to match the image
const canvas = document.createElement('canvas');
canvas.width = imageElement.width;
canvas.height = imageElement.height;
// Get the 2D rendering context
const ctx = canvas.getContext('2d');
// Draw the image on the canvas
ctx.drawImage(imageElement, 0, 0);
// Get the image data from the context
const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
const data = imageData.data;
// Function to check whether a pixel is fully white
const colorCutOff = 255;
function isFullyWhite(r, g, b, a) {
  return r >= colorCutOff && g >= colorCutOff && b >= colorCutOff;
}
// Store the non-white pixels into an array
const nonWhitePixels = [];
for (let y = 0; y < canvas.height; y++) {
  for (let x = 0; x < canvas.width; x++) {

    // Calculate the index of the current pixel in the data array
    const index = (y * canvas.width + x) * 4;

    // Get the color components of the pixel (red, green, blue, alpha)
    const r = data[index];
    const g = data[index + 1];
    const b = data[index + 2];
    const a = data[index + 3];

    // If the pixel is not fully white, store its coordinates in the array
    if (!isFullyWhite(r, g, b, a)) {
      nonWhitePixels.push({ x, y });
    }
  }
}

nonWhitePixels.sort((a, b) => a.y - b.y || a.x - b.x);
// Function to check the distance between two points
function distance(point1, point2) {
  return Math.sqrt(
    Math.pow(point2.x - point1.x, 2) + Math.pow(point2.y - point1.y, 2)
  );
}
// Function to check if two points are part of the same cluster
// We consider two points to be part of the same cluster if
// the distance between them is within the defined threshold
const clusterThreshold = 5;
function isInSameCluster(pointA, pointB) {
  return distance(pointA, pointB) <= clusterThreshold;
}
// Function to find clusters through the nonWhitePixels array
function findClusters(points) {
  const clusters = [];
  points.forEach((point) => {
    let clusterFound = false;
    for (let i = 0; i < clusters.length; i++) {
      const cluster = clusters[i];
      // If the point is close to at least one point in the cluster,
      // we add it to the cluster and mark it as found
      if (cluster.some((otherPoint) => isInSameCluster(point, otherPoint))) {
        cluster.push(point);
        clusterFound = true;
        break;
      }
    }
    // If no appropriate cluster was found, we create a new one with this point
    if (!clusterFound) {
      clusters.push([point]);
    }
  });
  return clusters;
}
// Find clusters of non-white pixels which represent words
const clusters = findClusters(nonWhitePixels);
// Draw rectangles around the clusters
clusters.forEach((cluster) => {
  // Find the minimum and maximum x and y values within the cluster
  const minX = Math.min(...cluster.map((p) => p.x));
  const maxX = Math.max(...cluster.map((p) => p.x));
  const minY = Math.min(...cluster.map((p) => p.y));
  const maxY = Math.max(...cluster.map((p) => p.y));
  // Calculate the width and height of the rectangle
  const width = maxX - minX;
  const height = maxY - minY;
  // Set the stroke style to blue and draw the rectangle
  ctx.strokeStyle = 'blue';
  ctx.lineWidth = 1;
  ctx.strokeRect(minX, minY, width, height);
});
// Get the base64 representation of the modified canvas
const modifiedImage = canvas.toDataURL();
console.log(modifiedImage);
// Create a new image element to display the modified image
const modifiedImageElement = document.createElement('img');
modifiedImageElement.src = modifiedImage;
// Replace the original image with the modified one
imageElement.parentNode.replaceChild(modifiedImageElement, imageElement);
