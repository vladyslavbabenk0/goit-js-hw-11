import axios from 'axios';
import Notiflix from 'notiflix';
import SimpleLightbox from "simplelightbox";
import "simplelightbox/dist/simple-lightbox.min.css";

const pixabayKey = '37761456-12bba2161ec0a2b01ebab9c6f';

const formEl = document.querySelector('form');
const inputEl = document.querySelector('input'); 
const galleryEl = document.querySelector('.gallery');
let page = 1;
let searchQuery = '';
let perPage;
let totalValues;
let inputValue = '';

let lightbox; 

function getUrl(inputValue, page) {
    perPage = 40;
    const urlAPI = 'https://pixabay.com/api/?';
    const searchParams = new URLSearchParams({
        key: pixabayKey,
        q: inputValue,
        image_type: 'photo',
        orientation: 'horizontal',
        maxHeight: 300,
        safesearch: true,
        per_page: perPage,
        page: page,
    });

    return urlAPI + searchParams.toString();
}

function getAxiosRequest(inputValue, page) {
    const url = getUrl(inputValue, page);
   
    return axios.get(url).then(response => response).catch(error => Notiflix.Notify.failure(error))
}

function makeMarkup(responseData) {
  let galleryItems = responseData.data.hits.map(item => {
    let galleryItem = document.createElement('div');
    galleryItem.className = 'photo-card';
    galleryItem.innerHTML = `
      <a class="gallery_link" href="${item.largeImageURL}">
        <img class="image" src="${item.webformatURL}" alt="${item.tags}" loading="lazy"/>
      </a>
      <div class="info">
        <p class="info-item">
          ${item.likes}<br>
          <b class="info-item-name">Likes</b>
        </p>
        <p class="info-item">
          ${item.views}<br>
          <b class="info-item-name">Views</b>
        </p>
        <p class="info-item">
          ${item.comments}<br>
          <b class="info-item-name">Comments</b>
        </p>
        <p class="info-item">
          ${item.downloads}<br>
          <b class="info-item-name">Downloads</b>
        </p>
      </div>
    `;
    return galleryItem;
  });

  galleryItems.forEach(item => {
    galleryEl.appendChild(item);
  });
  
  lightbox.refresh();

  const { height: cardHeight } = document
    .querySelector(".gallery")
    .firstElementChild.getBoundingClientRect();

  window.scrollBy({
    top: cardHeight * 2,
    behavior: "smooth",
  });

  window.scrollTo(0, 0);
}

async function onFormSubmit(event) {
    event.preventDefault();

    inputValue = inputEl.value;
    searchQuery = inputValue;
    page = 1;
    let responseData;
    
    if (inputValue.length === 0) {
        Notiflix.Notify.warning('Please, enter your request!')
    } else {
        try {
            responseData = await getAxiosRequest(inputValue, page);
            if (responseData.data.total === 0) {
                throw new Error('Sorry, there are no images matching your search query. Please try again.');
            } else {
              galleryEl.innerHTML = '';
              makeMarkup(responseData);
              inputEl.value = '';
              Notiflix.Notify.success(`Hooray! We found ${responseData.data.totalHits} images.`)
            }
        } catch (error) {
            Notiflix.Notify.failure(error.message);
        }
    }
};

formEl.addEventListener('submit', onFormSubmit);

let isLoading = false;
let throttleTimeout;
let currentScrollTop = 0;
let previousScrollTop = 0;

async function loadMoreImages() {
  if (isLoading || page * perPage >= totalValues) {
    return;
  }
  isLoading = true;
  page++;
  previousScrollTop = window.pageYOffset;
  try {
    let responseData = await getAxiosRequest(searchQuery, page);
    makeMarkup(responseData);
    totalValues = responseData.data.totalHits;
  } catch (error) {
    Notiflix.Notify.failure(error.message);
  } finally {
    isLoading = false;
    window.scrollTo(0, previousScrollTop);
  }
}

function onWindowScroll() {
  clearTimeout(throttleTimeout);
  throttleTimeout = setTimeout(function () {
    const documentRect = document.documentElement.getBoundingClientRect();
    if (documentRect.bottom < document.documentElement.clientHeight + 150 && window.pageYOffset > currentScrollTop) {
      loadMoreImages();
    }
    currentScrollTop = window.pageYOffset;
  }, 200);
}

window.addEventListener('scroll', onWindowScroll);

document.addEventListener('DOMContentLoaded', function() {
  lightbox = new SimpleLightbox('.photo-card a');
});