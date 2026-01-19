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

        register_setting('efbc_es_settings_group', 'efbc_table_row_text', [
            'type' => 'string',
            'sanitize_callback' => 'sanitize_hex_color',
            'default' => '#333333'
        ]);

        register_setting('efbc_es_settings_group', 'efbc_table_row_hover', [
            'type' => 'string',
            'sanitize_callback' => 'sanitize_hex_color',
            'default' => '#f1faff'
        ]);

        register_setting('efbc_es_settings_group', 'efbc_table_odd_row_bg', [
            'type' => 'string',
            'sanitize_callback' => 'sanitize_hex_color',
            'default' => '#ffffff'
        ]);

        register_setting('efbc_es_settings_group', 'efbc_table_even_row_bg', [
            'type' => 'string',
            'sanitize_callback' => 'sanitize_hex_color',
            'default' => '#f9f9f9'
        ]);

        // Pagination color settings
        register_setting('efbc_es_settings_group', 'efbc_pagination_primary', [
            'type' => 'string',
            'sanitize_callback' => 'sanitize_hex_color',
            'default' => '#0073aa'
        ]);

        register_setting('efbc_es_settings_group', 'efbc_pagination_active', [
            'type' => 'string',
            'sanitize_callback' => 'sanitize_hex_color',
            'default' => '#006799'
        ]);

        register_setting('efbc_es_settings_group', 'efbc_pagination_hover', [
            'type' => 'string',
            'sanitize_callback' => 'sanitize_hex_color',
            'default' => '#005a87'
        ]);

        register_setting('efbc_es_settings_group', 'efbc_pagination_text', [
            'type' => 'string',
            'sanitize_callback' => 'sanitize_hex_color',
            'default' => '#ffffff'
        ]);

        // Font family setting
        register_setting('efbc_es_settings_group', 'efbc_table_font_family', [
            'type' => 'string',
            'sanitize_callback' => 'sanitize_text_field',
            'default' => 'inherit'
        ]);
    }
}
