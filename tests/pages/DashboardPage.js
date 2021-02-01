var DashboardPage = function () {
    var foldersTitle = element.all(by.css('app-dashboard > div > div .card-title'));
    var folders = element.all(by.css('app-dashboard > div > div'));

    this.verifyFolderCount = function (count) {
        expect(folders.count()).toEqual(count);
    };

    this.verifyFolderNames = function (list) {
        for (var i = 0; i < list.lenght; i++)
            expect(foldersTitle.get(i).getText()).toEqual(list[i]);
    }

    this.clickOnFolder = function (count) {
        folders.get(count).click();
    };
};
module.exports = new DashboardPage();