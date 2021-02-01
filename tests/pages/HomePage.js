const { element } = require("protractor");

var HomePage = function () {
    var searchInput = element(by.tagName('input'));
    var searchButton = element(by.css('button.btn'));
    var movieList = element.all(by.css('app-movies-list div.row a>img'));
    var showList = element.all(by.css('app-shows-list div.row a>img'));
    var items = element.all(by.css('ul > li.list-group-item > a'));
    var itemList = element(by.css('div.card-header'));
    var pagesList = element.all(by.css('ul > li.page-item'));

    this.search = function (name) {
        searchInput.sendKeys(name);
        searchButton.click();
    };

    this.resetSearch = function () {
        searchInput.clear();
        searchButton.click();
    };

    this.moveOnToPage = function (number) {
        element(by.cssContainingText('li a.page-link', number)).click();
    };

    this.verifySearchResults = function (count, text) {
        expect(movieList.count()).toEqual(count);
        expect(movieList.get(0).getAttribute("alt")).toEqual(text);
    };

    this.verifySearchCount = function (count) {
        expect(movieList.count()).toEqual(count);
    }

    this.verifySearchResultsForShows = function (count, text) {
        expect(showList.count()).toEqual(count);
        expect(showList.get(0).getAttribute("alt")).toEqual(text);
    };

    this.verifySearchCountForShows = function (count) {
        expect(showList.count()).toEqual(count);
    }

    this.verifyMoviesOnPage = function () {
        expect(movieList.count()).toBeGreaterThanOrEqual(1);
    };

    this.openMovie = function (name) {
        searchInput.sendKeys(name);
        searchButton.click();
        movieList.get(0).click();
    };

    this.openShow = function (name) {
        searchInput.sendKeys(name);
        searchButton.click();
        showList.get(0).click();
    };

    this.clickOnItemListHeader = function () {
        itemList.click();
    };

    this.clickOnItemList = function (count) {
        items.get(count).click();
    };

    this.getNumberOfPages = function () {
        return pagesList.count();
    };
};
module.exports = new HomePage();