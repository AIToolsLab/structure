const DEBUG = true;
const SERVER_URL = DEBUG ? 'http://127.0.0.1:8000' : '';

// Declare global_data variable that will be received from the server
// TODO: need to type this, need to figure out the API response
let globalData: any;

const analyzeBtn = document.querySelector('#analyze-btn')!;

document.addEventListener('DOMContentLoaded', function() {
    resetSpanIds();
});

async function analyze() {
    document.querySelector('#outline-title')!.innerHTML = 'Outline';
    document.querySelector('#essay-title')!.innerHTML = 'Essay';
    
    // Get the textarea element and its value
    const outline = (document.getElementById('outline-textarea') as HTMLTextAreaElement).value;
    const essay = (document.getElementById('essay-textarea') as HTMLTextAreaElement).value;

    // Send a POST request to the server with the data
    const payload = {
        outline: outline,
        essay: essay,
    };

    document.querySelector('#loading')!.classList.remove('hidden');

    try {
        const res = await fetch(`${ SERVER_URL }/analyze`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        });
    
        const json = await res.json();

        console.log(json);
        globalData = json;
        colorMatches(json[0]);
        resetChooseSentenceAttribute();

        document.querySelector('#loading')!.classList.add('hidden');
    }
    catch(e) {
        console.error(e);
    }
}

analyzeBtn.addEventListener('click', analyze);

function convertOutlineAreaToHTML(text: string) {
    // Split the text into paragraphs
    const paragraphs = text.split(/\r?\n\r?\n/);

    // Create an array of spans with each paragraph
    const spans = paragraphs.map((paragraph) => {
        // Split the paragraph into sentences
        const sentences = paragraph.split(/(?<=[.?!])\s/g);

        // Create an array of spans with each sentence
        const sentenceSpans = sentences.map((sentence, index) => {
            // Check if the sentence ends with a period
            const endsWithPeriod = /\.$/.test(sentence);

            return `<span id='outline-${ index }'>${ sentence.trim() }</span>`;
        });

        // Join the sentence spans with br elements
        const sentenceHtml = sentenceSpans.join('<br>\n');

        return sentenceHtml;
    });

    // Join the spans with br elements
    const html = spans.join('<br>\n<br>\n');

    // Wrap the result in a div with the class 'popup-content'
    return html;
}

function convertTextareaToHTML(text: string) {
    // Split the text into paragraphs
    const paragraphs = text.split(/\r?\n\r?\n/);

    // Create an array of span elements with each sentence in each paragraph
    let sentenceIndex = 0;

    const spans = paragraphs.map((paragraph) => {
        const sentences = paragraph.split(/(?<=[.?!])\s+/);

        const sentenceSpans = sentences
            .filter((sentence) => sentence.trim() !== '')
            .map((sentence) => {
                const sentenceSpan = `<span id='span-${ sentenceIndex }'>${ sentence.trim() }</span>`;
                
                sentenceIndex++;
                
                return sentenceSpan;
            });

        return sentenceSpans.join('<br>\n');
    });

    // Join the spans with <br> elements if there was a new line in the original input
    const html =
        paragraphs.length > 1
            ? spans.join('<br>\n<br>\n')
            : spans.join('<br>\n');

    // Wrap the result in a div with the class 'popup-content'
    return html;
}

function resetSpanIds() {
    // Give unique IDs to all the spans of the text
    // Get the div element by its ID
    let divElement = document.getElementById('essay-text')!;

    // Get all the span elements inside the div element
    let spanElements = divElement.getElementsByTagName('span');

    // Loop through each span element and add an id attribute
    for (let i = 0; i < spanElements.length; i++) {
        spanElements[i].setAttribute('id', 'span-' + i);
    }
}

function resetChooseSentenceAttribute() {
    // Get the div element by its ID where text spans are residing
    const divElement = document.getElementById('essay-text')!;

    // Get all the span elements inside the div element
    const spanElements = divElement.getElementsByTagName('span');
    
    // Loop through each span element and add an onclick attribute
    for (let i = 0; i < spanElements.length; i++) {
        spanElements[i].addEventListener('click', chooseSentence);
    }
}

// Define the getSpanId function to handle the click event
function chooseSentence(e: MouseEvent) {
    let spanId = (e.target as HTMLSpanElement).id; // Get the ID of the clicked span

    // Highlighting sentence on click
    const highlightingSen = document.getElementById(spanId)!;
    highlightingSen.classList.toggle('highlighted');

    // Extract number from the id of a span
    const match = spanId.match(/-(\d+)/); // matches the dash followed by one or more digits
    let num = parseInt(match![1], 10); // extracts the number and returns it as a parsed integer

    // Get highest indexes of logprobs
    // hightolowindices = getHighestIndexes(global_data[1][num], 3);
    let hightolowindices = sortedIndices(globalData[1][num]);

    const gradientStart = [82, 183, 136]; // starting color in RGB
    const gradientEnd = [255, 255, 255]; // ending color in RGB

    let prevColor = gradientStart.slice(); // initialize with starting color

    // Create span with empty spaces where the current sentence can move
    for (let i = 0; i < hightolowindices.length; i++) {
        // If the suggested place is not the same as where the sentence is currently is
        console.log('index: ', hightolowindices[i]);
        console.log('num: ', num);

        if (hightolowindices[i] !== num && num !== hightolowindices[i] + 1) {
            // Create a span
            const tempSpan = document.createElement('span');
            tempSpan.setAttribute('class', 'option');

            // Calculate color for current span
            let currentColor = prevColor.slice(); // initialize with previous color
            const colorChangeFactor = 1.5; // amplify the color change
            
            for (let j = 0; j < 3; j++) {
                if (prevColor[j] < gradientEnd[j]) {
                    currentColor[j] += Math.round(
                        (colorChangeFactor * (gradientEnd[j] - prevColor[j])) /
                            (hightolowindices.length - 1)
                    );

                    if (currentColor[j] > gradientEnd[j]) currentColor[j] = gradientEnd[j];
                }
            }
            prevColor = currentColor.slice(); // set previous color to current color

            // Apply gradient color to temp_span
            const currentColorString = `rgb(${ currentColor[0] }, ${ currentColor[1] }, ${ currentColor[2] })`;
            tempSpan.style.backgroundColor = currentColorString;
            tempSpan.innerHTML = ' Click to move the sentence here.';
            tempSpan.style.border = '1px solid black';

            // ! What is this
            const option = document
                .getElementById('span-' + hightolowindices[i].toString())!
                .insertAdjacentElement('afterend', tempSpan);

            const excludedSpans = document.querySelectorAll('.option');

            // Detecting mouse click
            document.addEventListener('mousedown', function(event) {
                console.log('mouse detected');

                // If clicked not on the alternative places
                if (!Array.from(excludedSpans).includes((event.target as HTMLSpanElement))) {
                    console.log('clicked somewhere else');

                    // ! What is this for
                    const options = document.getElementsByClassName('option');

                    for (let i = 0; i < excludedSpans.length; i++) {
                        excludedSpans[i].remove();
                    }

                    // Unhighlight
                    highlightingSen.classList.remove('highlighted');
                }
                else {
                    // If suggestion is picked...
                    // Change content of empty span
                    tempSpan.addEventListener('click', function () {
                        tempSpan.style.backgroundColor = 'white';
                        tempSpan.style.border = '';
                        tempSpan.innerHTML =
                            '<br>' + highlightingSen.innerHTML;
                            tempSpan.classList.remove('option');

                        const options =
                            document.getElementsByClassName('option');

                        // Remove remaining spans that were not chosen by the user
                        while (options.length > 0) {
                            options[0].remove();
                        }

                        // Remove initial span of interest
                        highlightingSen.remove();

                        reRenderHtml();
                        resetSpanIds();
                        
                        analyze();
                        resetChooseSentenceAttribute();
                        
                        return;
                    });
                }
            });
        }
    }
}

function reRenderHtml() {
    const divElement = document.getElementById('essay-div')!;
    const divContent = divElement.innerHTML;

    const newContent = divContent.replace(/(<br>\s*){2,}/g, '<br>');
    divElement.innerHTML = newContent;

    const currentHtmlContent = divElement.innerHTML;
    divElement.innerHTML = currentHtmlContent;
}

// Find intexes of three lowest integers in a list
// Top 'num' elements
function getHighestIndexes(list: number[], num: number) {
    const sortedList = [...list].sort((a, b) => b - a); // Make a sorted copy of the list
    const indexes = [];

    // Get the index of the first three elements in the sorted list
    for (let i = 0; i < num; i++) {
        const index = list.indexOf(sortedList[i]);
        indexes.push(index);
    }

    return indexes;
}

async function makeMatches() {
    const response = await fetch(`${ SERVER_URL }/item/match`);
    const data = await response.json();

    colorMatches(data);
};

// TODO: need to type data as well
function colorMatches(data: any) {
    console.log('Embeddings:', data[0]);

    for (let j = 0; j < data.length; j++) {
        const outlinePar = 'outline-' + j;
        // Get top 3
        const indicesOfMax = reversedSortedIndices(data[j]);
        console.log('indices of max: ', indicesOfMax);

        document.getElementById(outlinePar)!.onmouseover = function () {
            document.getElementById(outlinePar)!.style.backgroundColor = '#f09819';

            const gradientStart = [240, 152, 25]; // starting color in RGB
            const gradientEnd = [255, 255, 255]; // ending color in RGB

            let currentColor = gradientStart.slice(); // initialize with starting color

            for (let i = 0; i < indicesOfMax.length; i++) {
                const elemId = 'span-' + indicesOfMax[i];

                document.getElementById(elemId)!.style.backgroundColor 
                    = `rgb(${ currentColor[0] }, ${ currentColor[1] }, ${ currentColor[2] })`;
                
                    // calculate the next color in the gradient
                for (let j = 0; j < 3; j++) {
                    if (gradientStart[j] < gradientEnd[j]) {
                        currentColor[j] += Math.round(
                            (gradientEnd[j] - gradientStart[j]) /
                            indicesOfMax.length
                        );

                        if (currentColor[j] > gradientEnd[j]) currentColor[j] = gradientEnd[j];
                    }
                }
            }
        };

        document.getElementById(outlinePar)!.onmouseleave = function () {
            document.getElementById(outlinePar)!.style.backgroundColor = 'white';

            for (let i = 0; i < indicesOfMax.length; i++) {
                const elemId = 'span-' + indicesOfMax[i];

                document.getElementById(elemId)!.style.backgroundColor = 'white';
            }
        };
    }
};

// Return a list of sorted indices from high to low numbers
function sortedIndices(numbers: number[]) {
    // Create an array of indices
    const indices = numbers.map((_, i) => i);

    // Sort the indices based on the values in the numbers array
    indices.sort((a, b) => numbers[b] - numbers[a]);

    return indices;
}

function reversedSortedIndices(numbers: number[]) {
    // Create an array of indices
    const indices = numbers.map((_, i) => i);

    // Sort the indices based on the values in the numbers array in ascending order
    indices.sort((a, b) => numbers[a] - numbers[b]);

    return indices;
}

// https://stackoverflow.com/questions/11792158/optimized-javascript-code-to-find-3-largest-element-and-its-indexes-in-array
function findIndicesOfMin(inp: number[], count: number) {
    let outp = [];

    for (let i = 0; i < inp.length; i++) {
        outp.push(i); // add index to output array

        if (outp.length >= count) {
            outp.sort(function (a, b) {
                return inp[a] - inp[b];
            }); // ascending sort the output array
            
            outp.pop(); // remove the last index (index of largest element in output array)
        }
    }

    return outp;
}

async function makeChanges() {
    // Change HTML section with received data
    console.log('received');

    const response = await fetch(`${ SERVER_URL }/item`);
    const data = await response.json();
    
    assessFix(data);
};

// TODO: need to type data as well
// TODO: This looks similar to other functions, maybe we can combine them
function assessFix(data: any) {
    console.log(data);

    for (let i = 0; i < data.length; i++) {
        const spanId = 'span-' + i;

        for (let j = 0; j < data.length; j++) {
            const newIndex = data[j]['new-order'];

            if (newIndex === i) {
                const currSpan = document.getElementById(spanId)!;

                currSpan.insertAdjacentHTML(
                    'afterend',
                    `<span class='${ spanId }'>${ data[j]['text'] }</span>`
                );

                currSpan.remove();
            }
        }
    }
};

export {};
