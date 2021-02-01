const { browser } = require('protractor');
var dashboardPage = require('../tests/pages/DashboardPage');
describe('Dashboard Page Test', function () {
    beforeAll(function () {
        browser.driver.manage().window().maximize();
        browser.get('dashboard');
        expect(browser.getCurrentUrl()).toContain('dashboard');
        expect(browser.getTitle()).toBe('AngularStarter');
    })

    beforeEach(function () {
        if (browser.getTitle() !== 'AngularStarter') {
            browser.get('dashboard');
        }
    })

    it('should have multipe folders present', function () {
        dashboardPage.verifyFolderCount(7);
        var list = ['Movies Images', 'Shows Images', 'Movies', 'Shows', 'Continents', 'Countries', 'Cities'];
        dashboardPage.verifyFolderNames(list);
    });

    it('should open correct link on clicking each folder', function () {
        var listUrls = ['movies-images', 'shows-images', 'movies', 'shows', 'continents', 'countries', 'cities'];
        for (var i = 0; i < listUrls.length; i++) {
            dashboardPage.clickOnFolder(i);
            expect(browser.getCurrentUrl()).toContain(listUrls[i]);
            browser.navigate().back();
        }
    });
});