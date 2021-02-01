const { browser } = require('protractor');
var continentsPage = require('./pages/BasePage');
var homePage = require('./pages/HomePage');
describe('Continents Page Test', function () {
    beforeAll(function () {
        browser.driver.manage().window().maximize();
        browser.get('continents');
        expect(browser.getCurrentUrl()).toContain('continents');
        expect(browser.getTitle()).toBe('AngularStarter');
    })

    beforeEach(function () {
        browser.getCurrentUrl().then(function (url) {
            if (!url.indexOf("continents") >= 0) {
                browser.get('continents');
            }
        })
    })

    it('should have continents per page', function () {
        var numOfPages = continentsPage.getNumberOfPages();
        for (var i = 1; i < numOfPages; i++) {
            continentsPage.moveOnToPage(i);
            continentsPage.verifyContentsOnPage();
        }
        continentsPage.moveOnToPage('1');
    });

    it('should search continents and provide correct results', function () {
        homePage.search('ASIA');
        continentsPage.verifySearchCount(1);
        continentsPage.verifySearchContentName('ASIA');
        homePage.resetSearch('ASIA');
    });

    it('should open correct continent', function () {
        homePage.search('ASIA');
        continentsPage.verifySearchCount(1);
        continentsPage.verifySearchContentName('ASIA');
        continentsPage.openFirstContent();
        expect(continentsPage.getName()).toBe('ASIA')
    });

    it('should be able to add, update and delete continent', function () {
        homePage.search('ASIA');
        continentsPage.openFirstContent();
        continentsPage.clickOnAddButton();
        continentsPage.setName('TestAdd');
        continentsPage.setCode('TA');
        continentsPage.clickOnSaveButton();
        homePage.clickOnItemListHeader();
        browser.sleep(1000);
        homePage.clickOnItemList(0);
        homePage.search('TestAdd');
        continentsPage.verifySearchCount(1);
        continentsPage.verifySearchContentName('TestAdd');
        continentsPage.openFirstContent();
        continentsPage.clickOnDeleteButton();
        homePage.clickOnItemList(0);
        homePage.search('TestAdd');
        continentsPage.verifySearchCount(0);
    });

});