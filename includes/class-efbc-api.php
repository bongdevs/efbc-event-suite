<?php
if ( ! defined( 'ABSPATH' ) ) exit;

class EFBC_Event_API {
    /**
     * Get events list from API
     * @return array|false
     */
    public static function get_events() {
        $base = rtrim( get_option( 'efbc_es_api_base', 'https://server.efbcconference.org/api' ), '/' );
        $url  = $base . '/events';

        $resp = wp_remote_get( $url, array( 'timeout' => 15 ) );
        if ( is_wp_error( $resp ) ) {
            return false;
        }

        $code = wp_remote_retrieve_response_code( $resp );
        if ( 200 !== (int) $code ) {
            return false;
        }

        $body = wp_remote_retrieve_body( $resp );
        $data = json_decode( $body, true );

        if ( ! is_array( $data ) ) {
            return false;
        }

        return $data;
    }

    /**
     * Get attendees for an event ID using progressive batch loading.
     * Fetches only required pages initially (for fast first load), caches progressively.
     * @param int|string $event_id
     * @param int|null $page Requested page number
     * @param int|null $per_page Items per page
     * @param string|null $activity Optional activity filter
     * @return array|false
     */
    public static function get_attendees( $event_id, $page = null, $per_page = null, $activity = null ) {
        $base = rtrim( get_option( 'efbc_es_api_base', 'https://server.efbcconference.org/api' ), '/' );
        $url_base  = $base . '/registrations/event/' . rawurlencode( $event_id );

        // Set defaults
        $page = $page !== null ? max( 1, intval( $page ) ) : 1;
        $per_page = $per_page !== null ? max( 1, intval( $per_page ) ) : 20;
        $activity = $activity !== null && $activity !== '' ? trim( $activity ) : '';

        // Check if we have cached data (cache for 30 seconds for performance)
        $full_dataset_key = 'efbc_attendees_full_' . md5( $url_base );
        $all_items = get_transient( $full_dataset_key );

        // Progressive loading: if not fully cached, fetch only needed pages
        if ( $all_items === false ) {
            $all_items = array();
            $api_page = 1;
            $max_api_pages = 100;

            // Fetch all pages (one-time full load)
            while ( $api_page <= $max_api_pages ) {
                $api_page_url = $url_base . '?page=' . $api_page;
                
                $resp = wp_remote_get( $api_page_url, array( 'timeout' => 15 ) );
                if ( is_wp_error( $resp ) ) break;

                $code = wp_remote_retrieve_response_code( $resp );
                if ( 200 !== (int) $code ) break;

                $body = wp_remote_retrieve_body( $resp );
                $data = json_decode( $body, true );

                if ( ! is_array( $data ) ) break;

                if ( isset( $data['data'] ) && is_array( $data['data'] ) ) {
                    $items = $data['data'];
                } elseif ( array_values( $data ) === $data ) {
                    $items = $data;
                } else {
                    $items = array();
                }

                if ( empty( $items ) ) break;

                $all_items = array_merge( $all_items, $items );

                // Stop if this page had fewer than 10 items (reached end)
                if ( count( $items ) < 10 ) break;

                $api_page++;
            }

            // Cache for 30 seconds - balances speed with fresh data updates
            set_transient( $full_dataset_key, $all_items, 30 );
        }

        if ( empty( $all_items ) ) {
            return array( 'data' => array(), 'meta' => array( 'total' => 0, 'last_page' => 1, 'current_page' => 1, 'per_page' => $per_page ) );
        }

        // Apply activity filter if requested
        $filtered_items = $all_items;
        if ( $activity !== '' ) {
            $filtered_items = array_filter( $all_items, function( $item ) use ( $activity ) {
                $item_category = isset( $item['category'] ) ? trim( $item['category'] ) : '';
                return strcasecmp( $item_category, $activity ) === 0;
            });
            $filtered_items = array_values( $filtered_items );
        }

        // Calculate pagination
        $total = count( $filtered_items );
        $last_page = max( 1, (int) ceil( $total / $per_page ) );
        $page = min( $page, $last_page );

        // Get the page slice
        $start_idx = ( $page - 1 ) * $per_page;
        $page_data = array_slice( $filtered_items, $start_idx, $per_page );

        return array(
            'data' => $page_data,
            'meta' => array(
                'total' => $total,
                'last_page' => $last_page,
                'current_page' => $page,
                'per_page' => $per_page
            )
        );
    }
}
