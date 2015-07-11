// ==UserScript==
// @name         LibriVox Torrent Links
// @namespace    http://m-kal.com/
// @version      1.0
// @description  1-click button for all librivox torrent links
// @author       You
// @match        https://librivox.org/*
// @require      https://ajax.googleapis.com/ajax/libs/jquery/1.11.3/jquery.min.js
// @grant        unsafeWindow
// ==/UserScript==
var gLVTSearchlinks = [];
var gLVTBTLinks = [];
function download(content) {
    var a = document.getElementById("librivox-torrent-download");
    var file = new Blob([content], {type: 'text/plain'});
    //a.href = URL.createObjectURL(file);
    //a.download = 'librivox-torrents.txt';
    window.open( URL.createObjectURL(file) );
}
function parseForDlLinks( resHtml )
{
    var regEx = new RegExp("http://www.archive.org/download/*");
    $.each( $(resHtml).find( 'a' ), function( i, v ) {
       var res = regEx.exec( v );
       if ( res )
       {
           var zipLink = res.input;
           var btLink  = zipLink.replace( "64kb_mp3.zip", "archive.torrent" );
           gLVTBTLinks.push( btLink );
       }
    });
}
function pumpSearchLinks()
{
    // just a wrapper for the cycle
    gLVTBTLinks = [];
    $.ajaxSetup({ async: false });
    
    for( var i = 0; i < gLVTSearchlinks.length; i++ )
    {
        var link = gLVTSearchlinks[i];
        console.log( "[" + ( i + 1 ) + "/" + gLVTSearchlinks.length + "] " + link );
        $.get( link, function( data ) {
            var resHtml = data.results;
            parseForDlLinks( resHtml );
        });
    }
    console.log( gLVTBTLinks.length );
    $("#librivox-torrent-links").after('<a href="#" id="librivox-torrent-download" class="donate">Download .torrent links</a>');
    $('#librivox-torrent-download').click(function(e){
        e.preventDefault();
        var content = '';
        for( var i = 0; i < gLVTBTLinks.length; i++ )
        {
            content += gLVTBTLinks[i] + '\n';
        }
        download( content );
    });
}
function generateSearchLinks( pages )
{
    var msgsToPump = [];
    var baseLink = "https://librivox.org/search/get_results?primary_key=0&search_category=title&sub_category=&search_page=";
    var postLink = "&search_order=alpha&project_type=either";
    for ( var p = 1; p <= pages; p++ )
    {
        msgsToPump.push( baseLink + p + postLink );
    }
    
    gLVTSearchlinks = msgsToPump;
}

function addUIButtons()
{
    // add in UI elements and hook up their callbacks
    $(".thank-reader").after('<a href="#" id="librivox-torrent-links" class="donate">Grab .torrent Links</a>');
    $('#librivox-torrent-links').click(function(e){
        e.preventDefault();
        var pages = $('.page-number.last').data('page_number');
        generateSearchLinks( pages );
        pumpSearchLinks();
    });
}

// run to the hills
addUIButtons();