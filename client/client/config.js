export default {
    IP: process.env.REACT_APP_API_URL,
    busy: false,
    isAdmin: false,
    hard_refresh: false,
    show_navigation: true,
    mobile_menu: false,
    minimize_navigation: false,
    toggled_toc_member: false,
    toggled_toc: false,
    toggled_organisation: false,
    toggled_academy: false,
    modal: false,
    tooltip: null,
    popover: null,
    credentials: { email: '', password: '' },
    notifications: [],
    connected: false,

    // @TODO this should be removed. 404's should be displayed when there are no matching routes, not based on checking is path is in this array
    pages: [
        'landing','organisations', 'organisation', 'toc-academy','public-tocs',
        'experts', 'expert', 'support','partnerships', 'contact','plans', 'toc',
        'support-form','pricing','privacy','terms','sign-up','sign-in', 'password-forgot',
        'new-password', 'public-toc', 'success', 'move-toc', 'done', 'posts', 'post', 'topics'
    ],

    // id
    // uuid
    // name
    // about
    // avatar
    // website
    // facebook
    // google_plus
    // instagram
    // linkedin
    // pinterest
    // twitter
    // organisation_id
    // isActivated
    // shouldBeDestroyed
    // deactivated_at
    // created_at
    // updated_at
    // visibility
    // needs_to_sync
    // movement_username
    // movement_hash
    // movement_sent_at

    // short_description
    // size_revenue
    // categories
    // regions
    focusToc: null,

    // id
    // name
    // address
    // country
    // website
    // avatar
    // vat_number
    // hasVatNumber
    // isValidVatNumber
    // plan_id
    // subs_exp_date
    // isActivated
    // activated_at
    // deactivated_at
    // created_at
    // updated_at
    // slug
    // extend_trial
    focusOrganisation: null,

    // id
    // email
    // full_name
    // username
    // function
    // bio
    // expertise
    // avatar
    // organisation
    // phone
    // location
    // website
    // facebook
    // google_plus
    // instagram
    // linkedin
    // pinterest
    // twitter
    // isAdmin
    // isVerified
    // isActivated
    // hasUsedFreeTrial
    // password_hash
    // activation_hash
    // activation_sent_at
    // activated_at
    // deactivated_at
    // reset_hash
    // reset_sent_at
    // new_email
    // login_count
    // last_login_at
    // custom_updated_at
    // created_at
    // updated_at
    focusUser: null,

    // id
    // stakeholder_id
    // toc_id
    // isAdmin
    // isMember
    // isModerator
    // admin_activation_hash
    // admin_activation_sent_at
    // member_activation_hash
    // member_activation_sent_at
    // moderator_activation_hash
    // moderator_activation_sent_at
    // created_at
    // updated_at
    focusTocMember: null,

    // id
    // isAdmin
    // stakeholder_id
    // organisation_id
    // admin_activation_hash
    // admin_activation_sent_at
    // member_activation_hash
    // member_activation_sent_at
    // created_at
    // updated_at
    focusOrganisationMember: null,

    focusPost: null,

    tocs: [],

    posts: [],

    toc_members: [],

    organisations: [],

    organisation_members: [],

    //TODO: This should be loaded from helpers/countriesList.js. 
    countries: [
        'Netherlands',
        'Belgium',
        'Germany'
    ],
    
    //TODO: This should be moved to helpers/regionsList.js. 
    regions: [
        //TODO: Not sure how to write this correctly (you should be able to select Africa as a whole or just part of Africa, that's up to the user)
        'Africa',
            'Eastern Africa',
            'Middle Africa',
            'Northern Africa',
            'Southern Africa',
            'Western Africa',
        'Americas',
            'Latin America and the Caribbean',
            'Caribbean',
            'Central America',
            'South America',
            'Northern America',
        'Asia',
            'Central Asia',
            'Eastern Asia',
            'South-eastern Asia',
            'Southern Asia',
            'Western Asia',
        'Europe',
            'Eastern Europe',
            'Northern Europe',
            'Southern Europe',
            'Western Europe',
        'Oceania',
            'Australia and New Zealand',
            'Melanesia',
            'Micronesia',
            'Polynesia'
    ],
    
// @TODO this should be moved to database.
    issues: [
        'Science and culture',
        'Education',
        'Health',
        'Government',
        'Mobility',
        'Poverty and social exclusion',
        'Sustainable markets',
        'Peace and human rights',
        'Nature and environment',
        'Sustainability and energy',
        'Food',
        'Water',
        'Local community',
        'Social cohesion',
        'Safety',
        'Youth',
        'Elderly and aging',
        'Digital economy',
        'Other'
    ],

// @TODO this should be moved to database. Should probably be called expertise rather than sectors.
    sectors: [
        'Facilitation',
        'Evaluation',
        'Monitoring',
        'Business model development',
        'General consultant'
    ],

    orgSelector: {
        value: '',
        label: '',
        email: '',
    },
    
    expert_filter: {
        search: '',
        region: [],
        issue: [],
    },
    
    toc_filter: {
        search: '',
        region: [],
        issue: [],
    },

    academy_filter: {
        search: '',
        language: 'English',
        source: '',
    },

// @TODO this should be moved to database.
    categories: {

        science_culture: {
            id: 'science_culture',
            key: 'categories.science_culture',
            name: 'Science and culture',
            icon: '/categories-science_culture.svg',
            toc: true
        },

        education: {
            id: 'education',
            key: 'categories.education',
            name: 'Education',
            icon: '/categories-education.svg',
            toc: true
        },

        health: {
            id: 'health',
            key: 'categories.health',
            name: 'Health',
            icon: '/categories-health.svg',
            toc: true
        },

        government: {
            id: 'government',
            key: 'categories.government',
            name: 'Government',
            icon: '/categories-government.svg',
            toc: true
        },

        mobility: {
            id: 'mobility',
            key: 'categories.mobility',
            name: 'Mobility',
            icon: '/categories-government.svg',
            toc: true
        },

        poverty: {
            id: 'poverty',
            key: 'categories.poverty',
            name: 'Poverty and social exclusion',
            icon: '/categories-government.svg',
            toc: true
        },

        sustainable_markets: {
            id: 'sustainable_markets',
            key: 'categories.sustainable_markets',
            name: 'Sustainable markets',
            icon: '/categories-government.svg',
            toc: true
        },

        peace: {
            id: 'peace',
            key: 'categories.peace',
            name: 'Peace and human rights',
            icon: '/categories-government.svg',
            toc: true
        },

        nature: {
            id: 'nature',
            key: 'categories.nature',
            name: 'Nature and environment',
            icon: '/categories-government.svg',
            toc: true
        },

        sustainability_energy: {
            id: 'sustainability_energy',
            key: 'categories.sustainability_energy',
            name: 'Sustainable and energy',
            icon: '/categories-government.svg',
            toc: true
        },

        food: {
            id: 'food',
            key: 'categories.food',
            name: 'Food',
            icon: '/categories-food.svg',
            toc: true
        },

        water: {
            id: 'water',
            key: 'categories.water',
            name: 'Water',
            icon: '/categories-water.svg',
            toc: true
        },

        local: {
            id: 'local',
            key: 'categories.local',
            name: 'Local community',
            icon: '/categories-local.svg',
            toc: true
        },

        social_cohesion: {
            id: 'social_cohesion',
            key: 'categories.social_cohesion',
            name: 'Social cohesion',
            icon: '/categories-social_cohesion.svg',
            toc: true
        },

        safety: {
            id: 'safety',
            key: 'categories.safety',
            name: 'Safety',
            icon: '/categories-safety.svg',
            toc: true
        },

        youth: {
            id: 'youth',
            key: 'categories.youth',
            name: 'Youth',
            icon: '/categories-youth.svg',
            toc: true
        },

        elderly_aging: {
            id: 'elderly_aging',
            key: 'categories.elderly_aging',
            name: 'Elderly aging',
            icon: '/categories-elderly_aging.svg',
            toc: true
        },

        digital_economy: {
            id: 'digital_economy',
            key: 'categories.digital_economy',
            name: 'Digital economy',
            icon: '/categories-digital_economy.svg',
            toc: true
        },

        other: {
            id: 'other',
            key: 'categories.other',
            name: 'Other',
            icon: '/categories-other.svg',
            toc: true
        },

    
    },

// @TODO this should be moved to database.
    partners: [
        {
            name: 'Wageningen University & Research',
            image: '/partner-0.png',
            url: 'http://cdi.wur.nl/english'
        },
        {
            name: 'Woord en Daad',
            image: '/partner-1.png',
            url: 'https://www.woordendaad.nl/english'
        },
        {
            name: 'Tropenbos International',
            image: '/partner-2.png',
            url: 'http://www.tropenbos.org/'
        },
        {
            name: 'MDF Training & Consultancy',
            image: '/partner-3.png',
            url: 'https://mdf.nl/'
        },
        {
            name: 'Impact Centre Erasmus',
            image: '/partner-4.png',
            url: 'https://www.eur.nl/ice/'
        },
        {
            name: 'Partos',
            image: '/partner-5.png',
            url: 'https://www.partos.nl/en/'
        },
        {
            name: 'Netherlands Enterprise Agency',
            image: '/partner-6.png',
            url: 'https://english.rvo.nl/'
        },
        {
            name: 'Hivos',
            image: '/partner-7.gif',
            url: 'https://www.hivos.org/'
        },
        {
            name: 'ICCO Cooperation',
            image: '/partner-8.gif',
            url: 'https://www.icco-cooperation.org/en/'
        },
        {
            name: 'Dorcas Relief & Development',
            image: '/partner-9.gif',
            url: 'https://www.dorcas.org/'
        },
        {
            name: 'IOB: Policy and Operations Evaluation Department',
            image: '/partner-10.jpg',
            url: 'https://english.iob-evaluatie.nl/'
        },
        {
            name: 'NWO-WOTRO Science for Global Development',
            image: '/partner-11.png',
            url: 'https://www.nwo.nl/en/about-nwo/organisation/nwo-domains/wotro'
        }
    ],
    quotes: [
        {
            quote: 'Changeroo is the best application for developing and managing Theories of Change I have seen.',
            author: 'Rick Davies',
            position: 'Monitoring and Evalution Consultant, MandE News'
        },
        {
            quote: 'Changeroo and the ToC Academt have substantially improved our knowledge of Theories of Change. It has set the standard within our organisation and our programs. We are really happy with how Changeroo contributes to the dialogue within the Netherlands Enterprise Agency, and are pleased to continue to be part of it.',
            author: 'Liesbeth Hofs',
            position: 'Netherlands Enterprise Agency'
        },
        {
            quote: 'Impact measurement uses and provides input to your Theory of Change. Changeroo its interactive nature helps move impact measurement to its next level.',
            author: 'Karen Maas',
            position: 'Director, Impact Centre Erasmus'
        }
    ],

};
