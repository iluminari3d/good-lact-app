<?php
/**
 * GoodLact Theme Functions and Definitions
 *
 * @link https://developer.wordpress.org/themes/basics/theme-functions/
 *
 * @package GoodLact_Theme
 */

if ( ! function_exists( 'goodlact_theme_setup' ) ) :
    /**
     * Sets up theme defaults and registers support for various WordPress features.
     */
    function goodlact_theme_setup() {
        // Make theme available for translation.
        load_theme_textdomain( 'goodlact-theme', get_template_directory() . '/languages' );

        // Add default posts and comments RSS feed links to head.
        add_theme_support( 'automatic-feed-links' );

        // Let WordPress manage the document title.
        add_theme_support( 'title-tag' );

        // Enable support for Post Thumbnails on posts and pages.
        add_theme_support( 'post-thumbnails' );

        // This theme uses wp_nav_menu() in one location.
        register_nav_menus(
            array(
                'header-menu' => esc_html__( 'Header Menu', 'goodlact-theme' ),
            )
        );

        // Switch default core markup for search form, comment form, and comments
        // to output valid HTML5.
        add_theme_support(
            'html5',
            array(
                'search-form',
                'comment-form',
                'comment-list',
                'gallery',
                'caption',
                'style',
                'script',
            )
        );

        // Set up the WordPress core custom background feature.
        add_theme_support( 'custom-background', array( 'default-color' => 'f8fafc' ) );

        // Add theme support for selective refresh for widgets.
        add_theme_support( 'customize-selective-refresh-widgets' );

        /**
         * Add support for core custom logo.
         *
         * @link https://codex.wordpress.org/Theme_Logo
         */
        add_theme_support(
            'custom-logo',
            array(
                'height'      => 82, // Corrisponde a h-[5.2rem]
                'width'       => 82,
                'flex-width'  => true,
                'flex-height' => true,
            )
        );
    }
endif;
add_action( 'after_setup_theme', 'goodlact_theme_setup' );

/**
 * Enqueue scripts and styles.
 */
function goodlact_theme_scripts() {
    // Non è necessario includere style.css se usiamo solo Tailwind,
    // ma lo lasciamo per buona pratica.
    wp_enqueue_style( 'goodlact-theme-style', get_stylesheet_uri(), array(), '1.0' );
}
add_action( 'wp_enqueue_scripts', 'goodlact_theme_scripts' );

?>
