/* Copyright 2016 Redbrick Technologies, Inc. */
/* https://github.com/rdbrck/jira-description-extension/blob/master/LICENSE */

var StorageID = "Jira-Template-Injector";
var disabledOptionToast =
    '<span>Option is currently disabled. See ' +
    '<a class="newTabLinks" href="https://github.com/rdbrck/jira-description-extension">Help?</a>' +
    ' for details</span>';

function sortObject(o) {
    var sorted = {}, key, a = [];
    for (key in o) {
        if (o.hasOwnProperty(key)) {
            a.push(key);
        }
    }
    a.sort();
    // Move "DEFAULT TEMPLATE" to top of list
    if (a.indexOf('DEFAULT TEMPLATE') > -1) {
        a.splice(a.indexOf('DEFAULT TEMPLATE'), 1);
        a.unshift('DEFAULT TEMPLATE');
    }
    for (key = 0; key < a.length; key++) {
        sorted[a[key]] = o[a[key]];
    }
    return sorted;
}

function openCollapsible(issueFieldType) {
    // Click header to open
    $('.collapsible-header[data-issuefieldtype="' + issueFieldType + '"]').click();
}

function onInitialFocus(event) {
    // If this is an anchor tag, remove focus
    if (event.target.tagName === "A") {
        event.target.blur();
    }
    // remove this event listener after it is triggered,
    document.removeEventListener("focusin", onInitialFocus);
}

function loadTemplateEditor(callback = false) {
    // Dynamically build the template editor from stored json
    chrome.storage.sync.get(StorageID, function (templates) {
        var dropdownExcludeList = [];

        // Clear previous templates in the Collapsible Template Editor
        $('#templateEditor').empty();
        // Clear the custom template fields
        $('#customTemplateName').val('');
        $('#customTemplateIssueTypeField').val('');
        // Clear the add default template dropdown
        $('#addDefaultDropdown').empty();


        if (templates[StorageID].templates) {
            templates = templates[StorageID].templates;

            $('#templateEditorTitle').text('Templates:');

            //Sort Alphabetically except with DEFAULT TEMPLATE at the top
            templates = sortObject(templates);

            //Build the Collapsible Template Editor
            $.each(templates, function(key, template){
                var templateTitle = "";
                if (key === "DEFAULT TEMPLATE") {
                    templateTitle = '<div class="collapsible-header grey lighten-5" data-issueFieldType="'+ template['issuetype-field'] +'" style="font-weight: bold;"><i class="material-icons">expand_less</i>' + key + '</div>';
                } else {
                    templateTitle = '<div class="collapsible-header grey lighten-5" data-issueFieldType="'+ template['issuetype-field'] +'"><i class="material-icons">expand_less</i>' + key + '</div>';
                }

                var templateData =
                    '<div class="collapsible-body">' +
                    '<div class="input-field">' +
                    '<i class="material-icons prefix">mode_edit</i>' +
                    '<textarea data-issueFieldType="'+ template['issuetype-field'] +'" class="materialize-textarea" name="' + key + '">' + template.text +'</textarea>' +
                    '</div>' +
                    '<div class="row">' +
                    '<div class="col s4 offset-s4">' +
                    '<div class="center-align">' +
                    '<a class="btn-floating btn-Tiny waves-effect waves-light red darken-4 removeSingleTemplate" id="'+ key +'"><i class="material-icons">delete</i></a>' +
                    '&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp' +
                    '<a class="btn-floating btn-Tiny waves-effect waves-light red darken-4 updateSingleTemplate" id="'+ key +'"><i class="material-icons">save</i></a>' +
                    '</div>' +
                    '</div>' +
                    '</div>' +
                    '</div>';
                $('#templateEditor').append('<li>' + templateTitle + templateData + '</li>');

                // Add templateName to dropdown exclude list
                dropdownExcludeList.push(template['issuetype-field']);
            });

            //noinspection JSUnusedLocalSymbols
            $('textarea').each(function (index) {
                $(this).trigger('autoresize');
            });
        } else {
            $('#templateEditorTitle').text('No templates are currently loaded');
        }

        // Populate the add default template dropdown - excluding any templates already loaded
        chrome.runtime.sendMessage({JDTIfunction: "fetchDefault"}, function (response) {
            if (response.status === "success") {
                var defaultTemplates = response.data.templates;

                // Remove default templates from dropdown list if already added
                $.each(dropdownExcludeList, function (index, issueTypeField) {
                    $.each(defaultTemplates, function (name, template) {
                        if (issueTypeField === template['issuetype-field']) {
                            delete defaultTemplates[name];
                        }
                    });
                });

                if (!$.isEmptyObject(defaultTemplates)) {
                    $('#addDefaultDropdownButton').removeClass('emptyDropdown').addClass( "waves-effect waves-light" );

                    $.each(defaultTemplates, function(key, template){
                        var dropdownData = '<li><a class="dropdownOption" href="#!" data-issueFieldType="'+ template['issuetype-field'] +'" data-text="'+ template.text +'">'+ key +'</a></li>';
                        $('#addDefaultDropdown').append(dropdownData);
                    });
                } else {
                    $('#addDefaultDropdownButton').addClass('emptyDropdown').removeClass( "waves-effect waves-light" );
                }

                // Reload the dropdown
                $('.dropdown-button').dropdown({constrain_width: false});
            } else {
                $('#addTemplateDropdown').empty();
                $('#addDefaultDropdownButton').addClass('emptyDropdown').removeClass( "waves-effect waves-light" );
                Materialize.toast('Error loading default templates please reload the extension', 2000, 'toastNotification');
            }
        });

        limitAccess();

        if (callback) {
            callback();
        }
    });
}

function limitAccess(callback = false) {
    // Limit interface actions from parameters passed in through json
    chrome.storage.sync.get(StorageID, function (data) {

        if (data[StorageID].options.limit) {
            var limits = data[StorageID].options.limit;
            $.each(limits, function(key, limit){
                switch (limit) {
                    case "all":
                        $("#jsonURLInput").prop('disabled', true);
                        $('#download').addClass('disabled');
                        $('#fileSelectorButton').addClass('disabled');
                        $("input[title='filePath']").prop('disabled', true);
                        $('#upload').addClass('disabled');
                        $('#clear').addClass('disabled');
                        $('.removeSingleTemplate').addClass('disabled');
                        $('.updateSingleTemplate').addClass('disabled');
                        $('#add').addClass('disabled');
                        $('#addCustomTemplate').addClass('disabled');
                        $("#customTemplateName").prop('disabled', true);
                        $("#customTemplateIssueTypeField").prop('disabled', true);
                        $('#addDefaultDropdownButton').addClass('disabled');
                        return false;
                        break;
                    case "url":
                        console.log("In the url!!");
                        $("#jsonURLInput").prop('disabled', true);
                        $('#download').addClass('disabled');
                        break;
                    case "file":
                        $('#fileSelectorButton').addClass('disabled');
                        $("input[title='filePath']").prop('disabled', true);
                        $('#upload').addClass('disabled');
                        break;
                    case "clear":
                        $('#clear').addClass('disabled');
                        break;
                    case "delete":
                        $('.removeSingleTemplate').addClass('disabled');
                        break;
                    case "save":
                        $('.updateSingleTemplate').addClass('disabled');
                        break;
                    case "add":
                        $('#add').addClass('disabled');
                        break;
                    case "add-custom":
                        $('#addCustomTemplate').addClass('disabled');
                        $("#customTemplateName").prop('disabled', true);
                        $("#customTemplateIssueTypeField").prop('disabled', true);
                        break;
                    case "add-default":
                        $('#addDefaultDropdownButton').addClass('disabled');
                        break;

                }
            });
        }

        if (callback) {
            callback();
        }
    });
}

function dm_ui_click(element){
    chrome.runtime.sendMessage({
        type: 'analytics', name: 'ui_click', body: {
            "element": element,
            "ip_address": "${dm.meta:request_ip}",
            "geo": "${dm.meta:request_geo}",
            "ua": "${dm.ua:user_agent}"
        }
    });
}

function dm_template_update(action){
    chrome.runtime.sendMessage({
        type: 'analytics', name: 'template_update', body: {
            "action": action,
            "ip_address": "${dm.meta:request_ip}",
            "geo": "${dm.meta:request_geo}",
            "ua": "${dm.ua:user_agent}"
        }
    });
}

function dm_error(action, message){
    chrome.runtime.sendMessage({
        type: 'analytics', name: 'error', body: {
            "action" : action,
            "message": message,
            "ip_address": "${dm.meta:request_ip}",
            "geo": "${dm.meta:request_geo}",
            "ua": "${dm.ua:user_agent}"
        }
    });
}

$(document).ready(function () {

    chrome.runtime.sendMessage({
        type: 'analytics', name: 'launch', body: {
            "ip_address": "${dm.meta:request_ip}",
            "geo": "${dm.meta:request_geo}",
            "ua": "${dm.ua:user_agent}"
        }
    });

    document.addEventListener("focusin", onInitialFocus);
    loadTemplateEditor();

    // Click Handlers
    $('#reset').click(function () {
        dm_ui_click("reset");
        chrome.runtime.sendMessage({
            JDTIfunction: "reset"
        }, function (response) {
            if (response.status === "success") {
                location.reload();
                Materialize.toast('Default templates successfully loaded', 2000, 'toastNotification');
                dm_template_update("reset");
            } else {
                $('#templateEditor').empty();
                if (response.message) {
                    dm_error("reset", response.message);
                    Materialize.toast(response.message, 2000, 'toastNotification');
                } else {
                    dm_error("reset", "generic");
                    Materialize.toast('Something went wrong. Please try again.', 2000, 'toastNotification');
                }
            }
        });
    });

    $('#upload').click(function () {
        if (!$(this).hasClass('disabled')) {
            dm_ui_click("upload");
            if (!$('#fileSelector')[0].files[0]) {
                Materialize.toast('No file selected. Please select a file and try again', 2000, 'toastNotification');
            } else {
                //noinspection JSLint
                var reader = new FileReader();
                // Read file into memory
                reader.readAsText($('input#fileSelector')[0].files[0]);
                // Handle success and errors
                reader.onerror = function () {
                    dm_error("upload", "Error reading file");
                    Materialize.toast('Error reading file. Please try again', 2000, 'toastNotification');
                };
                reader.onload = function () {
                    var data = $.parseJSON(reader.result);
                    chrome.runtime.sendMessage({
                        JDTIfunction: "upload",
                        fileContents: data
                    }, function (response) {
                        if (response.status === "success") {
                            location.reload();
                            Materialize.toast('Templates successfully loaded from file', 2000, 'toastNotification');
                            dm_template_update("upload");
                        } else {
                            if (response.message) {
                                dm_error("upload", response.message);
                                Materialize.toast(response.message, 2000, 'toastNotification');
                            } else {
                                dm_error("upload", "generic");
                                Materialize.toast('Something went wrong. Please try again.', 2000, 'toastNotification');
                            }
                        }
                    });
                };
            }
        } else {
            Materialize.toast(disabledOptionToast, 2000, 'toastNotification');
        }
    });

    $('#download').click(function () {
        if (!$(this).hasClass('disabled')) {
            dm_ui_click("download");
            chrome.runtime.sendMessage({
                JDTIfunction: "download",
                "url": $('#jsonURLInput').val()
            }, function (response) {
                if (response.status === "success") {
                    location.reload();
                    Materialize.toast('Templates successfully loaded from URL', 2000, 'toastNotification');
                    dm_template_update("download");
                } else {
                    if (response.message) {
                        dm_error("download", response.message);
                        Materialize.toast(response.message, 2000, 'toastNotification');
                    } else {
                        dm_error("download", "generic");
                        Materialize.toast('Something went wrong. Please try again.', 2000, 'toastNotification');
                    }
                }
            });
        } else {
            Materialize.toast(disabledOptionToast, 2000, 'toastNotification');
        }
    });

    $('#clear').click(function () {
        if (!$(this).hasClass('disabled')) {
            dm_ui_click("clear");
            chrome.runtime.sendMessage({
                JDTIfunction: "clear"
            }, function (response) {
                if (response.status === "success") {
                    location.reload();
                    Materialize.toast('All templates deleted', 2000, 'toastNotification');
                    dm_template_update("clear");
                } else {
                    $('#templateEditor').empty();
                    if (response.message) {
                        dm_error("clear", response.message);
                        Materialize.toast(response.message, 2000, 'toastNotification');
                    } else {
                        dm_error("clear", "generic");
                        Materialize.toast('Something went wrong. Please try again.', 2000, 'toastNotification');
                    }
                }
            });
        } else {
            Materialize.toast(disabledOptionToast, 2000, 'toastNotification');
        }
    });

    $('#add').click(function () {
        event.preventDefault();
        dm_ui_click("add");
        if (!$(this).hasClass('disabled')) {
            $('#addTemplateModal').openModal();
        } else {
            Materialize.toast(disabledOptionToast, 2000, 'toastNotification');
        }
    });

    $('#addCustomTemplate').click(function () {
        if (!$(this).hasClass('disabled')) {
            dm_ui_click("add-custom");
            var templateName = $('#customTemplateName').val();
            var issueTypeField = $('#customTemplateIssueTypeField').val();

            chrome.runtime.sendMessage({
                JDTIfunction: "add",
                templateName: templateName,
                issueTypeField: issueTypeField,
                text:""
            }, function (response) {
                $('#addTemplateModal').closeModal();
                if (response.status === "success") {
                    loadTemplateEditor(function () {
                        openCollapsible(issueTypeField);
                    });
                    Materialize.toast('Template successfully added', 2000, 'toastNotification');
                    dm_template_update("add-custom");
                } else {
                    loadTemplateEditor(function () {
                        if (response.message) {
                            dm_error("add-custom", response.message);
                            Materialize.toast(response.message, 2000, 'toastNotification');
                            if (response.data === 'open') {
                                openCollapsible(issueTypeField);
                            }
                        } else {
                            dm_error("add-custom", "generic");
                            Materialize.toast('Something went wrong. Please try again.', 2000, 'toastNotification');
                        }
                    });
                }
            });
        } else {
            Materialize.toast(disabledOptionToast, 2000, 'toastNotification');
        }
    });

    $('#addDefaultDropdownButton').click(function () {
        if ($( "#addDefaultDropdownButton" ).hasClass( "emptyDropdown" )) {
            Materialize.toast('All default templates have already been added', 2000, 'toastNotification');
        } else if ($( "#addDefaultDropdownButton" ).hasClass( "disabled" )) {
            Materialize.toast(disabledOptionToast, 2000, 'toastNotification');
        } else {
            dm_ui_click("add-default-dropdown");
            // Dropdown is not initialized on load to support disabling through json options
            // If it's not disabled initialize it on click
            var attr = $(this).attr('data-activates');
            if (typeof attr == typeof undefined || attr == false) {
                $(this).attr('data-activates', 'addDefaultDropdown');
                $('.dropdown-button').dropdown({constrain_width: false});
                $(this).click();
            }
        }
    });

    $('#export').click(function () {
        dm_ui_click("export");
        chrome.runtime.sendMessage({
            JDTIfunction: "getData"
        }, function (response) {
            if (response.status === "success") {
                var data = 'data:application/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(response.data, undefined, 4));
                chrome.downloads.download({
                    url: data,
                    filename: 'templates.json'
                });
            } else {
                if (response.message) {
                    dm_error("export", response.message);
                    Materialize.toast(response.message, 2000, 'toastNotification');
                } else {
                    dm_error("export", "generic");
                    Materialize.toast('Something went wrong. Please try again.', 2000, 'toastNotification');
                }
            }
        });
    });

    // Because the template editing section is dynamically build, need to monitor document rather then the classes directly
    $(document).on('click', "a.removeSingleTemplate", function () {
        if (!$(this).hasClass('disabled')) {
            dm_ui_click("remove-single");
            chrome.runtime.sendMessage({
                JDTIfunction: "delete",
                templateName: $(this).attr("id")
            }, function (response) {
                if (response.status === "success") {
                    loadTemplateEditor();
                    Materialize.toast('Template successfully removed', 2000, 'toastNotification');
                    dm_template_update("remove-single");
                } else {
                    if (response.message) {
                        dm_error("remove-single", response.message);
                        Materialize.toast(response.message, 2000, 'toastNotification');
                    } else {
                        dm_error("remove-single", "generic");
                        Materialize.toast('Something went wrong. Please try again.', 2000, 'toastNotification');
                    }
                }
            });
        } else {
            Materialize.toast(disabledOptionToast, 2000, 'toastNotification');
        }
    });

    $(document).on('click', "a.updateSingleTemplate", function () {
        if (!$(this).hasClass('disabled')) {
            dm_ui_click("update-single");
            chrome.runtime.sendMessage({
                JDTIfunction: "save",
                templateName: $(this).attr("id"),
                templateText: $('textarea[name="'+ $(this).attr("id") +'"]').val()
            }, function (response) {
                if (response.status === "success") {
                    Materialize.toast('Template successfully updated', 2000, 'toastNotification');
                    dm_template_update("update-single");
                } else {
                    if(response.message){
                        dm_error("update-single", response.message);
                        Materialize.toast(response.message, 2000, 'toastNotification');
                    } else {
                        dm_error("update-single", "generic");
                        Materialize.toast('Something went wrong. Please try again.', 2000, 'toastNotification');
                    }
                }
            });
        } else {
            Materialize.toast(disabledOptionToast, 2000, 'toastNotification');
        }
    });

    $(document).on('click', ".dropdownOption", function() {
        dm_ui_click("add-default-dropdown-selection");
        // Close the Modal
        var templateName = $(this).text();
        var issueTypeField = $(this).data('issuefieldtype');
        var text = "";
        if ($('#loadDefault').prop('checked')) {
            text = $(this).data('text');
        }

        chrome.runtime.sendMessage({
            JDTIfunction: "add",
            templateName: templateName,
            issueTypeField: issueTypeField,
            text: text
        }, function (response) {
            $('#addTemplateModal').closeModal();
            if (response.status === "success") {
                loadTemplateEditor(function(){
                    openCollapsible(issueTypeField);
                });
                Materialize.toast('Template successfully added', 2000, 'toastNotification');
                dm_template_update("add-default");
            } else {
                loadTemplateEditor();
                if (response.message) {
                    dm_error("add-default-dropdown-selection", response.message);
                    Materialize.toast(response.message, 2000, 'toastNotification');
                } else {
                    dm_error("add-default-dropdown-selection", "generic");
                    Materialize.toast('Something went wrong. Please try again.', 2000, 'toastNotification');
                }
            }
        });
    });

    // Resize textarea on click of collapsible header because doing it earlier doesn't resize it 100$ correctly.
    $(document).on('click', ".collapsible-header", function () {
        $('html, body').animate({
            scrollTop: $(this).siblings('.collapsible-body').find('textarea').focus().trigger('autoresize').offset().top - 90
        }, 500);

    });

    // Force links to open in new tab
    $(document).on('click', ".newTabLinks",function () {
        dm_ui_click("help");
        chrome.tabs.create({url: $(this).attr('href')});
        return false;
    });

    // Onchange Handlers
    $('#fileSelector').change(function () {
        var file = $(this)[0].files[0];
        if (file.type !== "application/json") {
            Materialize.toast('File must be of type JSON. Please select a valid file', 4000, 'toastNotification');
            $(this).val('');
        }
    });

});