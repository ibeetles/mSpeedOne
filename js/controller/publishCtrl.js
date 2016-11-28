
(function(angular) {
    'use strict';

    angular.module('ngMobileSpeedOne')
        .controller('ngPublishGraphCtrl', function($scope, $http, $cookieStore, $interval, dremelF,CONST,RESOURCE) {
            var accountMarket, region, vertical, advertiser, accountURL, language;
            var bUserInput = false, bWPTIndex = false, bPageSpeedInsightAPI = false;

            // All variables on WPT API Ping
            var wptResultJsonUrl;
            var intervalPromise;
            var tickCountWPTTest = 0; // 5 minutes are timeout threshold
            var wptAPICallSucceeded = false;
            var wptLocation = 'Dulles:Chrome.Cable';

            $scope.appTitle = RESOURCE.APP_TITLE;

            $scope.init = function () {
                // Set All Resources
                initializeUIString();
            }

            // getting all user input from
            angular.element(document).ready(function () {

                // Retrieve all user selection from dremelF service
                retrieveUserInputData();

                // Fix Report Title out
                setReportTitle();

                // Set progress message
                setProgressStatus('WPTAPI CALL','Started');

                // Send WPT API ping to get WPT Speed index and time (Visually/Fully loaded)
                initWPTAPITest();
            });

            function initWPTAPITest() {
                // Set WPT Test server location and Connectivty value
                getWPTLocationParam();

                var url = CONST.WPT_API_URL + 'url=' + encodeURIComponent(accountURL) + '&f=json&mobile=1&fvonly=1&priority=4&location=' + wptLocation + '&k=' + CONST.WPT_API_KEY + '&callback=JSON_CALLBACK';
                console.log(url);

                $http.jsonp(url).
                success(function(data) {
                    console.log(data.data.jsonUrl);

                    setProgressStatus('WPTAPI CALL','Test successfully registered');
                    wptResultJsonUrl = data.data.jsonUrl;
                    tickCountWPTTest = 0; // reset the tick counter

                    setProgressStatus('WPTAPI CALL','Interval object successfully registed');
                    intervalPromise = $interval(checkWPTAPITestResults, 2000);
                    console.log('interval initialized -------------------------------------------');
                }).
                error(function (data) {
                    wptAPICallSucceeded = false;
                    console.log('getJsonPAngularJs failed');

                    // Set progress message
                    setProgressStatus('WPTAPI CALL','Failed');
                });
            }

            var checkWPTAPITestResults = function (){
                var url = wptResultJsonUrl + '&callback=JSON_CALLBACK';
                console.log('checkWPTResults : ' + url);
                $http.jsonp(url).
                success(function(data) {
                    if(data.statusCode === 200 && data.statusText === 'Test Complete') { // succeeconsole.log('checkWPTResults - SpeedIndex : ' + data.data.median.firstView.SpeedIndex);
                        console.log('checkWPTResults - TTFB : ' + data.data.median.firstView.TTFB);
                        console.log('checkWPTResults - firstPaint : ' + data.data.median.firstView.firstPaint);
                        console.log('checkWPTResults - LoadTime : ' + data.data.median.firstView.loadTime);
                        console.log('checkWPTResults - VisuallyLoaded : ' + data.data.median.firstView.visualComplete);
                        console.log('checkWPTResults - fullyLoaded : ' + data.data.median.firstView.fullyLoaded);

                        if(data.data.median.firstView.SpeedIndex === undefined && data.data.median.firstView.visualComplete === undefined) {
                            // 404 error occurred
                            wptAPICallSucceeded = false;
                            setProgressStatus('WPTAPI CALL','Failed');
                        } else {
                            // everything is ok

                            // to avoid this section is being called twice time. I am not yet sure why $inteval.cancel doesn't stop the interval object immediately.
                            // due to that, Sometimes, this routine is called twice time resulting in drawing chart twice times.
                            if(wptAPICallSucceeded === true) {
                                $interval.cancel(intervalPromise);
                                return;
                            }

                            wptAPICallSucceeded = true;

                            $scope.WPTIndex                     = validateData(data.data.median.firstView.SpeedIndex) ? Math.round(data.data.median.firstView.SpeedIndex) : 0;
                            //$scope.WPTLoadTime                  = validateData(data.data.median.firstView.loadTime) ? data.data.median.firstView.loadTime : 0;
                            // Let's use loadTime as Visually Complete Time instead of VisualComplete as it looks the defintion in wpt and us are different.
                            // $scope.WPTVisuallyCompleteTime      = validateData(data.data.median.firstView.visualComplete) ? data.data.median.firstView.visualComplete : 0;
                            $scope.WPTVisuallyCompleteTime      = validateData(data.data.median.firstView.loadTime) ? data.data.median.firstView.loadTime : 0;
                            $scope.WPTFullyLoadedTime           = validateData(data.data.median.firstView.fullyLoaded) ? data.data.median.firstView.fullyLoaded : 0;

                            $scope.WPTTimetoStartRender = validateData(data.data.median.firstView.firstPaint) ? (data.data.median.firstView.firstPaint/1000).toFixed(2) : 0;
                            $scope.WPTTTFB = validateData(data.data.median.firstView.TTFB) ? (data.data.median.firstView.TTFB/1000).toFixed(2) : 0;

                            setProgressStatus('WPTAPI CALL','Succeeded');

                            // Set progress message
                            setProgressStatus('WPTIndex','Started');

                            // Retrieve WTP Index data for the account, market and vertical where the account is belonging to
                            getWPTPSIAPIData();
                        }
                        $interval.cancel(intervalPromise);
                    } else if (data.statusCode === 100) {  // testing is running
                        tickCountWPTTest += 1;
                        if(tickCountWPTTest >= 150) { // timeout -- 5 minutes
                            wptAPICallSucceeded = false;
                            $interval.cancel(intervalPromise);
                            setProgressStatus('WPTAPI CALL','Failed');
                        }
                        console.log('checkWPTResults : statusText  ' + data.data.statusText);
                        console.log('checkWPTResults : statusCode  ' + data.data.statusCode);

                        setProgressStatus('WPTAPI CALL',data.data.statusText);
                    } else if (data.statusCode >= 300 ) {// error occurred
                        wptAPICallSucceeded = false;
                        $interval.cancel(intervalPromise);
                        setProgressStatus('WPTAPI CALL','Failed');
                    } else if (data.statusCode === 101) { // we are in queue and waiting
                        setProgressStatus('WPTAPI CALL',data.data.statusText);
                    }
                }).
                error(function (data) {
                    console.log('checkWPTResults failed');
                    wptAPICallSucceeded = false;
                    $interval.cancel(intervalPromise);
                    setProgressStatus('WPTAPI CALL','Failed');
                });
            }


            function getWPTPSIAPIData() {
                // Retrieve WTP Index data for the account, market and vertical where the account is belonging to
                dremelF.executeSQL('WPTIndex', region, accountMarket, advertiser/*selectedAdvertiser.advertiser_name*/).then(
                    /* success function */
                    function(jsonData) {

                        console.log(RESOURCE.INTERNAL_ERR_MSG_WPT_SUCCEEDED);

                        // Get WPT Index data
                        if(validateJsonData(jsonData) === false) {
                            // Should show error message and return from the function.
                            bWPTIndex = false;
                            setProgressStatus('WPTIndex','Failed');
                            return;
                        }
                        // keep going as we succeeded in getting WPT data from dremelF
                        setWPTIndexData(jsonData);

                        // Set Page Speed Insights API data
                        drawWPTSpeedDetailGroupedBarChart(jsonData);

                        // Set progress message
                        bWPTIndex = true;
                        setProgressStatus('WPTIndex','Succeeded');

                        // Call Page Speed Insights API
                        retrievePageSpeedInsightData();
                    },
                    /* error function */
                    function(e) {
                        onDataError(e);  // Failed to Retrieve WPTIndex data (index.html)
                        console.log(RESOURCE.INTERNAL_ERR_MSG_WPT_FAILED);

                        setProgressStatus('WPTIndex','Failed');
                    }
                );
            }

            /*
             *  Setting WPT Index Data
             *
             *  2016.07.18
             *
             *  Min Cheoul Kim (mincheoulkim@)
             */
            function setWPTIndexData(data) {
                // WPT Speed Index
                // Under 2000  var POOR_COLOR = '#FF0000';
                // 2001 - 3000 var FAIR_COLOR = '#FF9900';
                // over 30000 var GOOD_COLOR = '#38761D';

                $scope.jsonWPTIndex = data;

                if(wptAPICallSucceeded === false) {
                    $scope.WPTIndex                 = validateData($scope.jsonWPTIndex[0].Base_Avg_Speed_Index) ? Math.round($scope.jsonWPTIndex[0].Base_Avg_Speed_Index) : 0;
                    $scope.WPTVisuallyCompleteTime  = validateData($scope.jsonWPTIndex[0].Base_Avg_Visually_Complete) ? $scope.jsonWPTIndex[0].Base_Avg_Visually_Complete : 0;
                    $scope.WPTFullyLoadedTime       = validateData($scope.jsonWPTIndex[0].Base_Avg_Time_to_Fully_Loaded) ? $scope.jsonWPTIndex[0].Base_Avg_Time_to_Fully_Loaded : 0;
                }

                $scope.WPTVisuallyCompleteTimeText  = validateData($scope.WPTVisuallyCompleteTime) ? ($scope.WPTVisuallyCompleteTime/1000).toFixed(2) + 's' : '0 s';
                $scope.WPTFullyLoadedTimeText       = validateData($scope.WPTFullyLoadedTime ) ? ($scope.WPTFullyLoadedTime /1000).toFixed(2) + 's' : '0 s';

                // set Index/Speed Value position & Suggestion Text position
                $scope.WPTIndexPos = adjustTextPosition('WPT_INDEX','NUM', $scope.WPTIndex);
                $scope.WPTIndexJudgeTextPos = adjustTextPosition('WPT_INDEX','TXT', $scope.WPTIndex);

                if(accountMarket === 'JP')
                    $scope.WPTVisuallyCompleteTitleTextPos = 50; // Japan position point
                else
                    $scope.WPTVisuallyCompleteTitleTextPos = 34; // default position point

                $scope.WPTVisuallyCompleteTimeTextPos = adjustTextPosition('VISUALLY_LOADED','NUM', validateData($scope.WPTVisuallyCompleteTime) ? ($scope.WPTVisuallyCompleteTime/1000).toFixed(2) : 0);
                $scope.WPTVisuallyCompleteTimeJudgeTextPos = adjustTextPosition('VISUALLY_LOADED','TXT', validateData($scope.WPTVisuallyCompleteTime) ? ($scope.WPTVisuallyCompleteTime/1000).toFixed(2) : 0);

                $scope.WPTFullyLoadedTimeTextPos = adjustTextPosition('FULLY_LOADED','NUM', validateData($scope.WPTFullyLoadedTime ) ? ($scope.WPTFullyLoadedTime /1000).toFixed(2) : 0);
                $scope.WPTFullyLoadedTimeJudgeTextPos = adjustTextPosition('FULLY_LOADED','TXT', validateData($scope.WPTFullyLoadedTime ) ? ($scope.WPTFullyLoadedTime /1000).toFixed(2) : 0);


                // really bad coding practice but just go with this as we only support Japanese
                if(accountMarket === 'JP') {
                    // Adjust JudgeTextPos for Japanese version
                    // -10 for poor, good
                    // -18 for fair
                    $scope.WPTIndexJudgeTextPos -= 10;
                    $scope.WPTVisuallyCompleteTimeJudgeTextPos -= 10;
                    $scope.WPTFullyLoadedTimeJudgeTextPos -= 10;
                }
                // Set Color and Judge Text for WPT Index score
                if($scope.WPTIndex > 3000) {
                    $scope.WPTIndexColor = CONST.POOR_COLOR;
                    $scope.WPTIndexJudgeText = (accountMarket === 'JP' ? RESOURCE.POOR_JA : RESOURCE.POOR_EN);
                }else if($scope.WPTIndex > 2000 && $scope.WPTIndex <= 3000){
                    $scope.WPTIndexColor = CONST.FAIR_COLOR;
                    $scope.WPTIndexJudgeText = (accountMarket === 'JP' ? RESOURCE.FAIR_JA: RESOURCE.FAIR_EN);
                    if(accountMarket === 'JP')
                        $scope.WPTIndexJudgeTextPos -= 18;
                }else {
                    if($scope.WPTIndex === 0 ) { // this means there is null value in database table
                        $scope.WPTIndexColor = CONST.UNKNOWN_COLOR;
                        $scope.WPTIndexJudgeText = (accountMarket === 'JP' ? RESOURCE.UNKNOWN_JA : RESOURCE.UNKNOWN_EN);
                    } else {
                        $scope.WPTIndexColor = CONST.GOOD_COLOR;
                        $scope.WPTIndexJudgeText = (accountMarket === 'JP' ? RESOURCE.GOOD_JA: RESOURCE.GOOD_EN);
                    }
                }

                // WPT Visually Complete load Time
                // Under 2  seconds var GOOD_COLOR = '#38761D';
                // 2 - 7 seconds   var FAIR_COLOR = '#FF9900';
                // over 7 seconds  var POOR_COLOR = '#FF0000';
                if($scope.WPTVisuallyCompleteTime > 7000) {
                    $scope.WPTVisuallyCompleteTimeColor = CONST.POOR_COLOR;
                    $scope.WPTVisuallyCompleteTimeJudgeText = (accountMarket === 'JP' ? RESOURCE.POOR_JA : RESOURCE.POOR_EN);
                }else if($scope.WPTVisuallyCompleteTime > 2000 && $scope.WPTVisuallyCompleteTime <= 7000){
                    $scope.WPTVisuallyCompleteTimeColor = CONST.FAIR_COLOR;
                    $scope.WPTVisuallyCompleteTimeJudgeText = (accountMarket === 'JP' ? RESOURCE.FAIR_JA: RESOURCE.FAIR_EN);
                    if(accountMarket === 'JP')
                        $scope.WPTVisuallyCompleteTimeJudgeTextPos -= 18;
                }else{
                    if($scope.WPTVisuallyCompleteTime === 0) {  // this means there is null value in database table
                        $scope.WPTVisuallyCompleteTimeColor = CONST.UNKNOWN_COLOR;
                        $scope.WPTVisuallyCompleteTimeJudgeText = (accountMarket === 'JP' ? RESOURCE.UNKNOWN_JA : RESOURCE.UNKNOWN_EN);
                    }else {
                        $scope.WPTVisuallyCompleteTimeColor = CONST.GOOD_COLOR;
                        $scope.WPTVisuallyCompleteTimeJudgeText = (accountMarket === 'JP' ? RESOURCE.GOOD_JA: RESOURCE.GOOD_EN);
                    }
                }

                // Fully Loaded Time
                // Under 3  seconds var GOOD_COLOR = '#38761D';
                // 3 - 15 seconds   var FAIR_COLOR = '#FF9900';
                // over 16 seconds  var POOR_COLOR = '#FF0000'; }
                if($scope.WPTFullyLoadedTime > 16000) {
                    $scope.WPTFullyLoadedTimeColor = CONST.POOR_COLOR;
                    $scope.WPTFullyLoadedTimeJudgeText = (accountMarket === 'JP' ? RESOURCE.POOR_JA : RESOURCE.POOR_EN);
                }else if($scope.WPTFullyLoadedTime > 3000 && $scope.WPTFullyLoadedTime <= 15000){
                    $scope.WPTFullyLoadedTimeColor = CONST.FAIR_COLOR;
                    $scope.WPTFullyLoadedTimeJudgeText = (accountMarket === 'JP' ? RESOURCE.FAIR_JA: RESOURCE.FAIR_EN);
                    if(accountMarket === 'JP')
                        $scope.WPTFullyLoadedTimeJudgeTextPos -= 18;
                }else{
                    if($scope.WPTFullyLoadedTime === 0 ) {// this means there is null value in database table
                        $scope.WPTFullyLoadedTimeColor = CONST.UNKNOWN_COLOR;
                        $scope.WPTFullyLoadedTimeJudgeText = (accountMarket === 'JP' ? RESOURCE.UNKNOWN_JA : RESOURCE.UNKNOWN_EN);
                    }
                    else {
                        $scope.WPTFullyLoadedTimeColor = CONST.GOOD_COLOR;
                        $scope.WPTFullyLoadedTimeJudgeText = (accountMarket === 'JP' ? RESOURCE.GOOD_JA: RESOURCE.GOOD_EN);
                    }
                }
            }

            $scope.convertToPdf = function (){
                // queryed from Google.com with query term : 'how to convert html to image in javascript'
                // http://stackoverflow.com/questions/10721884/render-html-to-an-image
                // https://github.com/tsayen/dom-to-image#usage

                // And also need to install jsPDF
                domtoimage.toJpeg(document.getElementById('bodyctrlid'), { quality: 1 })
                    .then(function (dataUrl) {
                        var doc = new jsPDF('p', 'pt', [900,1197]);
                        doc.addImage(dataUrl,'JPEG', 0, 0);
                        var utc = new Date().toJSON().slice(0,10);

                        var fileTitle = advertiser + ' ' + utc + '.pdf';
                        doc.save(fileTitle);
                    });
            }

            function getWPTLocationParam() {
                if(region === 'APAC')
                    wptLocation = 'ec2-ap-southeast-1:Chrome.3GFast';

                // Handle exception cases
                switch(accountMarket) {
                    case 'HK':
                        wptLocation = 'HongKong:Chrome.3GFast';
                        break;
                    case 'CN':
                        wptLocation = 'Shanghai:Chrome.3GFast';
                        break;
                    case 'TW':
                        wptLocation = 'Shanghai:Chrome.3GFast';
                        break;
                    case 'JP':
                        wptLocation = 'ec2-ap-northeast-1.custom&bwDown=25000&bwUp=8000&latency=20&plr=0&uastring=' + encodeURIComponent(CONST.WPT_UASTRING_NEXUS5_CHROME);
                        break;
                    case 'KR':
                        wptLocation = 'Seoul_EC2:Chrome.custom&bwDown=41800&bwUp=10400&latency=48&plr=0';
                        break;
                }
            }

            /*
             *  Call PageSpeedInsights APIs
             *  You can remove strategy=mobile doesn't look necessary
             *
             *  2016.07.18
             *
             *  Min Cheoul Kim (mincheoulkim@)
             */
            function retrieveUserInputData () {

                setProgressStatus('UserInput','Started');

                accountMarket   = dremelF.getUserInput('Country');
                region          = dremelF.getUserInput('Region');
                advertiser      = dremelF.getUserInput('Advertisers');
                accountURL      = dremelF.getUserInput('URL');

                bUserInput = true;
                setProgressStatus('UserInput','Succeeded');

                console.log(RESOURCE.INTERNAL_ERR_MSG_COOKIE_SUCCEEDED);
            }

            function retrievePageSpeedInsightData()
            {
                setProgressStatus('PageSpeedInsight API','Started');

                var reqPromise = $http ({
                    method: 'GET',
                    url : CONST.PSI_API_URL + 'url=' + encodeURIComponent(accountURL) + '&key=' + CONST.PSI_API_KEY + '&strategy=mobile'
                });

                reqPromise.success(function(data,status,headers,config) {

                    $scope.jsonPageSpeedInsight = data;

                    if(validateJsonData($scope.jsonPageSpeedInsight) === false) {

                        bPageSpeedInsightAPI = false;
                        setProgressStatus('PageSpeedInsight API','Failed');
                        console.log(RESOURCE.INTERNAL_ERR_MSG_API_FAILED);// Failed to get Page Speed Insights API call data (index.html)
                        return;
                    }

                    console.log(RESOURCE.INTERNAL_ERR_MSG_API_SUCCEEDED);

                    setPageSpeedInsightsData();

                    bPageSpeedInsightAPI = true;
                    setProgressStatus('PageSpeedInsight API','Succeeded');
                });

                reqPromise.then(function(response) {
                    console.log(RESOURCE.INTERNAL_ERR_MSG_API_SUCCEEDED);
                }, function (response) {
                    console.log(RESOURCE.INTERNAL_ERR_MSG_API_FAILED);// Failed to get Page Speed Insights API call data (index.html)

                    setProgressStatus('PageSpeedInsight API','Failed');
                });
            }

            function setPageSpeedInsightsData() {

                setPageSpeedInsightIndex();

                // Retrieve Page Spped suggestion and its rule impact
                var ruleResults = $scope.jsonPageSpeedInsight.formattedResults.ruleResults;

                for (var i in ruleResults) {
                    var ruleResult = ruleResults[i];

                    // determin suggestion Icon (PASSED_ICON, SHOULD_FIX_ICON , CONSIDERING_FIX_ICON)
                    var suggestionIcon = (ruleResult.ruleImpact === 0 ? $scope.PASSED_ICON : (ruleResult.ruleImpact > 10 ? $scope.SHOULD_FIX_ICON: $scope.CONSIDERING_FIX_ICON));

                    switch (ruleResult.localizedRuleName) {
                        case 'Avoid landing page redirects':
                            $scope.S3P2RedirectsIcon = suggestionIcon;
                            break;
                        case 'Enable compression':
                            $scope.S3P3EnableCompressionIcon = suggestionIcon;
                            break;
                        case 'Leverage browser caching':
                            $scope.S3P2BrowserCachingIcon = suggestionIcon;
                            break;
                        case 'Reduce server response time':
                            $scope.S3P2ServerTimeIcon = suggestionIcon;
                            break;
                        case 'Minify CSS':
                            $scope.S3P3MinCSSIcon = suggestionIcon;
                            break;
                        case 'Minify HTML':
                            $scope.S3P3MinHTMLIcon = suggestionIcon;
                            break;
                        case 'Minify JavaScript':
                            $scope.S3P3MinJSIcon = suggestionIcon;
                            break;
                        case 'Eliminate render-blocking JavaScript and CSS in above-the-fold content':
                            $scope.S3P1RenderBlockingIcon = suggestionIcon;
                            break;
                        case 'Optimize images':
                            $scope.S3P2ImageOptIcon = suggestionIcon;
                            break;
                        case 'Prioritize visible content':
                            $scope.S3P1PrioritizeContentIcon = suggestionIcon;
                            break;
                    }
                }
            }

            /*
             *  Setting Page Speed Insights API Data
             *
             *  2016.07.18
             *
             *  Min Cheoul Kim (mincheoulkim@)
             */
            function setPageSpeedInsightIndex() {

                $scope.pageSpeedIndexValue = validateData($scope.jsonPageSpeedInsight.ruleGroups.SPEED.score) ? $scope.jsonPageSpeedInsight.ruleGroups.SPEED.score : 0 ;
                $scope.pageSpeedIndexColor = '';
                $scope.pageSpeedIndexJudgeText = '';
                $scope.pageSpeedIndexJudgeTextPos = 127;

                if(accountMarket === 'JP')
                    $scope.pageSpeedIndexJudgeTextPos -= 15;

                // under 65 POOR  var POOR_COLOR = '#FF0000';
                // 66 - 79 FAIR   var FAIR_COLOR = '#FF9900';
                // 80 - 100 GOOD  var GOOD_COLOR = '#38761D';

                if($scope.pageSpeedIndexValue < 65){
                    $scope.pageSpeedIndexColor = CONST.POOR_COLOR;
                    $scope.pageSpeedIndexJudgeText = (accountMarket === 'JP' ? RESOURCE.POOR_JA : RESOURCE.POOR_EN);
                }else if($scope.pageSpeedIndexValue > 65 && $scope.pageSpeedIndexValue < 80 ) {
                    $scope.pageSpeedIndexColor = CONST.FAIR_COLOR;
                    $scope.pageSpeedIndexJudgeText = (accountMarket === 'JP' ? RESOURCE.FAIR_JA: RESOURCE.FAIR_EN);
                }else {
                    $scope.pageSpeedIndexColor = CONST.GOOD_COLOR;
                    $scope.pageSpeedIndexJudgeText = (accountMarket === 'JP' ? RESOURCE.GOOD_JA: RESOURCE.GOOD_EN);
                }
            }

            function drawWPTSpeedDetailGroupedBarChart(jsonData) {
                // reference - https://bl.ocks.org/mbostock/3887051
                console.log('Drawing Chart --------------------------------------------------------------');
                var data = manipulateWPTBenchmarkDataforChart (jsonData);

                // space between Bars
                var barSpace = 4;
                var peerCategory = []; // hard-coded as we only support this types

                if(accountMarket == 'JP')
                    peerCategory = ['上位5%の平均','中央値','貴社サイト','下位5％の平均'];
                else
                    peerCategory = ['Top 5% Average','Median','You','Bottom 5% Average'];


                // Set default frame size
                var margin = {top: 20, right: 20, bottom: 30, left: 40},
                    width = 950 - margin.left - margin.right,
                    height = 280 - margin.top - margin.bottom;

                var x0 = d3.scale.ordinal()
                    .rangeRoundBands([0, width], .1);

                var x1 = d3.scale.ordinal();

                // ruler scale
                var y = d3.scale.linear()
                    .range([height, 0]);

                var color = d3.scale.ordinal()
                    .range(["#FF5621", "#FFC108", "#00BBD7", "#89C541"]);

                var xAxis = d3.svg.axis()
                    .scale(x0)
                    .orient("bottom");

                var svg = d3.select("#mspeed-WPT-Chart").append("svg")
                    .attr("width", width + margin.left + margin.right)
                    .attr("height", height + margin.top + margin.bottom)
                    .append("g")
                    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

                data.forEach(function(d) {
                    d.indexGroup = peerCategory.map(function(name) { return {name: name, value: +d[name]}; });
                });

                x0.domain(data.map(function(d) { return d.Index; }));
                x1.domain(peerCategory).rangeRoundBands([0, x0.rangeBand()]);  // set the group of bars width
                y.domain([0, d3.max(data, function(d) { return d3.max(d.indexGroup, function(d) { return d.value; }); })]);

                // x-axis ruler
                svg.append("g")
                    .attr("class", "x axis")
                    .attr("transform", "translate(0," + height + ")")
                    .attr("fill","black")
                    .attr("font-size","14px")
                    .attr("font-weight", "bold")
                    .call(xAxis);

                var index = svg.selectAll(".index")
                    .data(data)
                    .enter().append("g")
                    .attr("class", "index")
                    .attr("transform", function(d) { return "translate(" + x0(d.Index)  + ",0)"; });

                index.selectAll("rect")
                    .data(function(d) { return d.indexGroup; })
                    .enter().append("rect")
                    .attr("width", x1.rangeBand() - barSpace)
                    .attr("x", function(d) { return x1(d.name); })
                    .attr("y", function(d) { return y(d.value); })
                    .attr("height", function(d) { return height - y(d.value); })
                    .style("fill", function(d) { return color(d.name); });

                // To add label on top of bars
                index.selectAll("text")
                    .data(function(d) { return d.indexGroup; })
                    .enter()
                    .append("text")
                    .text(function(d) { return d.value; })
                    .attr("x", function(d) { return x1(d.name) + 12; })
                    .attr("y", function(d) { return y(d.value) - 4; })
                    .attr("font-family", "sans-serif")
                    .attr("font-size", "10px")
                    .attr("font-weight", "bold")
                    .attr("fill","#838384");



                var legend = svg.selectAll(".legend")
                    .data(peerCategory)
                    .enter().append("g")
                    .attr("class", "legend")
                    .attr("transform", function(d, i) {
                        return "translate(10," + ((i * 15) + 10) + ")";
                    });

                legend.append("rect")
                    .attr("x", 20)
                    .attr("width", 9)
                    .attr("height", 9)
                    .style("fill", color);

                legend.append("text")
                    .attr("x", 30)
                    .attr("y", 8)
                    .attr("dx", ".35em")
                    .attr("font-family", "sans-serif")
                    .attr("font-size", "12px")
                    .attr("font-weight","bold")
                    .attr("fill","#838384")
                    .style("text-anchor", "left")
                    .text(function(d) { return d; });  //.attr("font-weight", "bold")
            }

            function getTimeValue (data) {
                return validateData(data) ? (data / 1000).toFixed(2) : 0;
            }

            function manipulateWPTBenchmarkDataforChart(jsonData) {
                var jsonOut = [];
                if(accountMarket == 'JP') {
                    jsonOut = [
                        {
                            'Index': '1バイト目 受信までの時間',
                            '中央値': getTimeValue(jsonData[0].PeerAvg_Avg_Time_to_First_Byte),
                            '上位5%の平均': getTimeValue(jsonData[0].PeerMin_Avg_Time_to_First_Byte),
                            '下位5％の平均': getTimeValue(jsonData[0].PeerMax_Avg_Time_to_First_Byte),
                            '貴社サイト': wptAPICallSucceeded ? $scope.WPTTTFB : getTimeValue(jsonData[0].Base_Avg_Time_to_First_Byte)
                        },
                        {
                            'Index': '描画開始までの時間',
                            '中央値': getTimeValue(jsonData[0].PeerAvg_Avg_Time_to_Start_Render),
                            '上位5%の平均': getTimeValue(jsonData[0].PeerMin_Avg_Time_to_Start_Render),
                            '下位5％の平均': getTimeValue(jsonData[0].PeerMax_Avg_Time_to_Start_Render),
                            '貴社サイト': wptAPICallSucceeded ? $scope.WPTTimetoStartRender : getTimeValue(jsonData[0].Base_Avg_Time_to_Start_Render)
                        },
                        {
                            'Index': '描画完了までの時間',
                            '中央値': getTimeValue(jsonData[0].PeerAvg_Avg_Visually_Complete),
                            '上位5%の平均': getTimeValue(jsonData[0].PeerMin_Avg_Visually_Complete),
                            '下位5％の平均': getTimeValue(jsonData[0].PeerMax_Avg_Visually_Complete),
                            '貴社サイト': wptAPICallSucceeded ? getTimeValue($scope.WPTVisuallyCompleteTime) : getTimeValue(jsonData[0].Base_Avg_Visually_Complete)
                        },
                        {
                            'Index': 'ロード完了までの時間',
                            '中央値': getTimeValue(jsonData[0].PeerAvg_Avg_Time_to_Fully_Loaded),
                            '上位5%の平均': getTimeValue(jsonData[0].PeerMin_Avg_Time_to_Fully_Loaded),
                            '下位5％の平均': getTimeValue(jsonData[0].PeerMax_Avg_Time_to_Fully_Loaded),
                            '貴社サイト': wptAPICallSucceeded ? getTimeValue($scope.WPTFullyLoadedTime) : getTimeValue(jsonData[0].Base_Avg_Time_to_Fully_Loaded)
                        }
                    ];

                } else {
                    jsonOut = [
                        {
                            'Index': 'Time To First Byte',
                            'Median': getTimeValue(jsonData[0].PeerAvg_Avg_Time_to_First_Byte),
                            'Top 5% Average': getTimeValue(jsonData[0].PeerMin_Avg_Time_to_First_Byte),
                            'Bottom 5% Average': getTimeValue(jsonData[0].PeerMax_Avg_Time_to_First_Byte),
                            'You': wptAPICallSucceeded ? $scope.WPTTTFB : getTimeValue(jsonData[0].Base_Avg_Time_to_First_Byte)
                        },
                        {
                            'Index': 'Time To Start Render',
                            'Median': getTimeValue(jsonData[0].PeerAvg_Avg_Time_to_Start_Render),
                            'Top 5% Average': getTimeValue(jsonData[0].PeerMin_Avg_Time_to_Start_Render),
                            'Bottom 5% Average': getTimeValue(jsonData[0].PeerMax_Avg_Time_to_Start_Render),
                            'You': wptAPICallSucceeded ? $scope.WPTTimetoStartRender : getTimeValue(jsonData[0].Base_Avg_Time_to_Start_Render)
                        },
                        {
                            'Index': 'Visually Loaded Time',
                            'Median': getTimeValue(jsonData[0].PeerAvg_Avg_Visually_Complete),
                            'Top 5% Average': getTimeValue(jsonData[0].PeerMin_Avg_Visually_Complete),
                            'Bottom 5% Average': getTimeValue(jsonData[0].PeerMax_Avg_Visually_Complete),
                            'You': wptAPICallSucceeded ? getTimeValue($scope.WPTVisuallyCompleteTime) : getTimeValue(jsonData[0].Base_Avg_Visually_Complete)
                        },
                        {
                            'Index': 'Fully Loaded Time',
                            'Median': getTimeValue(jsonData[0].PeerAvg_Avg_Time_to_Fully_Loaded),
                            'Top 5% Average': getTimeValue(jsonData[0].PeerMin_Avg_Time_to_Fully_Loaded),
                            'Bottom 5% Average': getTimeValue(jsonData[0].PeerMax_Avg_Time_to_Fully_Loaded),
                            'You': wptAPICallSucceeded ? getTimeValue($scope.WPTFullyLoadedTime) : getTimeValue(jsonData[0].Base_Avg_Time_to_Fully_Loaded)
                        }
                    ];
                }

                return jsonOut;
            }

            function setProgressStatus (type,message) {
                switch(type){
                    case 'UserInput':
                        $scope.progressMessageUserInput = RESOURCE.PROGRESS_USER_INPUT_EN + message;
                        break;
                    case 'WPTIndex':
                        $scope.progressMessageWPT = RESOURCE.PROGRESS_WPT_EN + message;
                        break;
                    case 'PageSpeedInsight API':
                        $scope.progressMessageAPI = RESOURCE.PROGRESS_API_EN  + message;
                        break;
                    case 'WPTAPI CALL':
                        $scope.progressMessageWPTAPI = RESOURCE.PROGRESS_WPT_API_EN  + message;
                        break;
                }

                if(message === 'Failed') {
                    // disable progress bar and add suggestion message
                    // $scope.progressMessageSuggestion should be empty till anything goes wrong
                    $(".progressbarctrl").fadeOut("fast");
                    $(".progressbutton").fadeIn("slow");

                    $scope.progressMessageSuggestionHeader      = RESOURCE.PROGRESS_SUGGESTION_HEADER_EN;
                    $scope.progressMessageSuggestionUserInput   = RESOURCE.PROGRESS_SUGGESTION_USER_INPUT_EN;
                    $scope.progressMessageSuggestionWPT         = RESOURCE.PROGRESS_SUGGESTION_WPT_EN;
                    $scope.progressMessageSuggestionAPI         = RESOURCE.PROGRESS_SUGGESTION_API_EN;
                    $scope.progressMessageSuggestionContact     = RESOURCE.PROGRESS_SUGGESTION_CONTACT_EN;


                }else { // if the message is 'Succeeded'
                    if(bUserInput === true && bWPTIndex === true && bPageSpeedInsightAPI === true && wptAPICallSucceeded === true) {
                        // Now everything is ready
                        // disable progress section and enable contents section here
                        $(".progressctrl").fadeOut("slow");
                        $(".convertBtn").fadeIn("slow");
                        $(".bodyctrl").fadeIn("slow");
                    }
                }
            }

            /*
             *  Getting all UI Resources for further localization
             *
             *  2016.07.18
             *
             *  Min Cheoul Kim (mincheoulkim@)
             */
            function initializeUIString() {
                $scope.headerPageTitleRe        = RESOURCE.HEADER_PAGE_TITLE_EN;
                $scope.headerReportTitleRe      = RESOURCE.HEADER_REPORT_TITLE_EN;

                $scope.section1TitleRe          = RESOURCE.SECTION_1_EN;
                $scope.section2TitleRe          = RESOURCE.SECTION_2_EN;
                $scope.section3TitleRe          = RESOURCE.SECTION_3_EN;

                $scope.S1MobileSpeedIndexRe     = RESOURCE.S1_MOBILE_SPEED_INDEX_EN;
                $scope.S1WptSpeedIndexRe        = RESOURCE.S1_WPT_SPEED_INDEX_EN;
                $scope.S1VisuallyCompleteTimeRe = RESOURCE.S1_VISUALLY_COMPLETE_TIME_EN;
                $scope.S1VisuallyCompleteRe     = RESOURCE.S1_VISUALLY_COMPLETE_EN;
                $scope.S1LoadTimeRe             = RESOURCE.S1_LOAD_TIME_EN;
                $scope.S1FullyLoadedTimeRe      = RESOURCE.S1_FULLY_LOADED_TIME_EN;

                $scope.S3FirstImpressMatterRe   = RESOURCE.S3_FIRST_IMPRESS_MATTER_EN;
                $scope.S3P1PrioritizeContentRe  = RESOURCE.S3_P1_ATF_EN;
                $scope.S3P1RenderBlockingRe     = RESOURCE.S3_P1_RENDER_BLOCKING_EN;

                $scope.S3P1PrioritizeContentIcon   = CONST.INFO_ICON_PATH;
                $scope.S3P1RenderBlockingIcon      = CONST.INFO_ICON_PATH;


                $scope.S3LimitServerHitsRe      = RESOURCE.S3_LIMIT_SERVER_HITS_EN;
                $scope.S3P2ServerTimeRe         = RESOURCE.S3_P2_SERVER_RESPONSE_TIME_EN;
                $scope.S3P2ImageOptRe           = RESOURCE.S3_P2_IMAGE_EN;
                $scope.S3P2BrowserCachingRe     = RESOURCE.S3_P2_BROWSER_CACHING_EN;
                $scope.S3P2RedirectsRe          = RESOURCE.S3_P2_REDIRECTS_EN;

                $scope.S3P2ServerTimeIcon         = CONST.INFO_ICON_PATH;
                $scope.S3P2ImageOptIcon           = CONST.INFO_ICON_PATH;
                $scope.S3P2BrowserCachingIcon     = CONST.INFO_ICON_PATH;
                $scope.S3P2RedirectsIcon          = CONST.INFO_ICON_PATH;


                $scope.S3OptContentDeliveryRe   = RESOURCE.S3_OPT_CONTENT_DELIVERY_EN;
                $scope.S3P3MinHTMLRe            = RESOURCE.S3_P3_MIN_HTML_EN;
                $scope.S3P3MinJSRe              = RESOURCE.S3_P3_MIN_JS_EN;
                $scope.S3P3MinCSSRe             = RESOURCE.S3_P3_MIN_CSS_EN;
                $scope.S3P3EnableCompressionRe  = RESOURCE.S3_P3_ENABLE_COMPRESSION_EN;

                $scope.S3P3MinHTMLIcon            = CONST.INFO_ICON_PATH;
                $scope.S3P3MinJSIcon              = CONST.INFO_ICON_PATH;
                $scope.S3P3MinCSSIcon             = CONST.INFO_ICON_PATH;
                $scope.S3P3EnableCompressionIcon  = CONST.INFO_ICON_PATH;


                $scope.legendPassedRe           = RESOURCE.LEGEND_PASSED_EN;
                $scope.legendConsiderFixRe      = RESOURCE.LEGEND_CONSIDER_FIX_EN;
                $scope.legendShouldFixRe        = RESOURCE.LEGEND_SHOULD_FIX_EN;

                $scope.FooterMessage            = RESOURCE.FOOTER_MESSAGE_EN;
                $scope.FooterMessageLong        = RESOURCE.FOOTER_MESSAGE_LONG_EN;

                $scope.INFO_ICON                = CONST.INFO_ICON_PATH;
                $scope.PASSED_ICON              = CONST.PASSED_ICON_PATH;
                $scope.SHOULD_FIX_ICON          = CONST.SHOULD_FIX_ICON_PATH;
                $scope.CONSIDERING_FIX_ICON     = CONST.CONSIDERING_FIX_ICON_PATH;

                $scope.progressSectionTitle         = RESOURCE.PROGRESS_TITLE_EN;
                $scope.progressSectionSubTitle      = RESOURCE.PROGRESS_SUB_TITLE_EN;
                $scope.progressSectionDescription   = RESOURCE.PROGRESS_DESCRIPTION_EN;
                $scope.progressSectionContact       = RESOURCE.PROGRESS_CONTACT_EN;

                $scope.S3P1PrioritizeContentLink    = CONST.PRI_VISIBLE_CONTENT_URL;
                $scope.S3P1RenderBlockingLink       = CONST.PRI_VISIBLE_CONTENT_URL;

                $scope.S3P2ServerTimeLink           = CONST.SERVER_RES_TIME_URL;
                $scope.S3P2ImageOptLink             = CONST.OPTIMIZE_IMG_URL;
                $scope.S3P2BrowserCachingLink       = CONST.BROWSER_CACHING_URL;
                $scope.S3P2Redirectslink            = CONST.AVOID_REDIRECTS_URL;

                $scope.S3P3MinHTMLLink              = CONST.MINIFYING_RESOURCE_URL;
                $scope.S3P3MinJSLink                = CONST.MINIFYING_RESOURCE_URL;
                $scope.S3P3MinCSSLink               = CONST.MINIFYING_RESOURCE_URL;
                $scope.S3P3EnableCompressionLink    = CONST.ENABLE_COMPRESSION_URL;
            }

            /*
             *  Generating report title
             *
             *  2016.07.18
             *
             *  Min Cheoul Kim (mincheoulkim@)
             */
            function setReportTitle()
            {
                $scope.headerReportTitleRe = advertiser + ' ('+ extractHttpPrefix(accountURL) + ')';
            }

            /*
             *  Removing http:// or https:// from accountURL
             *
             *  2016.07.18
             *
             *  Min Cheoul Kim (mincheoulkim@)
             */
            function extractHttpPrefix (account_URL)
            {
                var URL = account_URL;

                // remove '/', '?' and '&'
                var lastCharOfUrl = URL.substring(URL.length -1, URL.length);
                if(lastCharOfUrl === '/' || lastCharOfUrl == '?' || lastCharOfUrl === '&')
                    URL = URL.substring(0, URL.length-1);

                // if returned index of search is 0, the prefix should be http://
                if(URL.search('http://') === 0)
                    URL = URL.substring(7, URL.length);
                else if(URL.search('https://') === 0)
                    URL = URL.substring(8,URL.length);

                return URL;
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

            function validateData(data) {
                if(data === null || data === undefined || data === 0 || data === "") {
                    return false;
                }
                return true;
            }


            function adjustTextPosition(type,subType, data) {
                var temp;
                if(subType === 'NUM') {
                    /* 0      --> 1 (unknown)
                     5.38   --> 4
                     55.34  --> 5
                     245.56 --> 6
                     */
                    switch (type) {
                        case 'WPT_INDEX':
                            temp = 115 - ((data.toString().length - 1) * 10);
                            break;
                        case 'VISUALLY_LOADED':
                            var digit = data.toString().length;
                            if (digit === 1)
                                temp = 85;
                            else if (digit === 4)
                                temp = 65;
                            else if (digit === 5)
                                temp = 60;
                            else
                                temp = 45;
                            break;
                        case 'FULLY_LOADED':
                            var digit = data.toString().length;
                            if (digit === 1)
                                temp = 70;
                            else if (digit === 4)
                                temp = 50;
                            else if (digit === 5)
                                temp = 42;
                            else
                                temp = 32;
                            break;
                    }
                } else if(subType === 'TXT'){
                    switch (type) {
                        case 'WPT_INDEX':
                            if (data.toString().length === 1)
                                temp = 95;
                            else
                                temp = 110;
                            break;
                        case 'VISUALLY_LOADED':
                            if (data.toString().length === 1)
                                temp = 75;
                            else
                                temp = 95;
                            break;
                        case 'FULLY_LOADED':
                            if (data.toString().length === 1)
                                temp = 60;
                            else
                                temp = 75;
                            break;
                    }
                }
                return temp;
            }
        });
})(window.angular);
