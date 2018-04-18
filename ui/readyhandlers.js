$(document).ready(function(){
    debug.log("INIT","Document Ready Event has fired");
    if (prefs.usertheme) {
        prefs.setTheme(prefs.usertheme);
    } else {
        prefs.setTheme(prefs.theme);
    }
    if (prefs.do_not_show_prefs) {
        $('.choose_prefs').remove();
    }
    infobar.createProgressBar();
    pluginManager.doEarlyInit();
    player.controller.initialise();
    layoutProcessor.initialise();
    checkServerTimeOffset();
    cleanBackendCache();
    if (prefs.country_userset == false) {
        // Have to pull this data in via the webserver as it's cross-domain
        // It's helpful and important to get the country code set, as many users won't see it
        // and it's necessary for the Spotify info panel to return accurate data
        $.getJSON("utils/getgeoip.php", function(result) {
            debug.shout("GET COUNTRY", 'Country:',result.country_name,'Code:',result.country_code);
            if (result.country_name && result.country_name != 'ERROR') {
                $("#lastfm_country_codeselector").val(result.country_code);
                prefs.save({lastfm_country_code: result.country_code});
            } else {
                debug.error("GET COUNTRY","Country code error",result);
            }
        });
    }
    $('.combobox').makeTagMenu({textboxextraclass: 'searchterm', textboxname: 'tag', labelhtml: '<div class="fixed searchlabel"><b>'+language.gettext("label_tag")+'</b></div>', populatefunction: populateTagMenu});
    $('.tagaddbox').makeTagMenu({textboxname: 'newtags', populatefunction: populateTagMenu, buttontext: language.gettext('button_add'), buttonfunc: tagAdder.add});
    browser.createButtons();
    setClickHandlers();
    setChooserButtons();
    replacePlayerOptions();
    $(".toggle").click(prefs.togglePref);
    $(".saveotron").keyup(prefs.saveTextBoxes);
    $(".saveomatic").change(prefs.saveSelectBoxes);
    $(".savulon").click(prefs.toggleRadio);
    $(".clickreplaygain").click(player.controller.replayGain);
    setPlaylistControlClicks(true);
    prefs.setPrefs();
    if (prefs.playlistcontrolsvisible) {
        $("#playlistbuttons").show();
    }
    if (prefs.collectioncontrolsvisible) {
        $("#collectionbuttons").show();
    }
    showUpdateWindow();
    window.addEventListener("storage", onStorageChanged, false);
    $("#sortable").click(onPlaylistClicked);
    $(window).bind('resize', layoutProcessor.adjustLayout);
    pluginManager.setupPlugins();
    ferretMaster();
    layoutProcessor.sourceControl(prefs.chooser, function() {
        setSearchLabelWidth();
        setSpotiLabelWidth()
        layoutProcessor.adjustLayout();
    });
    if (prefs.auto_discovembobulate) {
        setTimeout(function() {
            pluginManager.autoOpen(language.gettext('button_infoyou'));
        }, 1000);
    }
    // Some debugging info, saved to the backend so we can see it
    prefs.save({test_width: $(window).width(), test_height: $(window).height()});
    coverscraper = new coverScraper(0, false, false, prefs.downloadart);
    lastfm = new LastFM(prefs.lastfm_user);
    // setTimeout(function() {
    //     $('#scrobwrangler').rangechooser('setProgress', prefs.scrobblepercent);
    // }, 2000);
});

function cleanBackendCache() {
    $.get('utils/cleancache.php', function() {
        debug.shout("INIT","Cache Has Been Cleaned");
        setTimeout(cleanBackendCache, 86400000)
    });
}