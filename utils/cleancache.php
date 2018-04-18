<?php
// Clean the backend cache. We do this with an AJAX request because
// a) It doesn't slow down the loading of the page, and
// b) If we do it at page load time Chrome's page preload feature can result in two of them running simultaneously,
//    which produces 'cannot stat' errors.

chdir('..');
include("includes/vars.php");
include("includes/functions.php");
include("utils/imagefunctions.php");
include("backends/sql/backend.php");

debuglog("Checking Cache","CACHE CLEANER");

// DO NOT REDUCE the values for musicbrainz or discogs
// - we have to follow their API rules and as we don't check
// expiry headers at all we need to keep everything for a month
// otherwise they will ban us. Don't spoil it for everyone.

// One Month
clean_cache_dir('prefs/jsoncache/musicbrainz/', 2592000);
// One Month
clean_cache_dir('prefs/jsoncache/allmusic/', 2592000);
// One Month
clean_cache_dir('prefs/jsoncache/discogs/', 2592000);
// One Month
clean_cache_dir('prefs/jsoncache/wikipedia/', 2592000);
// One Month
clean_cache_dir('prefs/jsoncache/lastfm/', 2592000);
// One Month
clean_cache_dir('prefs/jsoncache/soundcloud/', 2592000);
// One Month
clean_cache_dir('prefs/jsoncache/spotify/', 2592000);
// One Month
clean_cache_dir('prefs/jsoncache/google/', 2592000);
// Six Months - after all, lyrics are small and don't change
clean_cache_dir('prefs/jsoncache/lyrics/', 15552000);
// Two weeks (or it can get REALLY big)
clean_cache_dir('prefs/imagecache/', 1296000);
// Clean the albumart temporary upload directory
clean_cache_dir('albumart/', 1);
debuglog("Cache has been cleaned","CACHE CLEANER");

if ($mysqlc) {

    debuglog("Checking database for hidden album art","CACHE CLEANER");
    // Note the final line checking that image isn't in use by another album
    // it's an edge case where we have the album local but we also somehow have a spotify or whatever
    // version with hidden tracks
    if ($result = generic_sql_query("SELECT DISTINCT Albumindex, Albumname, Image, Domain FROM
        Tracktable JOIN Albumtable USING (Albumindex) JOIN Playcounttable USING (TTindex)
        WHERE Hidden = 1
        AND ".sql_two_weeks()."
        AND
            Albumindex NOT IN (SELECT Albumindex FROM Albumtable JOIN Tracktable USING (Albumindex) WHERE Hidden = 0)
        AND
            Image NOT IN (SELECT Image FROM Albumtable JOIN Tracktable USING (Albumindex) WHERE Hidden = 0)")) {
        while ($obj = $result->fetch(PDO::FETCH_OBJ)) {
            if (preg_match('#^albumart/small/#', $obj->Image)) {
                debuglog("Removing image for hidden album ".$obj->Albumname." ".$obj->Image,"CACHE CLEANER");
                generic_sql_query("UPDATE Albumtable SET Image = NULL, Searched = 0 WHERE Albumindex = ".$obj->Albumindex);
            }
        }
    }

    debuglog("Checking database for missing album art","CACHE CLEANER");
    if ($result = generic_sql_query("SELECT Albumindex, Albumname, Image, Domain, ImgKey FROM Albumtable")) {
        while($obj = $result->fetch(PDO::FETCH_OBJ)) {
            if ($obj->Image != '' && !file_exists($obj->Image)) {
                if (preg_match('#^getRemoteImage\.php\?url=(.*)#', $obj->Image)) {
                    // Don't do this, it archives all the soundcloud images for search results
                    // and we don't want that.
                    // debuglog($obj->Albumname." has remote image ".$obj->Image,"CACHE CLEANER");
                    // $retval = archive_image($obj->Image, $obj->ImgKey);
                    // $image = $retval['image'];
                    // $searched = 1;
                } else {
                    debuglog($obj->Albumname." has missing image ".$obj->Image,"CACHE CLEANER");
                    switch ($obj->Domain) {
                        case "youtube":
                        case "soundcloud":
                        case "internetarchive":
                        case "bassdrive":
                        case "oe1":
                        case "tunein":
                            $image = "newimages/".$obj->Domain."-logo.svg";
                            $searched = 1;
                            break;

                        case "podcast":
                        case "podcast+http":
                        case "podcast http":
                            $image = "newimages/podcast-logo.svg";
                            $searched = 1;
                            break;

                        default:
                            $image = '';
                            $searched = 0;
                            break;

                    }
                    sql_prepare_query("UPDATE Albumtable SET Searched = ?, Image = ? WHERE Albumindex = ?", $searched, $image, $obj->Albumindex);
                }
            }
        }
    }

    if ($prefs['cleanalbumimages']) {
        debuglog("Checking albumart folder for unneeded images","CACHE CLEANER");
        $files = glob('albumart/small/*.jpg');
        foreach ($files as $image) {
            // Keep everything for 24 hours regardless, we might be using it in a playlist or something
            if (filemtime($image) < time()-86400) {
                if ($result = sql_prepare_query("SELECT Albumindex FROM Albumtable WHERE Image = ?", $image)) {
                    $count = ($result) ? $result->fetchAll(PDO::FETCH_ASSOC) : false;
                    if ($count === false || count($count) < 1) {
                        debuglog("  Removing Unused Album image ".$image,"CACHE CLEANER");
                        exec('rm albumart/small/'.basename($image));
                        exec('rm albumart/asdownloaded/'.basename($image));
                    }
                }
            }
        }

        debuglog("Checking for orphaned radio station images","CACHE CLEANER");
        $files = glob('prefs/userstreams/*.*');
        foreach ($files as $image) {
            if ($result = sql_prepare_query("SELECT Stationindex FROM RadioStationtable WHERE Image = ?",$image)) {
                $count = ($result) ? $result->fetchAll(PDO::FETCH_ASSOC) : false;
                if ($count === false || count($count) < 1) {
                    debuglog("  Removing orphaned radio station image ".$image,"CACHE CLEANER");
                    exec('rm '.$image);
                }
            }
        }

        debuglog("Checking for orphaned podcast images","CACHE CLEANER");
        $files = glob('prefs/podcasts/*');
        if ($result = generic_sql_query("SELECT PODindex FROM Podcasttable")) {
            $pods = $result->fetchAll(PDO::FETCH_COLUMN, 'PODindex');
            foreach ($files as $file) {
                if (!in_array(basename($file), $pods)) {
                    debuglog("  Removing orphaned podcast directory ".$file,"CACHE CLEANER");
                    exec('rm -fR '.$file);
                }
            }
        }
        $files = glob('prefs/podcasts/*');
        foreach ($files as $pod) {
            $i = simple_query('Image', 'Podcasttable', 'PODindex', basename($pod), '');
            $files = glob($pod.'/{*.jpg,*.jpeg,*.JPEG,*.JPG,*.gif,*.GIF,*.png,*.PNG}', GLOB_BRACE);
            foreach ($files as $file) {
                if ($file != $i) {
                    debuglog("  Removing orphaned podcast image ".$file,"CACHE CLEANER");
                    exec('rm "'.$file.'"');
                }
            }
        }
    }

    // Compact the database
    if ($prefs['collection_type'] == 'sqlite') {
        debuglog("Vacuuming Database","CACHE CLEANER");
        generic_sql_query("VACUUM");
        generic_sql_query("PRAGMA optimize");
    }

}

function clean_cache_dir($dir, $time) {

    debuglog("Cache Cleaner is running on ".$dir,"CACHE CLEANER");
    $cache = glob($dir."*");
    $now = time();
    foreach($cache as $file) {
        if (!is_dir($file)) {
            if($now - filemtime($file) > $time) {
                debuglog("Removing file ".$file,"CACHE CLEANER",4);
                @unlink ($file);
            }
        }
    }
}

?>

<html></html>