
(function(angular) {
    'use strict';

    angular.module('ngMobileSpeedOne')
        .service('dremelF', function($q,$cookieStore) {

        var deferred;

        // these are not yet used but defined for future usage
        var jsonLanguages = [
            {language:'English', subText:'English'},
            {language:'Japanese', subText:'日本語'},
            {language:'Korean', subText:'한국어'},
            {language:'Simplified Chinese', subText:'简体中文'},
            {language:'Traditional Chinese', subText:'中文'}
        ];

        // mobile_speed_onepager.mobile_speed_onepager_peercomparison is materilized table pulling data from finance_analysts.WebPageTest_BetaTest_PeerComparison
        // workflow is not organized but it's schedule to pull data once a day (1 AM in MTV time)
        var sqlMarkets = function () {
            return  "SELECT country, " +
                            "region " +
                    "FROM mobile_speed_onepager.mobile_speed_onepager_peercomparison " + //finance_analysts.WebPageTest_BetaTest_PeerComparison
                    "GROUP BY 1,2 " +
                    "ORDER BY 1,2";
        };

        var sqlVerticals =   function (region, country) {
            return "SELECT  granularity_name, " +
                            "vertical_inferred, " +
                            "Avg_Visually_Complete " +
                    "FROM   finance_analysts.WebPageTest_BetaTest_SpeedDash_UnrestrictedAccess_Benchmarking " +
                    "WHERE  region = '" + region + "' AND " +
                            "country = '" + country + "' AND " +
                            "channel = 'LCS' AND " +
                            "url_domain_flag = 'Domain' " +
                    "ORDER BY 1";
        };

        var sqlAdvertisers =   function(region, country) {
            return "SELECT advertiser_name " +
                    "FROM   mobile_speed_onepager.mobile_speed_onepager_peercomparison " + //finance_analysts.WebPageTest_BetaTest_PeerComparison
                    "WHERE  region = '" + region + "' AND " +
                            "country = '" + country + "' AND " +
                            "channel = 'LCS' AND " +
                            "url_domain_flag = 'Domain' " +
                    "GROUP BY 1 " +
                    "ORDER BY 1";
        };

        var sqlWPTIndex =   function(region, country, advertiser_name) {

            return 'SELECT  advertiser_name,' +
                'Base_Avg_Speed_Index, ' +
                'Base_Avg_Time_to_First_Byte, ' +
                'Base_Avg_Time_to_Start_Render, ' +
                'Base_Avg_Visually_Complete, ' +
                'Base_Avg_Time_to_Fully_Loaded, ' +
                'PeerAvg_Avg_Time_to_First_Byte, ' +
                'PeerAvg_Avg_Time_to_Start_Render, ' +
                'PeerAvg_Avg_Visually_Complete, ' +
                'PeerAvg_Avg_Time_to_Fully_Loaded, ' +
                'PeerMax_Avg_Time_to_First_Byte, ' +
                'PeerMax_Avg_Time_to_Start_Render, ' +
                'PeerMax_Avg_Visually_Complete, ' +
                'PeerMax_Avg_Time_to_Fully_Loaded, ' +
                'PeerMin_Avg_Time_to_First_Byte,' +
                'PeerMin_Avg_Time_to_Start_Render, ' +
                'PeerMin_Avg_Visually_Complete, ' +
                'PeerMin_Avg_Time_to_Fully_Loaded  ' +
                'FROM   mobile_speed_onepager.mobile_speed_onepager_peercomparison ' +  //finance_analysts.WebPageTest_BetaTest_PeerComparison
                'WHERE  region = "' + region + '" AND ' +
                'country = "' + country + '" AND ' +
                'channel = "LCS" AND ' +
                'advertiser_name = "' + advertiser_name + '" AND ' +
                'url_domain_flag = "Domain"';
        };

        function onDataError(e) {
            if (e.getStatusText) {
                console.log(e.getStatusText());
            } else {
                console.log(e);
            }
            deferred.reject(e);
        }

        this.getLanguages = function() {
            return jsonLanguages;
        };

        this.executeSQL = function(dataType, region, country, advertiser_name) {

            // checked if aplos object is intialized which means user has access to corpnet
            var sql = '';
            deferred = $q.defer();

            switch(dataType) {
                case 'Markets':
                    sql = sqlMarkets();
                    break;
                case 'Verticals':
                    sql = sqlVerticals(region, country);
                    break;
                case 'Advertisers':
                    sql = sqlAdvertisers(region, country);
                    break;
                case 'WPTIndex':
                    sql = sqlWPTIndex(region, country, advertiser_name);
                    break;
            }

            try {
                var dataLoader = aplos.data.loader
                    .Builder
                    .fromSql(sql)
                    .build();

                var dataSet = new aplos.data.DataSet()
                    .dataLoader(dataLoader);
            }catch(err) {
                console.log('catch statement');
                deferred.reject(err);
                return deferred.promise;
            }

            dataSet.fetch(new aplos.data.Projection()).then(function(d) {

                if(dataType != 'Verticals') {
                    deferred.resolve(d[0].data);
                } else {
                    var jsonTempnVerticals = [];
                    for(var i = 0; i < d[0].data.length; i++) {
                        var vertical = d[0].data[i];
                        if(vertical.vertical_inferred != 'All') {
                            jsonTempnVerticals.push(vertical);
                        }
                    }
                    deferred.resolve(jsonTempnVerticals);
                }
            }, onDataError);

            return deferred.promise;
        };

        this.setUserInput = function (market,vertical,advertiser,url) {
            // Save all user Input to Cookies
            $cookieStore.put('country',market.country );
            $cookieStore.put('region',market.region);
            //$cookieStore.put('vertical',vertical.granularity_name);
            $cookieStore.put('advertiser',advertiser.advertiser_name);
            $cookieStore.put('url',url);
            //$cookieStore.put('language','English' );
        };

        this.getUserInput = function (dataType) {
            var data;
            switch(dataType) {
                case 'Country':
                    data = $cookieStore.get('country');
                    break;
                case 'Region':
                    data = $cookieStore.get('region');
                    break;
                case 'Verticals':
                    //data = $cookieStore.get('vertical');
                    break;
                case 'Advertisers':
                    data = $cookieStore.get('advertiser');
                    break;
                case 'URL':
                    data = $cookieStore.get('url');
                    break;
                case 'Language':
                   // data = $cookieStore.get('language');
                    break;
            }
            return data;
        }
    });

})(window.angular);

