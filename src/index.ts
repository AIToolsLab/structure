// Declare global_data variable that will be received from the server
let global_data;

function analyze() {
    document.querySelector('#outline-title').innerHTML = 'Outline';
    document.querySelector('#essay-title').innerHTML = 'Essay';
    // Get the textarea element and its value
    var outline_textarea = document.querySelector('#outline_div_id');
    if (outline_textarea != null) {
        var outline_textarea = document.querySelector('#outline_div_id');
        var outline_textarea_content = outline_textarea.innerText;
    } else {
        var outline_textarea = document.querySelector('#outline-textarea');
        var outline_textarea_content = outline_textarea.value;
        const outline_sentences_html = convertOutlineareaToHTML(
            outline_textarea_content
        );
        const outline_parent_div = document.createElement('div');
        outline_parent_div.innerHTML = outline_sentences_html;
        outline_parent_div.setAttribute('id', 'outline_div_id');
        outline_textarea.parentNode.replaceChild(
            outline_parent_div,
            outline_textarea
        );
    }
    outline_value = outline_textarea_content;

    var essay_textarea = document.querySelector('#essay_div_id');
    if (essay_textarea != null) {
        var essay_textarea = document.querySelector('#essay_div_id');
        var essay_textarea_content = essay_textarea.innerText;
    } else {
        var essay_textarea = document.querySelector('#essay-textarea');
        var essay_textarea_content = essay_textarea.value;
        const essay_sentences_html = convertTextareaToHTML(
            essay_textarea_content
        );
        const essay_parent_div = document.createElement('div');
        essay_parent_div.innerHTML = essay_sentences_html;
        essay_parent_div.setAttribute('id', 'essay_div_id');
        essay_textarea.parentNode.replaceChild(
            essay_parent_div,
            essay_textarea
        );
    }
    
    essay_value = essay_textarea_content;

    // Send a POST request to the server with the data
    const payload = {
        outline: outline_value,
        essay: essay_value,
    };

    fetch('http://127.0.0.1:8000/analyze', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
    })
        .then((response) => response.json())
        .then((data) => {
            console.log(data);
            global_data = data;
            colorMatches(data[0]);
            resetChooseSentenceAttribute();
        })
        .catch((error) => console.error(error));
}

document.addEventListener('DOMContentLoaded', function () {
    resetSpanIds();
});

function convertOutlineareaToHTML(text) {
    // Split the text into paragraphs
    const paragraphs = text.split(/\r?\n\r?\n/);

    // Create an array of spans with each paragraph
    const spans = paragraphs.map((paragraph, index) => {
        // Split the paragraph into sentences
        const sentences = paragraph.split(/(?<=[.?!])\s/g);

        // Create an array of spans with each sentence
        const sentenceSpans = sentences.map((sentence, index) => {
            // Check if the sentence ends with a period
            const endsWithPeriod = /\.$/.test(sentence);
            return `<span id='outline-${index}'>${sentence.trim()}</span>`;
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

function convertTextareaToHTML(text) {
    // Split the text into paragraphs
    const paragraphs = text.split(/\r?\n\r?\n/);

    // Create an array of span elements with each sentence in each paragraph
    let sentenceIndex = 0;
    const spans = paragraphs.map((paragraph, index) => {
        const sentences = paragraph.split(/(?<=[.?!])\s+/);
        const sentenceSpans = sentences
            .filter((sentence) => sentence.trim() !== '')
            .map((sentence) => {
                const sentenceSpan = `<span id='span-${sentenceIndex}'>${sentence.trim()}</span>`;
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
    var divElement = document.getElementById('essay_text_id');

    // Get all the span elements inside the div element
    var spanElements = divElement.getElementsByTagName('span');

    // Loop through each span element and add an id attribute
    for (var i = 0; i < spanElements.length; i++) {
        spanElements[i].setAttribute('id', 'span-' + i);
    }
}

function resetChooseSentenceAttribute() {
    // Get the div element by its ID where text spans are residing
    const divElement = document.getElementById('essay_text_id');
    // Get all the span elements inside the div element
    const spanElements = divElement.getElementsByTagName('span');
    // Loop through each span element and add an onclick attribute
    for (var i = 0; i < spanElements.length; i++) {
        spanElements[i].setAttribute('onclick', 'chooseSentence()');
    }
}

// Define the getSpanId function to handle the click event
function chooseSentence() {
    var span_id = event.target.id; // Get the ID of the clicked span

    // Highlighting sentence on click
    const highlighting_sen = document.getElementById(span_id);
    highlighting_sen.classList.toggle('highlighted');

    // Extract number from the id of a span
    const match = span_id.match(/-(\d+)/); // matches the dash followed by one or more digits
    num = match ? parseInt(match[1], 10) : null; // extracts the number and returns it as a parsed integer

    // Get highest indexes of logprobs
    // hightolowindices = getHighestIndexes(global_data[1][num], 3);
    hightolowindices = sortedIndices(global_data[1][num]);

    const gradientStart = [82, 183, 136]; // starting color in RGB
    const gradientEnd = [255, 255, 255]; // ending color in RGB
    let prev_color = gradientStart.slice(); // initialize with starting color

    // Create span with empty spaces where the current sentence can move
    for (let i = 0; i < hightolowindices.length; i++) {
        // If the suggested place is not the same as where the sentence is currently is
        console.log('index: ', hightolowindices[i]);
        console.log('num: ', num);
        if (hightolowindices[i] != num && num != hightolowindices[i] + 1) {
            // Create a span
            const temp_span = document.createElement('span');
            temp_span.setAttribute('class', 'option');

            // Calculate color for current span
            let currentColor = prev_color.slice(); // initialize with previous color
            const colorChangeFactor = 1.5; // amplify the color change
            for (let j = 0; j < 3; j++) {
                if (prev_color[j] < gradientEnd[j]) {
                    currentColor[j] += Math.round(
                        (colorChangeFactor * (gradientEnd[j] - prev_color[j])) /
                            (hightolowindices.length - 1)
                    );
                    if (currentColor[j] > gradientEnd[j]) {
                        currentColor[j] = gradientEnd[j];
                    }
                }
            }
            prev_color = currentColor.slice(); // set previous color to current color

            // Apply gradient color to temp_span
            const currentColorString = `rgb(${currentColor[0]}, ${currentColor[1]}, ${currentColor[2]})`;
            temp_span.style.backgroundColor = currentColorString;
            temp_span.innerHTML = ' Click to move the sentence here.';
            temp_span.style.border = '1px solid black';
            const option = document
                .getElementById('span-' + hightolowindices[i].toString())
                .insertAdjacentElement('afterend', temp_span);

            const excluded_spans = document.querySelectorAll('.option');

            // Detecting mouse click
            document.addEventListener('mousedown', function (event) {
                console.log('mouse detected');
                // If clicked not on the alternative places
                if (!Array.from(excluded_spans).includes(event.target)) {
                    console.log('clicked somewhere else');
                    const options = document.getElementsByClassName('option');
                    for (
                        let index = 0;
                        index < excluded_spans.length;
                        index++
                    ) {
                        excluded_spans[index].remove();
                    }
                    // Unhighlight
                    highlighting_sen.classList.remove('highlighted');
                } else {
                    // If suggestion is picked...
                    // Change content of empty span
                    temp_span.addEventListener('click', function () {
                        temp_span.style.backgroundColor = 'white';
                        temp_span.style.border = '';
                        temp_span.innerHTML =
                            '<br>' + highlighting_sen.innerHTML;
                        temp_span.classList.remove('option');

                        const options =
                            document.getElementsByClassName('option');
                        // Remove remaining spans that were not chosen by the user
                        while (options.length > 0) {
                            options[0].remove();
                        }
                        // Remove initial span of interest
                        highlighting_sen.remove();
                        reRenderHtml();
                        resetSpanIds();
                        const essay_div_element =
                            document.getElementById('essay_div_id');
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
    const divElement = document.getElementById('essay_div_id');
    const divContent = divElement.innerHTML;
    const newContent = divContent.replace(/(<br>\s*){2,}/g, '<br>');
    divElement.innerHTML = newContent;
    const currentHtmlContent = divElement.innerHTML;
    divElement.innerHTML = currentHtmlContent;
}

// Find intexes of three lowest integers in a list
// Top 'num' elements
function getHighestIndexes(list, num) {
    const sortedList = [...list].sort((a, b) => b - a); // Make a sorted copy of the list
    const indexes = [];

    // Get the index of the first three elements in the sorted list
    for (let i = 0; i < num; i++) {
        const index = list.indexOf(sortedList[i]);
        indexes.push(index);
    }

    return indexes;
}

makeMatches = async () => {
    const response = await fetch('http://127.0.0.1:8000/item/match');
    const data = await response.json();
    colorMatches(data);
};

colorMatches = (data) => {
    console.log('Embeddings:', data[0]);
    for (let j = 0; j < data.length; j++) {
        const outline_par = 'outline-' + j;
        // Get top 3
        // const indices_of_max = findIndicesOfMin(data[j], 3);
        const indices_of_max = reversedSortedIndices(data[j]);
        console.log('indices of max: ', indices_of_max);

        // document.getElementById(outline_par).onmouseover = function () {
        //     document.getElementById(outline_par).style.backgroundColor = '#f59b42';
        //     for (let i = 0; i < indices_of_max.length; i++) {
        //         const elem_id = 'span-' + indices_of_max[i];
        //         document.getElementById(elem_id).style.backgroundColor = '#f59b42';
        //     }
        // }
        document.getElementById(outline_par).onmouseover = function () {
            document.getElementById(outline_par).style.backgroundColor =
                '#f09819';
            const gradientStart = [240, 152, 25]; // starting color in RGB
            const gradientEnd = [255, 255, 255]; // ending color in RGB
            let currentColor = gradientStart.slice(); // initialize with starting color
            for (let i = 0; i < indices_of_max.length; i++) {
                const elem_id = 'span-' + indices_of_max[i];
                document.getElementById(
                    elem_id
                ).style.backgroundColor = `rgb(${currentColor[0]}, ${currentColor[1]}, ${currentColor[2]})`;
                // calculate the next color in the gradient
                for (let j = 0; j < 3; j++) {
                    if (gradientStart[j] < gradientEnd[j]) {
                        currentColor[j] += Math.round(
                            (gradientEnd[j] - gradientStart[j]) /
                                indices_of_max.length
                        );
                        if (currentColor[j] > gradientEnd[j]) {
                            currentColor[j] = gradientEnd[j];
                        }
                    }
                }
            }
        };
        document.getElementById(outline_par).onmouseleave = function () {
            document.getElementById(outline_par).style.backgroundColor =
                'white';
            for (let i = 0; i < indices_of_max.length; i++) {
                const elem_id = 'span-' + indices_of_max[i];
                document.getElementById(elem_id).style.backgroundColor =
                    'white';
            }
        };
    }
};

// Return a list of sorted indices from high to low numbers
function sortedIndices(numbers) {
    // Create an array of indices
    const indices = numbers.map((_, i) => i);

    // Sort the indices based on the values in the numbers array
    indices.sort((a, b) => numbers[b] - numbers[a]);

    return indices;
}

function reversedSortedIndices(numbers) {
    // Create an array of indices
    const indices = numbers.map((_, i) => i);

    // Sort the indices based on the values in the numbers array in ascending order
    indices.sort((a, b) => numbers[a] - numbers[b]);

    return indices;
}

// https://stackoverflow.com/questions/11792158/optimized-javascript-code-to-find-3-largest-element-and-its-indexes-in-array
function findIndicesOfMin(inp, count) {
    var outp = [];
    for (var i = 0; i < inp.length; i++) {
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

makeChanges = async () => {
    // Change HTML section with received data
    console.log('received');
    const response = await fetch('http://127.0.0.1:8000/item');
    const data = await response.json();
    // console.log(data);
    assessFix(data);
};

assessFix = (data) => {
    console.log(data);
    for (let i = 0; i < data.length; i++) {
        const span_id = 'span-' + i;
        for (let j = 0; j < data.length; j++) {
            const new_index = data[j]['new-order'];
            if (new_index == i) {
                const curr_span = document.getElementById(span_id);
                curr_span.insertAdjacentHTML(
                    'afterend',
                    `<span class='${span_id}'>${data[j]['text']}</span>`
                );
                curr_span.remove();
            }
        }
    }
};

export {};
