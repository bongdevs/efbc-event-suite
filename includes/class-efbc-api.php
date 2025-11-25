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
     * Get attendees for an event ID
     * @param int|string $event_id
     * @return array|false
     */
    public static function get_attendees( $event_id ) {
        $base = rtrim( get_option( 'efbc_es_api_base', 'https://server.efbcconference.org/api' ), '/' );
        // default path you gave; you may change API base later in settings
        $url  = $base . '/registrations/event/' . rawurlencode( $event_id );

        $transient_key = 'efbc_attendees_' . md5( $url );
        $cached = get_transient( $transient_key );
        if ( $cached !== false ) {
            return $cached;
        }

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

        // cache for 5 minutes
        set_transient( $transient_key, $data, 5 * MINUTE_IN_SECONDS );

        return $data;
    }
}
