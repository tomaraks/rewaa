var app = angular.module('reportingApp', []);

//<editor-fold desc="global helpers">

var isValueAnArray = function (val) {
    return Array.isArray(val);
};

var getSpec = function (str) {
    var describes = str.split('|');
    return describes[describes.length - 1];
};
var checkIfShouldDisplaySpecName = function (prevItem, item) {
    if (!prevItem) {
        item.displaySpecName = true;
    } else if (getSpec(item.description) !== getSpec(prevItem.description)) {
        item.displaySpecName = true;
    }
};

var getParent = function (str) {
    var arr = str.split('|');
    str = "";
    for (var i = arr.length - 2; i > 0; i--) {
        str += arr[i] + " > ";
    }
    return str.slice(0, -3);
};

var getShortDescription = function (str) {
    return str.split('|')[0];
};

var countLogMessages = function (item) {
    if ((!item.logWarnings || !item.logErrors) && item.browserLogs && item.browserLogs.length > 0) {
        item.logWarnings = 0;
        item.logErrors = 0;
        for (var logNumber = 0; logNumber < item.browserLogs.length; logNumber++) {
            var logEntry = item.browserLogs[logNumber];
            if (logEntry.level === 'SEVERE') {
                item.logErrors++;
            }
            if (logEntry.level === 'WARNING') {
                item.logWarnings++;
            }
        }
    }
};

var convertTimestamp = function (timestamp) {
    var d = new Date(timestamp),
        yyyy = d.getFullYear(),
        mm = ('0' + (d.getMonth() + 1)).slice(-2),
        dd = ('0' + d.getDate()).slice(-2),
        hh = d.getHours(),
        h = hh,
        min = ('0' + d.getMinutes()).slice(-2),
        ampm = 'AM',
        time;

    if (hh > 12) {
        h = hh - 12;
        ampm = 'PM';
    } else if (hh === 12) {
        h = 12;
        ampm = 'PM';
    } else if (hh === 0) {
        h = 12;
    }

    // ie: 2013-02-18, 8:35 AM
    time = yyyy + '-' + mm + '-' + dd + ', ' + h + ':' + min + ' ' + ampm;

    return time;
};

var defaultSortFunction = function sortFunction(a, b) {
    if (a.sessionId < b.sessionId) {
        return -1;
    } else if (a.sessionId > b.sessionId) {
        return 1;
    }

    if (a.timestamp < b.timestamp) {
        return -1;
    } else if (a.timestamp > b.timestamp) {
        return 1;
    }

    return 0;
};

//</editor-fold>

app.controller('ScreenshotReportController', ['$scope', '$http', 'TitleService', function ($scope, $http, titleService) {
    var that = this;
    var clientDefaults = {};

    $scope.searchSettings = Object.assign({
        description: '',
        allselected: true,
        passed: true,
        failed: true,
        pending: true,
        withLog: true
    }, clientDefaults.searchSettings || {}); // enable customisation of search settings on first page hit

    this.warningTime = 1400;
    this.dangerTime = 1900;
    this.totalDurationFormat = clientDefaults.totalDurationFormat;
    this.showTotalDurationIn = clientDefaults.showTotalDurationIn;

    var initialColumnSettings = clientDefaults.columnSettings; // enable customisation of visible columns on first page hit
    if (initialColumnSettings) {
        if (initialColumnSettings.displayTime !== undefined) {
            // initial settings have be inverted because the html bindings are inverted (e.g. !ctrl.displayTime)
            this.displayTime = !initialColumnSettings.displayTime;
        }
        if (initialColumnSettings.displayBrowser !== undefined) {
            this.displayBrowser = !initialColumnSettings.displayBrowser; // same as above
        }
        if (initialColumnSettings.displaySessionId !== undefined) {
            this.displaySessionId = !initialColumnSettings.displaySessionId; // same as above
        }
        if (initialColumnSettings.displayOS !== undefined) {
            this.displayOS = !initialColumnSettings.displayOS; // same as above
        }
        if (initialColumnSettings.inlineScreenshots !== undefined) {
            this.inlineScreenshots = initialColumnSettings.inlineScreenshots; // this setting does not have to be inverted
        } else {
            this.inlineScreenshots = false;
        }
        if (initialColumnSettings.warningTime) {
            this.warningTime = initialColumnSettings.warningTime;
        }
        if (initialColumnSettings.dangerTime) {
            this.dangerTime = initialColumnSettings.dangerTime;
        }
    }


    this.chooseAllTypes = function () {
        var value = true;
        $scope.searchSettings.allselected = !$scope.searchSettings.allselected;
        if (!$scope.searchSettings.allselected) {
            value = false;
        }

        $scope.searchSettings.passed = value;
        $scope.searchSettings.failed = value;
        $scope.searchSettings.pending = value;
        $scope.searchSettings.withLog = value;
    };

    this.isValueAnArray = function (val) {
        return isValueAnArray(val);
    };

    this.getParent = function (str) {
        return getParent(str);
    };

    this.getSpec = function (str) {
        return getSpec(str);
    };

    this.getShortDescription = function (str) {
        return getShortDescription(str);
    };
    this.hasNextScreenshot = function (index) {
        var old = index;
        return old !== this.getNextScreenshotIdx(index);
    };

    this.hasPreviousScreenshot = function (index) {
        var old = index;
        return old !== this.getPreviousScreenshotIdx(index);
    };
    this.getNextScreenshotIdx = function (index) {
        var next = index;
        var hit = false;
        while (next + 2 < this.results.length) {
            next++;
            if (this.results[next].screenShotFile && !this.results[next].pending) {
                hit = true;
                break;
            }
        }
        return hit ? next : index;
    };

    this.getPreviousScreenshotIdx = function (index) {
        var prev = index;
        var hit = false;
        while (prev > 0) {
            prev--;
            if (this.results[prev].screenShotFile && !this.results[prev].pending) {
                hit = true;
                break;
            }
        }
        return hit ? prev : index;
    };

    this.convertTimestamp = convertTimestamp;


    this.round = function (number, roundVal) {
        return (parseFloat(number) / 1000).toFixed(roundVal);
    };


    this.passCount = function () {
        var passCount = 0;
        for (var i in this.results) {
            var result = this.results[i];
            if (result.passed) {
                passCount++;
            }
        }
        return passCount;
    };


    this.pendingCount = function () {
        var pendingCount = 0;
        for (var i in this.results) {
            var result = this.results[i];
            if (result.pending) {
                pendingCount++;
            }
        }
        return pendingCount;
    };

    this.failCount = function () {
        var failCount = 0;
        for (var i in this.results) {
            var result = this.results[i];
            if (!result.passed && !result.pending) {
                failCount++;
            }
        }
        return failCount;
    };

    this.totalDuration = function () {
        var sum = 0;
        for (var i in this.results) {
            var result = this.results[i];
            if (result.duration) {
                sum += result.duration;
            }
        }
        return sum;
    };

    this.passPerc = function () {
        return (this.passCount() / this.totalCount()) * 100;
    };
    this.pendingPerc = function () {
        return (this.pendingCount() / this.totalCount()) * 100;
    };
    this.failPerc = function () {
        return (this.failCount() / this.totalCount()) * 100;
    };
    this.totalCount = function () {
        return this.passCount() + this.failCount() + this.pendingCount();
    };


    var results = [
    {
        "description": "should have cities per page|Cities Page Test",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 3512,
        "browser": {
            "name": "chrome",
            "version": "88.0.4324.104"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "00270069-0056-0092-007e-00a20059008f.png",
        "timestamp": 1612091860220,
        "duration": 1743
    },
    {
        "description": "should search cities and provide correct results|Cities Page Test",
        "passed": false,
        "pending": false,
        "os": "Windows",
        "instanceId": 3512,
        "browser": {
            "name": "chrome",
            "version": "88.0.4324.104"
        },
        "message": [
            "Expected 6 to equal 1.",
            "Expected 'Winterset' to equal 'Bengaluru'."
        ],
        "trace": [
            "Error: Failed expectation\n    at BasePage.verifySearchCount (C:\\Users\\aksha\\Downloads\\assignment\\e2e\\tests\\pages\\BasePage.js:25:35)\n    at UserContext.<anonymous> (C:\\Users\\aksha\\Downloads\\assignment\\e2e\\tests\\CitiesSpec.js:31:20)\n    at C:\\Users\\aksha\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:112:25\n    at new ManagedPromise (C:\\Users\\aksha\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:1077:7)\n    at ControlFlow.promise (C:\\Users\\aksha\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2505:12)\n    at schedulerExecute (C:\\Users\\aksha\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:95:18)\n    at TaskQueue.execute_ (C:\\Users\\aksha\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3084:14)\n    at TaskQueue.executeNext_ (C:\\Users\\aksha\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3067:27)\n    at C:\\Users\\aksha\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2974:25",
            "Error: Failed expectation\n    at BasePage.verifySearchContentName (C:\\Users\\aksha\\Downloads\\assignment\\e2e\\tests\\pages\\BasePage.js:29:85)\n    at UserContext.<anonymous> (C:\\Users\\aksha\\Downloads\\assignment\\e2e\\tests\\CitiesSpec.js:32:20)\n    at C:\\Users\\aksha\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:112:25\n    at new ManagedPromise (C:\\Users\\aksha\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:1077:7)\n    at ControlFlow.promise (C:\\Users\\aksha\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2505:12)\n    at schedulerExecute (C:\\Users\\aksha\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:95:18)\n    at TaskQueue.execute_ (C:\\Users\\aksha\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3084:14)\n    at TaskQueue.executeNext_ (C:\\Users\\aksha\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3067:27)\n    at C:\\Users\\aksha\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2974:25"
        ],
        "browserLogs": [],
        "screenShotFile": "001000c8-0041-00bb-0032-00ef00f900e4.png",
        "timestamp": 1612091862435,
        "duration": 3096
    },
    {
        "description": "should open correct city|Cities Page Test",
        "passed": false,
        "pending": false,
        "os": "Windows",
        "instanceId": 3512,
        "browser": {
            "name": "chrome",
            "version": "88.0.4324.104"
        },
        "message": [
            "Expected 6 to equal 1.",
            "Expected 'Winterset' to equal 'Bengaluru'.",
            "Expected 'Winterset' to be 'Bengaluru'."
        ],
        "trace": [
            "Error: Failed expectation\n    at BasePage.verifySearchCount (C:\\Users\\aksha\\Downloads\\assignment\\e2e\\tests\\pages\\BasePage.js:25:35)\n    at UserContext.<anonymous> (C:\\Users\\aksha\\Downloads\\assignment\\e2e\\tests\\CitiesSpec.js:38:20)\n    at C:\\Users\\aksha\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:112:25\n    at new ManagedPromise (C:\\Users\\aksha\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:1077:7)\n    at ControlFlow.promise (C:\\Users\\aksha\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2505:12)\n    at schedulerExecute (C:\\Users\\aksha\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:95:18)\n    at TaskQueue.execute_ (C:\\Users\\aksha\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3084:14)\n    at TaskQueue.executeNext_ (C:\\Users\\aksha\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3067:27)\n    at C:\\Users\\aksha\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2974:25",
            "Error: Failed expectation\n    at BasePage.verifySearchContentName (C:\\Users\\aksha\\Downloads\\assignment\\e2e\\tests\\pages\\BasePage.js:29:85)\n    at UserContext.<anonymous> (C:\\Users\\aksha\\Downloads\\assignment\\e2e\\tests\\CitiesSpec.js:39:20)\n    at C:\\Users\\aksha\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:112:25\n    at new ManagedPromise (C:\\Users\\aksha\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:1077:7)\n    at ControlFlow.promise (C:\\Users\\aksha\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2505:12)\n    at schedulerExecute (C:\\Users\\aksha\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:95:18)\n    at TaskQueue.execute_ (C:\\Users\\aksha\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3084:14)\n    at TaskQueue.executeNext_ (C:\\Users\\aksha\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3067:27)\n    at C:\\Users\\aksha\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2974:25",
            "Error: Failed expectation\n    at UserContext.<anonymous> (C:\\Users\\aksha\\Downloads\\assignment\\e2e\\tests\\CitiesSpec.js:41:38)\n    at C:\\Users\\aksha\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:112:25\n    at new ManagedPromise (C:\\Users\\aksha\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:1077:7)\n    at ControlFlow.promise (C:\\Users\\aksha\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2505:12)\n    at schedulerExecute (C:\\Users\\aksha\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:95:18)\n    at TaskQueue.execute_ (C:\\Users\\aksha\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3084:14)\n    at TaskQueue.executeNext_ (C:\\Users\\aksha\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3067:27)\n    at C:\\Users\\aksha\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2974:25\n    at C:\\Users\\aksha\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:668:7"
        ],
        "browserLogs": [],
        "screenShotFile": "00f40058-0064-0047-00f7-004b00fa0089.png",
        "timestamp": 1612091865971,
        "duration": 3808
    },
    {
        "description": "should be able to add, update and delete continent|Cities Page Test",
        "passed": false,
        "pending": false,
        "os": "Windows",
        "instanceId": 3512,
        "browser": {
            "name": "chrome",
            "version": "88.0.4324.104"
        },
        "message": [
            "Expected 7 to equal 1.",
            "Expected 'Winterset' to equal 'Delhi'."
        ],
        "trace": [
            "Error: Failed expectation\n    at BasePage.verifySearchCount (C:\\Users\\aksha\\Downloads\\assignment\\e2e\\tests\\pages\\BasePage.js:25:35)\n    at UserContext.<anonymous> (C:\\Users\\aksha\\Downloads\\assignment\\e2e\\tests\\CitiesSpec.js:53:20)\n    at C:\\Users\\aksha\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:112:25\n    at new ManagedPromise (C:\\Users\\aksha\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:1077:7)\n    at ControlFlow.promise (C:\\Users\\aksha\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2505:12)\n    at schedulerExecute (C:\\Users\\aksha\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:95:18)\n    at TaskQueue.execute_ (C:\\Users\\aksha\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3084:14)\n    at TaskQueue.executeNext_ (C:\\Users\\aksha\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3067:27)\n    at C:\\Users\\aksha\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2974:25",
            "Error: Failed expectation\n    at BasePage.verifySearchContentName (C:\\Users\\aksha\\Downloads\\assignment\\e2e\\tests\\pages\\BasePage.js:29:85)\n    at UserContext.<anonymous> (C:\\Users\\aksha\\Downloads\\assignment\\e2e\\tests\\CitiesSpec.js:54:20)\n    at C:\\Users\\aksha\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:112:25\n    at new ManagedPromise (C:\\Users\\aksha\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:1077:7)\n    at ControlFlow.promise (C:\\Users\\aksha\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2505:12)\n    at schedulerExecute (C:\\Users\\aksha\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:95:18)\n    at TaskQueue.execute_ (C:\\Users\\aksha\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3084:14)\n    at TaskQueue.executeNext_ (C:\\Users\\aksha\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3067:27)\n    at C:\\Users\\aksha\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2974:25"
        ],
        "browserLogs": [],
        "screenShotFile": "004600b1-006d-00b4-0071-0057005d0015.png",
        "timestamp": 1612091870183,
        "duration": 8744
    },
    {
        "description": "should have continents per page|Continents Page Test",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 3512,
        "browser": {
            "name": "chrome",
            "version": "88.0.4324.104"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "008300be-001c-00fb-0030-000c00f40059.png",
        "timestamp": 1612091881025,
        "duration": 1368
    },
    {
        "description": "should search continents and provide correct results|Continents Page Test",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 3512,
        "browser": {
            "name": "chrome",
            "version": "88.0.4324.104"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "00b70006-008c-00fb-002f-001f00f00016.png",
        "timestamp": 1612091882736,
        "duration": 3232
    },
    {
        "description": "should open correct continent|Continents Page Test",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 3512,
        "browser": {
            "name": "chrome",
            "version": "88.0.4324.104"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "00a90004-00b9-00ac-0003-000d00a80083.png",
        "timestamp": 1612091886303,
        "duration": 3925
    },
    {
        "description": "should be able to add, update and delete continent|Continents Page Test",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 3512,
        "browser": {
            "name": "chrome",
            "version": "88.0.4324.104"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "00000001-007d-00c7-000f-00e700ac0016.png",
        "timestamp": 1612091890603,
        "duration": 10356
    },
    {
        "description": "should have countries per page|Countries Page Test",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 3512,
        "browser": {
            "name": "chrome",
            "version": "88.0.4324.104"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "006d003a-00ab-00d5-000a-00c4003b006e.png",
        "timestamp": 1612091903693,
        "duration": 1850
    },
    {
        "description": "should search countries and provide correct results|Countries Page Test",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 3512,
        "browser": {
            "name": "chrome",
            "version": "88.0.4324.104"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "00ce0026-004e-006b-006b-00c700c30077.png",
        "timestamp": 1612091905946,
        "duration": 4076
    },
    {
        "description": "should open correct country|Countries Page Test",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 3512,
        "browser": {
            "name": "chrome",
            "version": "88.0.4324.104"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "000c00f7-0075-00cf-00c7-000000db00c5.png",
        "timestamp": 1612091910349,
        "duration": 4939
    },
    {
        "description": "should be able to add, update and delete continent|Countries Page Test",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 3512,
        "browser": {
            "name": "chrome",
            "version": "88.0.4324.104"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "006000f7-0024-0037-007b-00f3000d00c5.png",
        "timestamp": 1612091915595,
        "duration": 10409
    },
    {
        "description": "should have multipe folders present|Dashboard Page Test",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 3512,
        "browser": {
            "name": "chrome",
            "version": "88.0.4324.104"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "0050004e-00d5-009f-00c5-00170040004a.png",
        "timestamp": 1612091927289,
        "duration": 739
    },
    {
        "description": "should open correct link on clicking each folder|Dashboard Page Test",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 3512,
        "browser": {
            "name": "chrome",
            "version": "88.0.4324.104"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "003a002a-001c-003d-009b-003400d50052.png",
        "timestamp": 1612091928337,
        "duration": 9547
    },
    {
        "description": "should search movies and provide correct results|Home Page Test",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 3512,
        "browser": {
            "name": "chrome",
            "version": "88.0.4324.104"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "00c2006d-00ad-0006-0019-0071001c00a9.png",
        "timestamp": 1612091939552,
        "duration": 2663
    },
    {
        "description": "should have movies per page|Home Page Test",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 3512,
        "browser": {
            "name": "chrome",
            "version": "88.0.4324.104"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "000700af-00c2-003f-00ac-00ab00e2009e.png",
        "timestamp": 1612091942536,
        "duration": 1929
    },
    {
        "description": "should open correct movie|Home Page Test",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 3512,
        "browser": {
            "name": "chrome",
            "version": "88.0.4324.104"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "00a000bf-001a-00e6-0078-009000500009.png",
        "timestamp": 1612091944809,
        "duration": 3664
    },
    {
        "description": "should open correct link when clicked on items list|Home Page Test",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 3512,
        "browser": {
            "name": "chrome",
            "version": "88.0.4324.104"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "00070017-0063-00d2-0042-005900620045.png",
        "timestamp": 1612091948866,
        "duration": 7471
    },
    {
        "description": "should have movies per page|Movies Images Page Test",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 3512,
        "browser": {
            "name": "chrome",
            "version": "88.0.4324.104"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "006c0086-00be-0034-00ee-004000dd0023.png",
        "timestamp": 1612091958739,
        "duration": 1760
    },
    {
        "description": "should search movies and provide correct results|Movies Images Page Test",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 3512,
        "browser": {
            "name": "chrome",
            "version": "88.0.4324.104"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "003200a0-0028-0026-0039-00c000a000bc.png",
        "timestamp": 1612091960839,
        "duration": 3247
    },
    {
        "description": "should open correct movie|Movies Images Page Test",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 3512,
        "browser": {
            "name": "chrome",
            "version": "88.0.4324.104"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "00cc0022-0076-00ea-00fb-00c700da000f.png",
        "timestamp": 1612091964446,
        "duration": 3751
    },
    {
        "description": "should be able to add, update and delete movie|Movies Images Page Test",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 3512,
        "browser": {
            "name": "chrome",
            "version": "88.0.4324.104"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "00de002d-001c-0066-00b8-00df0027002f.png",
        "timestamp": 1612091968596,
        "duration": 11597
    },
    {
        "description": "should have movies per page|Movies Page Test",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 3512,
        "browser": {
            "name": "chrome",
            "version": "88.0.4324.104"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "008c00d2-00d1-00ff-00fc-00b100960036.png",
        "timestamp": 1612091981789,
        "duration": 1319
    },
    {
        "description": "should search movies and provide correct results|Movies Page Test",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 3512,
        "browser": {
            "name": "chrome",
            "version": "88.0.4324.104"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "00ac00e8-004b-00c3-00ab-004c00340008.png",
        "timestamp": 1612091983430,
        "duration": 4170
    },
    {
        "description": "should open correct movie|Movies Page Test",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 3512,
        "browser": {
            "name": "chrome",
            "version": "88.0.4324.104"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "00720071-0063-0042-00f1-00f10087002f.png",
        "timestamp": 1612091987947,
        "duration": 5019
    },
    {
        "description": "should be able to add, update and delete movie|Movies Page Test",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 3512,
        "browser": {
            "name": "chrome",
            "version": "88.0.4324.104"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "002c0023-00c9-003c-0058-00b500aa0087.png",
        "timestamp": 1612091993349,
        "duration": 12348
    },
    {
        "description": "should have shows per page|Show Images Page Test",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 3512,
        "browser": {
            "name": "chrome",
            "version": "88.0.4324.104"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "009700ac-0051-0058-002b-009300610023.png",
        "timestamp": 1612092010001,
        "duration": 6376
    },
    {
        "description": "should search shows and provide correct results|Show Images Page Test",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 3512,
        "browser": {
            "name": "chrome",
            "version": "88.0.4324.104"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "00a50090-0074-004d-009f-00130022005c.png",
        "timestamp": 1612092016725,
        "duration": 6323
    },
    {
        "description": "should open correct show|Show Images Page Test",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 3512,
        "browser": {
            "name": "chrome",
            "version": "88.0.4324.104"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "007d0004-001c-00e8-00a7-003300e8003c.png",
        "timestamp": 1612092023376,
        "duration": 11622
    },
    {
        "description": "should be able to add, update and delete show|Show Images Page Test",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 3512,
        "browser": {
            "name": "chrome",
            "version": "88.0.4324.104"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "00950014-0005-001a-008a-003c003a0075.png",
        "timestamp": 1612092035433,
        "duration": 16584
    },
    {
        "description": "should have show per page|Shows Page Test",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 3512,
        "browser": {
            "name": "chrome",
            "version": "88.0.4324.104"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "00ec0051-005d-001a-00bb-00a9008f0071.png",
        "timestamp": 1612092055052,
        "duration": 1447
    },
    {
        "description": "should search show and provide correct results|Shows Page Test",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 3512,
        "browser": {
            "name": "chrome",
            "version": "88.0.4324.104"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "00730070-00d4-007a-003a-00d900ed0090.png",
        "timestamp": 1612092056815,
        "duration": 3503
    },
    {
        "description": "should open correct show|Shows Page Test",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 3512,
        "browser": {
            "name": "chrome",
            "version": "88.0.4324.104"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "000d005a-00dd-0060-0063-003c00f5002f.png",
        "timestamp": 1612092060679,
        "duration": 3813
    },
    {
        "description": "should be able to add, update and delete show|Shows Page Test",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 3512,
        "browser": {
            "name": "chrome",
            "version": "88.0.4324.104"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "004d00ea-004b-0022-003a-00b200f6003a.png",
        "timestamp": 1612092064915,
        "duration": 10860
    }
];

    this.sortSpecs = function () {
        this.results = results.sort(function sortFunction(a, b) {
    if (a.sessionId < b.sessionId) return -1;else if (a.sessionId > b.sessionId) return 1;

    if (a.timestamp < b.timestamp) return -1;else if (a.timestamp > b.timestamp) return 1;

    return 0;
});

    };

    this.setTitle = function () {
        var title = $('.report-title').text();
        titleService.setTitle(title);
    };

    // is run after all test data has been prepared/loaded
    this.afterLoadingJobs = function () {
        this.sortSpecs();
        this.setTitle();
    };

    this.loadResultsViaAjax = function () {

        $http({
            url: './combined.json',
            method: 'GET'
        }).then(function (response) {
                var data = null;
                if (response && response.data) {
                    if (typeof response.data === 'object') {
                        data = response.data;
                    } else if (response.data[0] === '"') { //detect super escaped file (from circular json)
                        data = CircularJSON.parse(response.data); //the file is escaped in a weird way (with circular json)
                    } else {
                        data = JSON.parse(response.data);
                    }
                }
                if (data) {
                    results = data;
                    that.afterLoadingJobs();
                }
            },
            function (error) {
                console.error(error);
            });
    };


    if (clientDefaults.useAjax) {
        this.loadResultsViaAjax();
    } else {
        this.afterLoadingJobs();
    }

}]);

app.filter('bySearchSettings', function () {
    return function (items, searchSettings) {
        var filtered = [];
        if (!items) {
            return filtered; // to avoid crashing in where results might be empty
        }
        var prevItem = null;

        for (var i = 0; i < items.length; i++) {
            var item = items[i];
            item.displaySpecName = false;

            var isHit = false; //is set to true if any of the search criteria matched
            countLogMessages(item); // modifies item contents

            var hasLog = searchSettings.withLog && item.browserLogs && item.browserLogs.length > 0;
            if (searchSettings.description === '' ||
                (item.description && item.description.toLowerCase().indexOf(searchSettings.description.toLowerCase()) > -1)) {

                if (searchSettings.passed && item.passed || hasLog) {
                    isHit = true;
                } else if (searchSettings.failed && !item.passed && !item.pending || hasLog) {
                    isHit = true;
                } else if (searchSettings.pending && item.pending || hasLog) {
                    isHit = true;
                }
            }
            if (isHit) {
                checkIfShouldDisplaySpecName(prevItem, item);

                filtered.push(item);
                prevItem = item;
            }
        }

        return filtered;
    };
});

//formats millseconds to h m s
app.filter('timeFormat', function () {
    return function (tr, fmt) {
        if(tr == null){
            return "NaN";
        }

        switch (fmt) {
            case 'h':
                var h = tr / 1000 / 60 / 60;
                return "".concat(h.toFixed(2)).concat("h");
            case 'm':
                var m = tr / 1000 / 60;
                return "".concat(m.toFixed(2)).concat("min");
            case 's' :
                var s = tr / 1000;
                return "".concat(s.toFixed(2)).concat("s");
            case 'hm':
            case 'h:m':
                var hmMt = tr / 1000 / 60;
                var hmHr = Math.trunc(hmMt / 60);
                var hmMr = hmMt - (hmHr * 60);
                if (fmt === 'h:m') {
                    return "".concat(hmHr).concat(":").concat(hmMr < 10 ? "0" : "").concat(Math.round(hmMr));
                }
                return "".concat(hmHr).concat("h ").concat(hmMr.toFixed(2)).concat("min");
            case 'hms':
            case 'h:m:s':
                var hmsS = tr / 1000;
                var hmsHr = Math.trunc(hmsS / 60 / 60);
                var hmsM = hmsS / 60;
                var hmsMr = Math.trunc(hmsM - hmsHr * 60);
                var hmsSo = hmsS - (hmsHr * 60 * 60) - (hmsMr*60);
                if (fmt === 'h:m:s') {
                    return "".concat(hmsHr).concat(":").concat(hmsMr < 10 ? "0" : "").concat(hmsMr).concat(":").concat(hmsSo < 10 ? "0" : "").concat(Math.round(hmsSo));
                }
                return "".concat(hmsHr).concat("h ").concat(hmsMr).concat("min ").concat(hmsSo.toFixed(2)).concat("s");
            case 'ms':
                var msS = tr / 1000;
                var msMr = Math.trunc(msS / 60);
                var msMs = msS - (msMr * 60);
                return "".concat(msMr).concat("min ").concat(msMs.toFixed(2)).concat("s");
        }

        return tr;
    };
});


function PbrStackModalController($scope, $rootScope) {
    var ctrl = this;
    ctrl.rootScope = $rootScope;
    ctrl.getParent = getParent;
    ctrl.getShortDescription = getShortDescription;
    ctrl.convertTimestamp = convertTimestamp;
    ctrl.isValueAnArray = isValueAnArray;
    ctrl.toggleSmartStackTraceHighlight = function () {
        var inv = !ctrl.rootScope.showSmartStackTraceHighlight;
        ctrl.rootScope.showSmartStackTraceHighlight = inv;
    };
    ctrl.applySmartHighlight = function (line) {
        if ($rootScope.showSmartStackTraceHighlight) {
            if (line.indexOf('node_modules') > -1) {
                return 'greyout';
            }
            if (line.indexOf('  at ') === -1) {
                return '';
            }

            return 'highlight';
        }
        return '';
    };
}


app.component('pbrStackModal', {
    templateUrl: "pbr-stack-modal.html",
    bindings: {
        index: '=',
        data: '='
    },
    controller: PbrStackModalController
});

function PbrScreenshotModalController($scope, $rootScope) {
    var ctrl = this;
    ctrl.rootScope = $rootScope;
    ctrl.getParent = getParent;
    ctrl.getShortDescription = getShortDescription;

    /**
     * Updates which modal is selected.
     */
    this.updateSelectedModal = function (event, index) {
        var key = event.key; //try to use non-deprecated key first https://developer.mozilla.org/de/docs/Web/API/KeyboardEvent/keyCode
        if (key == null) {
            var keyMap = {
                37: 'ArrowLeft',
                39: 'ArrowRight'
            };
            key = keyMap[event.keyCode]; //fallback to keycode
        }
        if (key === "ArrowLeft" && this.hasPrevious) {
            this.showHideModal(index, this.previous);
        } else if (key === "ArrowRight" && this.hasNext) {
            this.showHideModal(index, this.next);
        }
    };

    /**
     * Hides the modal with the #oldIndex and shows the modal with the #newIndex.
     */
    this.showHideModal = function (oldIndex, newIndex) {
        const modalName = '#imageModal';
        $(modalName + oldIndex).modal("hide");
        $(modalName + newIndex).modal("show");
    };

}

app.component('pbrScreenshotModal', {
    templateUrl: "pbr-screenshot-modal.html",
    bindings: {
        index: '=',
        data: '=',
        next: '=',
        previous: '=',
        hasNext: '=',
        hasPrevious: '='
    },
    controller: PbrScreenshotModalController
});

app.factory('TitleService', ['$document', function ($document) {
    return {
        setTitle: function (title) {
            $document[0].title = title;
        }
    };
}]);


app.run(
    function ($rootScope, $templateCache) {
        //make sure this option is on by default
        $rootScope.showSmartStackTraceHighlight = true;
        
  $templateCache.put('pbr-screenshot-modal.html',
    '<div class="modal" id="imageModal{{$ctrl.index}}" tabindex="-1" role="dialog"\n' +
    '     aria-labelledby="imageModalLabel{{$ctrl.index}}" ng-keydown="$ctrl.updateSelectedModal($event,$ctrl.index)">\n' +
    '    <div class="modal-dialog modal-lg m-screenhot-modal" role="document">\n' +
    '        <div class="modal-content">\n' +
    '            <div class="modal-header">\n' +
    '                <button type="button" class="close" data-dismiss="modal" aria-label="Close">\n' +
    '                    <span aria-hidden="true">&times;</span>\n' +
    '                </button>\n' +
    '                <h6 class="modal-title" id="imageModalLabelP{{$ctrl.index}}">\n' +
    '                    {{$ctrl.getParent($ctrl.data.description)}}</h6>\n' +
    '                <h5 class="modal-title" id="imageModalLabel{{$ctrl.index}}">\n' +
    '                    {{$ctrl.getShortDescription($ctrl.data.description)}}</h5>\n' +
    '            </div>\n' +
    '            <div class="modal-body">\n' +
    '                <img class="screenshotImage" ng-src="{{$ctrl.data.screenShotFile}}">\n' +
    '            </div>\n' +
    '            <div class="modal-footer">\n' +
    '                <div class="pull-left">\n' +
    '                    <button ng-disabled="!$ctrl.hasPrevious" class="btn btn-default btn-previous" data-dismiss="modal"\n' +
    '                            data-toggle="modal" data-target="#imageModal{{$ctrl.previous}}">\n' +
    '                        Prev\n' +
    '                    </button>\n' +
    '                    <button ng-disabled="!$ctrl.hasNext" class="btn btn-default btn-next"\n' +
    '                            data-dismiss="modal" data-toggle="modal"\n' +
    '                            data-target="#imageModal{{$ctrl.next}}">\n' +
    '                        Next\n' +
    '                    </button>\n' +
    '                </div>\n' +
    '                <a class="btn btn-primary" href="{{$ctrl.data.screenShotFile}}" target="_blank">\n' +
    '                    Open Image in New Tab\n' +
    '                    <span class="glyphicon glyphicon-new-window" aria-hidden="true"></span>\n' +
    '                </a>\n' +
    '                <button type="button" class="btn btn-default" data-dismiss="modal">Close</button>\n' +
    '            </div>\n' +
    '        </div>\n' +
    '    </div>\n' +
    '</div>\n' +
     ''
  );

  $templateCache.put('pbr-stack-modal.html',
    '<div class="modal" id="modal{{$ctrl.index}}" tabindex="-1" role="dialog"\n' +
    '     aria-labelledby="stackModalLabel{{$ctrl.index}}">\n' +
    '    <div class="modal-dialog modal-lg m-stack-modal" role="document">\n' +
    '        <div class="modal-content">\n' +
    '            <div class="modal-header">\n' +
    '                <button type="button" class="close" data-dismiss="modal" aria-label="Close">\n' +
    '                    <span aria-hidden="true">&times;</span>\n' +
    '                </button>\n' +
    '                <h6 class="modal-title" id="stackModalLabelP{{$ctrl.index}}">\n' +
    '                    {{$ctrl.getParent($ctrl.data.description)}}</h6>\n' +
    '                <h5 class="modal-title" id="stackModalLabel{{$ctrl.index}}">\n' +
    '                    {{$ctrl.getShortDescription($ctrl.data.description)}}</h5>\n' +
    '            </div>\n' +
    '            <div class="modal-body">\n' +
    '                <div ng-if="$ctrl.data.trace.length > 0">\n' +
    '                    <div ng-if="$ctrl.isValueAnArray($ctrl.data.trace)">\n' +
    '                        <pre class="logContainer" ng-repeat="trace in $ctrl.data.trace track by $index"><div ng-class="$ctrl.applySmartHighlight(line)" ng-repeat="line in trace.split(\'\\n\') track by $index">{{line}}</div></pre>\n' +
    '                    </div>\n' +
    '                    <div ng-if="!$ctrl.isValueAnArray($ctrl.data.trace)">\n' +
    '                        <pre class="logContainer"><div ng-class="$ctrl.applySmartHighlight(line)" ng-repeat="line in $ctrl.data.trace.split(\'\\n\') track by $index">{{line}}</div></pre>\n' +
    '                    </div>\n' +
    '                </div>\n' +
    '                <div ng-if="$ctrl.data.browserLogs.length > 0">\n' +
    '                    <h5 class="modal-title">\n' +
    '                        Browser logs:\n' +
    '                    </h5>\n' +
    '                    <pre class="logContainer"><div class="browserLogItem"\n' +
    '                                                   ng-repeat="logError in $ctrl.data.browserLogs track by $index"><div><span class="label browserLogLabel label-default"\n' +
    '                                                                                                                             ng-class="{\'label-danger\': logError.level===\'SEVERE\', \'label-warning\': logError.level===\'WARNING\'}">{{logError.level}}</span><span class="label label-default">{{$ctrl.convertTimestamp(logError.timestamp)}}</span><div ng-repeat="messageLine in logError.message.split(\'\\\\n\') track by $index">{{ messageLine }}</div></div></div></pre>\n' +
    '                </div>\n' +
    '            </div>\n' +
    '            <div class="modal-footer">\n' +
    '                <button class="btn btn-default"\n' +
    '                        ng-class="{active: $ctrl.rootScope.showSmartStackTraceHighlight}"\n' +
    '                        ng-click="$ctrl.toggleSmartStackTraceHighlight()">\n' +
    '                    <span class="glyphicon glyphicon-education black"></span> Smart Stack Trace\n' +
    '                </button>\n' +
    '                <button type="button" class="btn btn-default" data-dismiss="modal">Close</button>\n' +
    '            </div>\n' +
    '        </div>\n' +
    '    </div>\n' +
    '</div>\n' +
     ''
  );

    });
