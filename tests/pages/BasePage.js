var BasePage = function () {
    var nameInput = element(by.id('name'));
    var idInput = element(by.id('code'));
    var flagInput = element(by.id('flag'));
    var alpha2Input = element(by.id('isoAlpha2'));
    var alpha3Input = element(by.id('isoAlpha3'));
    var numInput = element(by.id('isoNumeric'));
    var tableList = element.all(by.css('tbody > tr'));
    var showTableList = element.all(by.css('tbody > tr'));
    var pagesList = element.all(by.css('ul > li.page-item'));
    var buttonsList = element.all(by.css('button.btn'));

    this.clickOnAddButton = function () {
        buttonsList.get(0).click();
    };

    this.clickOnSaveButton = function () {
        buttonsList.get(1).click();
    };

    this.clickOnDeleteButton = function () {
        buttonsList.get(3).click();
    };

    this.verifySearchCount = function (count) {
        expect(tableList.count()).toEqual(count);
    };

    this.verifySearchContentName = function (text) {
        expect(tableList.get(0).element(by.css('td.text-primary > div')).getText()).toEqual(text);
    };

    this.setName = function (value) {
        return nameInput.sendKeys(value);
    };

    this.getName = function () {
        return nameInput.getAttribute('value');
    };

    this.setCode = function (value) {
        return idInput.sendKeys(value);
    };

    this.setFlag = function (value) {
        return flagInput.sendKeys(value);
    };

    this.setAlpha2 = function (value) {
        return alpha2Input.sendKeys(value);
    };

    this.setAlpha3 = function (value) {
        return alpha3Input.sendKeys(value);
    };

    this.setNumeric = function (value) {
        return numInput.sendKeys(value);
    };

    this.getCode = function () {
        return idInput.getAttribute('value');
    };
    
    this.getNumberOfPages = function () {
        return pagesList.count();
    };

    this.moveOnToPage = function (number) {
        element.all(by.cssContainingText('li a.page-link', number)).first().click();
    };

    this.verifyContentOnPage = function () {
        expect(tableList.count()).toBeGreaterThanOrEqual(1);
    };

    this.openFirstContent = function () {
        tableList.get(0).element(by.css('td.text-primary > div')).click();
    };

    this.openContent = function (value) {
        element(by.cssContainingText('tbody > tr td.text-primary > div', value)).click();
    };
};
module.exports = new BasePage();