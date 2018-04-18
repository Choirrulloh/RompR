jQuery.fn.menuReveal = function(callback) {
    if (callback) {
        this.slideToggle('fast',callback);
    } else {
        this.slideToggle('fast');
    }
    return this;
}

jQuery.fn.menuHide = function(callback) {
    if (callback) {
        this.slideToggle('fast',callback);
    } else {
        this.slideToggle('fast');
    }
    return this;
}

jQuery.fn.makeTagMenu = function(options) {
    var settings = $.extend({
        textboxname: "",
        textboxextraclass: "",
        labelhtml: "",
        populatefunction: null,
        buttontext: null,
        buttonfunc: null,
        buttonclass: ""
    },options);

    this.each(function() {
        var tbc = "enter combobox-entry";
        if (settings.textboxextraclass) {
            tbc = tbc + " "+settings.textboxextraclass;
        }
        $(this).append(settings.labelhtml);
        var holder = $('<div>', { class: "expand"}).appendTo($(this));
        var textbox = $('<input>', { type: "text", class: tbc, name: settings.textboxname }).
            appendTo(holder);
        var dropbox = $('<div>', {class: "drop-box tagmenu dropshadow"}).appendTo(holder);
        var menucontents = $('<div>', {class: "tagmenu-contents"}).appendTo(dropbox);
        if (settings.buttontext !== null) {
            var submitbutton = $('<button>', {class: "fixed"+settings.buttonclass,
                style: "margin-left: 8px"}).appendTo($(this));
            submitbutton.html(settings.buttontext);
            if (settings.buttonfunc) {
                submitbutton.click(function() {
                    settings.buttonfunc(textbox.val());
                });
            }
        }

        dropbox.mCustomScrollbar({
        theme: "light-thick",
        scrollInertia: 120,
        contentTouchScroll: 25,
        advanced: {
            updateOnContentResize: true,
            updateOnImageLoad: false,
            autoScrollOnFocus: false,
            autoUpdateTimeout: 500,
        }
        });
        textbox.hover(makeHoverWork);
        textbox.mousemove(makeHoverWork);
        textbox.click(function(ev) {
            ev.preventDefault();
            ev.stopPropagation();
            var position = getPosition(ev);
            var elemright = textbox.width() + textbox.offset().left;
            if (position.x > elemright - 24) {
                if (dropbox.is(':visible')) {
                    dropbox.slideToggle('fast');
                } else {
                    var data = settings.populatefunction(function(data) {
                        menucontents.empty();
                        for (var i in data) {
                            var d = $('<div>', {class: "backhi"}).appendTo(menucontents);
                            d.html(data[i]);
                            d.click(function() {
                                var cv = textbox.val();
                                if (cv != "") {
                                    cv += ",";
                                }
                                cv += $(this).html();
                                textbox.val(cv);
                            });
                        }
                        dropbox.slideToggle('fast', function() {
                            dropbox.mCustomScrollbar("update");
                        });
                    });
                }
            }
        });
    });
}

function getPanelWidths() {
    var sourcesweight = (prefs.sourceshidden) ? 0 : 1;
    var browserweight = (prefs.hidebrowser) ? 0 : 1;
    var sourceswidth = prefs.sourceswidthpercent*sourcesweight;
    var browserwidth = (100 - sourceswidth)*browserweight;
    if (browserwidth < 0) browserwidth = 0;
    return ({infopane: browserwidth, sources: sourceswidth});
}

function expandInfo(side) {
    switch(side) {
        case "left":
            var p = !prefs.sourceshidden;
            prefs.save({sourceshidden: p});
            break;
    }
    animatePanels();
    return false;
}

function setExpandIcons() {
    var i = (prefs.sourceshidden) ? "icon-angle-double-right" : "icon-angle-double-left";
    $("#expandleft").removeClass("icon-angle-double-right icon-angle-double-left").addClass(i);
}

function animatePanels() {
    var widths = getPanelWidths();
    widths.speed = { sources: 400, infopane: 400 };
    $("#sources").animatePanel(widths);
    $("#sourcescontrols").animatePanel(widths);
    $("#infopane").animatePanel(widths);
    $("#infopanecontrols").animatePanel(widths);
}

jQuery.fn.animatePanel = function(options) {
    var settings = $.extend({},options);
    var panel = this.attr("id");
    var opanel = panel;
    panel = panel.replace(/controls/,'');
    if (settings[panel] > 0 && this.is(':hidden')) {
        this.show();
    }
    this.animate({width: settings[panel]+"%"},
        {
            duration: settings.speed[panel],
            always: function() {
                if (settings[panel] == 0) {
                    $(this).hide();
                } else {
                    if (opanel == "infopane") browser.rePoint();
                    if (opanel.match(/controls/)) {
                        setExpandIcons();
                        setTopIconSize(["#"+opanel]);
                    }
                }
            }
        }
    );
}

function doThatFunkyThang() {
    var widths = getPanelWidths();
    $("#sources").css("width", widths.sources+"%");
    $("#sourcescontrols").css("width", widths.sources+"%");
    $("#infopane").css("width", widths.infopane+"%");
    $("#infopanecontrols").css("width", widths.infopane+"%");
    setFunkyBoxSize();
}

function hideBrowser() {
}

function setTopIconSize(panels) {
    var imw = (parseInt($('.topimg').first().css('margin-left')) +
        parseInt($('.topimg').first().css('margin-right')));
    panels.forEach( function(div) {
        if ($(div).is(':visible')) {
            var icons = $(div+" .topimg");
            var numicons = icons.length;
            var mw = imw*numicons;
            var iw = Math.floor(($(div).width() - mw)/numicons);
            if (iw > 24) iw = 24;
            if (iw < 2) iw = 2;
            icons.css({width: iw+"px", height: iw+"px", "font-size": (iw-2)+"px"});
        }
    });
}

function playlistControlButton(button) {
    if (!$("#playlistbuttons").is(':visible')) {
        togglePlaylistButtons()
    }
    $("#"+button).click();
}

function addCustomScrollBar(value) {
    $(value).mCustomScrollbar({
        theme: "light-thick",
        scrollInertia: 300,
        contentTouchScroll: 25,
        mouseWheel: {
            scrollAmount: parseInt(prefs.wheelscrollspeed),
        },
        alwaysShowScrollbar: 1,
        advanced: {
            updateOnContentResize: true,
            updateOnImageLoad: false,
            autoScrollOnFocus: false,
            autoUpdateTimeout: 500,
        }
    });
}

function flashTrack(uri, album) {
    infobar.markCurrentTrack();
    var thing = uri ? album : uri;
    $('[name="'+thing+'"]').makeFlasher({flashtime: 0.5, repeats: 5});
    // The timeout is so that markCurrentTrack doesn't fuck it up - these often
    // have CSS transitions that affect the scrollbar size
    setTimeout(function() {
        layoutProcessor.scrollCollectionTo($('[name="'+thing+'"]'));
    }, 1000);
}

var layoutProcessor = function() {

    function showPanel(source, callback) {
        if (callback) {
            $('#'+source).fadeIn('fast', callback);
        } else {
            $('#'+source).fadeIn('fast');
        }
    }

    my_scrollers = [ "#sources", "#infopane", ".topdropmenu", ".drop-box" ];
    var rtime = '';
    var ptime = '';
    var headers = Array();
    var currheader = 0;
    var headertimer;

    return {

        supportsDragDrop: true,
        hasCustomScrollbars: true,
        usesKeyboard: true,

        afterHistory: function() {
            setTimeout(function() { $("#infopane").mCustomScrollbar("scrollTo",0) }, 500);
        },

        addInfoSource: function(name, obj) {
            $("#chooserbuttons").append($('<i>', {
                onclick: "browser.switchsource('"+name+"')",
                title: language.gettext(obj.text),
                class: obj.icon+' topimg sep fixed',
                id: "button_source"+name
            }));
        },

        setupInfoButtons: function() {
            $("#button_source"+prefs.infosource).addClass("currentbun");
            $("#chooserbuttons .topimg").tipTip({delay: 1000, edgeOffset: 8});
        },

        goToBrowserPanel: function(panel) {
            $("#infopane").mCustomScrollbar('update');
            $("#infopane").mCustomScrollbar("scrollTo","#"+panel+"information");
        },

        goToBrowserPlugin: function(panel) {
            setTimeout( function() { layoutProcessor.goToBrowserPanel(panel) }, 1000);
        },

        goToBrowserSection: function(section) {
            $("#infopane").mCustomScrollbar("scrollTo",section);
        },

        notifyAddTracks: function() {

        },

        maxPopupSize : function(winsize) {
            return {width: winsize.x - 32, height: winsize.y - 32};
        },

        hidePanel: function(panel, is_hidden, new_state) {
            if (is_hidden != new_state) {
                if (new_state && prefs.chooser == panel) {
                    $("#"+panel).fadeOut('fast');
                    var s = ["albumlist", "searcher", "filelist", "radiolist", "playlistslist", "podcastslist", "pluginplaylistslist"];
                    for (var i in s) {
                        if (s[i] != panel && !prefs["hide_"+s[i]]) {
                            layoutProcessor.sourceControl(s[i], null);
                            break;
                        }
                    }
                }
                if (!new_state && prefs.chooser == panel) {
                    $("#"+panel).fadeIn('fast');
                }
            }
        },

        setTagAdderPosition: function(position) {
            $("#tagadder").css({top: Math.min(position.y+8, $(window).height() - $('#tagadder').height()),
                left: Math.min($(window).width() - $('#tagadder').width(),  position.x-16)});
        },

        setPlaylistHeight: function() {
            var w = getWindowSize();
            
        },

        updateInfopaneScrollbars: function() {
            $('#infopane').mCustomScrollbar('update');
        },

        playlistLoading: function() {
            infobar.notify(infobar.SMARTRADIO, language.gettext('label_smartsetup'));
        },

        scrollPlaylistToCurrentTrack: function() {
            if (prefs.scrolltocurrent && $('.track[romprid="'+player.status.songid+'"],.booger[romprid="'+player.status.songid+'"]').length > 0) {
                $('#phacker').mCustomScrollbar("stop");
                $('#phacker').mCustomScrollbar("update");
                var pospixels = Math.round($('div.track[romprid="'+player.status.songid+'"],.booger[romprid="'+player.status.songid+'"]').position().top - ($("#phacker").height()/2));
                if (pospixels < 0) { pospixels = 0 }
                if (pospixels > $("#sortable").parent().height()) {
                    pospixels = $("#sortable").parent().height();
                }
                debug.log("LAYOUT","Scrolling Playlist To Song:",player.status.songid);
                $('#phacker').mCustomScrollbar(
                    "scrollTo",
                    pospixels,
                    { scrollInertia: 0 }
                );
            }
        },

        preHorse: function() {

        },

        scrollCollectionTo: function(jq) {
            if (jq) {
                debug.log("LAYOUT","Scrolling Collection To",jq, jq.position().top,$("#collection").parent().parent().parent().height()/2);
                var pospixels = Math.round(jq.position().top -
                    $("#collection").parent().parent().parent().height()/2);
                debug.log("LAYOUT","Scrolling Collection To",pospixels);
                $("#sources").mCustomScrollbar('update').mCustomScrollbar('scrollTo', pospixels,
                    { scrollInertia: 1000,
                      scrollEasing: 'easeOut' }
                );
            } else {
                debug.log("LAYOUT","Was asked to scroll collection to something non-existent",2);
            }
        },

        sourceControl: function(source, callback) {
            if ($('#'+source).length == 0) {
                prefs.save({chooser: 'albumlist'});
                source = 'albumlist';
            }
            if (source != prefs.chooser) {
                $('#'+prefs.chooser).fadeOut('fast', function() {
                    prefs.save({chooser: source});
                    showPanel(source, function() {
                        if (source == 'searcher') setSearchLabelWidth();
                        if (source == 'pluginplaylistslist') setFunkyBoxSize();
                        if (source == 'radiolist') setFunkyBoxSize();
                        if (callback) { callback(); }
                    });
                });
            } else {
                showPanel(source, callback);
            }
            return false;
        },

        adjustLayout: function() {
            var ws = getWindowSize();
            // Height of the bottom pane (chooser, info, playlist container)
            var newheight = ws.y - $("#bottompage").offset().top;
            $("#bottompage").css("height", newheight+"px");
            if (newheight < 540) {
                $('.topdropmenu').css('height',newheight+"px");
            } else {
                $('.topdropmenu').css('height', "");
            }
            var newwidth = ws.x - $('#infobar').offset().left;
            $('#infobar').css('width', newwidth+'px');
            setTopIconSize(["#sourcescontrols", "#infopanecontrols"]);
            infobar.rejigTheText();
            browser.rePoint();
            setFunkyBoxSize();
        },

        fanoogleMenus: function(jq) {
            var top = jq.children().first().children('.mCSB_container').offset().top;
            var conheight = jq.children().first().children('.mCSB_container').height();
            var ws = getWindowSize();
            var avheight = ws.y - top;
            var nh = Math.min(avheight, conheight);
            jq.css({height: nh+"px", "max-height":''});
            jq.mCustomScrollbar("update");
            if (jq.attr("id") == "hpscr") {
                $('#hpscr').mCustomScrollbar("scrollTo", '.current', {scrollInertia:0});
            }
        },

        displayCollectionInsert: function(details) {

            debug.log("COLLECTION","Displaying New Insert",details);
            layoutProcessor.sourceControl('albumlist');
            if (prefs.sortcollectionby == "artist" && $('i[name="aartist'+details.artistindex+'"]').isClosed()) {
                debug.log("COLLECTION","Opening Menu","aartist"+details.artistindex);
                doAlbumMenu(null, $('i[name="aartist'+details.artistindex+'"]'), false, function() {
                    if ($('i[name="aalbum'+details.albumindex+'"]').isClosed()) {
                        debug.log("COLLECTION","Opening Menu","aalbum"+details.albumindex);
                        doAlbumMenu(null, $('i[name="aalbum'+details.albumindex+'"]'), false, function() {
                            flashTrack(details.trackuri, 'aalbum'+details.albumindex);
                        });
                    } else {
                        flashTrack(details.trackuri, 'aalbum'+details.albumindex);
                    }
                });
            } else if ($('i[name="aalbum'+details.albumindex+'"]').isClosed()) {
                debug.log("COLLECTION","Opening Menu","aalbum"+details.albumindex);
                doAlbumMenu(null, $('i[name="aalbum'+details.albumindex+'"]'), false, function() {
                    flashTrack(details.trackuri,'aalbum'+details.albumindex);
                });
            } else {
                flashTrack(details.trackuri,'aalbum'+details.albumindex);
            }
        },

        playlistupdate: function(upcoming) {
            var time = 0;
            for(var i in upcoming) {
                time += upcoming[i].duration;
            }
            if (time > 0) {
                headers['upcoming'] = "Up Next : "+upcoming.length+" tracks, "+formatTimeString(time);
            } else {
                headers['upcoming'] = '';
            }
            layoutProcessor.doFancyHeaderStuff();
        },

        doFancyHeaderStuff: function() {
            clearTimeout(headertimer);
            var lines = Array();
            for (var i in headers) {
                if (headers[i] != '') {
                    lines.push(headers[i]);
                }
            }
            if (lines.length == 0 && $('#plmode').html() != '') {
                $('#plmode').fadeOut(500, function() {
                    $('#plmode').html('').fadeIn(500);
                });
            } else if (lines.length == 1 && $('#plmode').html() != lines[0]) {
                $('#plmode').fadeOut(500, function() {
                    $('#plmode').html(lines[0]).fadeIn(500);
                });
            } else {
                currheader++;
                if (currheader >= lines.length) {
                    currheader = 0;
                }
                if ($('#plmode').html() != lines[currheader]) {
                    $('#plmode').fadeOut(500, function() {
                        $('#plmode').html(lines[currheader]).fadeIn(500, function() {
                            headertimer = setTimeout(layoutProcessor.doFancyHeaderStuff, 5000);
                        });
                    });
                } else {
                    headertimer = setTimeout(layoutProcessor.doFancyHeaderStuff, 5000);
                }
            }
        },

        setProgressTime: function(stats) {
            if (stats !== null) {
                rtime = stats.remainString;
                ptime = stats.durationString;
                $("#playposss").html(stats.progressString);
            }
            if (prefs.displayremainingtime) {
                $("#tracktimess").html(rtime);
            } else {
                $("#tracktimess").html(ptime);
            }
        },

        toggleRemainTime: function() {
            prefs.save({displayremainingtime: !prefs.displayremainingtime});
            layoutProcessor.setProgressTime(null);
        },

        themeChange: function() {
            $('.rangechooser').rangechooser('fill');
        },

        setRadioModeHeader: function(html) {
            if (html != headers['radiomode']) {
                headers['radiomode'] = html;
                layoutProcessor.doFancyHeaderStuff();
            }
        },

        postAlbumMenu: function(element) {
            debug.log("SKIN","Post Album Menu Thing",element.next());
            if (element.next().hasClass('smallcover')) {
                if (element.isClosed()) {
                    element.next().css('width','');
                    element.next().children('img').css('width', '');
                } else {
                    var imgsrc = element.next().children('img').attr('src');
                    if (imgsrc) {
                        var newsrc = imgsrc;
                        newsrc = imgsrc.replace('albumart/small','albumart/asdownloaded');
                        if (newsrc != imgsrc) {
                            element.next().children('img').attr('src', newsrc);
                        }
                    }
                    element.next().css('width','50%');
                    element.next().children('img').css('width', '100%');
                }
            }
        },

        initialise: function() {
            if (prefs.outputsvisible) {
                toggleAudioOutputs();
            }
            $("#sortable").disableSelection();
            setDraggable('#collection');
            setDraggable('#filecollection');
            setDraggable('#searchresultholder');
            setDraggable("#podcastslist");
            setDraggable("#somafmlist");
            setDraggable("#bbclist");
            setDraggable("#icecastlist");
            setDraggable('#artistinformation');
            setDraggable('#albuminformation');
            setDraggable('#storedplaylists');

            $("#sortable").acceptDroppedTracks({
                scroll: true,
                scrollparent: '#phacker'
            });
            $("#sortable").sortableTrackList({
                items: '.sortable',
                outsidedrop: playlist.dragstopped,
                insidedrop: playlist.dragstopped,
                scroll: true,
                scrollparent: '#phacker',
                scrollspeed: 80,
                scrollzone: 120
            });

            $("#pscroller").acceptDroppedTracks({
                ondrop: playlist.draggedToEmpty,
                coveredby: '#sortable'
            });

            // $('#upcontents').click(onPlaylistClicked);

            animatePanels();

            $(".topdropmenu").floatingMenu({
                handleClass: 'dragmenu',
                addClassTo: 'configtitle',
                siblings: '.topdropmenu'
            });

            $("#tagadder").floatingMenu({
                handleClass: 'configtitle',
                handleshow: false
            });

            $(".stayopen").click(function(ev) {ev.stopPropagation() });

            $(".enter").keyup( onKeyUp );
            $.each(my_scrollers,
                function( index, value ) {
                addCustomScrollBar(value);
            });

            $("#sources").find('.mCSB_draggerRail').resizeHandle({
                adjusticons: ['#sourcescontrols', '#infopanecontrols'],
                side: 'left'
            });

            $("#infopane").find('.mCSB_draggerRail').resizeHandle({
                adjusticons: ['#playlistcontrols', '#infopanecontrols'],
                side: 'right'
            });

            shortcuts.load();
            $("#collectionsearcher input").keyup( function(event) {
                if (event.keyCode == 13) {
                    player.controller.search('search');
                }
            } );
            setControlClicks();
            $('.choose_albumlist').click(function(){layoutProcessor.sourceControl('albumlist')});
            $('.choose_searcher').click(function(){layoutProcessor.sourceControl('searcher',setSearchLabelWidth)});
            $('.choose_filelist').click(function(){layoutProcessor.sourceControl('filelist')});
            $('.choose_radiolist').click(function(){layoutProcessor.sourceControl('radiolist')});
            $('.choose_podcastslist').click(function(){layoutProcessor.sourceControl('podcastslist')});
            $('.choose_playlistslist').click(function(){layoutProcessor.sourceControl('playlistslist')});
            $('.choose_pluginplaylistslist').click(function(){layoutProcessor.sourceControl('pluginplaylistslist',setSpotiLabelWidth)});
            $('.open_albumart').click(openAlbumArtManager);
            $('#love').click(nowplaying.love);
            $("#ratingimage").click(nowplaying.setRating);
            $('.icon-rss.npicon').click(function(){podcasts.doPodcast('nppodiput')});
            $('#expandleft').click(function(){expandInfo('left')});
            $('.clear_playlist').click(playlist.clear);
            $("#playlistname").parent().next('button').click(player.controller.savePlaylist);

            $(".lettuce,.tooltip").tipTip({delay: 1000, edgeOffset: 8});

            document.body.addEventListener('drop', function(e) {
                e.preventDefault();
            }, false);
            $('#albumcover').on('dragenter', infobar.albumImage.dragEnter);
            $('#albumcover').on('dragover', infobar.albumImage.dragOver);
            $('#albumcover').on('dragleave', infobar.albumImage.dragLeave);
            $("#albumcover").on('drop', infobar.albumImage.handleDrop);
            $("#tracktimess").click(layoutProcessor.toggleRemainTime);
            $('#plmode').detach().appendTo('#amontobin').addClass('tright');
            // $("#playlistbuttons").empty();
            // $("#giblets").remove();
        }
    }
}();
