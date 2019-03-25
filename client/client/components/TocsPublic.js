import React, { Component, Fragment } from 'react';
// import classNames from 'classnames';
import { withRouter } from 'react-router-dom';
import { withStore } from '../store';

class TocsPublic extends Component {

    constructor(props) {
        super(props);
        this.toggle_filters = this.toggle_filters.bind(this);
        this.toggle = this.toggle.bind(this); 
        this.favourite_toc = this.favourite_toc.bind(this); 
    }

    toggle_filters() {
        this.setState({ mobile_filters: !this.state.mobile_filters });
    }

    toggle(prop, value) {
        const { toc_filter, dispatch } = this.props;
        const array = toc_filter[prop] || [];
        const index = array.indexOf(value);
        if(index > -1) array.splice(index, 1);
        else array.push(value);
        dispatch({ toc_filter: { ...toc_filter, [prop]: array } });
    }

    favourite_toc(e, uuid) {

        e.stopPropagation();

        const { IP, request, dispatch, notifications, user, toggleString } = this.props;

        const newUser = {
            ...user,
            favourite_tocs: toggleString(user.favourite_tocs || '', uuid)
        };

        delete newUser.activated_at;

        delete newUser.activation_sent_at;

        delete newUser.created_at;

        console.log(newUser);

        request({ 
            url: `${IP}/edit_stakeholder`,
            method: 'post', 
            data: newUser
        }, (err, res) => {
            if(err) return console.log('?');

            dispatch({
                notifications: [...notifications, { status: 'success', message: 'ToC favourited', icon: 'notify-success' }]
            });

        });

    }

    render(){
        const { history, regions, issues, tocs, toc_filter, dispatch, user, mobile_menu } = this.props;
        const list = tocs ? tocs.reduce((memo, toc, index) => {
            if(!toc.visibility || toc.deactivated_at) return memo;
            if(toc_filter.search &&
               `${toc.name} ${toc.function || ''}`
                  .toLowerCase()
                  .indexOf(toc_filter.search.toLowerCase()) === -1
            ) return memo;
            if(toc_filter.region.length && !toc_filter.region.find(
                region => toc.regions && toc.regions.indexOf(region) > -1
            )) return memo;
            if(toc_filter.issue.length && !toc_filter.issue.find(
                region => toc.issues && toc.issues.indexOf(region) > -1
            )) return memo;
            memo.push(
                <Fragment key={index}>
                    <div className="public-toc">

                        <button toc={toc.uuid} className="favorite" style={{
                            backgroundImage: (user.favourite_tocs || '').indexOf(toc.uuid) > -1 ? `url(/icon-starfilled.svg)` : `url(/icon-star.svg`
                        }} onClick={e => this.favourite_toc(e, toc.uuid) }></button>

                        <div onClick={()=> { dispatch({ focusToc: toc }); history.push(`/public-toc/${toc.id}`) } } className="image" style={{ backgroundImage: `url(${ toc.avatar || '/placeholder-toc.svg' })` }}></div>				

                        <div className="content"  onClick={()=> { dispatch({ focusToc: toc }); history.push(`/public-toc/${toc.id}`)} }>

                            <h3>{ toc.name }</h3>

                            <div>

                                { toc.size_revenue ? [<i key="icon-revenue" className="icon revenue"></i>,<span key="span-revenue">{ toc.size_revenue }</span>] : '' }

                                { toc.regions ? [<i key="toc-location" className="icon location"></i>,
                                <div key="toc-location-checkbox" className="checkbox">
                                    {/* <label>
                                        <input onChange={()=>this.toggle('region', region)} type="checkbox" />
                                        {region}
                                    </label> */}
                                </div>] : '' }
                                <div className="categories">
                                    {
                                        // toc.categories.map(function(id) {

                                        //     return `
                                        //             <label data-category="${ id }">${ core.data.categories[id].name}</label>
                                        //             `;

                                        // }).join('')
                                    }
                                </div>

                            </div>
                            <p>{ toc.about }</p>
                        </div>

                    </div>
                </Fragment>
            );
            return memo;
    }, []) : []; 

    return [
            <nav key="top" className="top-nav public-tocs">
                <h2>Public ToCs</h2>
            </nav>,

            <div key="container" className="public-tocs-container">

                <label className="length"><small>{list.length}</small><span>Results</span></label>

                <div className={ mobile_menu ? 'public-filters toggled' : 'public-filters' } id="public-filters">

                    <button className="standard small rounded icon controls" onClick={() => dispatch({ mobile_menu: !mobile_menu })}>Filter ToCs</button>

                    <div className="search">

                        <span className="note">Search by name or keyword</span>

                        <input onChange={e => dispatch({ toc_filter: { ...toc_filter, search: e.target.value } })} value={toc_filter.search} type="text" />

                    </div>
                    
                    <h2>Additional options</h2>

                    <div className="filter">

                        <h3>Issues Areas</h3>

                        <div>
                            {issues.map(issue =>
                                <div key={issue} className="checkbox">
                                    <label>
                                        <input onChange={()=>this.toggle('issue', issue)} type="checkbox" />
                                        {issue}
                                    </label>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="filter regions">

                        <h3>Regions</h3>

                        <div>
                            {regions.map(region =>
                                <div key={region} className="checkbox">
                                    <label>
                                        <input onChange={()=>this.toggle('region', region)} type="checkbox" />
                                        {region}
                                    </label>
                                </div>
                            )}
                        </div>

                    </div>

                </div>     

                <div className="public-tocs-list"> {list} </div>
                
            </div>
        ];
    }

}
        
export default withRouter(withStore(TocsPublic));