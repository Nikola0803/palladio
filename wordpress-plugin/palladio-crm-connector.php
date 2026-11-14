<?php
/**
 * Plugin Name: Palladio CRM Connector
 * Description: Šalje WooCommerce događaje (narudžbe, kupci, forme) na Palladio CRM.
 * Version: 1.0.0
 * Author: Palladio
 */

if ( ! defined( 'ABSPATH' ) ) exit;

// ─── Admin stranica za postavke ───────────────────────────────────────────────

add_action( 'admin_menu', function () {
    add_options_page(
        'Palladio CRM',
        'Palladio CRM',
        'manage_options',
        'palladio-crm',
        'palladio_crm_settings_page'
    );
} );

add_action( 'admin_init', function () {
    register_setting( 'palladio_crm', 'palladio_crm_url' );
    register_setting( 'palladio_crm', 'palladio_crm_api_key' );
} );

function palladio_crm_settings_page() {
    ?>
    <div class="wrap">
        <h1>Palladio CRM Connector</h1>
        <form method="post" action="options.php">
            <?php settings_fields( 'palladio_crm' ); ?>
            <table class="form-table">
                <tr>
                    <th>CRM URL</th>
                    <td>
                        <input type="url" name="palladio_crm_url"
                               value="<?php echo esc_attr( get_option( 'palladio_crm_url', 'https://palladio-crm.vercel.app' ) ); ?>"
                               class="regular-text" placeholder="https://palladio-crm.vercel.app" />
                    </td>
                </tr>
                <tr>
                    <th>API ključ</th>
                    <td>
                        <input type="password" name="palladio_crm_api_key"
                               value="<?php echo esc_attr( get_option( 'palladio_crm_api_key' ) ); ?>"
                               class="regular-text" />
                        <p class="description">Isti ključ koji si unio u CRM → Postavke → WordPress / WooCommerce.</p>
                    </td>
                </tr>
            </table>
            <?php submit_button( 'Sačuvaj' ); ?>
        </form>
    </div>
    <?php
}

// ─── Helper: pošalji event na CRM ─────────────────────────────────────────────

function palladio_crm_send( string $event, array $data ): void {
    $url = get_option( 'palladio_crm_url', '' );
    $key = get_option( 'palladio_crm_api_key', '' );

    if ( ! $url || ! $key ) return;

    wp_remote_post( trailingslashit( $url ) . 'api/webhooks/wordpress', [
        'timeout'     => 10,
        'headers'     => [
            'Content-Type'  => 'application/json',
            'Authorization' => 'Bearer ' . $key,
        ],
        'body'        => wp_json_encode( compact( 'event', 'data' ) ),
        'data_format' => 'body',
    ] );
}

// ─── WooCommerce: promjena statusa narudžbe ───────────────────────────────────

add_action( 'woocommerce_order_status_changed', function ( $order_id, $old_status, $new_status ) {
    $order = wc_get_order( $order_id );
    if ( ! $order ) return;

    $line_items = [];
    foreach ( $order->get_items() as $item ) {
        $line_items[] = [
            'product_id' => $item->get_product_id(),
            'name'       => $item->get_name(),
            'quantity'   => $item->get_quantity(),
        ];
    }

    palladio_crm_send( 'order_status_changed', [
        'order_id'       => $order_id,
        'status'         => $new_status,
        'customer_name'  => $order->get_formatted_billing_full_name(),
        'customer_email' => $order->get_billing_email(),
        'total'          => $order->get_total(),
        'line_items'     => $line_items,
    ] );
}, 10, 3 );

// ─── WooCommerce: novi kupac ──────────────────────────────────────────────────

add_action( 'woocommerce_created_customer', function ( $customer_id ) {
    $user = get_userdata( $customer_id );
    if ( ! $user ) return;

    palladio_crm_send( 'customer_created', [
        'customer_id' => $customer_id,
        'name'        => $user->display_name,
        'email'       => $user->user_email,
    ] );
} );

// ─── Contact Form 7: forma poslana ───────────────────────────────────────────

add_action( 'wpcf7_mail_sent', function ( $contact_form ) {
    $submission = WPCF7_Submission::get_instance();
    if ( ! $submission ) return;

    $posted = $submission->get_posted_data();
    palladio_crm_send( 'contact_form_submitted', [
        'name'    => sanitize_text_field( $posted['your-name'] ?? '' ),
        'email'   => sanitize_email( $posted['your-email'] ?? '' ),
        'phone'   => sanitize_text_field( $posted['your-phone'] ?? '' ),
        'message' => sanitize_textarea_field( $posted['your-message'] ?? '' ),
    ] );
} );
