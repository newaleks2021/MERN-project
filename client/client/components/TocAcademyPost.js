import React from 'react';
import { withRouter } from 'react-router-dom';
import { withStore } from '../store';

class TocAcademyPost extends React.Component {
    constructor(props) {
        super(props);
        this.toggle = this.toggle.bind(this);
        this.findStakeholder = this.findStakeholder.bind(this);
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
            const post = posts.find(p=>String(p.id)===match.params.post);
            if(post) dispatch({ focusPost: post });
        });

    }

    toggle() {

    }

    findStakeholder(id, property) {
        const { stakeholders } = this.props;
        const s = stakeholders.find((s) => { return s.id === id; });
        if(s) return s[property];
        return false;
    }

    render(){
        const { focusPost, history } = this.props;

        if(!focusPost) return null;
console.log('focuspost', focusPost);
        return (
            <div>
                <nav key="nav" className="top-nav">

                    <a className="main" data-page="public-tocs" data-id="" data-click="router">ToC Academy</a>
                    <span>> Post </span>
                    <span className="current" data-load="toc.load_toc_name">&nbsp;{ focusPost.id }</span>

                </nav>

                <div key="detail" className="post-detail">

                    <div className="content">

                        <h1>{ focusPost.id }</h1>

                        <div className="rows" data-rows="2">

                            <div className="row">

                                <div className="image" style={{ backgroundImage: `url(${'/placeholder-toc.svg'})` }}></div>

                            </div>
                            
                            <div className="row">
                                <p>{ focusPost.title.rendered }</p>

                            </div>

                        </div>

                        <div className="nav-buttons">

                            <button className="standard icon back" onClick={() => history.push(`/toc-academy`) }> Return ToC Academy</button>

                        </div>

                    </div>
                    
                </div>
            </div>

        );
    }
}

export default withRouter(withStore(TocAcademyPost));