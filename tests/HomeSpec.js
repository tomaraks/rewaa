const { browser } = require('protractor');
var homePage = require('./pages/HomePage');
var moviesPage = require('./pages/BasePage');
describe('Home Page Test', function () {
    beforeAll(function () {
        browser.driver.manage().window().maximize();
        browser.get('');
        expect(browser.getTitle()).toBe('New Movies: angular.movies');
    })

    beforeEach(function () {
        if (browser.getTitle() !== 'New Movies: angular.movies') {
            browser.get('');
        }
    })

    it('should search movies and provide correct results', function () {
        homePage.search('DDLJ');
        homePage.verifySearchResults(1, 'DDLJ');
        homePage.resetSearch('DDLJ');
    });

    it('should have movies per page', function () {
        var numOfPages = homePage.getNumberOfPages();
        for(var i = 1; i< numOfPages; i++) {
            homePage.moveOnToPage(i);
            homePage.verifyMoviesOnPage();
        }
        homePage.moveOnToPage('1');
    });

    it('should open correct movie', function () {
        homePage.openMovie('DDLJ');
        expect(moviesPage.getName()).toBe('DDLJ')
    });

    it('should open correct link when clicked on items list', function () {
        var listUrls = ['continents', 'countries', 'cities', 'movies'];
        homePage.clickOnItemListHeader();
        browser.sleep(1000);
        for (var i = 0; i < listUrls.length; i++) {
            homePage.clickOnItemList(i);
            expect(browser.getCurrentUrl()).toContain(listUrls[i]);
            browser.navigate().back();
        }
    });
});  