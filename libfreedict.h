// This was coded by Zalaxci (Calyx Ga.) - I'm in no way associated with freedict.org or know the people who make their dictionaries or website
// This simple C header file is just a library to download and parse freedict XML files without the need for a custom dictionary format or many bells and whistles
// libxml and libcurl are needed to compile this header file

#ifndef LIBFREEDICT_H
#define LIBFREEDICT_H

#include <curl/curl.h>
#include <stdbool.h>
#include <libxml2/libxml/xpath.h>

#define FREEDICT_DOMAIN "https://freedict.org"

typedef struct dictionary_info{
    char from_lang[3];
    char to_lang[3];
    char archive_url[50];
} dict_info;

dict_info *freedict_list_dicts() {}
void freedict_download_dict(const dict_info &dict_to_download) {}
char *freedict_search_dict(const dict_info &dict_to_download) {}

#endif