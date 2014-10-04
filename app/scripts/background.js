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

var OP = {
    showPageIcon : function( tab ){
        var path = 'images/icon-19.png';
        if (!OP.getValue({ key: "active", defaultValue : false, type : "boolean" })){
            path = 'images/icon-19-disabled.png';
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
    value : function(){
        return OP.getValue({ key: "variant" });
    },
    key : function(){
        return "optimizely_x" + OP.getValue({ key: "experiment" });
    },
    qs : function(){
        return OP.key() +"="+ OP.value();
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
    isAllowedUrl : function( url ){
        var test = false,
            allowedurls = OP.getValue( {key : "allowedUrls", type : "array", defaultValue : "[]"} );
        allowedurls.forEach(function( el ){
            if ( el && url.startsWith( el.substring(0, el.length-1 ) ) ){
                return test = true;
            }
        })
        return test;
    },
    getValue : function(ops){
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
        if ( OP.urlContainsUnchangedQS( details.url ) || !OP.getValue({ key: "active", defaultValue : false, type : "boolean" }) ){
            return {};
        } else {
            return { redirectUrl: OP.addOrUpdateQS( details.url ) };
        }
    },
    setListener : function() {
        var ArrayOfURLs = OP.getValue( {key : "allowedUrls", type : "array", defaultValue : "[]"} );
        console.log('gets here', ArrayOfURLs.length)
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
                if (console){
                    console.log( e );
                }
            }
        }
    }
}

OP.setListener();








