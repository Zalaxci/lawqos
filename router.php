<?php
$path = pathinfo($_SERVER["SCRIPT_FILENAME"]);
if ($path["extension"] == "html") {
    header("Cross-Origin-Embedder-Policy: require-corp");
    header("Cross-Origin-Opener-Policy: same-origin");
    readfile($_SERVER["SCRIPT_FILENAME"]);
} else if ($path["extension"] == "js") {
    header("Cross-Origin-Embedder-Policy: require-corp");
    header("Cross-Origin-Opener-Policy: same-origin");
    header('Content-type: application/javascript');
    readfile($_SERVER["SCRIPT_FILENAME"]);
} else {
    return FALSE;
}
?>