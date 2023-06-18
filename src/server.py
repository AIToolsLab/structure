import os
import dotenv

from typing import Optional 

from joblib import Memory

import spacy
import numpy as np
import openai
from openai.embeddings_utils import (
    get_embedding,
    distances_from_embeddings,
)

from pydantic import BaseModel

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware 
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles

nlp = spacy.load('en_core_web_sm')

dotenv.load_dotenv()

openai.organization = 'org-9bUDqwqHW2Peg4u47Psf9uUo'
openai.api_key = os.getenv('OPENAI_API_KEY')

# EMBEDDINGS

# constants
EMBEDDING_MODEL = 'text-embedding-ada-002'

# outline_sections = [
#     'It took me eighteen years to realize what an extraordinary influence my mother has been on my life.',
#     'Her mother's enthusiasm for learning.',
#     'Learning through travel by using the example of a trip to Greece.',
#     'While I treasure the various worlds my mother has opened to me abroad, my life has been equally transformed by what she has shown me just two miles from my house.',
#     'Her mother's dedication to the community.',
#     'Her multiple volunteer activities such as helping at the local soup kitchen.',
#     'Everything that my mother has ever done has been overshadowed by the thought behind it.',
#     'She has enriched my life with her passion for learning, and changed it with her devotion to humanity.',
#     'Next year, I will find a new home miles away. However, my mother will always be by my side.'
# ]



# texts = [
#     'It took me eighteen years to realize what an extraordinary influence my mother has been on my life.',
#     'She's the kind of person who has thoughtful discussions about which artist she would most want to have her portrait painted by (Sargent), the kind of mother who always has time for her four children, and the kind of community leader who has a seat on the board of every major project to assist Washington's impoverished citizens.',
#     'Growing up with such a strong role model, I developed many of her enthusiasms.I not only came to love the excitement of learning simply for the sake of knowing something new, but I also came to understand the idea of giving back to the community in exchange for a new sense of life, love, and spirit.',
#     'My mother's enthusiasm for learning is most apparent in travel.',
#     'Despite the fact that we were traveling with fourteen-month-old twins, we managed to be at each ruin when the site opened at sunrise.',
#     'I vividly remember standing in an empty amphitheatre pretending to be an ancient tragedian, picking out my favorite sculpture in the Acropolis museum, and inserting our family into modified tales of the battle at Troy.',
#     'Eight years and half a dozen passport stamps later I have come to value what I have learned on these journes about global history, politics and culture, as well as my family and myself.',
#     'I was nine years old when my family visited Greece. Every night for three weeks before the trip, my older brother Peter and I sat with my mother on her bed reading Greek myths and taking notes on the Greek Gods.',
#     '''While I treasure the various worlds my mother has opened to me abroad, my life has been equally transformed by what she has shown me just two miles from my house.''',
#     '''As a ten year old, I often accompanied my mother to (name deleted), a local soup kitchen and children's center.''',
#     'While she attended meetings, I helped with the Summer Program by chasing children around the building and performing magic tricks.',
#     '''Having finally perfected the 'floating paintbrush' trick, I began work as a full time volunteer with the five and six year old children last June.''',
#     'It is here that I met Jane Doe, an exceptionally strong girl with a vigor that is contagious.',
#     'At the end of the summer, I decided to continue my work at (name deleted) as Jane's tutor.Although the position is often difficult, the personal rewards are beyond articulation.',
#     'In the seven years since I first walked through the doors of (name deleted), I have learned not only the idea of giving to others, but also of deriving from them a sense of spirit.',
#     'Everything that my mother has ever done has been overshadowed by the thought behind it.',
#     'While the raw experiences I have had at home and abroad have been spectacular, I have learned to truly value them by watching my mother.',
#     'She has enriched my life with her passion for learning, and changed it with her devotion to humanity.',
#     'In her endless love of everything and everyone she is touched by, I have seen a hope and life that is truly exceptional.',
#     'Next year, I will find a new home miles away.', 
#     'However, my mother will always be by my side.'
# ]

memory = Memory('./joblib_cache', verbose = 0)

# Note:
# Rate limiting is already implemented in https://github.com/openai/openai-python/blob/main/openai/embeddings_utils.py
# So we don't need to implement it here.
# If we did, we could do something like:
# get_embedding_ratelimited = retry(wait=wait_random_exponential(min=1, max=60), stop=stop_after_attempt(6))(get_embedding)

# Cache the embeddings so we don't have to request them every time (and pay for it)
@memory.cache
def get_embedding_cached(text):
    # Use the embedding model specified by EMBEDDING_MODEL
    return get_embedding(text, engine=EMBEDDING_MODEL)

def get_distances_from_query_list(query_list, texts):
    list_emb = [get_embedding_cached(text) for text in texts]
    distances = []
    for query in query_list:
        query_emb = get_embedding_cached(query)
        distances.append(distances_from_embeddings(query_emb, list_emb))
    return distances

# %%
# distances = get_distances_from_query_list(outline_sections, texts)
# distances


# question_w_outline = '''
# Write a short essay given this outline:
# • First paragraph.
# • Second paragraph.
# • Third paragraph.
# • Fourth paragraph.
# • Fifth paragraph.

# '''

# sentences = [
#     'Meet Jack.',
#     'He's a driven and ambitious individual with a laser-focused mindset on achieving his goals.',
#     'With a keen eye for detail, he excels in problem-solving and is always seeking new challenges to test his abilities.',
#     'Jack is a natural leader, with the ability to inspire and motivate others to perform at their best.',
#     'Despite his demanding schedule, he always makes time for his family and friends, valuing the importance of maintaining strong relationships.'
#     ]

# Function to return a list with combinations of order, where a sentence of interest is in unique positions
def all_unique_pos(lst, element):
    res = []
    for i in range(len(lst)):
        new_list = lst[:]
        new_list.pop(lst.index(element))
        res.append(new_list[:i] + [element] + new_list[i:])
    return res

# combinations = all_unique_pos(sentences, 'It took me eighteen years to realize what an extraordinary influence my mother has been on my life.')

# original_text = ' '.join(sentences)
# original_text

# full_request = question_w_outline + original_text

def full_request_template(question, sents):
    return question + ' '.join(sents)

# request = full_request_template(question_w_outline, sentences)
# request

# Given a combination list where one sentnce is present in all unique places, get the response from openai for that list
def get_all_responses(options, question_w_outline):
    response = []
    for x in options:
        response.append(get_response(full_request_template(question_w_outline, x)))
    return response


@memory.cache
def get_response(full_request):
  response = openai.Completion.create(
      model='text-davinci-003',
      prompt = full_request,
      temperature=0.7,
      max_tokens=256,
      top_p=1,
      frequency_penalty=0,
      presence_penalty=0,
      logprobs=10,
      echo=True
    )
  return response

# result = get_all_responses(all_unique_pos(sentences, 'It took me eighteen years to realize what an extraordinary influence my mother has been on my life.'))
# result

# For all the possibilities
# Takes all the sentences, and returns a list of responses
def all_the_log_probs(sentences, question_w_outline):
    res = []
    for x in sentences:
        res.append(get_all_responses(all_unique_pos(sentences, x), question_w_outline))
    return res

# res = all_the_log_probs(sentences)

def compute_log_probs(question_w_outline, original_text, response):
    start_point = len(question_w_outline)
    start_index = response.choices[0].logprobs.text_offset.index(start_point)
    len_original_text = len(original_text)
    end_point = start_point + len_original_text - 1
    end_index = min(range(len(response.choices[0].logprobs.text_offset)), key=lambda i: abs(response.choices[0].logprobs.text_offset[i] - end_point))
    total = 0
    for x in range(start_index, end_index + 1):
        total = total + response.choices[0].logprobs.token_logprobs[x]
    return total

# compute_log_probs(question_w_outline, original_text, result[0])

# combinations = all_unique_pos(sentences, 'It took me eighteen years to realize what an extraordinary influence my mother has been on my life.')
# combinations

# logprobs = []
# for i in range(len(combinations)):
#     original_text = ' '.join(combinations[i])
#     logprobs.append(compute_log_probs(question_w_outline, original_text, result[i]))

# logprobs
# print('LOGPROBS: ', logprobs)

def all_unique_pos(lst, element):
    res = []
    for i in range(len(lst)):
        new_list = lst[:]
        new_list.pop(lst.index(element))
        res.append(new_list[:i] + [element] + new_list[i:])
    return res

# Get highest indeces given the list and 
def getHighestIndexes(lst, highests):
    indexes = []
    sorted_indexes = np.argsort(lst)[-highests:]
    for i in range(highests):
        indexes.append(sorted_indexes[i])
    return indexes

# Calculate all logprobs and find the indexes of [n] highest numbers 
def allLogProbs(res, sentences, question_w_outline):
    all_logprobs = []
    for i in range(len(sentences)):
        combinations = all_unique_pos(sentences, sentences[i])
        logprobs = []
        for j in range(len(combinations)):
            original_text = ' '.join(combinations[j])
            logprobs.append(compute_log_probs(question_w_outline, original_text, res[i][j]))
        # Get the highest indeces here
        # highest_indeces = getHighestIndexes(logprobs, 3)
        all_logprobs.append(logprobs)
    return all_logprobs
# all_logprobs = allLogProbs(res)
# print('ALL LOGPROBS: ', all_logprobs)


def create_prompt(outline_sections):
    # join the paragraphs into a single string, separated by newlines
    essay = '\n'.join(outline_sections)

    # split the essay into a list of sentences
    sentences = essay.split('. ')

    # join the sentences back into a single string, with each sentence on a new line and
    # prepended with a bullet point
    outline = 'Write a short essay given this outline:\n'
    for i, sentence in enumerate(sentences):
        if sentence:
            outline += f'• {sentence.strip()}.'
            if i < len(sentences) - 1:
                outline += '\n'

    outline += '\n'  # add a newline character at the end
    return outline



# HOST WEB

app = FastAPI() 

# Receive data
# Define the payload schema
class TextPayload(BaseModel):
    outline: str
    essay: str

origins = [ 
    'http://localhost', 
    'http://localhost:8080', 
] 

app.add_middleware( 
    CORSMiddleware, 
    allow_origins=origins, 
    allow_credentials=True, 
    allow_methods=['*'], 
    allow_headers=['*'], 
) 

@app.get('/', response_class=HTMLResponse) 
def read_root(): 
    return open('index.html').read()

app.mount('/styles', StaticFiles(directory='styles'), name='styles')

@app.get('/items/{item_id}') 
def read_item(item_id: int, q: Optional[str] = None): 
    return {'item_id': item_id, 'q': q}

@app.get('/item/match')
async def read_items(payload: TextPayload):
    payload.outline = payload.outline.replace('\n', ' ')
    # payload.essay = payload.essay.replace('\n', ' ')
    print('Payload outline: ', payload.outline)
    print('Payload essay: ', payload.essay)
    outline_doc = nlp(payload.outline)
    outline_sections = [sentence.text.strip() for sentence in outline_doc.sents]
    essay_doc = nlp(payload.essay)
    essay_sections = [sentence.text.strip() for sentence in essay_doc.sents]
    data = get_distances_from_query_list(outline_sections, essay_sections)
    return data

# @app.get('/item/logprobs')
# async def read_items():
#     data = (all_logprobs)
#     return data



@app.post('/analyze')
async def analyze_post_request(payload: TextPayload):
    payload.outline = payload.outline.replace('\n', ' ')
    # payload.essay = payload.essay.replace('\n', ' ')
    print('Payload outline: ', payload.outline)
    print('Payload essay: ', payload.essay)
    outline_doc = nlp(payload.outline)
    outline_sections = [sentence.text.strip() for sentence in outline_doc.sents]
    essay_doc = nlp(payload.essay)
    essay_sections = [sentence.text.strip() for sentence in essay_doc.sents]

    print('outline sents:')
    print(outline_sections)
    print('essay sents:')
    print(essay_sections)

    distances = get_distances_from_query_list(outline_sections, essay_sections)

    # Create prompt
    question_w_outline = create_prompt(outline_sections)

    # original_text = ' '.join(essay_sections)
    
    # full_request = questions_w_outline + original_text

    # request = full_request_template(questions_w_outline, essay_sections)

    res = all_the_log_probs(essay_sections, question_w_outline)

    all_logprobs = allLogProbs(res, essay_sections, question_w_outline)

    return (distances, all_logprobs)





@app.get('/item')
async def read_items():
    # data = 'My mother's enthusiasm for learning is most apparent in travel. Despite the fact that we were traveling with fourteen-month-old twins, we managed to be at each ruin when the site opened at sunrise. I vividly remember standing in an empty amphitheatre pretending to be an ancient tragedian, picking out my favorite sculpture in the Acropolis museum, and inserting our family into modified tales of the battle at Troy. I was nine years old when my family visited Greece. Every night for three weeks before the trip, my older brother Peter and I sat with my mother on her bed reading Greek myths and taking notes on the Greek Gods. Eight years and half a dozen passport stamps later I have come to value what I have learned on these journes about global history, politics and culture, as well as my family and myself.'

    data = (
            {
                'text':'I vividly remember standing in an empty amphitheatre pretending to be an ancient tragedian, picking out my favorite sculpture in the Acropolis museum, and inserting our family into modified tales of the battle at Troy. ',
                'comment':'',
                'new-order':'0'
                
            },
            {
                'text':'I was nine years old when my family visited Greece. ',
                'comment':'',
                'new-order':'2'
                
            },
            {
                'text':'Every night for three weeks before the trip, my older brother Peter and I sat with my mother on her bed reading Greek myths and taking notes on the Greek Gods. ',
                'comment':'',
                'new-order':'3'
                
            },
            {
                'text':'Eight years and half a dozen passport stamps later I have come to value what I have learned on these journes about global history, politics and culture, as well as my family and myself. ',
                'comment':'',
                'new-order':'1'
            }
    )
    return data

import nest_asyncio 
import uvicorn 

nest_asyncio.apply() 
uvicorn.run(app, port=8000) 


