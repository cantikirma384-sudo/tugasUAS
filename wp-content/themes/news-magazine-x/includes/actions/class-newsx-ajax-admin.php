<?php

if ( ! defined( 'ABSPATH' ) ) {
	exit; // Exit if accessed directly.
}

class Newsx_Ajax_Admin {
    public function __construct() {
        add_action('wp_ajax_newsx_activate_required_plugins', [$this, 'activate_required_plugins_callback']);
    }

    public function activate_required_plugins_callback() {
        // Verify nonce
        if ( !isset( $_POST['nonce'] ) || !wp_verify_nonce( sanitize_text_field( wp_unslash( $_POST['nonce'] ) ), 'newsx-activate-required-plugins' ) ) {
            wp_send_json_error( 'Invalid nonce' );
        }

        // Check user capabilities
        if ( ! current_user_can( 'activate_plugins' ) ) {
            wp_send_json_error( 'Insufficient permissions' );
        }

        // Ensure plugin functions are available
        if ( ! function_exists( 'get_plugins' ) ) {
            require_once ABSPATH . 'wp-admin/includes/plugin.php';
        }

        // Get plugins to activate (can be single slug or array)
        $plugins = isset($_POST['plugins']) ? $_POST['plugins'] : [];

        // Handle single plugin for backwards compatibility
        if ( empty($plugins) && isset($_POST['plugin']) ) {
            $plugins = [ sanitize_text_field($_POST['plugin']) ];
        }

        if ( !is_array($plugins) ) {
            $plugins = array_map('sanitize_text_field', (array) $plugins);
        } else {
            $plugins = array_map('sanitize_text_field', $plugins);
        }

        if ( empty($plugins) ) {
            wp_send_json_error( 'No plugins specified' );
        }

        // Clear plugin cache
        wp_clean_plugins_cache();

        // Get all installed plugins
        $all_plugins = get_plugins();
        $results = [];

        foreach ( $plugins as $slug ) {
            $plugin_path = $this->find_plugin_path( $slug, $all_plugins );

            if ( ! $plugin_path ) {
                $results[$slug] = ['success' => false, 'error' => 'Plugin not found'];
                continue;
            }

            if ( is_plugin_active( $plugin_path ) ) {
                $results[$slug] = ['success' => true, 'message' => 'Already active'];
                continue;
            }

            $result = activate_plugin( $plugin_path );

            if ( is_wp_error( $result ) ) {
                $results[$slug] = ['success' => false, 'error' => $result->get_error_message()];
            } else {
                $results[$slug] = ['success' => true, 'message' => 'Activated'];

                // Delete Freemius activation redirect transient to prevent plugin from overriding our redirect
                delete_transient( 'fs_plugin_' . $slug . '_activated' );
            }
        }

        wp_send_json_success( $results );
    }

    private function find_plugin_path( $slug, $all_plugins ) {
        foreach ( $all_plugins as $path => $plugin_data ) {
            if ( strpos( $path, $slug . '/' ) === 0 ) {
                return $path;
            }
        }
        return false;
    }
}

new Newsx_Ajax_Admin();
