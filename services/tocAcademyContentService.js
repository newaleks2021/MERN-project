const fetch = require('node-fetch');
const flattenDeep = require('lodash/flattenDeep');
const uuid = require('uuid');
const compareDesc = require('date-fns/compare_desc');
const slug = require('slug');

/**
 * Fetch all posts from content API (Wordpress site)
 */
const fetchAllPosts = () => {
    return fetch(
        `${process.env.CONTENT_URL}/posts/?per_page=999`
    )
    .then(res => res.json());
};
 
/**
 * Filter posts by category
 * @param {*} posts 
 * @param {*} categoryNumber 
 */
const filterByCategory = (posts, categoryNumber) => {
    posts.filter(post => 
        post.categories.includes(
            parseInt(categoryNumber)
        )
    );
};

/**
 * Filter topic by accepted_for_publication
 * @param {*} posts 
 * @param {*} accepted 
 */
const filterTopicByAcceptedForPublication = (topic, accepted) => {
    topic.posts = topic.posts.filter(post => {
        return (post.acf && post.acf.accepted_for_publication === accepted); 
    });
    return topic;
};

/**
 * Filter topics by accepted_for_publication
 * @param {*} posts 
 * @param {*} accepted 
 */
const filterTopicsByAcceptedForPublication = (topics, accepted) => {
    Object.keys(topics).map(key => {
        topics[key].posts = topics[key].posts.filter(post => {
            return (post.acf && post.acf.accepted_for_publication === accepted);  
        });
    });

    return topics;
};

/**
 * Filter posts by accepted_for_publication
 * @param {*} posts 
 * @param {*} accepted 
 */
const filterPostsByAcceptedForPublication = (posts, accepted) => {
    posts = posts.filter(post => {
        return (post.acf && post.acf.accepted_for_publication === accepted);  
    });

    return posts;
};

/**
 * Filter posts by ToC Academy category
 * @param {*} posts 
 * @param {*} categoryNumber 
 */
const filterByTocAcademyCategory = (
    posts, 
    categoryNumber = process.env.TOC_ACADEMY_CATEGORY_NUMBER
) => filterByCategory(posts, categoryNumber);

/**
 * Map all posts object by topic
 * @param {*} posts 
 */
const mapPostsByTopic = posts => {
    const byTopics = {};
    posts.map((post, i) => {
        // HINT: Spreads object inside array to just an object
        const topic = post.acf.short_categorytopic_title;
        const fullTopic = (post && post.acf && post.acf.general && post.acf.general.topiccategory) ? post.acf.general.topiccategory : null;
        
        if(!byTopics[topic]) {
            byTopics[topic] = {};
            byTopics[topic].posts = [];
            byTopics[topic].uuid = slug(topic, { lower: true });
            byTopics[topic].name = topic;
            byTopics[topic].fullTopic = fullTopic;
        }

        byTopics[topic].posts.push(post);
    });

    return byTopics;
};

/**
 * Return a single post from posts object
 * @param {*} posts 
 * @param {*} id 
 */
const getSinglePost = (posts, slug) => {
    posts.find(post => post.slug === slug);
};

/**
 * Return a single post from posts object
 * @param {*} posts 
 * @param {*} id 
 */
const getSinglePostById = (posts, id) => {
    posts.find(post => post.id === id);
};

//TODO: Abstract to getTopic
/**
 * Return a single topic from byTopics object by uuid
 * @param {*} topics 
 * @param {*} uuid 
 */
const getTopicByUuid = (topics, uuid) => {
    Object.entries(topics).find(entry => 
        topics[entry[0]].uuid === uuid);
};

/**
 * Return a single topic from byTopics object by post
 * @param {*} topics 
 * @param {*} postId 
 */
const getTopicByPost = (topics, postId) => {
    Object.entries(topics).find(entry => 
        topics[entry[0]].posts
            .find(post => post.id === postId)
    );
};

/**
 * Search through post title and content on a per query basis
 * @param {*} posts 
 * @param {*} query 
 */

const searchInPosts = (posts, query) => {
    posts.filter(post => {
        post.inTitle = post.title.rendered.toLowerCase().indexOf(query.toLowerCase()) >= 0;
        post.inText = (post && post.acf && post.acf.the_resource && post.acf.the_resource.full_post_text) ? (post.acf.the_resource.full_post_text.toLowerCase().indexOf(query.toLowerCase()) >= 0) : false;
        
        return post.inTitle || post.inText;
    });
};

/**
 * 
 * @param {*
 * } posts 
 */
const getAllLanguages = (posts) => {
    const allLanguages = new Set();

    posts.map(post => {
        const language = (post && post.acf && post.acf.the_resource) ? post.acf.the_resource[0].language : null;

        if(language)
        {
            language.map(lang => {
                allLanguages.add(lang);
            });
        }
    });

    return Array.from(allLanguages);
};

/**
 * 
 * @param {*} queryLang 
 * @param {*} topics 
 */
const filterTopicsByLanguage = (queryLang, topics) => {
    Object.keys(topics).map(key => {
        topics[key].posts = topics[key].posts.filter(post => {
            const {language} = Object.assign(...post.acf.the_resource);
            return language.includes(queryLang);
        });
    });

    return topics;
};

const filterTopicByLanguage = (queryLang, topic) => {
    topic.posts = topic.posts.filter(post => {
        const {language} = Object.assign(...post.acf.the_resource);
        return language.includes(queryLang);
    });
    return topic;
};

/**
 * 
 * @param {*} topics 
 */
const sortTopicsByPublicationDate = (topics) => {
    Object.keys(topics).map(key => {
        if(!key === 'Events') {
            topics[key].posts = topics[key].posts.sort((a, b) => {      
                const dateA = new Date(a.acf.general[0].details_resource[0].publication_date);
                const dateB = new Date(b.acf.general[0].details_resource[0].publication_date);
                
                const isValidDateA = 
                    Object.prototype.toString.call(dateA) === "[object Date]" && isNaN(dateA.getTime());
                const isValidDateB = 
                    Object.prototype.toString.call(dateB) === "[object Date]" && isNaN(dateB.getTime());
                
                if(isValidDateA && isValidDateB && dateB > dateA) return -1;
                else if (isValidDateA && isValidDateB && dateB < dateA) return 0;
                else return 1;
            });
        }
    });

    return topics;
};

const sortPostsByPublicationDate = (posts) => {
    let sortedPosts = posts.filter(post => {
        return (post.acf && post.acf.short_categorytopic_title !== "Events");
    });

    sortedPosts = sortedPosts.sort((a, b) => {
        const dateA = new Date(a.date.split("T").join(" "));
        const dateB = new Date(b.date.split("T").join(" "));
        
        const isValidDateA = 
            Object.prototype.toString.call(dateA) === "[object Date]" && isNaN(dateA.getTime());
        const isValidDateB = 
            Object.prototype.toString.call(dateB) === "[object Date]" && isNaN(dateB.getTime());
        
        if(isValidDateA && isValidDateB && dateB > dateA) return -1;
        else if (isValidDateA && isValidDateB && dateB < dateA) return 0;
        else return 1;
    });

    return sortedPosts;
};

const sortEventsByDate = (topics) => {
    Object.keys(topics).map(key => {
        if(!key === 'Events') {
            topics[key].posts = topics[key].posts.sort((a, b) => {      
                const dateA = new Date(a.acf.general[0].details_events[0].when);
                const dateB = new Date(b.acf.general[0].details_events[0].when);
                
                const isValidDateA = 
                    Object.prototype.toString.call(dateA) === "[object Date]" && isNaN(dateA.getTime());
                const isValidDateB = 
                    Object.prototype.toString.call(dateB) === "[object Date]" && isNaN(dateB.getTime());
                
                if(isValidDateA && isValidDateB && dateB > dateA) return -1;
                else if (isValidDateA && isValidDateB && dateB < dateA) return 0;
                else return 1;
            });
        }
    });

    return topics;
};

/**
 * 
 * @param {*} topics 
 */
const sortTopicsBySticky = (topics) => {
    Object.keys(topics).map(key => {
        topics[key].posts = topics[key].posts.sort((a, b) => 
            b.acf.sticky_key_resource - a.acf.sticky_key_resource
        );
    });

    return topics;
};

const sortTopicsByFixedTopicsOrder = (topics) => {
    
    // Missing: Changeroo guiding content

    const fixedOrder = ["latest posts", //
                        "changeroo: tutorials", //
                        "toc general", //
                        "manuals and development process", //
                        "toc thinking", //
                        "assumptions", //
                        "case studies", //
                        "toc process facilitation", //
                        "narrative and story telling",
                        "planning, monitoring & evaluation", //
                        "learning", //
                        "measurement", // 
                        "toc quality", //
                        "tocs in relationship to other topics", //
                        "logic models", //
                        "other",
                        "changeroo: guiding content", //
    ]; 


    const topicKeys = Object.keys(topics);
    const topicLookup = {};
    for(var i = 0; i < topicKeys.length; i++)
    {
        const topic = topicKeys[i];

        topicLookup[topic.toLowerCase()] = topic;
    }

    const sortedTopics = [];
    for(order of fixedOrder)
    {
        if(order in topicLookup)
        {
            sortedTopics[topicLookup[order]] = topics[topicLookup[order]];
        }
    }

    for(let lookup in topicLookup)
    {
        if(!(topicLookup[lookup] in sortedTopics))
        {
            sortedTopics[topicLookup[lookup]] = topics[topicLookup[lookup]];
        }
    }

    return sortedTopics;
};

module.exports = {
    fetchAllPosts,
    mapPostsByTopic,
    getSinglePost,
    getSinglePostById,
    getTopicByUuid,
    getTopicByPost,
    searchInPosts,
    getAllLanguages,
    filterTopicsByLanguage,
    filterTopicByAcceptedForPublication,
    filterTopicByLanguage,
    filterTopicsByAcceptedForPublication,
    sortTopicsByFixedTopicsOrder,
    sortTopicsByPublicationDate,
    sortTopicsBySticky,
    sortEventsByDate,
    sortPostsByPublicationDate,
    filterPostsByAcceptedForPublication,
    filterByTocAcademyCategory
};
