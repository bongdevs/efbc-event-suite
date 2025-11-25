<?php
/**
 * Plugin Name: EFBC Event Suite
 * Plugin URI:  https://bongdevs.com
 * Description: Complete event management plugin with an admin React dashboard and a dynamic [efbc_attendees] shortcode. Display and manage attendees efficiently, with search and filtering options, and fully customizable table columns.
 * Version: 1.0.0
 * Author: Bongdevs.com
 * Author URI: https://bongdevs.com
 * Text Domain: efbc-event-suite
 * Domain Path: /languages
 * License: GPL2
 * License URI: https://www.gnu.org/licenses/gpl-2.0.html
 *
 * @package EFBC_Event_Suite
 * @developer Jahid Hasan, Bongdevs (https://bongdevs.com)
 * @link https://efbcconference.org
 * 
 * Features:
 * - Dynamic [efbc_attendees] shortcode
 * - Admin React dashboard for event management
 * - Customizable attendee table columns
 * - Filter attendees by activity
 * - Searchable attendee tables
 * - Fully responsive modal preview
 *
 * This plugin is developed and maintained by Bongdevs – your WordPress & web solutions agency.
 */


if (!defined('ABSPATH')) exit;

define('EFBC_ES_VERSION', '1.0.0');
define('EFBC_ES_PLUGIN_DIR', plugin_dir_path(__FILE__));
define('EFBC_ES_PLUGIN_URL', plugin_dir_url(__FILE__));

// Include classes
require_once EFBC_ES_PLUGIN_DIR . 'includes/class-efbc-api.php';
require_once EFBC_ES_PLUGIN_DIR . 'includes/class-efbc-shortcodes.php';
require_once EFBC_ES_PLUGIN_DIR . 'includes/class-efbc-ajax.php';
require_once EFBC_ES_PLUGIN_DIR . 'includes/class-efbc-settings.php';
require_once EFBC_ES_PLUGIN_DIR . 'admin/class-admin.php';

// Initialize
new EFBC_Admin();
new EFBC_Ajax();
new EFBC_Settings();
EFBC_Event_Shortcodes::init();
