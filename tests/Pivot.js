// Copyright (c) Microsoft Corp.  All Rights Reserved. Licensed under the MIT License. See License.txt in the project root for license information.

describe("Pivot control directive tests", function () {
    var testTimeout = 5000,
        testDatasourceLength = 5;

    var scope,
        compile;

    beforeEach(angular.mock.module("winjs"));
    beforeEach(angular.mock.inject(function ($rootScope, $compile) {
        scope = $rootScope.$new();
        compile = $compile;
    }));
    beforeEach(function () {
        WinJS.Utilities._fastAnimations = true;
    });

    function initControl(markup) {
        var element = angular.element(markup)[0];
        document.body.appendChild(element);
        var compiledControl = compile(element)(scope)[0];
        scope.$digest();
        return compiledControl;
    }

    it("should initialize a simple Pivot", function () {
        var compiledControl = initControl("<win-pivot></win-pivot>");

        expect(compiledControl.winControl).toBeDefined();
        expect(compiledControl.winControl instanceof WinJS.UI.Pivot);
        expect(compiledControl.className).toContain("win-pivot");
    });

    it("should use the locked attribute", function () {
        var compiledControl = initControl("<win-pivot locked='true'></win-pivot>");
        expect(compiledControl.winControl.locked).toBeTruthy();
    });

    it("should use the title attribute", function () {
        var compiledControl = initControl("<win-pivot title=\"'PivotTitle'\"></win-pivot>");
        expect(compiledControl.winControl.title).toEqual("PivotTitle");
    });

    it("should use inline pivot items", function () {
        var compiledControl = initControl("<win-pivot>" +
                                              "<win-pivot-item header=\"'Header1'\">Item1</win-pivot-item>" +
                                              "<win-pivot-item header=\"'Header2'\">Item2</win-pivot-item>" +
                                          "</win-pivot>");
        // The Pivot doesn't have a loadingStateChanged event (or any similar loading complete events).
        // We'll use itemanimationend as a signal for loading complete.
        var gotItemAnimationEndEvent = false;
        compiledControl.addEventListener("itemanimationend", function () {
            gotItemAnimationEndEvent = true;
        }, false);
        waitsFor(function () {
            return gotItemAnimationEndEvent;
        }, "the Pivot to load", testTimeout);

        runs(function () {
            var pivotHeaders = compiledControl.querySelectorAll(".win-pivot-header");
            var pivotItemContent = compiledControl.querySelectorAll(".win-pivot-item-content");
            expect(pivotHeaders.length).toEqual(2);
            expect(pivotItemContent.length).toEqual(2);
            expect(pivotHeaders[0].innerHTML).toEqual("Header1");
            expect(pivotHeaders[1].innerHTML).toEqual("Header2");
            expect(pivotItemContent[0].firstElementChild.innerHTML).toEqual("Item1");
            expect(pivotItemContent[1].firstElementChild.innerHTML).toEqual("Item2");
        });
    });

    it("should use the selectedIndex attribute", function () {
        scope.selectedIndex = 0;
        var compiledControl = initControl("<win-pivot selected-index='selectedIndex'>" +
                                              "<win-pivot-item header=\"'Header1'\">Item1</win-pivot-item>" +
                                              "<win-pivot-item header=\"'Header2'\">Item2</win-pivot-item>" +
                                          "</win-pivot>"),
            pivot = compiledControl.winControl;

        var gotItemAnimationEndEvent = false;
        compiledControl.addEventListener("itemanimationend", function () {
            gotItemAnimationEndEvent = true;
        }, false);

        waitsFor(function () {
            return gotItemAnimationEndEvent;
        }, "the Pivot to load", testTimeout);

        runs(function () {
            gotItemAnimationEndEvent = false;
            expect(pivot.selectedIndex).toEqual(0);
            scope.selectedIndex = 1;
            scope.$digest();
        });

        waitsFor(function () {
            return gotItemAnimationEndEvent;
        }, "the Pivot to change pages", testTimeout);

        runs(function () {
            expect(pivot.selectedIndex).toEqual(1);
        });
    });
    
    it("should use the selectedItem attribute", function () {
        scope.selectedItem = null;
        var compiledControl = initControl("<win-pivot selected-item='selectedItem'>" +
                                              "<win-pivot-item header=\"'Header1'\">Item1</win-pivot-item>" +
                                              "<win-pivot-item header=\"'Header2'\">Item2</win-pivot-item>" +
                                          "</win-pivot>"),
            pivot = compiledControl.winControl;

        var gotItemAnimationEndEvent = false;
        compiledControl.addEventListener("itemanimationend", function () {
            gotItemAnimationEndEvent = true;
        }, false);

        waitsFor(function () {
            return gotItemAnimationEndEvent;
        }, "the Pivot to load", testTimeout);

        runs(function () {
            gotItemAnimationEndEvent = false;
            expect(pivot.selectedIndex).toEqual(0);
            scope.selectedItem = compiledControl.querySelectorAll(".win-pivot-item")[1].winControl;
            scope.$digest();
        });

        waitsFor(function () {
            return gotItemAnimationEndEvent;
        }, "the Pivot to change pages", testTimeout);

        runs(function () {
            expect(pivot.selectedIndex).toEqual(1);
        });
    });

    it("should use the on-item-animation-end event handler", function () {
        var gotItemAnimationEndEvent = false;
        scope.itemAnimationEndHandler = function (e) {
            gotItemAnimationEndEvent = true;
        };
        var compiledControl = initControl("<win-pivot on-item-animation-end='itemAnimationEndHandler($event)'>" +
                                              "<win-pivot-item>Item1</win-pivot-item>" +
                                          "</win-pivot>");
        waitsFor(function () {
            return gotItemAnimationEndEvent;
        }, "the Pivot to fire animation events", testTimeout);
    });

    it("should use the custom header attributes", function () {
        scope.customLeftHeader = document.createElement("div");
        scope.customRightHeader = document.createElement("div");
        var control = initControl("<win-pivot custom-left-header='customLeftHeader' custom-right-header='customRightHeader'>" +
                                     "<win-pivot-item>Item1</win-pivot-item>" +
                                  "</win-pivot>").winControl;

        expect(control.customLeftHeader).toEqual(scope.customLeftHeader);
        expect(control.customRightHeader).toEqual(scope.customRightHeader);
    });

    it("should use the custom header directives", function () {
        var control = initControl("<win-pivot>" +
                                      "<win-pivot-left-header>LeftHeader</win-pivot-left-header>" +
                                      "<win-pivot-item>Item1</win-pivot-item>" +
                                      "<win-pivot-right-header>RightHeader</win-pivot-right-header>" +
                                  "</win-pivot>").winControl;

        expect(control.customLeftHeader.firstElementChild.innerHTML).toEqual("LeftHeader");
        expect(control.customRightHeader.firstElementChild.innerHTML).toEqual("RightHeader");
    });

    it("should render child WinJS controls that need to measure", function () {
        var listViewLoaded;
        scope.onListViewStateChanged = function (e) {
            if (e.currentTarget.winControl && e.currentTarget.winControl.loadingState === "complete") {
                listViewLoaded = true;
            }
        };
        scope.childData = [1, 2, 3];
        var compiledControl = initControl("<win-pivot>" +
                                              "<win-pivot-item><win-list-view item-data-source='childData' on-loading-state-changed='onListViewStateChanged($event)'></win-list-view></win-pivot-item>" +
                                          "</win-pivot>");

        waitsFor(function () {
            return listViewLoaded;
        }, "the child ListView to load", testTimeout);

        runs(function () {
            expect(compiledControl.querySelectorAll(".win-item").length > 0);
        });
    });

    it("should let ng-repeat add new pivot items", function () {
        scope.items = [
            { title: "Item0" },
            { title: "Item1" }
        ];
        var compiledControl = initControl("<win-pivot>" +
                                      "<win-pivot-item ng-repeat='item in items' header='item.title'></win-pivot-item>" +
                                  "</win-pivot>");

        var gotItemAnimationEndEvent = false;
        compiledControl.addEventListener("itemanimationend", function () {
            gotItemAnimationEndEvent = true;
        }, false);
        waitsFor(function () {
            return gotItemAnimationEndEvent;
        }, "the Pivot to load", testTimeout);

        runs(function () {
            var pivotHeaders = compiledControl.querySelectorAll(".win-pivot-header");
            expect(pivotHeaders.length).toEqual(2);
            expect(pivotHeaders[0].innerHTML).toEqual("Item0");
            expect(pivotHeaders[1].innerHTML).toEqual("Item1");
            scope.items.push({ title: "NewItem" });
            scope.$digest();
            pivotHeaders = compiledControl.querySelectorAll(".win-pivot-header");
            expect(pivotHeaders.length).toEqual(3);
            expect(pivotHeaders[0].innerHTML).toEqual("Item0");
            expect(pivotHeaders[1].innerHTML).toEqual("Item1");
            expect(pivotHeaders[2].innerHTML).toEqual("NewItem");
        });
    });

    afterEach(function () {
        var controls = document.querySelectorAll(".win-pivot");
        for (var i = 0; i < controls.length; i++) {
            controls[i].parentNode.removeChild(controls[i]);
        }
        WinJS.Utilities._fastAnimations = false;
    });
});
