const { browser } = require('protractor');
var moviesPage = require('./pages/BasePage');
var homePage = require('./pages/HomePage');
describe('Movies Page Test', function () {
    beforeAll(function () {
        browser.driver.manage().window().maximize();
        browser.get('movies');
        expect(browser.getCurrentUrl()).toContain('movies');
        expect(browser.getTitle()).toBe('AngularStarter');
    })

    beforeEach(function () {
        browser.getCurrentUrl().then(function (url) {
            if (!url.indexOf("movies") >= 0) {
                browser.get('movies');
            }
        })
    })

    it('should have movies per page', function () {
        var numOfPages = moviesPage.getNumberOfPages();
        for (var i = 1; i < numOfPages; i++) {
            moviesPage.moveOnToPage(i);
            moviesPage.verifyContentOnPage();
        }
        moviesPage.moveOnToPage('1');
    });

    it('should search movies and provide correct results', function () {
        homePage.search('DDLJ');
        moviesPage.verifySearchCount(1);
        moviesPage.verifyContentOnPage('DDLJ');
        homePage.resetSearch('DDLJ');
    });

    it('should open correct movie', function () {
        homePage.search('DDLJ');
        moviesPage.verifySearchCount(1);
        moviesPage.verifyContentOnPage('DDLJ');
        moviesPage.openFirstContent();
        expect(moviesPage.getName()).toBe('DDLJ')
    });

    it('should be able to add, update and delete movie', function () {
        homePage.search('DDLJ');
        moviesPage.openFirstContent();
        moviesPage.clickOnAddButton();
        moviesPage.setName('TestAdd');
        moviesPage.clickOnSaveButton();
        homePage.clickOnItemListHeader();
        browser.sleep(1000);
        homePage.clickOnItemList(3);
        homePage.search('TestAdd');
        moviesPage.verifySearchCount(1);
        moviesPage.verifyContentOnPage('TestAdd');
        moviesPage.openFirstContent();
        moviesPage.clickOnDeleteButton();
        homePage.clickOnItemList(3);
        homePage.search('TestAdd');
        moviesPage.verifySearchCount(0);
    });

});