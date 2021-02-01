const { browser } = require('protractor');
var showImagesPage = require('./pages/BasePage');
var homePage = require('./pages/HomePage');
describe('Show Images Page Test', function () {
    beforeAll(function () {
        browser.driver.manage().window().maximize();
        browser.get('shows-images');
        expect(browser.getCurrentUrl()).toContain('shows-images');
        expect(browser.getTitle()).toBe('New TV Shows : angular.movies');
    })

    beforeEach(function () {
        browser.getCurrentUrl().then(function (url) {
            if (!url.indexOf("shows-images") >= 0) {
                browser.get('shows-images');
            }
        })
    })

    it('should have shows per page', function () {
        var numOfPages = showImagesPage.getNumberOfPages();
        for (var i = 1; i < numOfPages; i++) {
            showImagesPage.moveOnToPage(i);
            homePage.verifyMoviesOnPage();
        }
        showImagesPage.moveOnToPage('1');
    });

    it('should search shows and provide correct results', function () {
        homePage.search('Bonanza');
        homePage.verifySearchResultsForShows(1, 'Bonanza');
        homePage.resetSearch('Bonanza');;
    });

    it('should open correct show', function () {
        homePage.openShow('Bonanza');
        expect(showImagesPage.getName()).toBe('Bonanza');
    });

    it('should be able to add, update and delete show', function () {
        homePage.openShow('Bonanza');
        showImagesPage.clickOnAddButton();
        showImagesPage.setName('TestAdd');
        showImagesPage.clickOnSaveButton();
        browser.sleep(1000);
        browser.get('shows-images');
        homePage.openShow('TestAdd');
        showImagesPage.clickOnDeleteButton();
        browser.sleep(1000);
        browser.get('shows-images');
        homePage.search('TestAdd');
        homePage.verifySearchCountForShows(0);
    });

});