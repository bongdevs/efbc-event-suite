<?php
if (!defined('ABSPATH')) exit;

class EFBC_Admin {

    public function __construct() {
        add_action('admin_menu', [$this, 'register_admin_menu']);
        add_action('admin_enqueue_scripts', [$this, 'enqueue_admin_assets']);
        add_action('wp_enqueue_scripts', [$this, 'enqueue_frontend_assets']);
    }

    public function register_admin_menu() {
        add_menu_page(
            __('EFBC Events', 'efbc-event-suite'),
            __('EFBC Events', 'efbc-event-suite'),
            'manage_options',
            'efbc-event-suite',
            [$this, 'render_admin_page'],
            'dashicons-calendar-alt',
            30
        );

        add_submenu_page(
            'efbc-event-suite',
            __('Table Builder', 'efbc-event-suite'),
            __('Table Builder', 'efbc-event-suite'),
            'manage_options',
            'efbc-table-builder',
            [$this, 'render_table_builder_page']
        );

        add_submenu_page(
            'efbc-event-suite',
            __('Settings', 'efbc-event-suite'),
            __('Settings', 'efbc-event-suite'),
            'manage_options',
            'efbc-event-suite-settings',
            [$this, 'render_settings_page']
        );
    }

    public function render_admin_page() {
        echo '<div class="wrap"><h1>' . esc_html__('EFBC Event Suite', 'efbc-event-suite') . '</h1>';
        echo '<div id="efbc-event-suite-app"></div></div>';
    }

    public function render_table_builder_page() {
        echo '<div class="wrap"><h1>Table Builder</h1>';
        echo '<div id="efbc-table-builder-app"></div></div>';
    }

    public function render_settings_page() {
        ?>
        <div class="wrap">
            <h1><?php esc_html_e('EFBC Event Suite Settings', 'efbc-event-suite'); ?></h1>
            <form method="post" action="options.php">
                <?php
                settings_fields('efbc_es_settings_group');
                do_settings_sections('efbc_es_settings_group');
                // Color customization options for shortcode table
                $header_bg = get_option('efbc_table_header_bg', '#0073aa');
                $header_text = get_option('efbc_table_header_text', '#ffffff');
                $row_hover = get_option('efbc_table_row_hover', '#f1faff');
                $even_row = get_option('efbc_table_even_row_bg', '#f9f9f9');
                ?>
                <?php $api_base = get_option('efbc_es_api_base', 'https://server.efbcconference.org/api'); ?>
                <table class="form-table">
                    <tr valign="top">
                        <th scope="row"><?php esc_html_e('API Base URL', 'efbc-event-suite'); ?></th>
                        <td>
                            <input type="text" name="efbc_es_api_base" value="<?php echo esc_attr($api_base); ?>" style="width:50%" />
                            <p class="description"><?php esc_html_e('Base URL for EFBC API (e.g. https://server.efbcconference.org/api).', 'efbc-event-suite'); ?></p>
                        </td>
                    </tr>
                    <tr valign="top">
                        <th scope="row"><?php esc_html_e('Table Header Background', 'efbc-event-suite'); ?></th>
                        <td>
                            <input type="color" name="efbc_table_header_bg" value="<?php echo esc_attr($header_bg); ?>" />
                            <p class="description"><?php esc_html_e('Header background color for attendee tables.', 'efbc-event-suite'); ?></p>
                        </td>
                    </tr>
                    <tr valign="top">
                        <th scope="row"><?php esc_html_e('Table Header Text Color', 'efbc-event-suite'); ?></th>
                        <td>
                            <input type="color" name="efbc_table_header_text" value="<?php echo esc_attr($header_text); ?>" />
                            <p class="description"><?php esc_html_e('Header text color for attendee tables.', 'efbc-event-suite'); ?></p>
                        </td>
                    </tr>
                    <tr valign="top">
                        <th scope="row"><?php esc_html_e('Row Hover Color', 'efbc-event-suite'); ?></th>
                        <td>
                            <input type="color" name="efbc_table_row_hover" value="<?php echo esc_attr($row_hover); ?>" />
                            <p class="description"><?php esc_html_e('Background color when hovering a table row.', 'efbc-event-suite'); ?></p>
                        </td>
                    </tr>
                    <tr valign="top">
                        <th scope="row"><?php esc_html_e('Even Row Background', 'efbc-event-suite'); ?></th>
                        <td>
                            <input type="color" name="efbc_table_even_row_bg" value="<?php echo esc_attr($even_row); ?>" />
                            <p class="description"><?php esc_html_e('Background color for even table rows (zebra stripe).', 'efbc-event-suite'); ?></p>
                        </td>
                    </tr>
                </table>
                <?php submit_button(); ?>
            </form>
        </div>
        <?php
    }

    public function enqueue_frontend_assets() {
        wp_enqueue_style('efbc-es-frontend', EFBC_ES_PLUGIN_URL . 'assets/css/front.css', [], EFBC_ES_VERSION);
        wp_enqueue_script('efbc-front-js', EFBC_ES_PLUGIN_URL . 'assets/js/front.js', ['jquery'], EFBC_ES_VERSION, true);

        // Inject inline CSS based on saved color options so shortcode/modal tables match admin settings
        $header_bg = get_option('efbc_table_header_bg', '#0073aa');
        $header_text = get_option('efbc_table_header_text', '#ffffff');
        $row_hover = get_option('efbc_table_row_hover', '#f1faff');
        $even_row = get_option('efbc_table_even_row_bg', '#f9f9f9');

        $inline_css = "
        .efbc-attendees-table th{ background-color: {$header_bg} !important; color: {$header_text} !important; }
        .efbc-attendees-table tr:hover{ background-color: {$row_hover} !important; }
        .efbc-attendees-table tr:nth-child(even){ background-color: {$even_row} !important; }
        ";

        wp_add_inline_style('efbc-es-frontend', $inline_css);
    }

    public function enqueue_admin_assets($hook) {
        if (strpos($hook,'efbc-event-suite')===false && strpos($hook,'efbc-table-builder')===false) return;

        $asset_file = EFBC_ES_PLUGIN_DIR . 'admin/build/index.asset.php';
        $asset = file_exists($asset_file) ? require $asset_file : ['dependencies'=>['wp-element'],'version'=>EFBC_ES_VERSION];

        wp_register_script('efbc-es-admin-app', EFBC_ES_PLUGIN_URL.'admin/build/index.js', $asset['dependencies'], $asset['version'], true);
        wp_localize_script('efbc-es-admin-app','efbcData',[
            'ajaxUrl'=>admin_url('admin-ajax.php'),
            'nonce'=>wp_create_nonce('efbc_es_nonce')
        ]);
        wp_enqueue_script('efbc-es-admin-app');

        // Enqueue Admin CSS
        $admin_css_file = EFBC_ES_PLUGIN_URL . 'assets/css/admin.css';
        if (file_exists(EFBC_ES_PLUGIN_DIR . 'assets/css/admin.css')) {
            wp_enqueue_style('efbc-es-admin-css', $admin_css_file, [], EFBC_ES_VERSION);
            // Add inline admin CSS (color customizations) so modal in admin reflects settings
            $header_bg = get_option('efbc_table_header_bg', '#0073aa');
            $header_text = get_option('efbc_table_header_text', '#ffffff');
            $row_hover = get_option('efbc_table_row_hover', '#f1faff');
            $even_row = get_option('efbc_table_even_row_bg', '#f9f9f9');
            // Also target plugin app containers so admin modal/table reflect colors even before rebuilding the admin JS
            $inline_css = ".efbc-attendees-table th, .wrap #efbc-event-suite-app .wp-list-table th, .wrap #efbc-table-builder-app .wp-list-table th { background-color: {$header_bg} !important; color: {$header_text} !important; }\n";
            $inline_css .= ".efbc-attendees-table tr:hover, .wrap #efbc-event-suite-app .wp-list-table tr:hover, .wrap #efbc-table-builder-app .wp-list-table tr:hover { background-color: {$row_hover} !important; }\n";
            $inline_css .= ".efbc-attendees-table tr:nth-child(even), .wrap #efbc-event-suite-app .wp-list-table tr:nth-child(even), .wrap #efbc-table-builder-app .wp-list-table tr:nth-child(even) { background-color: {$even_row} !important; }\n";
            wp_add_inline_style('efbc-es-admin-css', $inline_css);
        }
        else {
            // Ensure admin screens still get the inline CSS even if admin.css is missing
            $header_bg = get_option('efbc_table_header_bg', '#0073aa');
            $header_text = get_option('efbc_table_header_text', '#ffffff');
            $row_hover = get_option('efbc_table_row_hover', '#f1faff');
            $even_row = get_option('efbc_table_even_row_bg', '#f9f9f9');
            $inline_css = ".efbc-attendees-table th, .wrap #efbc-event-suite-app .wp-list-table th, .wrap #efbc-table-builder-app .wp-list-table th { background-color: {$header_bg} !important; color: {$header_text} !important; }\n";
            $inline_css .= ".efbc-attendees-table tr:hover, .wrap #efbc-event-suite-app .wp-list-table tr:hover, .wrap #efbc-table-builder-app .wp-list-table tr:hover { background-color: {$row_hover} !important; }\n";
            $inline_css .= ".efbc-attendees-table tr:nth-child(even), .wrap #efbc-event-suite-app .wp-list-table tr:nth-child(even), .wrap #efbc-table-builder-app .wp-list-table tr:nth-child(even) { background-color: {$even_row} !important; }\n";
            wp_register_style('efbc-es-admin-inline', false);
            wp_enqueue_style('efbc-es-admin-inline');
            wp_add_inline_style('efbc-es-admin-inline', $inline_css);
        }

        if (!file_exists(EFBC_ES_PLUGIN_DIR.'admin/build/index.js')) {
            add_action('admin_notices', function(){
                echo '<div class="notice notice-warning"><p>EFBC Event Suite admin app not built. Run <code>npm run build</code> in plugin/admin.</p></div>';
            });
        }
    }
}
