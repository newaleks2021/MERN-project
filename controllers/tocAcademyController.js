const {
    mapPostsByTopic,
    getSinglePost,
    getSinglePostById,
    getTopicByUuid,
    getTopicByPost,
    searchInPosts,
    getAllLanguages,
    filterTopicsByLanguage,
    filterTopicByLanguage,
    filterTopicByAcceptedForPublication,
    sortTopicsByFixedTopicsOrder,
    sortTopicsBySticky,
    sortTopicsByPublicationDate,
    sortEventsByDate,
    filterTopicsByAcceptedForPublication,
    filterPostsByAcceptedForPublication,
    sortPostsByPublicationDate,
    filterByTocAcademyCategory
} = require('../services/tocAcademyContentService');

// Renders the ToC Academy page
const showTocAcademy = async (req, res) => {
    let byTopics;
    let languages;
    let latestPosts;
    let currentLanguage;
    let events;
    let notYetApproved;

    if(req.posts && req.byTopics)
    {
        const posts = filterByTocAcademyCategory(req.posts);
        languages = getAllLanguages(posts);
        byTopics = req.byTopics;

        if(req.query.language && languages.includes(req.query.language)) {
            byTopics = filterTopicsByLanguage(req.query.language, byTopics);
        }

        events = [];
        if('Events' in byTopics && byTopics['Events'].posts)
        {
            events = byTopics['Events'].posts;
        }

        byTopics["Latest Posts"] = {
            name: "Latest Posts",
            uuid: null,
            posts: sortPostsByPublicationDate(filterPostsByAcceptedForPublication(req.posts, true)).slice(0, 5),
            fullTopic: null
        };
    }
    else
    {
        req.posts = [];
        byTopics = {},
        languages = [];
        latestPosts = [];
        currentLanguage = "";
        events = [];
        notYetApproved = [];
    }

    return res.render('toc-academy/index', {
        title: 'ToC Academy',
        byTopics: sortTopicsByFixedTopicsOrder(
            sortTopicsBySticky(
                sortTopicsByPublicationDate(
                    filterTopicsByAcceptedForPublication(byTopics, true)
                )
            )
        ),
        languages,
        currentLanguage: req.query.language,
        latestPosts: sortPostsByPublicationDate(filterPostsByAcceptedForPublication(req.posts, true)).slice(0, 5),
        notYetApproved: filterPostsByAcceptedForPublication(req.posts, false).slice(0, 5),
        events: filterPostsByAcceptedForPublication(events, true)
    });
};


// Renders the not-yet-approved posts for super admins
const showNotYetApproved = (req, res) => {
    if(!req.session.user || !req.session.user.isAdmin) {
        req.flash('error', 'No topic found');
        return res.redirect('back');
    }

    const posts = filterByTocAcademyCategory(req.posts);
    const languages = getAllLanguages(req.posts);
    const filtered = filterPostsByAcceptedForPublication(posts, false);

    const topic = {
        name: "Not Yet Approved",
        uuid: "nya",
        fullTopic: null,
        posts: filtered,
    };

    return res.render('toc-academy/topic', {
        title: `Topic: ${topic.name}`,
        topic,
        languages,
        currentLanguage: req.query.language
    });
};


// Renders page with all posts for a specific topic
const showTopic = (req, res) => {
    let topic = Object.assign(...getTopicByUuid(
        req.byTopics,
        req.params.uuid
    ));

    const languages = getAllLanguages(req.posts);

    if(!topic) {
        req.flash('error', 'No topic found');
        return res.redirect('back');
    }

    if(req.query.language && languages.includes(req.query.language)) {
        topic = filterTopicByLanguage(req.query.language, topic);
    }

    topic = filterTopicByAcceptedForPublication(topic, true);

    return res.render('toc-academy/topic', {
        title: `Topic: ${topic.name}`,
        topic,
        languages,
        currentLanguage: req.query.language
    });
};


// TODO: What is this method for...? How is it used...?
const showJsonPost = (req, res) => {
    const post = getSinglePostById(req.posts, parseInt(req.params.id));
    return res.json(post);

    // I've disabled the IP whitelist, seeing as we'll be loading this endpoint from the client side.

    // const whitelist = ["::1", "::ffff:127.0.0.1", "127.0.0.1", "217.195.114.107", "84.53.85.154"];
    // if(whitelist.indexOf(req.connection.remoteAddress) >= 0)
    // {
    //     res.setHeader('Content-Type', 'application/json');
    //
    //     return res.status(200).send(JSON.stringify(post));
    // }
    // else
    // {
    //     res.status(403).send(JSON.stringify({ status: "ERROR", error: "Forbidden (" + req.connection.remoteAddress + ")" }));
    // }
};


// Render an individual post
const showPost = (req, res) => {
    const post = getSinglePost(req.posts, req.params.slug);

    if(!post) {
        req.flash('error', req.__('flashes.toc-academy.post-not-found'));
        return res.redirect('/toc-academy/');
    }

    return res.render('toc-academy/post', {
        title: 'Single post',
        user: req.session.user,
        post,
        topic: Object.assign(
            ...getTopicByPost(req.byTopics, post.id)
        )
    });
};


// TODO: What is it for...? It is to search within the ToC Academy posts...? Is it to render search results...?
const searchIndex = (req, res) => res.render('toc-academy/search', {
    title: `Search results for ${req.query.query ? req.query.query : ''}`,
    results: searchInPosts(req.posts, req.query.query ? req.query.query : ''),
    query: req.query.query ? req.query.query : ''
});


// TODO: What is it for? Is it the same as previous method but now only for posts within a specific topic...?
const searchTopic = (req, res) => {
    const topic = Object.assign(...getTopicByUuid(
        req.byTopics,
        req.params.uuid
    ));

    const results = searchInPosts(topic.posts, req.query.query);

    return res.render('toc-academy/search', {
        title: `Search results for ${req.query.query} in ${topic.name}`,
        query: req.query.query,
        results
    });
};


module.exports = {
    showTocAcademy,
    showPost,
    showJsonPost,
    showTopic,
    showNotYetApproved,
    searchIndex,
    searchTopic
};
