import React from 'react';
import { withRouter } from 'react-router-dom';
import { withStore } from '../store';

class TocAcademyTopic extends React.Component {
    constructor(props) {
        super(props);
        this.findStakeholder = this.findStakeholder.bind(this);
        this.ConvertToURL = this.ConvertToURL.bind(this);
    }

    componentDidMount() {

        const { 
            IP,
            match,
            dispatch,
            posts,
            request
        } = this.props;
        console.log('will mount', posts, match.params.post);

        request({ 
            url: `${IP}/posts`,
            method: 'get', 
            data: {}
        }, (err, res) => {
            if(err) return console.log(err);
            const posts = res.posts;
            if(!posts.length) return;
            dispatch({ posts });
        });

    }

    ConvertToURL(c) {
        const url = c.replace(/\s+/g, '-').toLowerCase();
        return url;
    }


    findStakeholder(id, property) {
        const { stakeholders } = this.props;
        const s = stakeholders.find((s) => { return s.id === id; });
        if(s) return s[property];
        return false;
    }

    render(){
        const { 
            match,
            posts,
            history
        } = this.props;

        return (
        <div>

            <nav key="nav" className="top-nav">

                <a className="main" data-page="public-tocs" data-id="" data-click="router">ToC Academy</a>
                <span>> Topic </span>
                <span className="current" data-load="toc.load_toc_name">&nbsp;{ match.params.topic }</span>

            </nav>

            <div>

                {posts.map((p) => {
                    return <div className="topic">

                    <div onClick={()=> history.push(`/posts/${p.id}`) } className="image" style={{ backgroundImage: `url(${ '/placeholder-toc.svg' })` }}></div>				

                    <div className="content"  onClick={()=> history.push(`/posts/${p.id}`) }>
                        <p>{ p.title.rendered }</p>
                    </div>

                </div>;
                })}

            </div>
        </div>
        );
    }
}

export default withRouter(withStore(TocAcademyTopic));