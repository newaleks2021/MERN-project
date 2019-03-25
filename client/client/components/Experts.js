import React from 'react';
import { withRouter } from 'react-router-dom';
import { withStore } from '../store';

class Experts extends React.Component {
    constructor(props) {
        super(props);
        this.toggle = this.toggle.bind(this);
    }

    toggle(prop, value) {
        const { expert_filter, dispatch } = this.props;
        const array = expert_filter[prop] || [];
        const index = array.indexOf(value);
        if(index > -1) array.splice(index, 1);
        else array.push(value);
        dispatch({ expert_filter: { ...expert_filter, [prop]: array } });
    }

    render(){
        const { history, stakeholders, regions, issues, expert_filter, dispatch, mobile_menu } = this.props;
        const list = stakeholders ? stakeholders.reduce((memo, stakeholder, index) => {
            if(!stakeholder.expertise) return memo;
            if(expert_filter.search &&
               `${stakeholder.full_name} ${stakeholder.function || ''}`
                  .toLowerCase()
                  .indexOf(expert_filter.search.toLowerCase()) === -1
            ) return memo;
            if(expert_filter.region.length && !expert_filter.region.find(
                region => stakeholder.regions && stakeholder.regions.indexOf(region) > -1
            )) return memo;
            if(expert_filter.issue.length && !expert_filter.issue.find(
                region => stakeholder.issues && stakeholder.issues.indexOf(region) > -1
            )) return memo;
            memo.push(
                <div key={index} className="expert-card" onClick={()=>history.push(`/expert/${stakeholder.id}`)}>
                    <div className="image" style={{ backgroundImage: `url(${ stakeholder.avatar || '/placeholder-avatar.svg' })` }} /><div className="info">
                        <span className="note">{ stakeholder.full_name || '' }</span><br />
                        <span className="note function">{ stakeholder.function || '' }</span>
                        { stakeholder.location ? <span className="note location"><i></i>{ stakeholder.location }</span> : null }
                        { stakeholder.regions ? <span className="note regions"><i></i>{ stakeholder.regions }</span> : null }
                        { stakeholder.issues ? <span className="note issues"><i></i>{ stakeholder.issues }</span> : null }
                    </div>
                </div>
            );
            return memo;
        }, []) : [];

        return [
            <nav key="top" className="top-nav experts-nav">
                <h2>Experts</h2>
                <label><input onChange={()=>console.log('favourite-only')} type="checkbox" /> My favourite experts</label>
            </nav>,
            <div key="container" className="experts-container">
                <div className={ mobile_menu ? 'public-filters toggled' : 'public-filters' }>
                    
                    <button className="standard small rounded icon controls" onClick={() => dispatch({ mobile_menu: !mobile_menu })}>Filter Experts</button>

                    <div className="search">

                        <span className="note">Search Expert</span>

                        <input onChange={e => dispatch({ expert_filter: { ...expert_filter, search: e.target.value } })} value={expert_filter.search} type="text" placeholder="by name or function"/>
                    
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

                <div className="experts" data-public="true">

                    <label className="length"><small>{list.length}</small><span>Results</span></label>

                    { list }

                </div>
            </div>];
        }
    }

    export default withRouter(withStore(Experts));
    