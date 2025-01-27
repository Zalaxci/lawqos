// This was coded by Zalaxci (Calyx Ga.) - I'm in no way associated with freedict.org or know the people who make their dictionaries or website
// This simple C header file is just a library to download and parse freedict XML files without the need for a custom dictionary format or many bells and whistles
// libxml and libcurl are needed to compile this header file

#include <stdlib.h>
#include <stdio.h>
#include <string.h>
#include <curl/curl.h>
#include <stdbool.h>
#include <libxml2/libxml/parser.h>
#include <libxml2/libxml/xpath.h>

#ifndef LIBFREEDICT_H
#define LIBFREEDICT_H

#define FREEDICT_DOMAIN "https://freedict.org"
#define MAX_STR_LENGTH 200

// Dictionary & API-related types
typedef char language_pair[6];
typedef const char *error_msg;
typedef struct dictionary_download{
    language_pair lang;
    char archive_url[MAX_STR_LENGTH];
} dict_download;
typedef struct dictionary_search_results{
    bool was_succesful;
    const char *data_or_err_str;
} dict_search_res;

// List dictionaries
dict_download *freedict_list_all() {
    return NULL;
}
language_pair *freedict_list_downloaded(const char *folder_path) {
    return NULL;
}

// Get the full file path of a freedict .tei file
const char *freedict_get_file_path(const language_pair l, const char *folder_path, const char *extension) {
    char *init_file_path_ptr = malloc(strlen(folder_path) + strlen(extension) + 9);
    char *file_path_ptr = stpcpy(init_file_path_ptr, folder_path); // Copy the provided file path (e.g. "/assets/dictionaries") to file_path
    *(file_path_ptr++) = '/'; // Append a slash between the folder & file name
    u_int8_t i;
    for (i = 0; i < 3; i++) *(file_path_ptr++) = l[i]; // Append language code 1 of the language pair
    *(file_path_ptr++) = '-'; // Append a dash between the 2 language codes (e.g. eng-ell) of the dictionary 
    for (i = 0; i < 3; i++) *(file_path_ptr++) = l[i + 3]; // Append language code 2 of the language pair
    file_path_ptr = strcpy(file_path_ptr, extension); // Add the file extension
    return init_file_path_ptr;
}

// Download a freedict archive & extract the .tei dictionary file
error_msg freedict_download_archive(const dict_download *d, const char *folder_path) {
    CURL *curl = curl_easy_init();
    if (curl == NULL) return "attempted to initialize curl, but got back a null pointer";
    const char *file_path = freedict_get_file_path((*d).lang, folder_path, ".tar.xz");
    printf(file_path);
    printf("\n");
    FILE *fp = fopen(file_path, "wb");
    curl_easy_setopt(curl, CURLOPT_URL, (*d).archive_url);
    curl_easy_setopt(curl, CURLOPT_WRITEFUNCTION, fwrite);
    curl_easy_setopt(curl, CURLOPT_WRITEDATA, fp);
    CURLcode res = curl_easy_perform(curl);
    curl_easy_cleanup(curl);
    fclose(fp);
    if (res != CURLE_OK) return curl_easy_strerror(res);
    return NULL;
}
error_msg freedict_extract_from_archive(const language_pair l, const char *folder_path) {}

// Open a freedict dictionary file & search for a word
xmlDocPtr freedict_open_dict(const language_pair l, const char *folder_path) {
    return xmlParseFile(freedict_get_file_path(l, folder_path, ".tei"));
}
dict_search_res *freedict_search_dict(xmlDocPtr dict_document, const char *query) {
    if (dict_document == NULL) return &(dict_search_res){
        false,
        "the dict_document provided as a parameter in the freedict search function is a null pointer"
    };
    char xpath_query_str[MAX_STR_LENGTH];
    snprintf(
        xpath_query_str,
        MAX_STR_LENGTH,
        "//entry[form/orth[contains(text(), \"%s\")] | sense/cit/quote[contains(text(), \"%s\")]]",
        query,
        query
    );
    xmlChar *xpath_query_ptr = xpath_query_str;
    xmlXPathContextPtr xpath_ctx = xmlXPathNewContext(dict_document);
    if (xpath_ctx == NULL) return &(dict_search_res){
        false,
        "attempted to get the xpath context necessary to search the dictionary, but got back a null pointer"
    };
    xmlXPathObjectPtr xpath_result = xmlXPathEvalExpression(xpath_query_ptr, xpath_ctx);
    xmlXPathFreeContext(xpath_ctx);
    if (xpath_result == NULL) return &(dict_search_res){
        false,
        "dictionary search failed: got null pointer at xpath evaluation"
    };
    xmlNodeSetPtr matching_entries = xpath_result->nodesetval;
    if (matching_entries == NULL) return &(dict_search_res){
        false,
        "dictionary search failed: got null pointer as the matching dictionary entries"
    };
    u_int8_t entry_count = matching_entries->nodeNr < 255? matching_entries->nodeNr : 255;
    xmlBufferPtr curr_entry_buffer = xmlBufferCreate();
    for (u_int8_t i = 0; i < entry_count; i++) {
        int curr_size = xmlNodeDump(curr_entry_buffer, dict_document, matching_entries->nodeTab[i], 0, 1);
        if (curr_size < 0) {
            return &(dict_search_res){
                false,
                "dictionary search failed: got size smaller than zero when trying to get contents of a dictionary entry"
            };
        }
    }
    printf(curr_entry_buffer->content);
    printf("\n");
    xmlXPathFreeObject(xpath_result);
    xmlCleanupParser();
    xmlBufferFree(curr_entry_buffer);
    return NULL;
}

#endif