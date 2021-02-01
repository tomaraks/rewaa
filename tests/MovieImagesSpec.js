const { browser } = require('protractor');
var movieImagesPage = require('./pages/BasePage');
var homePage = require('./pages/HomePage');
describe('Movies Images Page Test', function () {
    beforeAll(function () {
        browser.driver.manage().window().maximize();
        browser.get('movies-images');
        expect(browser.getCurrentUrl()).toContain('movies-images');
        expect(browser.getTitle()).toBe('New Movies: angular.movies');
    })

    beforeEach(function () {
        browser.getCurrentUrl().then(function (url) {
            if (!url.indexOf("movies") >= 0) {
                browser.get('movies-images');
            }
        })
    })

    it('should have movies per page', function () {
        var numOfPages = movieImagesPage.getNumberOfPages();
        for (var i = 1; i < numOfPages; i++) {
            movieImagesPage.moveOnToPage(i);
            homePage.verifyMoviesOnPage();
        }
        movieImagesPage.moveOnToPage('1');
    });

    it('should search movies and provide correct results', function () {
        homePage.search('DDLJ');
        homePage.verifySearchResults(1, 'DDLJ');
        homePage.resetSearch('DDLJ');
    });

    it('should open correct movie', function () {
        homePage.openMovie('DDLJ');
        expect(movieImagesPage.getName()).toBe('DDLJ');
    });

    it('should be able to add, update and delete movie', function () {
        homePage.openMovie('DDLJ');
        movieImagesPage.clickOnAddButton();
        movieImagesPage.setName('TestAdd');
        movieImagesPage.clickOnSaveButton();
        browser.sleep(1000);
        browser.get('movies-images');
        homePage.openMovie('TestAdd');
        movieImagesPage.clickOnDeleteButton();
        browser.sleep(1000);
        browser.get('movies-images');
        homePage.search('TestAdd');
        homePage.verifySearchCount(0);
    });

});