<?php
if (!defined('ABSPATH')) exit;

class EFBC_Settings {
    public function __construct() {
        add_action('admin_init', [$this, 'register_settings']);
    }

    public function register_settings() {
        register_setting('efbc_es_settings_group', 'efbc_es_api_base', [
            'type'=>'string',
            'sanitize_callback'=>'esc_url_raw',
            'default'=>'https://server.efbcconference.org/api'
        ]);

        // Table color customization settings for shortcode / modal
        register_setting('efbc_es_settings_group', 'efbc_table_header_bg', [
            'type' => 'string',
            'sanitize_callback' => 'sanitize_hex_color',
            'default' => '#0073aa'
        ]);

        register_setting('efbc_es_settings_group', 'efbc_table_header_text', [
            'type' => 'string',
            'sanitize_callback' => 'sanitize_hex_color',
            'default' => '#ffffff'
        ]);

        register_setting('efbc_es_settings_group', 'efbc_table_row_hover', [
            'type' => 'string',
            'sanitize_callback' => 'sanitize_hex_color',
            'default' => '#f1faff'
        ]);

        register_setting('efbc_es_settings_group', 'efbc_table_even_row_bg', [
            'type' => 'string',
            'sanitize_callback' => 'sanitize_hex_color',
            'default' => '#f9f9f9'
        ]);
    }
}
