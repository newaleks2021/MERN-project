import React, { Component } from 'react';
import classNames from 'classnames';
import { withRouter } from 'react-router-dom';
import { withStore } from '../store';

class Landing extends Component {

    constructor(props) {
        super(props);
        this.copy = this.copy.bind(this);
        this.archive = this.archive.bind(this);
        this.delete = this.delete.bind(this);
        this.state = { filter: 'active', search: '' };
    }

    componentWillUnmount() {
        const { dispatch } = this.props;
        dispatch({ toggled_toc: false });
    }

    copy(id) {

        const { IP, request, dispatch, notifications } = this.props;

        request({ 
            url: `${IP}/copy_toc`,
            method: 'post', 
            data: { uuid: id, keep_permissions: true }
        }, (err, res) => {
            if(err) return console.log('?');

            dispatch({
                notifications: [...notifications, { status: 'success', message: 'ToC copied', icon: 'notify-success' }]
            });

        });

    }

    archive(id) {
 
        const { IP, request, dispatch, notifications } = this.props;

        request({ 
            url: `${IP}/deactivate_toc`,
            method: 'post', 
            data: { uuid: id }
        }, (err, res) => {
            if(err) return console.log('?');

            dispatch({
                notifications: [...notifications, { status: 'success', message: 'ToC archived', icon: 'notify-success' }]
            });

        });

    }

    delete(id) {
 
        const { IP, request, dispatch, notifications } = this.props;

        request({ 
            url: `${IP}/destroy_toc`,
            method: 'post', 
            data: { uuid: id }
        }, (err, res) => {
            if(err) return console.log('?');

            dispatch({
                notifications: [...notifications, { status: 'success', message: 'ToC deleted', icon: 'notify-success' }]
            });

        });

    }

    render(){
        const { tocs, categories, toggled_toc, dispatch, history, organisation_members, toc_members, user } = this.props;

        const { search, filter } = this.state;

        if(!toc_members || !tocs || !user) return '';

        const favourites = user.favourite_tocs || '';

        const tmpTocs = toc_members.reduce((memo, m, index) => {
            if(m.stakeholder_id !== user.id) return memo;
            const toc = tocs.find((t) => t.id === m.toc_id);
            memo.push(toc);
            return memo; 
        }, []);

        organisation_members.map((member) => {
            if(member.stakeholder_id !== user.id) return null;
            tocs.map((toc) => {
                if(toc.organisation_id !== member.organisation_id) return null;
                if(tmpTocs.find(t => t.id === toc.id)) return null;
                tmpTocs.push(toc);
                return null;
            });
            return null;
        }, []);

        const userTocs = tmpTocs.reduce((memo, toc) => {
            if(filter !== 'archived' && toc.deactivated_at) return memo;
            if(filter === 'archived' && !toc.deactivated_at) return memo;
            if(filter === 'favourites' && (toc.deactivated_at || favourites.indexOf(toc.uuid) === -1)) return memo;
            if(search && toc.name.toLowerCase().indexOf(search.toLowerCase()) === -1) return memo;
            memo.push(toc);
            return memo;
        }, []);

        return [
            <nav key="nav" className="top-nav">
                <h2>My ToCs</h2>
                <form onSubmit={e => e.preventDefault()} className="search">
                    <input value={search} onChange={e => this.setState({ search: e.target.value })} placeholder="Search ToCs" type="text" data-load="labels.placeholder_search" />
                </form>
            </nav>,
            <div key="container" className="tocs-container">

                <label className="length"><small>{userTocs.length}</small><span>ToC{ userTocs.length === 1 ? '' : 's'}</span></label>

                <div className="filters" data-filter={filter} data-click="toc.filter">

                    <a onClick={()=>this.setState({ filter: 'active' })} data-filter="active">Active</a>

                    <a onClick={()=>this.setState({ filter: 'favourites' })} data-filter="favourites">Favourites</a>

                    <a onClick={()=>this.setState({ filter: 'archived' })} data-filter="archived">Archived</a>

                    { null /* <select name="sort">
                        <option value="Last edited">Last edited</option>
                        <option value="Newest">Newest</option>
                        <option value="Alphabetic">A - Z</option>
                    </select> */ }

                </div>
                
                <div className="content">
                    <div className="toc new">
                        <button type="button" className="standard icon add" onClick={() => dispatch({ focusToc: {}, modal: 'toc_create'})}>Create new ToC</button>
                    </div>
                    { userTocs.map(toc => <div className="toc" key={ toc.key || Math.random() }>
                        
                        <button className="dots" onClick={() => dispatch({ toggled_toc: toggled_toc !== toc.id ? toc.id : null })}></button>

                        <div className={classNames({
                            'toggle-actions': true,
                            toggled: toggled_toc === toc.id
                        })}>
                            <a className="edit" onClick={()=>{
                                dispatch({ focusToc: toc, active_tab: 'settings' });
                                history.push(`/toc/${toc.id}`);
                            }}>Edit ToC Settings</a>
                            <a className="copy" onClick={() => this.copy(toc.uuid) }>Copy ToC</a>   
                            <a className="archive" onClick={() => this.archive(toc.uuid) }>Archive ToC</a>
                            <a className="delete" onClick={() => this.delete(toc.uuid) }>Delete ToC</a>
                        </div>

                        <header></header>
                        <h3>{ toc.name || '' }</h3>
                        <div className="image" style={{ backgroundImage: `url(${ toc.avatar || toc.preview_avatar || '/placeholder-toc.svg' })` }}>
                            <a className={classNames({
                                'status': true,
                                'tip': true,
                                'public': toc.visibility ? true : false
                            })} >
                                <i className="tooltip visibility">{ toc.visibility ? `This ToC is public` : `This ToC is private` }</i>
                            </a>
                        </div>
                        <div className="categories">
                            { 
                                toc.categories ? Object.keys(categories).map((c, index) => {
                                    if(!toc.categories) return null;
                                    if(toc.categories.indexOf(c) === -1) return null;
                                    return <label key={index} className="tip" data-category={ c } style={{ backgroundImage: `url(${ categories[c].icon })` }}>
                                        <i className="tooltip">{ categories[c].name }</i>
                                    </label>;
                                }) : null
                            }
                        </div>
                        <p>{ toc.short_description || '' }</p>
                        <div className="actions">
                            <button className="small regular bend view" onClick={() => { history.push(`/toc/${toc.id}/users`); dispatch({ active_tab: 'users' })}}>View users</button>
                            <button className="small regular bend invite icon add" onClick={() => dispatch({ modal: 'toc_invite', focusToc: { ...toc }})} data-modal="toc-invite" data-id={ toc.id }>Invite user</button>
                            <br />
                            <a className="uuid" target="_blank" href={`https://app.changeroo.com/project/${ toc.uuid }`}>Open ToC</a>
                        </div>

                    </div>)}

            </div>
            
        </div>
        ];
    }
}

export default withRouter(withStore(Landing));
