import React, { Component } from 'react';
import { withRouter } from 'react-router-dom';
import { withStore } from '../store';
import Toggle from 'react-toggle';
import classNames from 'classnames';
import "../styles/toggle.css"; // for ES6 modules
import Select from 'react-select';

class TocAdmin extends Component {

    constructor(props) {
        super(props);
        this.state = {
            embed_container: false,
            email: ''
        };
        this.save = this.save.bind(this);
        this.onChange = this.onChange.bind(this);
        this.setAvatar = this.setAvatar.bind(this);
        this.findStakeholder = this.findStakeholder.bind(this);
        this.toggleEmbed = this.toggleEmbed.bind(this);
    }

    componentWillMount() {

        const { dispatch, history, tocs, match, toc_members, user } = this.props;

        // find toc
        if(!tocs || !match.params.id || !toc_members.length) return history.push('/landing');

        const toc = tocs.find(t=>String(t.id)===match.params.id);

        if(toc) dispatch({ focusToc: toc });

        // find out if member is admin
        let admin = toc_members.reduce((memo, m) => {
            if((String(m.toc_id) === String(match.params.id)) && (String(m.stakeholder_id) === String(user.id))) {
                memo = m;
                return memo;
            }
            return memo;
        }, {});

        if(admin && admin.isAdmin) dispatch({ isAdmin: true });

    }

    componentDidMount() {

        const { match, tocs, history, dispatch, active_tab } = this.props;
        const { key } = match.params;
        const toc = tocs.find(toc=>toc.key===key);
        if(!active_tab) dispatch({ active_tab: 'settings' });
        if(!toc) {
            history.push('/landing');
            return null;
        }
        
    }

    toggleEmbed() {
        this.setState({ embed_container: !this.state.embed_container });
    }

    setAvatar(e) {
        const { focusToc, dispatch } = this.props;
        const file = e.target.files[0];
        const reader = new FileReader();
      
        reader.addEventListener('load', function () {
          dispatch({ focusToc: { ...focusToc, preview_avatar: reader.result } }); 
        }, false);
      
        if (file) reader.readAsDataURL(file);
    }

    save() {

        const { IP, request, focusToc, dispatch, notifications, history } = this.props;

        if(!focusToc) return console.log('no toc found');
        request({ 
            url: `${IP}/edit_toc`,
            method: 'post', 
            data: focusToc
        }, (err, res) => {
            if(err) return console.log('?');
            dispatch({
                notifications: [...notifications, { status: 'success', message: `${ focusToc.name ? `ToC ${ focusToc.name} saved` : 'ToC saved'}`, icon: 'notify-success'  }]
            });

            history.push('/landing');
        });

    }

    findStakeholder(id, property) {
        const { stakeholders } = this.props;
        const s = stakeholders.find((s) => { return s.id === id; });
        if(s) return s[property];
        return false;
    }

    onChange(e) {

        const { focusToc, dispatch } = this.props;
        
        if(e.target.name === "visibility") return dispatch({ focusToc: { ...focusToc, [e.target.name]: e.target.checked ? 1 : 0 }});
        
        dispatch({ focusToc: { ...focusToc, [e.target.name]: e.target.value }});

    }

    render() {
        const { 
            IP,
            focusTocMember,
            isAdmin,
            request, 
            user, 
            // match, 
            history, 
            toggled_toc_member,
            active_tab, 
            dispatch, 
            categories,
            stakeholders,
            toc_members, 
            focusToc,
        } = this.props;
        // const key = match.params.id;
        // const toc = tocs.find(toc=>toc.key===key);

        if(!user || !focusToc || !toc_members || !stakeholders || !focusTocMember) return null;
              
        const cats = Object.keys(categories).reduce((memo, c) => {

            memo.push({ value: categories[c].id, label: categories[c].name });

            return memo;

        }, []);

        const pending_list = toc_members.reduce((memo, m) => {
            if(m.toc_id !== focusToc.id) return memo;
            if(m.member_activation_sent_at || m.moderator_activation_sent_at || m.admin_activation_sent_at) {
                memo.push(m);
                return memo;
            }
            return memo;
        }, []);

        const registered_list = toc_members.reduce((memo, m) => {
            if(m.toc_id !== focusToc.id) return memo;
            if(!m.member_activation_sent_at && !m.moderator_activation_sent_at && !m.admin_activation_sent_at) {
                memo.push(m);
                return memo;
            }
            return memo;
        }, []);
        return [
<nav key="nav" className="top-nav toc-detail">
    <a className="main" onClick={() => history.push('/landing')}>My ToCs</a>
    <span>> ToC</span>
    <span className="current">&nbsp;{ focusToc.name || '' }</span>
</nav>,

<div key="body" className="toc-viewer" data-active={ active_tab || 'settings'}>

    <nav className="tab-nav toc-nav">
        <a data-tab="settings" onClick={() => this.props.dispatch({ active_tab: 'settings' }) }>
            <i style={{backgroundImage: 'url(/icon-settings.svg)' }}></i>
            <span>Settings</span>
        </a>
        <a data-tab="users" onClick={() => this.props.dispatch({ active_tab: 'users' }) }>
            <i style={{backgroundImage: 'url(/icon-user.svg)'}}></i>
            <span>Users</span>
        </a>
        <a data-tab="advanced" onClick={() => this.props.dispatch({ active_tab: 'advanced'}) }>
            <i style={{backgroundImage: 'url(/icon-advanced.svg)'}}></i>
            <span>Advanced</span>
        </a>
        <div className="active-line"></div>
    </nav>

    <section data-tab="settings">

        <h1>
            ToC Details
            <label className="question tip" data-click="basic.toggle_tooltip">
                <i className="tooltip">Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed porta sollicitudin velit vel porttitor. Morbi vel est arcu. Nullam eu auctor eros, a rutrum lorem. Nunc pretium eleifend diam non facilisis.</i>
            </label>
        </h1>

        <div className="rows" data-rows="2">

            <div className="row">

                <label>ToC Name</label>
                <input type="text" name="name" value={focusToc.name || ''} onChange={ this.onChange } />

                <label>Short description - <small>Max 60 characters</small></label>
                <textarea name="short_description" maxLength={60} value={focusToc.short_description || ''} onChange={ this.onChange }></textarea>

                <label>About this ToC</label>
                <textarea name="about" value={focusToc.about || ''} onChange={ this.onChange }></textarea>

                <label>Size revenue</label>
                <select name="size_revenue">
                    <option value="large">Large: > €5 million total revenues</option>
                    <option value="middle">Middle: ≤ €5 million total revenues</option>
                    <option value="small">Small: ≤ €1 million total revenues</option>
                    <option value="micro">Micro: ≤ €100.000 total revenues</option>
                </select>

            </div>
            
            <div className="row">

                <label>Select up to 3 categories</label>
                <div className="select-container toc-admin">
                    <Select 
                        className="select"
                        options={cats} 
                        closeMenuOnSelect={false}  
                        isMulti
                        classNamePrefix="select"
                        onChange={selected=>dispatch({ focusToc: { ...focusToc, categories: selected.map(option => option.value).join(',') }})}
                        value={(focusToc.categories ? focusToc.categories.split(',') : []).map(option => ({ value: option, label: option.replace(/_/g, ' ') }))}
                        />
                </div>

                <label>Select the region(s)</label>
                <select name="regions">
                    <option value="large">Africa</option>
                    <option>Other option</option>
                </select>

                <label>Choose an image for this ToC</label>
                <div className="image-upload-container">
                {
                    isAdmin ? (
                        <div className="image admin" style={{backgroundImage: `url(${ (focusToc.preview_avatar || focusToc.avatar) ? focusToc.preview_avatar || focusToc.avatar : '/placeholder-avatar.svg'})`}}>
                            <input onChange={this.setAvatar} type="file" />
                        </div>
                    ) : (
                        <div className="image" style={{backgroundImage: `url(${focusToc.avatar || '/placeholder-avatar.svg'})`}}></div>
                    )
                }
                </div>

            </div>
        
        </div>

        <div className="nav-buttons">

            <button type="button" className="back standard icon" onClick={() => history.push('/landing')}>Return to My Tocs</button>

            <button type="button" className="save standard warning" onClick={this.save}>Save changes</button>

        </div>

    </section>

    <section data-tab="users">

        <h1>Users and invitations</h1>

        <button onClick={ () => dispatch({ modal: 'toc_invite' }) } 
            className="invite-user small standard icon add mobile-remove-text"> 
            <a>Invite user</a>
        </button>

        <div className="member-container">
       
            { pending_list.length ? <h4>Pending invitations</h4> : null }

            <div className="pending-container">
                {
                    pending_list ? 
                    Object.keys(pending_list).map((key) =>
                    <div className="member" key={key}>
                        <div className="image-container">
                            <div className="image" style={{
                                backgroundImage: `url(${ this.findStakeholder(pending_list[key].stakeholder_id, 'avatar') || '/placeholder-avatar.svg' })`
                            }}></div>
                        </div>
                        <div className="name-container">
                            <h5>{ this.findStakeholder(pending_list[key].stakeholder_id, 'full_name') }</h5><i className="email-label">{ this.findStakeholder(pending_list[key].stakeholder_id, 'email') }</i>
                        </div>
                        <div className="roles-container">
                            { pending_list[key].admin_activation_sent_at ? <small data-role="administrator">Administrator</small> : '' }
                            { pending_list[key].admin_activation_sent_at && pending_list[key].moderator_activation_hash ? <span>/</span> : ''}
                            { pending_list[key].moderator_activation_sent_at ? <small data-role="moderator">Moderator</small> : '' }
                            { pending_list[key].moderator_activation_sent_at && pending_list[key].member_activation_hash ? <span>/</span> : ''}
                            { pending_list[key].member_activation_sent_at ? <small data-role="member">Member</small> : '' }
                        </div>
                        
                        <div className="pending-actions">
                            <button className="small standard silver icon resend" onClick={() => dispatch({ 
                                modal: 'reinvite_stakeholder_toc',
                                focusTocMember: { 
                                    toc_id: pending_list[key].toc_id,
                                    id: pending_list[key].id,
                                    stakeholder_id: pending_list[key].stakeholder_id,
                                    role: pending_list[key].admin_activation_sent_at ? 'admin' : 
                                    (pending_list[key].moderator_activation_sent_at ? 'moderator' :
                                    ((pending_list[key].member_activation_sent_at ? 'member' : '' ))),
                                    email: this.findStakeholder(pending_list[key].stakeholder_id, 'email'),
                                    full_name: this.findStakeholder(pending_list[key].stakeholder_id, 'full_name')
                                }}) }><span>Resend invitation</span>
                            </button>
                            <button className="small standard silver icon remove" onClick={() => dispatch({ 
                                focusTocMember: {
                                    email: this.findStakeholder(pending_list[key].stakeholder_id, 'email'), 
                                    full_name: this.findStakeholder(pending_list[key].stakeholder_id, 'full_name'),
                                    id: this.findStakeholder(pending_list[key].stakeholder_id, 'id'),
                                    role: pending_list[key].admin_activation_sent_at ? 'admin' : 
                                    (pending_list[key].moderator_activation_sent_at ? 'moderator' :
                                    ((pending_list[key].member_activation_sent_at ? 'member' : '' ))) },
                                modal: 'confirm_remove_invite_toc' }) }>
                                <span>remove</span>
                            </button>
                        </div>
                    </div>) : ''
                }


            </div>

            <h4>Users of this ToC</h4>
        
            <div className="registered-container">{
                Object.keys(registered_list).map((key) =>
                <div className="member" key={key}>
                    <button className="dots" onClick={() => dispatch({ toggled_toc_member: toggled_toc_member !== key ? key : null })}></button>

                    <div className={classNames({
                        'toggle-actions': true,
                        toggled: toggled_toc_member === key
                    })}>
                        <a className="edit" onClick={()=>{
                            dispatch({
                                modal: 'edit_toc_role',
                                toggled_toc_member: false,
                                focusTocMember: {
                                    full_name: this.findStakeholder(registered_list[key].stakeholder_id, 'full_name'),
                                    email: this.findStakeholder(registered_list[key].stakeholder_id, 'email'),
                                    id: registered_list[key].id,
                                    toc_id: registered_list[key].toc_id,
                                    role: registered_list[key].isAdmin ? 'admin' : 
                                    (registered_list[key].isModerator ? 'moderator' :
                                    ((registered_list[key].isMember ? 'member' : '')))
                                }
                            });
                        }}>Edit role(s)</a>
                        <a data-action="delete_member" onClick={()=>{
                            dispatch({
                                modal: 'remove_stakeholder_toc_role',
                                toggled_toc_member: false,
                                focusTocMember: {
                                    full_name: this.findStakeholder(registered_list[key].stakeholder_id, 'full_name'),
                                    email: this.findStakeholder(registered_list[key].stakeholder_id, 'email'),
                                    id: registered_list[key].id,
                                    stakeholder_id: registered_list[key].stakeholder_id,
                                    role: registered_list[key].isAdmin ? 'admin' : 
                                    (registered_list[key].isModerator ? 'moderator' :
                                    ((registered_list[key].isMember ? 'member' : '')))
                                }
                            });
                        }}>Remove user</a>
                    </div>

                    <div className="image-container">
                        <div className="image" style={{
                            backgroundImage: `url(${ this.findStakeholder(registered_list[key].stakeholder_id, 'avatar') || '/placeholder-avatar.svg' })`
                        }}></div>
                    </div>
                    <div className="name-container">
                        <h5>{ this.findStakeholder(registered_list[key].stakeholder_id, 'full_name') }</h5><i className="email-label">{ this.findStakeholder(registered_list[key].stakeholder_id, 'email') }</i>
                    </div>
                    <div className="roles-container">
                        { registered_list[key].isAdmin ? <small data-role="administrator">Administrator /</small> : '' }
                        { registered_list[key].isModerator ? <small data-role="moderator">Moderator /</small> : '' }
                        { registered_list[key].isMember ? <small data-role="member">Member</small> : '' }
                    </div>
                    <div className="pending-actions">
                        <button className="small standard silver icon resend" data-modal="toc-confirm"><span>Resend invitation</span></button>
                        <button className="small standard silver icon remove" data-modal="toc-confirm"><span>remove</span></button>
                    </div>
                </div>)
            }</div>
        
        </div>

        <div className="nav-buttons">
            
            <button onClick={() => history.push('/landing')}>Return to My ToCs</button>

        </div>

    </section>

    <section data-tab="advanced">

        <h1>Advanced</h1>

        <div className="rows" data-rows="1">
            
            <div className="row">

                <label>Set the visibility of this ToC <i></i></label>
                <div className="toggle-container">
                    <label>Private</label>
                    <Toggle
                        checked={ focusToc.visibility ? true : false }
                        name="visibility"
                        icons={false}
                        onChange={this.onChange} />
                    <label>Public</label>
                </div>
                {/* <label>Embed this ToC on your website<i></i></label>
                <div className={ this.state.embed_container ? 'embed-container toggled' : 'embed-container' }>
                    <textarea placeholder="embed link"/>
                </div>
                <button className="small silver round" onClick={ this.toggleEmbed }>Embed ToC</button> */}

                <label>Invite stakeholder to move this ToC to another organisation<i></i></label>
                <div className="select-container">
                    {/* <Select
                        value={{
                            value: orgSelector.id,
                            label: orgSelector.name
                        }}
                        onChange={selected => { dispatch({ focusToc: { ...focusToc, organisation_id: selected.value } } ) } }
                        options={orgs}
                    /> */}
                    <input type="email" onChange={ e => this.setState({ email: e.target.value }) } />
                </div>
                <button className="small silver round" onClick={() => 
                    request({ 
                        url: `${IP}/init_move_toc`, 
                        method: 'post', 
                        data: { id: focusToc.id, email: this.state.email }
                    }) }>Move ToC</button>
            </div>

        </div>

        <div className="nav-buttons">

            <button className="back standard icon" onClick={() => history.push('/tocs')}>Return to My Tocs</button>

            <button type="button" className="save standard warning" onClick={this.save}>Save changes</button>

        </div>

    </section>

</div>
        ];
    }
}

export default withRouter(withStore(TocAdmin));