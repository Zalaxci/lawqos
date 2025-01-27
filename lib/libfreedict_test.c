#include "libfreedict.h"

int main() {
    /*dict_download d = {
        .lang = "elleng",
        .archive_url = "https://download.freedict.org/dictionaries/ell-eng/2024.10.10/freedict-ell-eng-2024.10.10.src.tar.xz\0"
    };
    error_msg err = freedict_download_archive(&d, "./assets/dictionaries");
    if (err != NULL) {
        printf(err);
        printf("\n");
    }*/
    xmlDocPtr dict_document = freedict_open_dict("elleng", "./assets/dictionaries");
    freedict_search_dict(dict_document, "dictionary");
    freedict_search_dict(dict_document, "word");
    xmlFreeDoc(dict_document);
}