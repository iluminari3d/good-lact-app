<?php
/**
 * The main template file
 *
 * @package GoodLact_Theme
 */

get_header();
?>

<main id="main" class="site-main container mx-auto px-6 py-8">

    <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div class="md:col-span-2">
            <?php
            if ( have_posts() ) :
                while ( have_posts() ) :
                    the_post();
                    ?>
                    <article id="post-<?php the_ID(); ?>" <?php post_class('bg-white p-6 rounded-lg shadow-md mb-8'); ?>>
                        <header class="entry-header mb-4">
                            <?php the_title( sprintf( '<h2 class="entry-title text-2xl font-bold text-[#2c7bb6] hover:text-[#73c0ec]"><a href="%s" rel="bookmark">', esc_url( get_permalink() ) ), '</a></h2>' ); ?>
                        </header>

                        <?php if ( has_post_thumbnail() ) : ?>
                            <div class="post-thumbnail mb-4">
                                <?php the_post_thumbnail('large', ['class' => 'rounded-lg w-full h-auto']); ?>
                            </div>
                        <?php endif; ?>

                        <div class="entry-content text-gray-700">
                            <?php the_excerpt(); ?>
                        </div>
                    </article>
                    <?php
                endwhile;

                the_posts_pagination();

            else :
                ?>
                <p><?php esc_html_e( 'Nessun articolo trovato.', 'goodlact-theme' ); ?></p>
                <?php
            endif;
            ?>
        </div>
        <div class="md:col-span-1">
            <?php get_sidebar(); ?>
        </div>
    </div>

</main><!-- #main -->

<?php
get_footer();
