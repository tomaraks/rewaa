const { browser } = require('protractor');
var showsPage = require('./pages/BasePage');
var homePage = require('./pages/HomePage');
describe('Shows Page Test', function () {
    beforeAll(function () {
        browser.driver.manage().window().maximize();
        browser.get('shows');
        expect(browser.getCurrentUrl()).toContain('shows');
        expect(browser.getTitle()).toBe('AngularStarter');
    })

    beforeEach(function () {
        browser.getCurrentUrl().then(function (url) {
            if (!url.indexOf("shows") >= 0) {
                browser.get('shows');
            }
        })
    })

    it('should have show per page', function () {
        var numOfPages = showsPage.getNumberOfPages();
        for (var i = 1; i < numOfPages; i++) {
            showsPage.moveOnToPage(i);
            showsPage.verifyContentOnPage();
        }
        showsPage.moveOnToPage('1');
    });

    it('should search show and provide correct results', function () {
        homePage.search('Bonanza');
        showsPage.verifySearchCount(1);
        showsPage.verifyContentOnPage('Bonanza');
        homePage.resetSearch('Bonanza');
    });

    it('should open correct show', function () {
        homePage.search('Bonanza');
        showsPage.verifySearchCount(1);
        showsPage.verifyContentOnPage('Bonanza');
        showsPage.openFirstContent();
        expect(showsPage.getName()).toBe('Bonanza')
    });

    it('should be able to add, update and delete show', function () {
        homePage.search('Bonanza');
        showsPage.openFirstContent();
        showsPage.clickOnAddButton();
        showsPage.setName('TestAdd');
        showsPage.clickOnSaveButton();
        browser.sleep(1000);
        browser.get('shows');
        homePage.search('TestAdd');
        showsPage.verifySearchCount(1);
        showsPage.verifyContentOnPage('TestAdd');
        showsPage.openFirstContent();
        showsPage.clickOnDeleteButton();
        browser.sleep(1000);
        browser.get('shows');
        homePage.search('TestAdd');
        showsPage.verifySearchCount(0);
    });

});