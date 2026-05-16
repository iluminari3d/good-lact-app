<?php
/**
 * Template Name: GoodLact App Template
 *
 * Questo template è progettato per visualizzare l'app GoodLact a schermo intero,
 * rimuovendo il padding standard per permettere all'iframe di occupare tutto lo spazio.
 *
 * @package GoodLact_Theme
 */

get_header();
?>

<main id="main" class="site-main">
    <?php
    while ( have_posts() ) :
        the_post();
        ?>
        <article id="post-<?php the_ID(); ?>" <?php post_class(); ?>>
            <div class="entry-content">
                <?php
                // Il contenuto di questa pagina dovrebbe essere l'iframe
                // che punta alla tua app su Vercel.
                // Esempio: <iframe src="https://tua-app.vercel.app" style="width:100%; height:100vh; border:0;"></iframe>
                the_content();
                ?>
            </div><!-- .entry-content -->
        </article><!-- #post-<?php the_ID(); ?> -->
    <?php endwhile; // End of the loop. ?>
</main><!-- #main -->

<?php
get_footer();
