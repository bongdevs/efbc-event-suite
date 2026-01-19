<?php
if (!defined('ABSPATH')) exit;

class EFBC_Ajax {

    public function __construct() {
        add_action('wp_ajax_efbc_get_events', [$this, 'get_events']);
        add_action('wp_ajax_nopriv_efbc_get_events', [$this, 'get_events']);
        add_action('wp_ajax_efbc_get_attendees', [$this, 'get_attendees']);
        add_action('wp_ajax_nopriv_efbc_get_attendees', [$this, 'get_attendees_public']);
        add_action('wp_ajax_efbc_get_attendees_public', [$this, 'get_attendees_public']);
        add_action('wp_ajax_nopriv_efbc_get_attendees_public', [$this, 'get_attendees_public']);
        add_action('wp_ajax_efbc_save_columns', [$this, 'save_columns']);
        add_action('wp_ajax_efbc_get_saved_columns', [$this, 'get_saved_columns']);
    }

    public function get_events() {
        $api_base = trim( get_option('efbc_es_api_base', 'https://server.efbcconference.org/api') );
        if ( empty( $api_base ) ) {
            $api_base = 'https://server.efbcconference.org/api';
        }
        $res = wp_remote_get( trailingslashit( $api_base ) . 'events' );
        if(is_wp_error($res)) wp_send_json_error($res->get_error_message());
        $body = wp_remote_retrieve_body($res);
        $data = json_decode($body,true);
        wp_send_json_success($data['data']??$data);
    }

    public function get_attendees() {
        if ( ! current_user_can( 'manage_options' ) ) {
            wp_send_json_error( 'Permission denied.' );
        }
        if ( ! check_ajax_referer( 'efbc_es_nonce', 'nonce', false ) ) {
            wp_send_json_error( 'Nonce verification failed.' );
        }
        $event_id = intval($_GET['event_id'] ?? 0);
        if ( ! $event_id ) wp_send_json_error( 'Missing event_id' );

        $api_base = trim( get_option( 'efbc_es_api_base', 'https://server.efbcconference.org/api' ) );
        if ( empty( $api_base ) ) {
            $api_base = 'https://server.efbcconference.org/api';
        }

        // request parameters - ensure reasonable defaults
        $per_page = intval( $_GET['per_page'] ?? 20 );
        $per_page = max( 1, $per_page );
        $page = intval( $_GET['page'] ?? 1 );
        $page = max( 1, $page );
        $activity = isset( $_GET['activity'] ) ? trim( wp_unslash( $_GET['activity'] ) ) : '';

        // optional force param to clear transient cache for the requested page (or base)
        $force = isset( $_GET['force'] ) && ( '1' === strval( $_GET['force'] ) || 'true' === strtolower( strval( $_GET['force'] ) ) );
        if ( $force ) {
            $url_base = rtrim( $api_base, '/' ) . '/registrations/event/' . rawurlencode( $event_id );
            // delete base cached all-pages key
            delete_transient( 'efbc_attendees_' . md5( $url_base ) );
            // delete page-specific key if page/per_page provided
            if ( $page || $per_page || $activity ) {
                $params = array();
                if ( $page ) $params['page'] = $page;
                if ( $per_page ) $params['per_page'] = $per_page;
                if ( $activity !== '' ) $params['activity'] = $activity;
                $query = http_build_query( $params );
                $url = $url_base . ( $query ? '?' . $query : '' );
                delete_transient( 'efbc_attendees_' . md5( $url ) );
            }
        }

        // If page/per_page specified, fetch that page from API (EFBC_Event_API will handle caching)
        $data = EFBC_Event_API::get_attendees( $event_id, $page, $per_page, $activity );
        if ( $data === false ) wp_send_json_error( 'Failed to fetch attendees from API' );

        // Expecting ['data'=>[], 'meta'=>[]]
        $response = [ 'data' => $data['data'] ?? array(), 'meta' => $data['meta'] ?? array() ];
        // Debug: if requested, include received query params to help diagnose frontend issues
        if ( isset( $_GET['debug'] ) ) {
            $response['debug_received'] = wp_unslash( $_GET );
        }
        wp_send_json_success( $response );
    }

    // Public (nopriv) handler for shortcode pagination - no nonce required, no capability check
    public function get_attendees_public() {
        $event_id = intval($_GET['event_id'] ?? 0);
        if ( ! $event_id ) wp_send_json_error( 'Missing event_id' );

        $api_base = trim( get_option( 'efbc_es_api_base', 'https://server.efbcconference.org/api' ) );
        if ( empty( $api_base ) ) {
            $api_base = 'https://server.efbcconference.org/api';
        }

        // request parameters - ensure reasonable defaults for public shortcode
        $per_page = intval( $_GET['per_page'] ?? 20 );
        $per_page = max( 1, $per_page );
        $page = intval( $_GET['page'] ?? 1 );
        $page = max( 1, $page );
        $activity = isset( $_GET['activity'] ) ? trim( wp_unslash( $_GET['activity'] ) ) : '';

        // Fetch the requested page with pagination
        $data = EFBC_Event_API::get_attendees( $event_id, $page, $per_page, $activity );
        if ( $data === false ) wp_send_json_error( 'Failed to fetch attendees from API' );

        // Expecting ['data'=>[], 'meta'=>[]]
        wp_send_json_success( [ 'data' => $data['data'] ?? array(), 'meta' => $data['meta'] ?? array() ] );
    }

    public function save_columns() {
        if ( ! current_user_can( 'manage_options' ) ) {
            wp_send_json_error( 'Permission denied.' );
        }
        if ( ! check_ajax_referer( 'efbc_es_nonce', 'nonce', false ) ) {
            wp_send_json_error( 'Nonce verification failed.' );
        }
        $event_id = intval( $_POST['event_id'] ?? 0 );
        $activity = sanitize_text_field( $_POST['activity'] ?? '' );
        $columns = isset( $_POST['columns'] ) ? json_decode( wp_unslash( $_POST['columns'] ), true ) : array();
        
        if ( empty( $event_id ) || empty( $activity ) || empty( $columns ) ) {
            wp_send_json_error( 'Invalid data' );
        }

        $all_columns = get_option( 'efbc_columns_layout', array() );
        $all_columns[ $event_id ][ $activity ] = array_map( 'sanitize_text_field', $columns );
        update_option( 'efbc_columns_layout', $all_columns ) ? wp_send_json_success( 'Saved' ) : wp_send_json_error( 'Failed' );
    }

    public function get_saved_columns() {
        if ( ! current_user_can( 'manage_options' ) ) {
            wp_send_json_error( 'Permission denied.' );
        }
        if ( ! check_ajax_referer( 'efbc_es_nonce', 'nonce', false ) ) {
            wp_send_json_error( 'Nonce verification failed.' );
        }
        wp_send_json_success(get_option('efbc_columns_layout', []));
    }
}
