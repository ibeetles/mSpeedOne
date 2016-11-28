
(function(angular) {
    // ERROR CODE
    // ERROR (1000) - PERMSSION DENIED
    // ECODE(1001) - Market List      Failed to retrieve Market list
    // ECODE(1002) - Advertiser List  Failed to retrieve Advertiser list
    // ECODE(1003) - Vertical List    Failed to retrieve Vertical list

    // get changes
    // unnecessary dependent files should be removed
    'use strict';

    angular.module('ngMobileSpeedOne')
    .controller('ngInputCtrl', function($scope, $cookieStore, $http, $interval, dremelF,CONST,RESOURCE) {
        var currentMarket = null;

        $scope.ErrMsg = '';

        $scope.jsonMarketList = [];
        $scope.jsonVerticalList = [];
        $scope.jsonAdvertiserList = [];
        $scope.jsonWPTDataList = [];
        $scope.jsonLanguages = [];

        $scope.appTitle = RESOURCE.APP_TITLE;

        angular.element(document).ready(function () {
            $scope.jsonLanguages = dremelF.getLanguages();

            dremelF.executeSQL('Markets', null, null, null).then(
                // success function
                function(jsonData) {
                    $scope.jsonMarketList = jsonData;

                    if(validateJsonData($scope.jsonMarketList) === false) {
                        // no data retrieve. Maybe SQL statement error or something
                        console.log(RESOURCE.INTERNAL_ERR_MSG_USER_INPUT_MARKET_FAILED);
                        $scope.ErrMsg = 'ECODE(1001) ' + RESOURCE.USER_INPUT_FAIL_SUGGESTION_EN ;
                    } else
                        console.log(RESOURCE.INTERNAL_ERR_MSG_USER_INPUT_MARKET_SUCCEED);
                },
                // error function
                function(e) {
                    onDataError(e);  // Failed to retrieve Market List data (Welcome.html)

                    if(e.statusCode === 'PERMISSION_DENIED') {
                        console.log(RESOURCE.INTERNAL_ERR_MSG_USER_INPUT_MARKET_FAILED);
                        $scope.ErrMsg = 'ECODE(1000) ' + RESOURCE.ACCESS_PERMISSIN_DENIED_SUGGESTION_EN ;
                    } else {
                        console.log(RESOURCE.INTERNAL_ERR_MSG_USER_INPUT_MARKET_FAILED);
                        $scope.ErrMsg = 'ECODE(1001) ' + RESOURCE.USER_INPUT_FAIL_SUGGESTION_EN ;
                    }
                }
            );
        });

        function initialize() {
            $scope.jsonVerticalList = [];
            $scope.jsonAdvertiserList = [];
        }

        function onDataError(e) {
            if (e.getStatusText) {
                console.log(e.getStatusText());
            } else {
                console.log(e);
            }
        }

        function validateJsonData(json) {
            if(json === null || json === undefined || json.length <= 0) {
                return false;
            }
            return true;
        }

        $scope.getMarkets = function () {

            if($scope.selectedMarket === undefined || $scope.selectedMarket === null) {
                if(currentMarket != undefined && currentMarket != null ) {

                    initialize();
                    currentMarket = $scope.selectedMarket;
                }
                return;
            }

            if($scope.selectedMarket.country != currentMarket && $scope.selectedMarket.country.length > 0) {

                currentMarket = $scope.selectedMarket;

                initialize();

                dremelF.executeSQL('Advertisers',currentMarket.region, currentMarket.country, null).then(
                    /* success function */
                    function(jsonData) {

                        $scope.jsonAdvertiserList = jsonData;
                        //if (jsonData[0].advertiser_name == undefined) {
                        //    alert('undefined');
                        //    console.log('error occurred');
                        //}

                        if(validateJsonData($scope.jsonAdvertiserList) === false) {
                            initialize();
                            $scope.ErrMsg = 'ECODE(1002)' + RESOURCE.USER_INPUT_FAIL_SUGGESTION_EN ;
                            console.log(RESOURCE.INTERNAL_ERR_MSG_ADVERTISER_FAILED);
                        } else {
                            console.log(RESOURCE.INTERNAL_ERR_MSG_ADVERTISER_SUCCEEDED);
                        }
                    },
                    /* error function */
                    function(e) {
                        onDataError(e);  // Failed to retrieve Vertical data (Welcome.html)

                        initialize();
                        $scope.ErrMsg = 'ECODE(1002)' + RESOURCE.USER_INPUT_FAIL_SUGGESTION_EN ;
                        console.log(RESOURCE.INTERNAL_ERR_MSG_ADVERTISER_FAILED);
                    }
                );
            }
        }

        $scope.setUserInput= function () {
            dremelF.setUserInput(   $scope.selectedMarket,
                                    $scope.selectedVertical,
                                    $scope.selectedAdvertiser,
                                    $scope.selectedAccountURL/*,
                                    $scope.selectedLanguage  will be set as English as default for a while*/);
        }
    });
})(window.angular);

