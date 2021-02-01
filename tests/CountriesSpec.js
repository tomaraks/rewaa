const { browser } = require('protractor');
var countriesPage = require('./pages/BasePage');
var homePage = require('./pages/HomePage');
describe('Countries Page Test', function () {
    beforeAll(function () {
        browser.driver.manage().window().maximize();
        browser.get('countries');
        expect(browser.getCurrentUrl()).toContain('countries');
        expect(browser.getTitle()).toBe('AngularStarter');
    })

    beforeEach(function () {
        browser.getCurrentUrl().then(function (url) {
            if (!url.indexOf("countries") >= 0) {
                browser.get('countries');
            }
        })
    })

    it('should have countries per page', function () {
        var numOfPages = countriesPage.getNumberOfPages();
        for (var i = 1; i < numOfPages; i++) {
            countriesPage.moveOnToPage(i);
            countriesPage.verifyContentsOnPage();
        }
        countriesPage.moveOnToPage('1');
    });

    it('should search countries and provide correct results', function () {
        homePage.search('Alaska');
        countriesPage.verifySearchCount(1);
        countriesPage.verifySearchContentName('Alaska');
        homePage.resetSearch();
    });

    it('should open correct country', function () {
        homePage.search('Alaska');
        countriesPage.verifySearchCount(1);
        countriesPage.verifySearchContentName('Alaska');
        countriesPage.openFirstContent();
        expect(countriesPage.getName()).toBe('Alaska')
    });

    it('should be able to add, update and delete continent', function () {
        homePage.search('Alaska');
        countriesPage.openFirstContent();
        countriesPage.clickOnAddButton();
        countriesPage.setName('Country');
        countriesPage.setFlag('TA');
        countriesPage.setAlpha2('TA');
        countriesPage.setAlpha3('TAA');
        countriesPage.setNumeric('123');
        countriesPage.clickOnSaveButton();
        homePage.clickOnItemListHeader();
        browser.sleep(1000);
        homePage.clickOnItemList(1);
        homePage.search('Country');
        countriesPage.verifySearchCount(1);
        countriesPage.verifySearchContentName('Country');
        countriesPage.openFirstContent();
        countriesPage.clickOnDeleteButton();
        homePage.clickOnItemList(1);
        homePage.search('Country');
        countriesPage.verifySearchCount(0);
    });

});