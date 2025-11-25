<?php
if ( ! defined( 'ABSPATH' ) ) exit;

class EFBC_Event_Shortcodes {

    public static function init() {
        // Register shortcode
        add_shortcode( 'efbc_attendees', array( __CLASS__, 'render_attendees_table' ) );

        // Enqueue frontend CSS + JS
        add_action( 'wp_enqueue_scripts', array( __CLASS__, 'enqueue_frontend_assets' ) );
    }

    public static function enqueue_frontend_assets() {
        wp_enqueue_style(
            'efbc-attendees-css',
            plugin_dir_url( __FILE__ ) . '../css/front.css',
            array(),
            '1.0.0'
        );

        wp_enqueue_script(
            'efbc-attendees-js',
            plugin_dir_url( __FILE__ ) . '../js/front.js',
            array(),
            '1.0.0',
            true
        );
    }

    public static function render_attendees_table( $atts ) {
        $atts = shortcode_atts( array(
            'event_id' => 0,
            'activity' => '', // empty = show all attendees
        ), $atts, 'efbc_attendees' );

        $event_id = intval( $atts['event_id'] );
        if ( ! $event_id ) return '<p><strong>EFBC Event:</strong> No event selected.</p>';

        $activity_filter = sanitize_text_field($atts['activity']);

        // Ensure API base option is valid; fall back to default if empty
        $api_base = trim( get_option( 'efbc_es_api_base', 'https://server.efbcconference.org/api' ) );
        if ( empty( $api_base ) ) {
            $api_base = 'https://server.efbcconference.org/api';
        }
        $api_base = esc_url_raw( $api_base );
        $url = trailingslashit( $api_base ) . "registrations/event/{$event_id}";

        $response = wp_remote_get( $url );
        if ( is_wp_error( $response ) ) {
            return '<p>Unable to fetch attendees: ' . esc_html( $response->get_error_message() ) . '</p>';
        }

        $body = wp_remote_retrieve_body( $response );
        $data = json_decode( $body, true );
        $attendees = isset($data['data']) ? $data['data'] : array();

        if ( empty( $attendees ) ) return '<p>No attendees found for this event.</p>';

        // Filter by activity if specified
        if ( $activity_filter && strtolower($activity_filter) !== 'all' ) {
            $activity_lower = strtolower(trim($activity_filter));
            $attendees = array_filter($attendees, function($att) use($activity_lower) {
                return isset($att['wednesdayActivity']) && strtolower(trim($att['wednesdayActivity'])) === $activity_lower;
            });

            if ( empty( $attendees ) ) return '<p>No attendees match the selected activity.</p>';
        }

        // Load saved columns
        $all_columns = get_option('efbc_columns_layout', []);
        $event_columns = isset($all_columns[$event_id]) ? $all_columns[$event_id] : [];

        // Default columns
        $default_columns = ['Name','City','Organization','Zip',];

        // Determine columns to use for this activity
        if ( $activity_filter && strtolower($activity_filter) !== 'all' ) {
            $columns = $event_columns[$activity_filter] ?? $default_columns;
        } else {
            $columns = $event_columns['All Attendees'] ?? $default_columns;
        }

        // Map columns to JSON fields
        $fieldKeyMap = [
            "Name" => "badgeName",
            "Email" => "email",
            "Phone" => "mobile",
            "Status" => "status",
            "Golf Handicap" => "golfHandicap",
            "Club Rentals" => "clubRentals",
            "Paid" => "paid",
            "City" => "city",
            "State" => "state",
            "Zip" => "zipCode",
            "Country" => "country",
            "Address" => "address",
            "Organization" => "organization",
            "Company" => "companyType",
            "Group Assigned" => "groupAssigned",
            "Wednesday Activity" => "wednesdayActivity",
        ];

        // Fetch group names if "Group Assigned" column is included
        $groupNames = [];
        if ( in_array('Group Assigned', $columns) ) {
            $groupIds = array_filter(array_map(function($att) { return $att['groupAssigned'] ?? null; }, $attendees));
            $groupIds = array_unique($groupIds);

            foreach ($groupIds as $groupId) {
                $group_url = trailingslashit( $api_base ) . "groups/{$groupId}";
                $group_response = wp_remote_get( $group_url );
                if ( !is_wp_error( $group_response ) ) {
                    $group_body = wp_remote_retrieve_body( $group_response );
                    $group_data = json_decode( $group_body, true );
                    if ( isset($group_data['data']['name']) ) {
                        $groupNames[$groupId] = $group_data['data']['name'];
                    } else {
                        $groupNames[$groupId] = 'Unknown';
                    }
                } else {
                    $groupNames[$groupId] = 'Unknown';
                }
            }
        }

        $table_id = 'efbc_table_' . $event_id . '_' . sanitize_title($activity_filter ?: 'all');

        // Build table HTML with search
        $html = '<div class="efbc-attendees-table-wrapper">';
        $html .= '<input type="text" class="efbc-table-search" data-table-id="' . esc_attr($table_id) . '" placeholder="Search attendees..." style="margin-bottom:10px;padding:5px;width:100%;">';
        $html .= '<table id="' . esc_attr($table_id) . '" class="efbc-attendees-table wp-list-table widefat striped">';
        $html .= '<thead><tr>';
        foreach ($columns as $col) {
            $html .= '<th>' . esc_html($col) . '</th>';
        }
        $html .= '</tr></thead><tbody>';

        foreach ($attendees as $att) {
            $html .= '<tr>';
            foreach ($columns as $col) {
                $key = $fieldKeyMap[$col] ?? '';
                $value = $key && isset($att[$key]) ? $att[$key] : '';
                if ($col === "Paid") $value = !empty($att['paid']) ? 'Yes' : 'No';
                if ($col === "Group Assigned") {
                    $groupId = $att['groupAssigned'] ?? null;
                    $value = $groupId && isset($groupNames[$groupId]) ? $groupNames[$groupId] : ($groupId ? 'Unknown' : 'Unassigned');
                }
                $html .= '<td>' . esc_html($value) . '</td>';
            }
            $html .= '</tr>';
        }

        $html .= '</tbody></table></div>';

        return $html;
    }
}

EFBC_Event_Shortcodes::init();
