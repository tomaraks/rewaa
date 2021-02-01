const { browser } = require('protractor');
var citiesPage = require('./pages/BasePage');
var homePage = require('./pages/HomePage');
describe('Cities Page Test', function () {
    beforeAll(function () {
        browser.driver.manage().window().maximize();
        browser.get('cities');
        expect(browser.getCurrentUrl()).toContain('cities');
        expect(browser.getTitle()).toBe('AngularStarter');
    })

    beforeEach(function () {
        browser.getCurrentUrl().then(function (url) {
            if (!url.indexOf("cities") >= 0) {
                browser.get('cities');
            }
        })
    })

    it('should have cities per page', function () {
        var numOfPages = citiesPage.getNumberOfPages();
        for (var i = 1; i < numOfPages; i++) {
            citiesPage.moveOnToPage(i);
            citiesPage.verifyContentsOnPage();
        }
        citiesPage.moveOnToPage('1');
    });

    it('should search cities and provide correct results', function () {
        homePage.search('Bengaluru');
        citiesPage.verifySearchCount(1);
        citiesPage.verifySearchContentName('Bengaluru');
        homePage.resetSearch();
    });

    it('should open correct city', function () {
        homePage.search('Bengaluru');
        citiesPage.verifySearchCount(1);
        citiesPage.verifySearchContentName('Bengaluru');
        citiesPage.openFirstContent();
        expect(citiesPage.getName()).toBe('Bengaluru')
    });

    it('should be able to add, update and delete continent', function () {
        citiesPage.openFirstContent();
        citiesPage.clickOnAddButton();
        citiesPage.setName('Delhi');
        citiesPage.clickOnSaveButton();
        homePage.clickOnItemListHeader();
        browser.sleep(1000);
        homePage.clickOnItemList(2);
        homePage.search('Delhi');
        citiesPage.verifySearchCount(1);
        citiesPage.verifySearchContentName('Delhi');
        citiesPage.openContent('Delhi');
        citiesPage.clickOnDeleteButton();
        homePage.clickOnItemList(2);
        homePage.search('Delhi');
        citiesPage.verifySearchCount(0);
    });

});