(function($, undefined){
    "use strict";


    var backgroundPage = chrome.extension.getBackgroundPage(),
        popup = {},
        active = backgroundPage.OP.OPS.active,
        variant = backgroundPage.OP.value(),
        title = backgroundPage.OP.OPS.title;


    popup.init = function(){

        $("input[type=text], input[type=hidden]").on("keyup",function(e){
            var $el = $(e.target);
            // backgroundPage.OP.setValue( $el.attr("name"), $el.val() );
        });
        $("input[name=active]").on("click",function(e){
            var $el = $(e.target);
            backgroundPage.OP.OPS.active = $el.prop("checked");
            backgroundPage.OP.updatePageIcon();
        });
        $("input[name=active]").prop("checked", active);
        $("input[name=variant]").val(variant);
        $("input[name=variant]").on("keyup",function(e){
            var $el = $(e.target);
            backgroundPage.OP.OPS.variant = $el.val();
        });
        $(".reload").on("click",function(e){
            e.preventDefault();
            popup.reload();
        })
        $(".options").on("click",function(e){
            e.preventDefault();
            popup.options();
        })
        $(".__title").html( title );

    }
    popup.reload = function(){
        chrome.tabs.getSelected(null, function(tab) {
            var code = 'window.location.reload();';
            chrome.tabs.executeScript(tab.id, {code: code});
        });
    }
    popup.options = function(){
        chrome.tabs.create({
                url: chrome.extension.getURL("options.html")
        })
    }

    popup.init();

})(window.$, window);
