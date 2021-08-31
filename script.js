// Navigation on the 'tabs'
const homePage = document.querySelector('#homePage');
const reportsPage = document.querySelector('#reportsPage');
const aboutPage = document.querySelector('#aboutPage');
const navigation = document.querySelector('nav');

navigation.addEventListener('click', ({ target }) => {
    if (target.matches('#homeBtn')) {
        hide(aboutPage);
        hide(reportsPage);
        show(homePage);
        killInterval();
    }
    if (target.matches('#aboutBtn')) {
        hide(homePage);
        hide(reportsPage);
        show(aboutPage);
        killInterval();
    }
    if (target.matches('#reportsBtn')) {
        hide(homePage);
        hide(aboutPage);
        show(reportsPage);
        createGraph();
    }
})

// Auxiliary functions used to display spinner, navigation and modal window
const hide = (item) => {
    item.classList.add('hide');
}

const show = (item) => {
    item.classList.remove('hide');
}

// Loading all cards
const cardsContainer = document.querySelector('#cardsContainer');
const spinner = document.querySelector('#spinner');

let cardsData = [];
const getData = () => {
    show(spinner);
    fetch('https://api.coingecko.com/api/v3/coins/list')
        .then(result => checkError(result))
        .then(json => {
            cardsData = json.splice(1220, 20);
            renderCards(cardsData);
            hide(spinner);
        })
        .catch((error) => {
            hide(spinner);
            window.alert('Cannot get the data... \nPlease reload the page and try again');
            console.log(error);
        })
}
getData();

const checkError = (result) => {
    if (result.status >= 200 && result.status <= 299) {
        return result.json();
    } else {
        throw Error(result.statusText);
    }
}

const renderCards = (data) => {
    data.forEach(item => {
        const card = document.createElement('div');
        card.classList.add('card');
        card.innerHTML = `
        <div class="card-body">
            <div class="card-content">
            <div class="card-static">
                <h3 class="card-title">${item.symbol}</h3>
                <label class="switch">
                <input type="checkbox" id="checkbox">
                <span class="slider round"></span>
                </label>
            </div>
            <div class="card-dynamic" id="cardMainPart ${item.id}">
                <p>${item.name}</p>
                <button class="showMore" id="showMore" value="${item.id}">Show more</button>
            </div>
            </div>
        </div>
        `;
        cardsContainer.appendChild(card);
    })
}

// Saving additional info to local storage
const saveToLocalStorage = (item) => {
    localStorage.setItem(`${item.id}`, JSON.stringify(item));
}

const checkLocalStorage = () => {
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
        let date = Date.now();
        let object = JSON.parse(localStorage.getItem(key));
        if (date - object.date > 119000) {
            localStorage.removeItem(key);
        }
    })
}
// In case of page reload we will check local storage again.
// If time would not be expired after reload, we launch a timer to remove stored data in another 2 min after reload

if (localStorage.length > 0) {
    checkLocalStorage();
    setTimeout(checkLocalStorage, 120000)
}

// Listening whether any event invocked  on each card

cardsContainer.addEventListener('click', ({ target }) => {
    if (target.matches('#showMore')) {
        showMoreInfo(target);
    }
    if (target.matches('#close')) {
        hideAnimation(target);
        setTimeout(() => target.parentElement.parentElement.remove(), 500)
    }
    if (target.matches('#checkbox')) {
        let name = target.parentElement.previousElementSibling.innerHTML;
        if (target.checked) {
            if (favorites.length < 5) {
                favorites.push(name);
                favorites.sort();
            } else {
                renderModal();
                target.checked = false;
                nextInQueue = target.parentElement;
            }
        } else {
            filterFavorites(name);
        }
    }
})

const showMoreInfo = async (target) => {
    let details = JSON.parse(localStorage.getItem(target.value));
    if (!details) {
        details = await getMoreInfo(target);
        setTimeout(checkLocalStorage, 120000);
    }
    const cardMoreInfoPart = document.createElement('div');
    cardMoreInfoPart.classList.add('card-dynamic', 'hidden');
    cardMoreInfoPart.id = 'cardMoreInfoPart';
    cardMoreInfoPart.innerHTML = `
        <div class="col">
            <img class="card-icon" src="${details.image}" alt="currency logo">
        </div>
        <div class="col col-right">
            <h4 class="details-subtitle">Current marketprice:</h4>
            <p class="details-item">USD: &#36; ${details.usd}</p>
            <p class="details-item">EUR: &#8364; ${details.eur}</p>
            <p class="details-item">ILS: &#8362; ${details.ils}</p>
            <span class="close" id="close">&times;</span>
        </div>
        `;
    target.parentElement.parentElement.appendChild(cardMoreInfoPart);
    setTimeout(() => showAnimation(target), 100)
}

const getMoreInfo = async (target) => {
    show(spinner);
    let details = [];
    await fetch(`https://api.coingecko.com/api/v3/coins/${target.value}`)
        .then(result => checkError(result))
        .then(json => {
            details = {
                id: json.id,
                image: json.image.small,
                usd: json.market_data.current_price.usd,
                eur: json.market_data.current_price.eur,
                ils: json.market_data.current_price.ils,
                date: Date.now(),
            };
            saveToLocalStorage(details);
            hide(spinner);
            return details;
        })
        .catch((error) => {
            hide(spinner);
            window.alert('Cannot get the data... \nPlease reload the page and try again');
            console.log(error);
        })
    return details;
}

// Helpers to smooth moreInfo component motion
const showAnimation = (target) => {
    const cardMainPart = target.parentElement;
    const cardMoreInfoPart = target.parentElement.nextElementSibling;
    cardMainPart.classList.add('opacity');
    cardMoreInfoPart.classList.add('bottomToTop');
}

const hideAnimation = (target) => {
    const cardMainPart = target.parentElement.parentElement.previousElementSibling;
    const cardMoreInfoPart = target.parentElement.parentElement;
    cardMoreInfoPart.classList.remove('bottomToTop');
    cardMainPart.classList.remove('opacity');
}

// Processing 'add to favorites' functionality
let favorites = [];
let itemsTBremoved = [];
let nextInQueue;

const listGroup = document.querySelector('#list-group');
const modal = document.querySelector('#modal');

const renderModal = () => {
    favorites.forEach(item => {
        const li = document.createElement('li');
        li.classList.add('list-item');
        li.innerHTML = `${item}<label class="switch">
            <input type="checkbox" checked id="checkbox">
            <span class="slider round"></span>
            </label>
        `;
        listGroup.appendChild(li);
    });
    show(modal);
    document.body.style.overflow = 'hidden';
}

modal.addEventListener('click', ({ target }) => {
    if (target.matches('#checkbox')) {
        let name = target.parentElement.parentElement.innerText;
        itemsTBremoved.push(name);
    }
    if (target.matches('#save')) {
        filterFavorites(itemsTBremoved);
        itemsTBremoved = [];
        uncheckToggles();
        closeModal();
        if (favorites.length < 5) {
            favorites.push(nextInQueue.previousElementSibling.innerHTML);
            nextInQueue.firstElementChild.checked = true;
            nextInQueue = '';
        }
    }
    if (target.matches('#close') || target.matches('[data-close]')) {
        itemsTBremoved = [];
        nextInQueue = '';
        closeModal();
    }
})

const closeModal = () => {
    hide(modal);
    document.body.style.overflow = '';
    listGroup.innerHTML = '';
}

const uncheckToggles = () => {
    const toggles = cardsContainer.querySelectorAll('input[type="checkbox"]:checked');
    toggles.forEach(toggle => {
        let name = toggle.parentElement.parentElement.innerText;
        if (!favorites.includes(name)) {
            toggle.checked = false;
        }
    })
}

const filterFavorites = (item) => {
    if (typeof item === 'object') {
        favorites = favorites.filter(elem => !item.includes(elem));
    } else {
        favorites = favorites.filter(elem => elem !== item);
    }
}

// Search & filter operations
setTimeout(() => {
    const searchArea = document.querySelector('#searchArea');
    const searchInput = document.querySelector('#searchInput');
    const cards = document.querySelectorAll('.card');

    let keyword;
    searchInput.addEventListener('input', () => {
        keyword = searchInput.value.toLowerCase();
        if (keyword === '') {
            cards.forEach(card => show(card));
        }
    });

    searchArea.addEventListener('click', ({ target }) => {
        if (target.matches('#search-button') || target.matches('.fa-search')) {
            filter(keyword);
        }
        if (target.matches('#reset-input')) {
            searchInput.value = '';
            cards.forEach(card => show(card));
        }
    })

    const filter = (keyword) => {
        cards.forEach(card => {
            const title = card.querySelector('.card-title').innerText.toLowerCase();
            if (title.localeCompare(keyword) !== 0) {
                hide(card);
            } else {
                show(card);
            }
        })
    }
}, 2000);

// Canvas Graph section
const createGraph = () => {

    const getObject = async (array) => {
        try {
            const response = await fetch(
                `https://min-api.cryptocompare.com/data/pricemulti?fsyms=${array}&tsyms=USD`);
            const result = await response.json();
            return result;
        } catch (error) {
            console.log(error);
        }
    }

    let coin1 = [],
        coin2 = [],
        coin3 = [],
        coin4 = [],
        coin5 = [];

    const getPoints = async (array) => {
        if (array.length > 0) {
            let object = await getObject(array);
            Object.values(object)[0] ? coin1.push({
                x: new Date(),
                y: Object.values(object)[0].USD
            }) : '';
            Object.values(object)[1] ? coin2.push({
                x: new Date(),
                y: Object.values(object)[1].USD
            }) : '';
            Object.values(object)[2] ? coin3.push({
                x: new Date(),
                y: Object.values(object)[2].USD
            }) : '';
            Object.values(object)[3] ? coin4.push({
                x: new Date(),
                y: Object.values(object)[3].USD
            }) : '';
            Object.values(object)[4] ? coin5.push({
                x: new Date(),
                y: Object.values(object)[4].USD
            }) : '';
            console.log(coin1, coin2)
        }
    }

    getPoints(favorites);

    let chart = new CanvasJS.Chart("chartContainer", {
        title: {
            text: `${favorites.length === 0 ? 'Please choose any currency to heed its cost in ': favorites + ' to'} USD`
        },
        axisX: {
            title: "Time",
            valueFormatString: "HH:mm:ss",
            labelAngle: -20
        },
        axisY: {
            title: "Coin Value",
            valueFormatString: "$#######.##",
            includeZero: true,
            viewportMinimum: -5,
            minimum: -5,
        },
        data: [{
                type: "line",
                legendText: coin1 ? favorites[0] : '',
                showInLegend: true,
                dataPoints: coin1
            },
            {
                type: "line",
                legendText: coin2 ? favorites[1] : '',
                showInLegend: true,
                dataPoints: coin2
            },
            {
                type: "line",
                legendText: coin3 ? favorites[2] : '',
                showInLegend: true,
                dataPoints: coin3
            },
            {
                type: "line",
                legendText: coin4 ? favorites[3] : '',
                showInLegend: true,
                dataPoints: coin4
            },
            {
                type: "line",
                legendText: coin5 ? favorites[4] : '',
                showInLegend: true,
                dataPoints: coin5
            },
        ]
    });

    setTimeout(() => {
        chart.render();
        console.log('hi from first render')
        if (favorites.length > 0) {
            interval();
        }
    }, 1000);

    const updateChart = () => {
        getPoints(favorites);
        if (coin1.length > 10) {
            coin1.shift();
            coin2.shift();
            coin3.shift();
            coin4.shift();
            coin5.shift();
        }
        chart.render();
    };

    const interval = () => {
        t = setInterval(() => {
            updateChart();
        }, 2000);
    }
}

const killInterval = () => {
    if (favorites.length > 0) {
        clearInterval(t)
    }
}