import React, { Component } from 'react';
// import classNames from 'classNamenames';
import { withRouter } from 'react-router-dom';
import { withStore } from '../store';

class TocPublic extends Component {

    // constructor(props) {
    //     super(props);
    //     // this.favourite_toc = this.favourite_toc.bind(this); 
    // }

    componentDidMount() {

        const { match, dispatch, history, tocs, focusToc } = this.props;
        if(!match.params.id) return history.push('/public-tocs');

        if(!focusToc) {

            const toc = tocs.find((t) => String(t.id) === String(match.params.id));

            if(toc) dispatch({ focusToc: toc });
            console.log(toc);
            
        }

    }

    render() {

        const { focusToc, history } = this.props;

        if(!focusToc) return '';

        return <div>
            <nav key="nav" className="top-nav">

                <a className="main" data-page="public-tocs" data-id="" data-click="router">Public ToCs</a>
                <span>> ToC </span>
                <span className="current" data-load="toc.load_toc_name">&nbsp;{ focusToc.name }</span>

            </nav>

            <div key="detail" className="public-toc-detail">

                <div className="content">

                    <h1>{ focusToc.name }</h1>

                    <div className="rows" data-rows="2">

                        <div className="row">

                            <div className="image" style={{ backgroundImage: `url(${focusToc.avatar || '/placeholder-toc.svg'})` }}></div>

                            <span className="note">Users of this ToC</span>
                            <div className="users"></div>

                        </div>
                        
                        <div className="row">
                    
                            <label className="location"></label><small>Region:</small><span>South America</span><br/>
                            <label className="location"></label><small>Size revenue:</small><span>€1 million total revenues</span><br/>

                            <span className="note">About this ToC</span>
                            <p>{ focusToc.about }</p>

                            <button className="standard small bend">Open this ToC</button>
                            <button className="standard small bend">Join this ToC</button>
                        </div>

                    </div>

                    <div className="nav-buttons">

                        <button className="standard icon back" onClick={() => history.push(`/public-tocs`) }> Return Public ToCs</button>

                    </div>

                </div>
                
            </div>
        </div>;
    }

}

export default withRouter(withStore(TocPublic));