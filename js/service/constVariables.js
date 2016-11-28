
(function(angular) {
    'use strict';
    // Codes will be hosted in x20/ which does not support http://. The only supporting protocol is https://
    angular.module('ngMobileSpeedOne')
        .constant('CONST', {
            'PSI_API_KEY'               : 'AIzaSyAI90ADVr01iS15IBfU492VwM4XtGroWfw',
            'PSI_API_URL'               : 'https://www.googleapis.com/pagespeedonline/v2/runPagespeed?',
            'INFO_ICON_PATH'            : 'assets/img/png/info.png',
            'PASSED_ICON_PATH'          : 'assets/img/png/success.png',
            'SHOULD_FIX_ICON_PATH'      : 'assets/img/png/error.png',
            'CONSIDERING_FIX_ICON_PATH' : 'assets/img/png/minus.png',
            'FAIR_COLOR'                : '#FF9900',
            'POOR_COLOR'                : '#FF0000',
            'GOOD_COLOR'                : '#38761D',
            'UNKNOWN_COLOR'             : '#666666',
            'PRI_VISIBLE_CONTENT_URL'   : 'https://developers.google.com/speed/docs/insights/PrioritizeVisibleContent',
            'BLOCKING_JS_URL'           : 'https://developers.google.com/speed/docs/insights/BlockingJS',
            'SERVER_RES_TIME_URL'       : 'https://developers.google.com/speed/docs/insights/Server',
            'OPTIMIZE_IMG_URL'          : 'https://developers.google.com/speed/docs/insights/OptimizeImages',
            'BROWSER_CACHING_URL'       : 'https://developers.google.com/speed/docs/insights/LeverageBrowserCaching',
            'AVOID_REDIRECTS_URL'       : 'https://developers.google.com/speed/docs/insights/AvoidRedirects',
            'MINIFYING_RESOURCE_URL'    : 'https://developers.google.com/speed/docs/insights/MinifyResources',
            'ENABLE_COMPRESSION_URL'    : 'https://developers.google.com/speed/docs/insights/EnableCompression',
            'WPT_API_KEY'               : '2eb919284bb24f28b78fcf49148c1dd9',
            'WPT_API_URL'               : 'https://www.webpagetest.org/runtest.php?',
            'WPT_UASTRING_NEXUS5_CHROME': 'Mozilla/5.0 (Linux; Android 4.4.4; Nexus 5 Build/KTU84Q) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/51.0.2704.81 Mobile Safari/537.36'        /*  Chanmi Lee, Custom Setting */
        })
})(window.angular);