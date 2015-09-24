'use strict';
// see https://github.com/webr3/URI for URI
// var allowedurls = [
//     "https://www.google.co.uk/",
//     "http://www.chromium.org/",
//     "https://developer.chrome.com/extensions/"
// ];
chrome.runtime.onInstalled.addListener(function (details) {
    console.log('previousVersion', details.previousVersion);
});

chrome.tabs.onUpdated.addListener(function (tabId) {
    chrome.tabs.get(tabId, function( tab ){
        OP.showPageIcon( tab );
    });
});

var optimizely,
    OP = {
        startsWith:function(str,s,i){
            i = i || 0;
            return str.indexOf(s) === i;
        },
        OPS : {
            currentUrl : "",
            filterURLs : [],
            URLs : [],
            current : {}
        },
        showPageIcon : function( tab ){
            if (!tab){return;}
            var path = 'images/icon-24.png';
            if (!OP.OPS.current.active){
                path = 'images/icon-24-disabled.png';
            }
            if ( OP.isAllowedUrl( tab.url ) ){
                chrome.pageAction.setIcon( {path: path, tabId:tab.id } );
                chrome.pageAction.show( tab.id );
            }
        },
        updatePageIcon : function(){
            chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
                OP.showPageIcon( tabs[0] );
            });
        },
        key : function(){
            return "optimizely_x" + OP.OPS.current.id;
        },
        qs : function(){
            return OP.key() +"="+ OP.OPS.current.variant;
        },
        urlContainsUnchangedQS : function(url){
            return url.indexOf( OP.qs() ) > -1;
        },
        urlContainsQS : function(url){
            return url.indexOf( OP.key() ) > -1;
        },
        addOrUpdateQS : function(url){
            if ( OP.urlContainsUnchangedQS(url) ){
                return url;
            } else if ( OP.urlContainsQS(url) ){
                return OP.updateQS(url);
            } else {
                return OP.addQS(url);
            }
        },
        addQS : function(url){
            var u = new URI( url ),
                search = (u.querystring()) ? u.querystring() + "&" + OP.qs() : "?" + OP.qs(),
                hash = u.hash(),
                path = u.scheme() + u.heirpart();

            return path + search + hash;
        },
        updateQS : function( url ){
            var u = new URI( url ),
                searchCurrent = u.querystring().substring(1).split("&"),
                searchUpdate = [],
                hash = u.hash(),
                path = u.scheme() + u.heirpart();

            searchCurrent.forEach(function(el){
                var kv = el.split("=");
                if (kv[0] === OP.key()){
                    searchUpdate.push( OP.qs() );
                } else {
                    searchUpdate.push(el);
                }
            });
            return path +"?"+ searchUpdate.join("&") + hash;
        },
        addUrl : function(url){
            allowedurls.push(url);
        },
        setCurrentAttrs : function(url){
            url = url || OP.OPS.currentUrl;
            if (url){
                OP.OPS.current = OP.db.ops.hash[url];
                OP.OPS.currentUrl = url;
            }
            return true;
        },
        saveCurrentState: function(variant, active){
            var data = OP.OPS.current;
            data.variant = variant;
            data.active = active;
            // console.log('update', data.uid, variant, active);
            // console.table( data );
            OP.indexedDB.add( {uid:data.uid, data: data} );
        },
        isAllowedUrl : function( url ){
            var test = false,
                allowedurls = OP.db.ops.URLs;

            allowedurls.forEach(function( el ){
                if ( el && OP.startsWith( url, el ) ){
                    var testset = OP.setCurrentAttrs(el);
                    return test = true;
                }
            });

            return test;
        },
        getValue : function(ops){
            // ops : { key : "some text", defaultValue : "fallback value", type : "number" }
            var value = localStorage.getItem(ops.key);
            if (value === null){
                value = ops.defaultValue || null;
            }
            if (value && ops.type && ops.type === "number"){
                value = parseFloat( value );
            } else if (value && ops.type && ops.type === "boolean"){
                value = ( value === "true" || value === "1" ) ? true : false;
            } else if (value && ops.type && ops.type === "array"){
                value = JSON.parse( value );
            } else if (value && ops.type && ops.type === "object"){
                value = JSON.parse( value );
            }
            return value;
        },
        setValue : function(key, value){
            localStorage.setItem(key, value);
            if (key === "allowedUrls"){
                OP.setListener();
            }
            return null;
        },
        requestHandler : function(details){
            if ( OP.isRedirected || OP.OPS.current && !OP.OPS.current.active ){
                return {};
            } else {
                OP.isRedirected = true;
                OP.timer = setTimeout(function(){
                    OP.isRedirected = false;
                },10);
                return { redirectUrl: OP.addOrUpdateQS( details.url ) };
            }
        },
        getArrayOfURLs : function(){
            return OP.db.ops.filterURLs;
            //return OP.getValue( {key : "allowedUrls", type : "array", defaultValue : "[]"} );
        },
        setListener : function() {
            var ArrayOfURLs = OP.getArrayOfURLs();
            if (ArrayOfURLs.length){
                try {
                    chrome.webRequest.onBeforeRequest.removeListener( OP.requestHandler );
                    chrome.webRequest.onBeforeRequest.addListener(
                        OP.requestHandler,
                        { urls: ArrayOfURLs, types: ["main_frame"] },
                        ["blocking"]
                    );
                    chrome.webRequest.handlerBehaviorChanged();
                }catch(e){
                }
            }
        },
        init : function(){
            OP.setListener();
        }
    }
