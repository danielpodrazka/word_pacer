var underlineTimeout;
var animationInterval;
var timeBeforeScrolling; // miliseconds
var foundRectIndex;
var wordsPerMinute;
var previousRectY;
var bodyTextElements;
var allWordCoordinates = [];
var overlay;
var stop = true;
var rectSetByUser;
var mouseDistance;
var underlineColor;

function findMostFrequentColor(elementColors) {
  const colorsCount = elementColors.reduce((acc, color) => {
    acc[color] = (acc[color] || 0) + 1;
    return acc;
  }, {});
  let mostFrequentColor = null;
  let maxCount = 0;
  for (const color in colorsCount) {
    if (colorsCount[color] > maxCount) {
      maxCount = colorsCount[color];
      mostFrequentColor = color;
    }
  }
  return mostFrequentColor;
}

function getMostCommonColor(bodyTextElements) {
  const elementColors = [];
  for (let i = 0; i < bodyTextElements.length; i++) {
    const color = window.getComputedStyle(bodyTextElements[i].parentNode).color;
    elementColors.push(color);
  }
  return findMostFrequentColor(elementColors);
}

function startUnderlineAnimation() {
    if (stop) {
        return;
    }
    const wordsIntervalDuration = (60 / wordsPerMinute) * 1000;
    var scrolling = false;
    const moveUnderlineToNextWord = () => {
        let prevRect;
        let currentCoords;

        if (mouseDistance > 200) {
            return;
        }
        prevRect = allWordCoordinates[foundRectIndex - 1];
            if (prevRect !== undefined) {
                previousRectY = prevRect.rect.y;
            } else {
                previousRectY = 0;
            }
        currentCoords = allWordCoordinates[foundRectIndex];

        overlay.innerHTML = '';
        scrolling = previousRectY && previousRectY < currentCoords.rect.y && !stop && currentCoords.rect !== rectSetByUser && !scrolling;
        if (scrolling) {
            window.scrollBy({
                top: currentCoords.rect.y - previousRectY,
                behavior: 'instant'
            });
            foundRectIndex--;
        }
        if (currentCoords !== undefined) {
          let newUnderline = createUnderline(currentCoords.rect);
            overlay.appendChild(newUnderline);

        }
        foundRectIndex++;
        if (foundRectIndex >= allWordCoordinates.length) {
            clearInterval(animationInterval);
        }
    };
    moveUnderlineToNextWord();

    animationInterval = setInterval(moveUnderlineToNextWord, wordsIntervalDuration);
}

function stopUnderlineAnimationAfterDelay() {
    clearTimeout(underlineTimeout);
    clearInterval(animationInterval);
    underlineTimeout = setTimeout(() => {
        startUnderlineAnimation();
    }, timeBeforeScrolling);
}

function getTextNodes(element) {
    let textNodes = [];
    for (let node of element.childNodes) {
        if (node.nodeType === Node.TEXT_NODE && node.textContent.trim() !== "") {
            textNodes.push(node);
        } else if (node.nodeType === Node.ELEMENT_NODE) {
            textNodes = textNodes.concat(getTextNodes(node));
        }
    }
    return textNodes;
}

function updateUnderlinePos(event) {
    if (stop) {
        return;
    }
    const mouseX = event.clientX;
    const mouseY = event.clientY;
    let nearest = null;
    let minDistance = Number.MAX_VALUE;
    let nearestWord = null; // Adding variable to store the nearest word
    allWordCoordinates.forEach(({word, rect}) => {
        const centerX = rect.left;
        const centerY = rect.top + rect.height / 2;
        const distance = Math.hypot(centerX - mouseX, centerY - mouseY);
        if (distance < minDistance) {
            minDistance = distance;
            nearest = rect;
            nearestWord = word; // Storing the nearest word
            mouseDistance = distance;
            foundRectIndex = allWordCoordinates.findIndex(
                (element) => element.rect === nearest
            );
        }
    });
    console.log(nearestWord); // Log the nearest word to the console
    overlay.innerHTML = ''; // remove previous underlines
    rectSetByUser = nearest;
    const newUnderline = createUnderline(nearest);
    overlay.appendChild(newUnderline);
    stopUnderlineAnimationAfterDelay();
}

function getWordCoordinates(textNode) {
    const range = document.createRange();
    const words = textNode.textContent.split(' ');
    const coordinates = [];
    words.forEach((word, index) => {
        range.setStart(textNode, index ? range.endOffset + 1 : 0);
        range.setEnd(textNode, range.startOffset + word.length);
        const rects = range.getClientRects();
        Array.from(rects).forEach(rect => {
            coordinates.push({word, rect});
        });
    });
    return coordinates;
}

function updateOverlayPosition() {
    if (stop) {
        return;
    }
    console.log("Updating overlay position");
    let overlay = document.getElementById("read-overlay");
    overlay.style.top = `${document.documentElement.scrollTop}px`;
}

function updateWordCoordinates() {
    if (stop) {
        return;
    }
    allWordCoordinates = [];
    bodyTextElements.forEach(node => {
        const coords = getWordCoordinates(node);
        allWordCoordinates = allWordCoordinates.concat(coords);
    });
}

function createUnderline(rect) {
    const underline = document.createElement('div');
    underline.style.position = 'fixed';
    underline.style.left = `${rect.left}px`;
    underline.style.top = `${rect.bottom - 1}px`;
    underline.style.width = `${rect.width}px`;
    underline.style.height = '1px';
    underline.style.backgroundColor = underlineColor;
    return underline;
}

function startReadingAssistant() {
    stop = false;
    foundRectIndex = 0;
    bodyTextElements = getTextNodes(document.body);
    underlineColor = getMostCommonColor(bodyTextElements);
    function main() {
        overlay = document.createElement('div');
        overlay.style.position = 'fixed';
        overlay.style.top = '0';
        overlay.style.left = '0';
        overlay.style.width = '100%';
        overlay.style.height = '100%';
        overlay.style.pointerEvents = 'none';
        overlay.id = 'read-overlay';
        document.body.appendChild(overlay);
        bodyTextElements.forEach(node => {
            const coords = getWordCoordinates(node);
            allWordCoordinates = allWordCoordinates.concat(coords);
        });
        document.addEventListener('scroll', event => {
            updateOverlayPosition();
            updateWordCoordinates();
            overlay.innerHTML = '';
        });

        updateOverlayPosition();
        document.addEventListener('mousemove', event => {
            updateUnderlinePos(event);
        });
        chrome.storage.sync.get(["wordsPerMinute", "timeBeforeScrolling"], (items) => {
            if (items.wordsPerMinute) {
                wordsPerMinute = items.wordsPerMinute;
            }
            if (items.timeBeforeScrolling) {
                timeBeforeScrolling = items.timeBeforeScrolling;
            }
            stopUnderlineAnimationAfterDelay();
        });
    }
    main();
}

function stopReadingAssistant() {
    stop = true;
    overlay.innerHTML = '';
    stopUnderlineAnimationAfterDelay();
}
chrome.runtime.onMessage.addListener(
  (request, sender, sendResponse) => {
    if (request.command === "start") {
      startReadingAssistant();
    } else if (request.command === "stop") {
      stopReadingAssistant();
    }
  }
);
chrome.runtime.sendMessage({ message: "contentScriptReady" });
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.command === "start") {
    startReadingAssistant();
  } else if (request.command === "stop") {
    stopReadingAssistant();
  }
});
