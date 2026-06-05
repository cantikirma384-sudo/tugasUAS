jQuery( document ).ready( function( $ ) {
    "use strict";

    var pluginsToInstall = [];
    var pluginsToActivate = [];
    var currentInstallIndex = 0;

    $('.newsx-btn-get-started').on('click', function() {
        var $btn = $(this);
        $btn.find('span').text(NewsxWelcomeNotice.installing_text);
        $btn.append('<span class="dot-flashing"></span>');

        pluginsToInstall = [];
        pluginsToActivate = [];

        // Core plugin
        if ( 'yes' !== NewsxWelcomeNotice.core_active ) {
            pluginsToActivate.push('news-magazine-x-core');
            if ( 'no' === NewsxWelcomeNotice.core_installed ) {
                pluginsToInstall.push('news-magazine-x-core');
            }
        }

        // Backup plugin
        if ( 'yes' !== NewsxWelcomeNotice.backup_active ) {
            pluginsToActivate.push('royal-backup-reset');
            if ( 'no' === NewsxWelcomeNotice.backup_installed ) {
                pluginsToInstall.push('royal-backup-reset');
            }
        }

        console.log('Plugins to install:', pluginsToInstall);
        console.log('Plugins to activate:', pluginsToActivate);

        // Start the process
        currentInstallIndex = 0;
        installNextPlugin();
    });

    function installNextPlugin() {
        // If all plugins are installed, activate them all at once
        if ( currentInstallIndex >= pluginsToInstall.length ) {
            console.log('All plugins installed, now activating...');
            activateAllPlugins();
            return;
        }

        var slug = pluginsToInstall[currentInstallIndex];
        console.log('Installing:', slug);

        wp.updates.installPlugin({
            slug: slug,
            success: function( response ) {
                console.log('Install success:', slug, response);
                currentInstallIndex++;
                installNextPlugin();
            },
            error: function( response ) {
                console.log('Install error:', slug, response);
                if ( response.errorCode === 'folder_exists' ) {
                    console.log('Folder exists, continuing...');
                }
                currentInstallIndex++;
                installNextPlugin();
            }
        });
    }

    function activateAllPlugins() {
        if ( pluginsToActivate.length === 0 ) {
            console.log('No plugins to activate, redirecting...');
            redirectToThemePage();
            return;
        }

        console.log('Activating all plugins:', pluginsToActivate);

        $.ajax({
            type: 'POST',
            url: NewsxWelcomeNotice.ajaxurl,
            data: {
                action: 'newsx_activate_required_plugins',
                plugins: pluginsToActivate,
                nonce: NewsxWelcomeNotice.nonce
            },
            success: function( response ) {
                console.log('Activation response:', response);
                redirectToThemePage();
            },
            error: function( xhr, status, error ) {
                console.log('Activation error:', status, error, xhr.responseText);
                redirectToThemePage();
            }
        });
    }

    function redirectToThemePage() {
        window.location.href = ajaxurl.replace('admin-ajax.php', 'admin.php') + '?page=newsx-options&tab=starter-templates';
    }
});
