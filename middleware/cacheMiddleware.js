const {fetchAllPosts, mapPostsByTopic, filterByTocAcademyCategory} = require('../services/tocAcademyContentService');
const Post = require('../models/post');

// TODO: What does this method do? Where is it used? Is next line correct?
// Renders specific ToC Academy posts from the Mysql database
const readTocAcademyPosts = async (req, res, next) => {
  let all_posts = await Post.fetchAll().then((posts) => {
    return posts.map((post) => {
      return JSON.parse(post.get('json'));
    });
  });
  req.posts = all_posts;
  req.byTopics = mapPostsByTopic(filterByTocAcademyCategory(all_posts));

  return next();
};

// Takes the JSON blob from the Wordpress site and writes posts to Mysql wordpress_posts table. Used in cron job as well as button for super admin on the ToC Academy page to recache.
const cacheTocAcademyPosts = async (ignore_last_updated = false) => {
  // Check last updated
  const last_updated = await Post.query('orderBy', 'updated_at', 'asc').fetch().then(model => {
    if(!model) {
      return 0;
    }
    return model.get('updated_at');
  });
  const last_updated_time = new Date(last_updated).getTime();
  const current_time = new Date().getTime();

  // Only update if last update was more than 24 hours ago
  if (!ignore_last_updated && !((current_time - last_updated_time) > (1000 * 60 * 60 * 24))){
    return;
  }

  const posts = await fetchAllPosts();

  let incoming_post_ids = posts.map((post) => post.id);

  for (let post_id in posts) {
    let post = posts[post_id];

    // Check if post exists
    const existing_post = await Post.where({wp_id: post.id}).fetch();

    // Add or insert post to database
    if (existing_post) {
      await existing_post.save({'json': JSON.stringify(post)});
    }
    else {
      await Post.forge({
        wp_id: posts[post_id].id,
        json: JSON.stringify(posts[post_id])
      }).save(null, {method: 'insert'});
    }
  }

  // Delete posts not returned from wordpress
  await Post.query().whereNotIn('wp_id',incoming_post_ids).del();

  return;
};

// Processes when super admin submits button on ToC Academy to recache academy posts from Wordpress
recacheTocAcademyPosts = async (req, res, next) => {
  await cacheTocAcademyPosts(true);
  return res.redirect('/toc-academy');
};

module.exports = {
  cacheTocAcademyPosts,
  recacheTocAcademyPosts,
  readTocAcademyPosts
};
