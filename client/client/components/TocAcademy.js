import React from 'react';
import { withRouter } from 'react-router-dom';
import { withStore } from '../store';
import Select from 'react-select';

class TocAcademy extends React.Component {
    constructor(props) {
        super(props);
        this.toggle = this.toggle.bind(this);
        this.findStakeholder = this.findStakeholder.bind(this);
        this.ConvertToURL = this.ConvertToURL.bind(this);
    }

    componentWillMount() {

        const { IP, request, dispatch } = this.props;

        request({ 
            url: `${IP}/posts`,
            method: 'get', 
            data: {}
        }, (err, res) => {
            if(err) return console.log(err);
            const posts = res.posts;
            if(!posts.length) return;
            if(posts) dispatch({ posts });
        });
    }

    toggle(e, cat) {

        const { dispatch, toggled_academy } = this.props;

        if(toggled_academy) return dispatch({ toggled_academy: false });
        
        dispatch({ toggled_academy: cat });

    }

    findStakeholder(id, property) {
        const { stakeholders } = this.props;
        const s = stakeholders.find((s) => { return s.id === id; });
        if(s) return s[property];
        return false;
    }

    ConvertToURL(c) {
        const url = c.replace(/\s+/g, '-').toLowerCase();
        return url;
    }

    render(){
        const { posts, stakeholders, organisations, toggled_academy, academy_filter, dispatch, history } = this.props;

        let list = {};

        if(!posts || !stakeholders || !organisations) return null;

        posts.map((post, index) => {
            
            if(!post.id) return null;

            const cat = post.acf.short_category ? post.acf.short_category : 'Other';

            list[cat] = list[cat] || [];

            return list[cat].push(
            <div className="post" key={ `post-${index}` } onClick={() => history.push(`/posts/${post.id}`) }>
                <div className="image">F</div>
                <small>{ this.findStakeholder(post.author, 'full_name') || '?' }</small><br />
                <span>{ this.findStakeholder(post.author, 'organisation') || '?' }</span><br />
                <p>{ post.title.rendered || '' }</p>
            </div>);

        });

        console.log('LIST', list);

        return (<div>
            <nav key="top" className="top-nav academy-nav">
                <h2>ToC Academy</h2>
                <div className="academy-filters">
                    <Select
                        placeholder={ academy_filter.language }
                        onChange={selected => { dispatch({ academy_filter: { ...academy_filter, language: selected.value } } ) } }
                        options={ [{ value: 'English', label: 'English'}] }
                    />
                    <Select
                        placeholder={ academy_filter.source }
                        onChange={selected => { dispatch({ academy_filter: { ...academy_filter, source: selected.value } } ) } }
                        options={ [{ value: 'source', label: 'source'}] }
                    />
                </div>
                <div className="search">

                    <span className="note">Search Posts</span><br/>

                    <input onChange={e => dispatch({ academy_filter: { ...academy_filter, search: e.target.value } })} value={academy_filter.search} type="text" />

                </div>
            </nav>
            <div key="container" className="academy-container">
                {
                    Object.keys(list).map((topic, index) => 
                    <div className={ toggled_academy === topic ? 'tile-container toggled' : 'tile-container' } key={`tile-${index}`}>
                        <div className="tile">
                            <h3>{topic}</h3>
                            <a className="show-more" onClick={(e) => history.push(`/topics/${this.ConvertToURL(topic)}`) }>Show more</a>
                            {
                                list[topic].map((p) => {
                                    return p;
                                })
                            }
                        </div>
                    </div>)
                }
            </div>
        </div>);
    }
}

export default withRouter(withStore(TocAcademy));