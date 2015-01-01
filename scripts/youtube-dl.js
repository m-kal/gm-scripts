// ==UserScript==
// @name         Youtube-DL
// @namespace    http://m-kal.com/
// @version      1.0
// @description  1-click button for generating youtube-dl script
// @author       m-kal
// @match        https://www.youtube.com/user/*
// @match        https://www.youtube.com/channel/*
// @match        https://www.youtube.com/watch?v=*
// @require      https://ajax.googleapis.com/ajax/libs/jquery/1.11.1/jquery.min.js
// @grant        unsafeWindow
// ==/UserScript==

function promptScript( str )
{
    prompt("Save as script", str);
}

function addVideoPageButton()
{
    $("#watch8-secondary-actions").prepend('<span><button id="yt-video-dta-urls" class="yt-uix-button yt-uix-button-size-default yt-uix-button-opacity yt-uix-button-has-icon no-icon-markup action-panel-trigger yt-uix-tooltip" type="button" title="ytDL" data-tooltip-text="ytDL"><span class="yt-uix-button-content">ytDL</span></button></span>');
    $('#yt-video-dta-urls').click(function(e){
        e.preventDefault();
        var hrd = $('#watch7-user-header').first('.yt-user-info');
        var ytId = hrd.find('a:first').attr('data-ytid');
        promptScript( 'youtube-dl https://www.youtube.com/channel/' + ytId );
    });
}

function addUserChannelPageButton()
{
    $("#channel-navigation-menu").append('<li><a href="#" class="yt-uix-button spf-link yt-uix-sessionlink yt-uix-button-epic-nav-item yt-uix-button-size-default" id="yt-channel-dta-urls"><span class="yt-uix-button-content">ytDL</span></a></li>');
    $('#yt-channel-dta-urls').click(function(e){
        e.preventDefault();
        promptScript( 'youtube-dl ' + window.location );
    });
}

function addUIButtons()
{
    // add in UI elements and hook up their callbacks
    addVideoPageButton();
    addUserChannelPageButton();
}

// run to the hills
addUIButtons();