(function($, window, undefined){
    "use strict";


    var backgroundPage = chrome.extension.getBackgroundPage(),
        popup = {},
        active = backgroundPage.OP.OPS.current.active,
        variant = backgroundPage.OP.OPS.current.variant,
        title = backgroundPage.OP.OPS.current.title;


    popup.init = function(){

        $("input[type=text], input[type=hidden]").on("keyup",function(e){
            var $el = $(e.target);
            // backgroundPage.OP.setValue( $el.attr("name"), $el.val() );
        });
        $("input[name=active]").on("click",function(e){
            var $el = $(e.target);
            backgroundPage.OP.OPS.current.active = $el.prop("checked");
            backgroundPage.OP.updatePageIcon();
            backgroundPage.OP.saveCurrentState(backgroundPage.OP.OPS.current.variant, backgroundPage.OP.OPS.current.active);
        });
        $("input[name=active]").prop("checked", active);
        $("input[name=variant]").val(variant);
        $("input[name=variant]").on("keyup",function(e){
            var $el = $(e.target);
            backgroundPage.OP.OPS.current.variant = $el.val();
            backgroundPage.OP.saveCurrentState(backgroundPage.OP.OPS.current.variant, backgroundPage.OP.OPS.current.active);
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
        $("body").addClass('ready');
        window.current = backgroundPage.OP.OPS.current
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
