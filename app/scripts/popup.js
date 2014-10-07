(function($, undefined){
    "use strict";


    var backgroundPage = chrome.extension.getBackgroundPage(),
        popup = {},
        active = backgroundPage.OP.OPS.active,
        variant = backgroundPage.OP.value(),
        title = backgroundPage.OP.OPS.title;

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
    $(".__title").html( title );

})(window.$, window);
