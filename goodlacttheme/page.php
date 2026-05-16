<?php
/**
 * The template for displaying all pages
 *
 * @package GoodLact_Theme
 */

get_header();
?>

<main id="main" class="site-main container mx-auto px-6 py-12">

    <?php
    while ( have_posts() ) :
        the_post();
        ?>
        <article id="post-<?php the_ID(); ?>" <?php post_class('bg-white p-8 rounded-lg shadow-md'); ?>>
            <header class="entry-header mb-6">
                <?php the_title( '<h1 class="entry-title text-3xl font-bold text-[#2c7bb6]">', '</h1>' ); ?>
            </header>

            <div class="entry-content prose lg:prose-xl max-w-none">
                <?php
                the_content();

                wp_link_pages(
                    array(
                        'before' => '<div class="page-links">' . esc_html__( 'Pages:', 'goodlact-theme' ),
                        'after'  => '</div>',
                    )
                );
                ?>
            </div>
        </article>
    <?php endwhile; ?>

</main><!-- #main -->

<?php
get_footer();
