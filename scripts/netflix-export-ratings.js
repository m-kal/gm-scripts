// ==UserScript==
// @name         Netflix - Export Ratings
// @namespace    http://m-kal.com/
// @version      1.0
// @description  Export Netflix ratings into a CSV
// @author       m-kal
// @match        https://www.netflix.com/MoviesYouveSeen
// @require      https://ajax.googleapis.com/ajax/libs/jquery/1.11.1/jquery.min.js
// @grant        none
// ==/UserScript==

/*
 * Netflix API has been deprecated / no new sign-ups, so we'll exploit an API call, parse the URL (that has an authURL),
 * and build new URLs to different data-pages, thus allowing us to return and parse all movie ratings. From there,
 * it's simple string formatting for a CSV and then dump that into a new window for copy/paste. Easy peasy lemon squeezy.
 */

var RATINGS_REGEX = /netflix.com\/api\/shakti\/([a-z0-9]+)\/ratinghistory\?pg=([0-9]+)&authURL=([a-zA-Z0-9.]+)/mg;
var REGEX_IDX_AUTHURL = 3;

// on load force page data refresh by scrolling to bottom
var netflixRatings = [ ];
var skipAjaxHandling = false;

/**
 * Setup event handler and set handling bool.
 */
function hookAjaxComplete()
{
    skipAjaxHandling = false;
    $( document ).ajaxComplete( handleAjaxComplete );
}

/**
 * Unset event handler and skip ajax handling going forward
 */
function unhookAjaxComplete()
{
    skipAjaxHandling = true;
    $( document ).ajaxComplete( null );
}

/**
 * Shortcut to scroll browser to top of page
 */
function scrollToTop()
{
    $( "html, body" ).animate( {scrollTop: 0} );
}

/**
 * Shortcut to scroll browser to bottom of page
 */
function scrollToBottom()
{
    $( "html, body" ).animate( {scrollTop: $( document ).height() - $( window ).height()} );
}

/**
 * Add a rating object (returned from Netflix API) to our data-struct
 * @param idx
 * @param ratingObj
 */
function addRating( idx, ratingObj )
{
    // dealing with async requests, use idx as key to dict
    netflixRatings[ idx ] = {
        'movieid':   parseInt( ratingObj.movieID ),
        'title':     ratingObj.title,
        'rating':    parseInt( ratingObj.yourRating ),
        'ratingDtm': new Date( ratingObj.date )
    };
}

/**
 * Return a Netflix ratings API URL for a given authURL and page
 * @param page
 * @param authUrl
 * @returns {string}
 */
function buildNetflixRatingUrl( page, authUrl )
{
    var url = 'https://www.netflix.com/api/shakti/d3d420db/ratinghistory?pg='
              + parseInt( page )
              + '&authURL='
              + authUrl
              + '&_retry=0&_='
              + ( new Date().getTime() );

    return url;
}

/**
 * Grab/fetch all the ratings for a given page from the API.  If all results are found,
 * then export the ratings into a CSV.
 * @param page
 * @param authUrl
 * @param maxPageSize
 * @param total
 */
function ratingFetcher( page, authUrl, maxPageSize, total )
{
    var url = buildNetflixRatingUrl( page, authUrl );
    $.get( url, function ( respObj )
    {
        // append each item to the data struct
        $.each( respObj['ratingItems'], function ( idx, ratingObj )
        {
            addRating( idx + ( maxPageSize * page ), ratingObj );
        } );

        // if we've grabbed all titles, we can export
        if ( netflixRatings.length &gt;= total )
        {
            exportRatings();
        }
    } );
}

/**
 * For a given authURL, fetch all ratings by manually fetching each page from the API,
 * and then append the results to the netflixRatings data-struct.
 * @param authUrl
 */
function compileRatings( authUrl )
{
    // ensure empty array
    netflixRatings = [ ];

    // start with first page and go from there
    var url = buildNetflixRatingUrl( 0, authUrl );
    $.get( url, function ( respObj )
    {
        var maxPages = Math.ceil( respObj['totalRatings'] / respObj['size'] );
        for ( var p = 0; p &lt;= maxPages; p++ )
        {
            ratingFetcher( p, authUrl, respObj['size'], respObj['totalRatings'] );
        }
    } );
}

/**
 * Handle Ajax Complete events - If we're handling Ajax Complete events, parse
 * the events for the ratings API URL, and if it matches, extract the authURL
 * and compile ratings.
 * @param event
 * @param respObj
 * @param ajaxObj
 */
function handleAjaxComplete( event, respObj, ajaxObj )
{
    if ( skipAjaxHandling )
    {
        return;
    }

    // parse for our netflix rating URL
    var matches = RATINGS_REGEX.exec( ajaxObj.url );
    if ( matches && matches.length )
    {
        // unhook ajaxComplete
        unhookAjaxComplete();

        // we've found out authURL, now we can fetch all of our ratings
        compileRatings( matches[REGEX_IDX_AUTHURL] );
    }
}

/**
 * Returns a link to a Netflix title based off its movieID.
 * @param movieId
 * @returns {string}
 */
function netflixMovieLink( movieID )
{
    return 'https://www.netflix.com/WiMovie/' + movieID;
}

/**
 * Export the netflixRatings dict data-struct into a download link and show that link on the main menu.
 */
function exportRatings()
{
    // columns -&gt; rows -&gt; export
    var exportStr = 'title,rating,movieid,ratingDtm,link\n';
    $.each( netflixRatings, function ( idx, nR )
    {
        exportStr += '"' + nR['title'] + '",' + nR['rating'] + ',' + nR['movieid'] + ',"' + nR['ratingDtm'].toUTCString() + '",' + netflixMovieLink( nR['movieid']) + '\n';
    } );

    // add link to download file
    $( '#netflix-dl-ratings-href' ).attr( 'href', "data:text/csv;charset=utf-8," + escape( exportStr ) );
    $( '#netflix-dl-ratings-href' ).attr( 'download', 'netflix-ratings.csv' );
    $( '#netflix-dl-ratings' ).show();
}



/**
 * Add the 'Export Ratings' && 'DL Ratings' buttons to the main Netflix menu.
 */
function addUIButton()
{
    // add main button
    $( '#global-header' ).append('&lt;li class="nav-item display-until-xs dropdown-trigger"&gt;&lt;span class="i-b content"&gt;&lt;a href="#" id="netflix-export-ratings"&gt;Export Ratings&lt;/a&gt;&lt;/span&gt;&lt;span class="i-b shim"&gt;&lt;/span&gt;&lt;/li&gt;');

    // add download file button, hidden
    $( '#global-header').append('&lt;li class="nav-item display-until-xs dropdown-trigger" id="netflix-dl-ratings"&gt;&lt;span class="i-b content"&gt;&lt;a href="#" id="netflix-dl-ratings-href"&gt;DL Ratings&lt;/a&gt;&lt;/span&gt;&lt;span class="i-b shim"&gt;&lt;/span&gt;&lt;/li&gt;');
    $( '#netflix-dl-ratings' ).hide();

    // hook up event handler
    $( '#netflix-export-ratings' ).on( 'click', function( e )
    {
        e.preventDefault();

        // hook up our ajax event handler
        hookAjaxComplete();

        // trigger scrolling to trigger API call
        scrollToTop();
        scrollToBottom();
    });
}

/**
 * our 'main'.
 */
$( document ).ready( function ()
{
    // add our action button
    addUIButton();
} );