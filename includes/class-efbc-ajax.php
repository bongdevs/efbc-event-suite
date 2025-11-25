<?php
if (!defined('ABSPATH')) exit;

class EFBC_Ajax {

    public function __construct() {
        add_action('wp_ajax_efbc_get_events', [$this, 'get_events']);
        add_action('wp_ajax_nopriv_efbc_get_events', [$this, 'get_events']);
        add_action('wp_ajax_efbc_get_attendees', [$this, 'get_attendees']);
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
        $event_id = intval($_GET['event_id'] ?? 0);
        if(!$event_id) wp_send_json_error('Missing event_id');
        $api_base = trim( get_option('efbc_es_api_base', 'https://server.efbcconference.org/api') );
        if ( empty( $api_base ) ) {
            $api_base = 'https://server.efbcconference.org/api';
        }
        $res = wp_remote_get( trailingslashit( $api_base ) . "registrations/event/{$event_id}" );
        if(is_wp_error($res)) wp_send_json_error($res->get_error_message());
        $body = wp_remote_retrieve_body($res);
        $data = json_decode($body,true);
        wp_send_json_success($data['data']??$data);
    }

    public function save_columns() {
        $input = json_decode(file_get_contents('php://input'), true);
        if(empty($input['event_id'])||empty($input['activity'])||empty($input['columns'])) wp_send_json_error('Invalid data');

        $all_columns = get_option('efbc_columns_layout', []);
        $all_columns[intval($input['event_id'])][$input['activity']] = array_map('sanitize_text_field',$input['columns']);
        update_option('efbc_columns_layout',$all_columns) ? wp_send_json_success('Saved') : wp_send_json_error('Failed');
    }

    public function get_saved_columns() {
        wp_send_json_success(get_option('efbc_columns_layout', []));
    }
}
