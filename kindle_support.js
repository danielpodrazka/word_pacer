const colorCutOff = 50;
const columnGap = 10;
const minColWidth = 200;
const underlineColor = 'blue'
const defaultKindleFontSize = 5;
var currentDrawing = 0;
var logs = [];
/**
 * Retrieves the RGB color values for a pixel at a given x, y coordinate.
 * @param {number} y - The y-coordinate of the pixel.
 * @param {number} x - The x-coordinate of the pixel.
 * @returns {Object} An object containing the color components r, g, b.
 */
function getRGB(x,y) {
    // Calculate the index of the current pixel in the data array
    let index = (y * canvas.width + x) * 4;
    // Get the color components of the pixel (red, green, blue, alpha)
    let r = data[index];
    let g = data[index + 1];
    let b = data[index + 2];
    return {r, g, b};
}

function isFullyWhite(x,y) {
    let {r,g,b} = getRGB(x, y);
    return r >= colorCutOff && g >= colorCutOff && b >= colorCutOff;
}

/**
 * Finds and returns the coordinates of non-white pixels on the canvas.
 * @returns {Array} An array of objects containing the x and y coordinates of non-white pixels.
 */
function findNonWhitePixels() {
    let pixels = [];
    for (let y = 0; y < canvas.height; y++) {
        for (let x = 0; x < canvas.width; x++) {
            // If the pixel is not fully white, store its coordinates in the array
            if (!isFullyWhite(x,y)) {
                pixels.push({x, y});
            }
        }
    }
    return pixels;
}

/**
 * Sorts pixel objects by their y and x coordinates.
 * @param {Object} pointA - The first pixel object.
 * @param {Object} pointB - The second pixel object.
 * @returns {number} The sorting value.
 */
function sortPixels(pointA, pointB) {
    return pointA.y - pointB.y || pointA.x - pointB.x;
}

/**
 * Creates a promise that resolves after the specified duration.
 * @param {number} ms - The duration in milliseconds.
 * @returns {Promise} A promise that resolves after ms milliseconds.
 */
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function getColumns(maxX, maxY) {
    let columns = [];
    let whiteYs = 0;
    for (let x = 0; x < maxX; x++) {
        let whitePixelsInColumn = 0;
        for (let y = 0; y < maxY; y++) {
            if (isFullyWhite(x,y)) {
                whitePixelsInColumn++;
            }
        }
        if (whitePixelsInColumn >= maxY) {
            whiteYs++;
            if (whiteYs >= columnGap) {
                columns.push(x - columnGap);
                whiteYs = 0;
            }
        }
    }
    return columns
}

/**
 * Calculates and returns the column ranges in the canvas.
 * @returns {Array} An array of objects representing the column ranges.
 */
function getColumnRanges(columns) {

    let columnRanges = [];
    for (let i = 0; i < columns.length - 1; i++) {
        let start = columns[i];
        let end = columns[i + 1];
        if (end - start > minColWidth) {
            columnRanges.push({start: start, end: end});
        }
    }
    return columnRanges;
}

/**
 * Returns the first column range where the end value is greater than the x-coordinate of the line.
 * @param {Array} columnRanges - An array of column range objects.
 * @param {Object} line - An object containing the x and y coordinates of the line.
 * @returns {Object} The matching column range object or null if not found.
 */
function getColRange(columnRanges, line) {
    for (let i = 0; i < columnRanges.length; i++) {
        let colRange = columnRanges[i];
        if (colRange.end > line.x) {
            return colRange;
        }
    }
    return null;
}

/**
 * Gets the x-coordinate of the first non-white pixel in a column range.
 * @param {Object} colRange - A column range object.
 * @param {Object} line - An object containing the x and y coordinates of the line.
 * @returns {number} The x-coordinate of the first non-white pixel.
 */
function getFirstX(colRange, line) {
    for (let x = colRange.start; x < colRange.end; x++) {
        if (!isFullyWhite(x, line.y)) {
            return x;
        }
    }
    return colRange.end;
}

/**
 * Gets the x-coordinate of the last non-white pixel in a column range.
 * @param {Object} colRange - A column range object.
 * @param {Object} line - An object containing the x and y coordinates of the line.
 * @returns {number} The x-coordinate of the last non-white pixel.
 */
function getLastX(colRange, line) {
    for (let x = colRange.end; x > colRange.start; x--) {
        if (!isFullyWhite(x, line.y)) {
            return x;
        }
    }
    return colRange.start;
}
function getClosestLine(underlineY) {
    let minDist = Infinity;
    let closestLineIndex = -1;
    for (let i = 0; i < lines.length; i++) {
        let line = lines[i];
        let y = line.y;
        let dist = Math.abs(y - underlineY);
        if (dist < minDist) {
            minDist = dist;
            closestLineIndex = i;
        }
    }
    return closestLineIndex;
}

/**
 * Draws lines on a canvas based on the input image.
 * @returns {Promise} A promise that resolves when the lines are drawn.
 */
async function draw(pixelsPerColumn, columnRanges,elemRect, randomColor = false) {
    let linesCanvas = document.getElementById('lines-canvas');
    let linesCtx = linesCanvas.getContext('2d');
    linesCanvas.style.pointerEvents = 'none';
    if (randomColor) {
      let colors = ['red','green','blue','yellow'];
      linesCtx.strokeStyle =  colors[Math.floor(Math.random()*colors.length)];
    } else {
      linesCtx.strokeStyle = underlineColor;
    }
    linesCtx.strokeStyle = 'yellow';
    // Update the position of the linesCanvas to match the position of the imageElement
    linesCanvas.style.position = 'absolute';
    linesCanvas.style.left = `${elemRect.left}px`;
    linesCanvas.style.top = `${elemRect.top}px`;
    let pixels = [].concat(...pixelsPerColumn);
    lines = [];
    for (let i = 0; i < pixels.length-1; i++) {
        if (pixels[i].y !== pixels[i+1].y){
            lines.push(pixels[i]);
        }
    }

    for (const line of lines) {
        let colRange = getColRange(columnRanges, line);
        let y = line.y;
        let firstX = getFirstX(colRange, line);
        let lastX = getLastX(colRange, line);
        linesCtx.beginPath();
        linesCtx.moveTo(firstX, y + 3);
        linesCtx.lineTo(lastX, y + 3);
        linesCtx.stroke();
    }
}

async function drawLine(fromX,toX,y, randomColor= false) {
    let imageWithText = document.getElementsByClassName('kg-full-page-img')[0];
    if (imageWithText === undefined){
        return;
    }
    let imageWithTextRect = imageWithText.getBoundingClientRect();
    let linesCanvas = document.getElementById('underlines-canvas');
    let linesCtx = linesCanvas.getContext('2d');
    linesCanvas.style.pointerEvents = 'none';
    if (randomColor) {
      let colors = ['red','green','blue','yellow'];
      linesCtx.strokeStyle =  colors[Math.floor(Math.random()*colors.length)];
    } else {
      linesCtx.strokeStyle = underlineColor;
    }
    linesCtx.lineWidth = 2;
    // Update the position of the linesCanvas to match the position of the imageElement
    linesCanvas.style.position = 'absolute';
    linesCanvas.style.left = `${imageWithTextRect.left}px`;
    linesCanvas.style.top = `${imageWithTextRect.top}px`;
    for (let x = fromX; x <= toX; x= x+25) {
        linesCtx.beginPath();
        linesCtx.moveTo(Math.max(x-5,fromX), y );
        linesCtx.lineTo(Math.min(x+25,toX), y );
        linesCtx.stroke();
        await sleep(30);
    }
}

async function drawUnderline(underlineX, underlineY){
    currentDrawing++;
    let thisDrawing = currentDrawing;
     let imageWithText = document.getElementsByClassName('kg-full-page-img')[0];
    let oldCanvas = document.getElementById('underlines-canvas');
    if (oldCanvas != undefined) {
        document.getElementById('underlines-canvas').remove();
    }
    let linesCanvas =  document.createElement('canvas');
    linesCanvas.width = imageWithText.width;
    linesCanvas.height = imageWithText.height;
    linesCanvas.id = 'underlines-canvas';
    document.body.appendChild(linesCanvas);
    let startLineIndex = getClosestLine(underlineY);
    for (let i = startLineIndex; i < lines.length; i++) {
        if (currentDrawing !== thisDrawing){
            break;
        }
        let line = lines[i];
        let colRange = getColRange(columnRanges, line);
        let y = line.y;
        let firstX = getFirstX(colRange, line);
        let lastX = getLastX(colRange, line);
        if (i === startLineIndex) {
          await drawLine(Math.max(underlineX, firstX), lastX, y + 3);
        } else{
             await drawLine(firstX, lastX, y + 3);
        }

    }
}

/**
 * getColumnNonWhitePixels - Filters non-white pixels within a given column range.
 *
 * @param {Object} columnRange - An object with a start and end property representing the range of a column.
 * @returns {Array} Returns non-white pixels in the specified column range.
 */
function getColumnNonWhitePixels(columnRange) {
    return nonWhitePixels.filter(pixel => pixel.x >= columnRange.start && pixel.x < columnRange.start + 100);
}

/**
 * filterConsecutiveNonWhitePixels - Filters out consecutive non-white pixels in a column.
 *
 * @param {Array} columnNonWhitePixels - An array of non-white pixels in a single column.
 * @returns {Array} Returns an array of non-consecutive non-white pixels.
 */
function filterConsecutiveNonWhitePixels(columnNonWhitePixels) {
    return columnNonWhitePixels.filter((a, index) => {
        const found = columnNonWhitePixels.some((b, i) => {
            if (a.y - b.y > 50) {
                return false;
            }
            return i !== index && (((a.x === b.x) || (a.x === b.x - 1) || (a.x === b.x + 1)) && a.y === b.y - 1);
        });
        return !found;
    });
}

/**
 * getPixelCountPerRow - Counts the number of non-white pixels per row.
 *
 * @param {Array} columnNonWhitePixels - An array of non-white pixels in a single column.
 * @returns {Object} Returns an object with row numbers as keys and the number of non-white pixels in each row as values.
 */
function getPixelCountPerRow(columnNonWhitePixels) {
    var pixelCountPerRow = {};
    columnNonWhitePixels.forEach((pixel) => {
        if (pixelCountPerRow[pixel.y]) {
            pixelCountPerRow[pixel.y]++;
        } else {
            pixelCountPerRow[pixel.y] = 1;
        }
    });
    return pixelCountPerRow;
}

/**
 * Filters rows based on the pixel distance between them.
 *
 * This function takes an object with row indices as keys and their respective pixel counts as values. It iteratively filters rows
 * that are closer than a specified maximum pixel distance while considering the pixel count on the rows.
 *
 * @param {Object} pixelCountPerRow - An object with row indices as keys and their respective pixel counts as values.
 * @param {number} [maxDistance=20] - The maximum pixel distance allowed between rows to be considered for filtering.
 * @param {number} [iterations=5] - The number of iterations for filtering rows based on pixel distance.
 * @returns {string[]} An array of filtered row indices as strings.
 */
function filterRowsByPixelDistance(pixelCountPerRow, maxDistance = 20, iterations = 5) {

    let filteredRows = Object.keys(pixelCountPerRow);

    for (let i = 0; i < iterations; i++) {
        filteredRows = filteredRows.filter((row, index, rows) => {
            const nextRow = parseInt(rows[index + 1]);
            const currentRow = parseInt(row);

            if (nextRow && nextRow - currentRow <= maxDistance) {
                return pixelCountPerRow[currentRow] >= pixelCountPerRow[nextRow];
            }
            return true;
        });
    }
    return filteredRows;
}

/**
 * Filters given rows by keeping only those having at least a minimum pixel count.
 *
 * @param {Object} pixelCountPerRow - An object where keys represent row indices and values represent pixel counts.
 * @param {number} minPixelCount - The minimum pixel count required for a row to be included in the output.
 * @returns {Object} filteredPixelCountPerRow - An object containing the filtered rows with at least the minimum pixel count.
 */
function filterRowsWithMinPixelCount(pixelCountPerRow, minPixelCount) {
    const filteredPixelCountPerRow = {};
    for (const row in pixelCountPerRow) {
        if (pixelCountPerRow[row] >= minPixelCount) {
            filteredPixelCountPerRow[row] = pixelCountPerRow[row];
        }
    }
    return filteredPixelCountPerRow;
}

/**
 * Filters the given column's non-white pixels based on the average pixels per row, removing any outliers.
 *
 * @param {Array} columnNonWhitePixels - List of non-white pixel objects with x and y coordinate properties.
 * @returns {Array} Returns a list of filtered non-white pixels in the column.
 */
function filterNonWhitePixelsByRow(columnNonWhitePixels) {
    let pixelCountPerRow = getPixelCountPerRow(columnNonWhitePixels);
    pixelCountPerRow = filterRowsWithMinPixelCount(pixelCountPerRow, 20);
    let pixelDistance = 8 + 4 * getKindleFontSize();
    let filteredRows = filterRowsByPixelDistance(pixelCountPerRow,pixelDistance);
    const averagePixelsPerRow =
        columnNonWhitePixels.length / Object.keys(pixelCountPerRow).length;
    const filteredRowsBasedOnAverage = filteredRows.filter(
        (row) => pixelCountPerRow[row] > averagePixelsPerRow * 0.2 // Adjust the multiplier as needed
    );
    // Keep only the pixels that belong to the filtered rows
    return columnNonWhitePixels.filter((pixel) =>
        filteredRowsBasedOnAverage.includes(pixel.y.toString())
    );
}

/**
 * Filters the non-white pixels for each column range, considering minimum pixel count per row and
 * pixel distance.
 * @param {Array} columnRanges - An array containing column ranges.
 * @returns {Array} filteredPixelsPerColumnRange - An array containing filtered non-white pixels for each column range.
 */
function filterNonWhitePixelsByColumnRanges(columnRanges) {
    return columnRanges.map(columnRange => filterNonWhitePixelsByRow(filterConsecutiveNonWhitePixels(getColumnNonWhitePixels(columnRange))));
}
function logExecutionTime(message, startTime, print_logs=false) {
    logs.push(`${message} Execution time: ${Date.now() - startTime} ms`);
    if (logs.length > 100){
        logs = [];
    }
    if(print_logs) {
        console.log(logs.at(-1));
    }
}

function getAllElementsWithAttribute(root, attributeName) {
  const elements = [];

  const recurse = (node) => {
    if (node.nodeType === Node.ELEMENT_NODE && node.hasAttribute(attributeName)) {
      elements.push(node);
    }
    if (node.shadowRoot) {
      recurse(node.shadowRoot);
    }
    for (const child of node.children) {
      recurse(child);
    }
  };

  recurse(root);
  return elements;
}
function getKindleFontSize() {
    let attributeName = 'aria-valuenow';
    let root = document.documentElement;
    let elementsWithAttribute = getAllElementsWithAttribute(root, attributeName);
    let fontSliderElement = elementsWithAttribute[0];
    if (fontSliderElement !== undefined && fontSliderElement.style.left === '100%') {
        return parseInt(elementsWithAttribute[0].getAttribute(attributeName))
    }
    console.warn("Kindle fontsize element not found. Returning default");
    return defaultKindleFontSize;
}

function drawGuidelines() {
    let start = Date.now();
    let imageWithText = document.getElementsByClassName('kg-full-page-img')[0];
    let imageWithTextRect = imageWithText.getBoundingClientRect();
    // Create a canvas and set its dimensions to match the image
    canvas = document.createElement('canvas');
    canvas.width = imageWithText.width;
    canvas.height = imageWithText.height;
    let maxX = canvas.width;
    let maxY = canvas.height;
    let ctx = canvas.getContext('2d');
    guideLinesCanvas.id = 'lines-canvas'
    guideLinesCanvas.width = imageWithText.width;
    guideLinesCanvas.height = imageWithText.height;
    document.body.appendChild(guideLinesCanvas);
    ctx.drawImage(imageWithText, 0, 0);
    imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    data = imageData.data;
    logExecutionTime("1", start);
    nonWhitePixels = findNonWhitePixels();
    logExecutionTime("2", start);
    nonWhitePixels.sort(sortPixels);
    let columns = getColumns(maxX, maxY);
    columnRanges = getColumnRanges(columns);
    logExecutionTime("3", start);
    var filteredPixelsPerColumnRange = filterNonWhitePixelsByColumnRanges(columnRanges);
    logExecutionTime("4", start);
    draw(filteredPixelsPerColumnRange, columnRanges,imageWithTextRect);
    logExecutionTime("5", start);
}
function updateUnderlinePos(event) {

    let stop = false;
    if (stop) {
        return;
    }
    let imageWithText = document.getElementsByClassName('kg-full-page-img')[0];
    if (imageWithText === undefined){
        return;
    }
    let imageWithTextRect = imageWithText.getBoundingClientRect();
      var mouseX;
  var mouseY;
        if (event == null){
                 mouseX = imageWithTextRect.left;
                 mouseY =imageWithTextRect.top;
    }else {
             mouseX = event.clientX - imageWithTextRect.left;
             mouseY = event.clientY - imageWithTextRect.top;
        }
    drawUnderline(mouseX,mouseY);
    // stopUnderlineAnimationAfterDelay();
}
var canvas;
var nonWhitePixels = [];
var imageData;
var data;
var guideLinesCanvas=document.createElement('canvas');
var monitoringCanvas = document.createElement("canvas");
var monitoringCtx = monitoringCanvas.getContext("2d");
// Define the specific section of imageWithText to be checked
var lines;
var columnRanges;
drawGuidelines();

document.addEventListener('mousemove', event => {
    updateUnderlinePos(event);
});

let imageWithTextSrc = document.getElementsByClassName('kg-full-page-img')[0].src;
// Monitor the imageWithText every 200ms
setInterval(function () {

  if ( document.getElementsByClassName('kg-full-page-img')[0].src !== imageWithTextSrc) {
    drawGuidelines();
    updateUnderlinePos(null)
    imageWithTextSrc = document.getElementsByClassName('kg-full-page-img')[0].src;
  }
}, 100);