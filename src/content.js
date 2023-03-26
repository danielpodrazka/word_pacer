var underlineTimeout;
var animationInterval;
var timeBeforeScrolling = 500; // miliseconds
var foundRectIndex = 0;
var wordsPerMinute = 500;
var previousRectY = 0;
var bodyTextElements;
var allWordCoordinates = [];
var overlay;
var stop = true;
var rectSetByUser;
var mouseDistance;

function startUnderlineAnimation() {
    if (stop) {
        return;
    }
    const wordsIntervalDuration = (60 / wordsPerMinute) * 1000;
    const moveUnderlineToNextWord = () => {
        if (mouseDistance > 200) {
            return;
        }

        if (foundRectIndex > 0) {
            previousRectY = allWordCoordinates[foundRectIndex - 1].rect.y;
        } else {
            previousRectY = 0;
        }
        const currentCoords = allWordCoordinates[foundRectIndex];
        overlay.innerHTML = '';

        if (previousRectY && previousRectY < currentCoords.rect.y && !stop && currentCoords.rect !== rectSetByUser) {
            window.scrollBy({
                top: currentCoords.rect.y - previousRectY,
                behavior: 'smooth'
            });
        } else {
            const newUnderline = createUnderline(currentCoords.rect);
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
    underline.style.backgroundColor = 'black';
    return underline;
}


function startReadingAssistant() {
    stop = false;
    foundRectIndex = 0;
    bodyTextElements = getTextNodes(document.body);

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
