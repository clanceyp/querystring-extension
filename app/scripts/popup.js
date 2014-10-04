(function($, undefined){
    "use strict";


    var backgroundPage = chrome.extension.getBackgroundPage(),
        popup = {};

    $("input[type=text], input[type=hidden]").on("keyup",function(e){
    	var $el = $(e.target);
    	backgroundPage.OP.setValue( $el.attr("name"), $el.val() );
    });
    $("input[type=checkbox]").on("click",function(e){
    	var $el = $(e.target);
    	backgroundPage.OP.setValue( $el.attr("name"), $el.prop("checked") );
   		backgroundPage.OP.updatePageIcon();
    });
    $("select").on("change",function(e){
    	var $el = $(e.target);
    	backgroundPage.OP.setValue( $el.attr("name"), $el.val() );
    });
    $("textarea").on("keyup",function(e){
		var $el = $(e.target),
    		regex1 = new RegExp('\n', "g"),
			regex2 = new RegExp(' ', "g"),
			regex3 = new RegExp('^[\r\n]+|\.|[\r\n]+$', "g"),
			val = $el.val().replace(regex1,'","').replace(regex2,"");
		$("input[name="+ $el.attr("id") +"]").val( '["'+ val +'"]' ).trigger("keyup");
	});
    $("input").each(function(i, el){
    	var $el = $(el);
    	if ($el.attr("type") === "text"){
    		$el.val( backgroundPage.OP.getValue({key: $el.attr("name") , defaultValue:""}) );
    	} else if ($el.attr("type") === "hidden"){
    		$el.val( backgroundPage.OP.getValue({key: $el.attr("name") , defaultValue:""}) );
    	} else if ($el.attr("type") === "checkbox"){
    		$el.prop("checked", backgroundPage.OP.getValue({key: $el.attr("name") ,type:"boolean",defaultValue:true}) );
    	}
    });
    $("textarea").each(function(i, el){
    	var $el = $(el), 
    		val,
    		regex1 = new RegExp('"', "g"),
			regex2 = new RegExp(',', "g");

    	if ($el.data("linebreak")){
    		val = $("input[name="+ $el.attr("id") +"]").val();
    		$el.val( val.substring(1,val.length-1).replace(regex1,'').replace(regex2,'\n') );
    	}
    });

})(window.$, window);
