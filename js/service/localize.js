/*
 * An AngularJS Localizatin Service
 *
 * Witten by Min Cheoul Kim
 *
 */
(function(angular) {
    'use strict';
    angular.module('localization',[])
        .factory('localize', ['$http', '$rootScope', '$window', '$filter', 'dremelF', function ($http, $rootScope, $window, $filter,dremelF) {
            var localize = {
                // use the $window service to get the language of the user's browser
                //language:$window.navigator.userLanguage || $window.navigator.language,
                language:dremelF.getUserInput('Country'), // getting market data from cookie instead of browser language setting because we only support ja-JP and en-US.

                // array to hold the localized resource string entries
                dictionary:[],
                // flag to indicate if the service hs loaded the resource file
                resourceFileLoaded:false,


                /*successCallback:function (data) {
                    // store the returned array in the dictionary
                    localize.dictionary = data;
                    // set the flag that the resource are loaded
                    localize.resourceFileLoaded = true;
                    // broadcast that the file has been loaded
                    $rootScope.$broadcast('localizeResourcesUpdates');
                },
                */

                initLocalizedResources:function () {
                    /*
                     No need to load file from server as we are supporting only Japanese. I know it is not scalable but ROI perspecitve, it is not bad way to go.

                     // build the url to retrieve the localized resource file
                     var url = '/i18n/resources-locale_' + localize.language + '.js';

                     // request the resource file
                     $http({ method:"GET", url:url, cache:false }).success(localize.successCallback).error(function (data, status, headers, config) {
                     // the request failed set the url to the default resource file
                     var url = '/i18n/resources-locale_default.js';
                     // request the default resource file
                     $http({ method:"GET", url:url, cache:false }).success(localize.successCallback).error(function (data, status, headers, config) {
                     console.log('Fail to retreive default localization file');
                     });
                     });
                     */
                    var bIsJapan = false;

                    if(localize.language === 'JP')
                        bIsJapan = true;

                    localize.dictionary = [
                        {
                            'key' : 'APP_TITLE',
                            'value' : bIsJapan ? 'ひと目でわかるモバイルページスピード' : 'Mobile Site Speed One Pager Generator'
                        },
                        {
                            'key' : 'HEADER_PAGE_TITLE_EN',
                            'value' : bIsJapan ? 'モバイルサイトの診断結果': 'Mobile Website Performance Report'
                        },
                        {   'key' : 'SECTION_1_EN',
                            'value' : bIsJapan ? '貴社モバイルサイトの速度' : 'How fast is your Mobile Website ?'
                        },
                        {
                            'key' : 'SECTION_2_EN',
                            'value' :  bIsJapan ? '対競合他社の状況' : 'How are your competitors performing?'
                        },
                        {
                            'key' : 'SECTION_3_EN',
                            'value' :  bIsJapan ? 'PageSpeed Insights' : 'PageSpeed Insights'
                        },
                        {
                            'key' : 'S1_MOBILE_SPEED_INDEX_EN',
                            'value' :  bIsJapan ? 'MOBILE PAGE SPEED INDEX' : 'MOBILE PAGE SPEED INDEX'
                        },
                        {
                            'key' : 'S1_WPT_SPEED_INDEX_EN',
                            'value' : bIsJapan ?  '"WPT SPEED INDEX' : '"WPT SPEED INDEX'
                        },
                        {
                            'key' : 'S1_VISUALLY_COMPLETE_TIME_EN',
                            'value' :  bIsJapan ? '描画完了までの時間' : 'VISUALLY LOADED TIME'
                        },
                        {
                            'key' : 'S1_VISUALLY_COMPLETE_EN',
                            'value' : bIsJapan ?  '描画完了' : 'VISUALLY COMPLETE'
                        },
                        {
                            'key' : 'S1_LOAD_TIME_EN',
                            'value' : bIsJapan ?  '時間' : 'LOAD TIME'
                        },
                        {
                            'key' : 'S1_FULLY_LOADED_TIME_EN',
                            'value' :  bIsJapan ? 'ロード完了までの時間' : 'FULLY LOADED TIME'
                        },
                        {
                            'key' : 'S2_TIME_TO_FIRST_BYTE_EN',
                            'value' :  bIsJapan ? '1バイト目 受信までの時間' : 'Time To First Byte'
                        },
                        {
                            'key' : 'S2_TIME_TO_START_RENDER_EN',
                            'value' :  bIsJapan ? '描画開始までの時間' : 'Time To Start Render'
                        },
                        {
                            'key' : 'S3_FIRST_IMPRESS_MATTER_EN',
                            'value' : bIsJapan ?  '第一印象が決め手' : 'First Impression Matters'
                        },
                        {
                            'key' : 'S3_P1_ATF_EN',
                            'value' :  bIsJapan ? 'ファーストビューのロードを優先する' : 'Prioritize visible content'
                        },
                        {
                            'key' : 'S3_P1_RENDER_BLOCKING_EN',
                            'value' : bIsJapan ?  'レンダリングを妨げるJavaScriptやCSSを最適化' : 'Eliminate render-blocking Javascript and CSS in above-the-fold content'
                        },
                        {
                            'key' : 'S3_LIMIT_SERVER_HITS_EN',
                            'value' : bIsJapan ?  'HTTPリクエストを抑える' : 'Limit Server Hits'
                        },
                        {
                            'key' : 'S3_P2_SERVER_RESPONSE_TIME_EN',
                            'value' : bIsJapan ?  'サーバーの応答時間を改善' : 'Reduce server response time'
                        },
                        {
                            'key' : 'S3_P2_IMAGE_EN',
                            'value' : bIsJapan ?  '画像を最適化' : 'Optimize images'
                        },
                        {
                            'key' : 'S3_P2_BROWSER_CACHING_EN',
                            'value' :  bIsJapan ? 'ブラウザのキャッシュを活用' : 'Leverage browser caching'
                        },
                        {
                            'key' : 'S3_P2_REDIRECTS_EN',
                            'value' :  bIsJapan ? 'リンク先ページでリダイレクトを使用しない' : 'Avoid landing page redirects'
                        },
                        {
                            'key' : 'S3_OPT_CONTENT_DELIVERY_EN',
                            'value' : bIsJapan ?  'コンテンツの配信を最適化' : 'Optimize Contents Delivery'
                        },
                        {
                            'key' : 'S3_P3_MIN_HTML_EN',
                            'value' : bIsJapan ?  'HTMLを圧縮(ミニファイ)' : 'Minify HTML'
                        },
                        {
                            'key' : 'S3_P3_MIN_JS_EN',
                            'value' :  bIsJapan ? 'JavaScriptを圧縮(ミニファイ)' : 'Minify JavaScript'
                        },
                        {
                            'key' : 'S3_P3_MIN_CSS_EN',
                            'value' :  bIsJapan ? 'CSSを圧縮(ミニファイ)' : 'Minify CSS'
                        },
                        {
                            'key' : 'S3_P3_ENABLE_COMPRESSION_EN',
                            'value' :  bIsJapan ? '圧縮を有効化' : 'Enable compression'
                        },
                        {
                            'key' : 'FOOTER_MESSAGE_EN',
                            'value' :  bIsJapan ? '詳細については Google 営業担当にお問い合わせください' : 'More ideas & discussion? Reach out to your Google contact'
                        },
                        {
                            'key' : 'LEGEND_PASSED_EN',
                            'value' : bIsJapan ?  '完璧' : 'Passed'
                        },
                        {
                            'key' : 'LEGEND_CONSIDER_FIX_EN',
                            'value' : bIsJapan ?  '要見直し' : 'Consider fix'
                        },
                        {
                            'key' : 'LEGEND_SHOULD_FIX_EN',
                            'value' : bIsJapan ?  '要修正' : 'Should fix'
                        },
                        {
                            'key' : 'GOOD_EN',
                            'value' : bIsJapan ?  '速いです' : 'GOOD'
                        },
                        {
                            'key' : 'FAIR_EN',
                            'value' :  bIsJapan ? 'そこそこ速い' : 'FAIR'
                        },
                        {
                            'key' : 'POOR_EN',
                            'value' : bIsJapan ?  '遅いです' : 'POOR'
                        },
                        {
                            'key' : 'UNKNOWN_EN',
                            'value' : bIsJapan ?  '判定不明' : 'UNKNOWN'
                        }
                    ];

                    // set the flag that the resource are loaded
                    localize.resourceFileLoaded = true;
                    // broadcast that the file has been loaded
                    $rootScope.$broadcast('localizeResourcesUpdates');
                },

                getLocalizedString:function (value) {
                    // default the result to an empty string
                    var result = '';

                    // check to see if the resource file has been loaded
                    if (!localize.resourceFileLoaded) {

                        // call the init method
                        localize.initLocalizedResources();

                        // set the flag to keep from looping in init
                        localize.resourceFileLoaded = true;

                        // return the empty string
                        return result;
                    }
                    // make sure the dictionary has valid data
                    if ((localize.dictionary !== []) && (localize.dictionary.length > 0)) {
                        // use the filter service to only return those entries which match the value
                        // and only take the first result
                        var entry = $filter('filter')(localize.dictionary, {key:value})[0];
                        // check to make sure we have a valid entry
                        if ((entry !== null) && (entry != undefined)) {
                            // set the result
                            result = entry.value;
                        }
                    }
                    // return the value to the call
                    return result;
                }
            };
            // return the local instance when called
            return localize;
        }])
        .filter('i18n',['localize', function(localize){
            return function (input) {
              return localize.getLocalizedString(input);
            };
        }])
})(window.angular);