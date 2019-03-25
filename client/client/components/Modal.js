import React, { Component } from 'react';
import classNames from 'classnames';
import { withRouter } from 'react-router-dom';
import { withStore } from '../store';
import Select from 'react-select';
// import { copyFile } from 'fs';

class Modal extends Component {

    constructor(props) {
        super(props);
        this.createToc = this.createToc.bind(this);
        this.createOrganisation = this.createOrganisation.bind(this);
        this.onChange = this.onChange.bind(this);
        this.onChangeFocusMember = this.onChangeFocusMember.bind(this);
        this.organisationMemberChange = this.organisationMemberChange.bind(this);
        this.inviteStakeholder = this.inviteStakeholder.bind(this);
        this.saveOrganisationRole = this.saveOrganisationRole.bind(this);
        this.saveTocRole = this.saveTocRole.bind(this);
        this.removeStakeholderFromToc = this.removeStakeholderFromToc.bind(this);
        this.removeStakeholderFromOrganisation = this.removeStakeholderFromOrganisation.bind(this);
        this.setTocAvatar = this.setTocAvatar.bind(this);
        this.setOrganisationAvatar = this.setOrganisationAvatar.bind(this);
        this.onChangeOrganisation = this.onChangeOrganisation.bind(this);
        this.inviteOrganisation = this.inviteOrganisation.bind(this);
        this.closeOrganisation = this.closeOrganisation.bind(this);
        this.reSend = this.reSend.bind(this);
    }


    reSend(e) {
        const {  IP, dispatch, request, notifications, focusTocMember } = this.props;
        
        e.stopPropagation();

        if(!focusTocMember.id) return console.log('no member found', focusTocMember);

        const data = {
            toc: focusTocMember.toc_id,
            id: focusTocMember.stakeholder_id,
            email: focusTocMember.email,
            role:  focusTocMember.role,
            full_name: focusTocMember.full_name
        };

        console.log('resend', data, focusTocMember);

        request({ 
            url: `${IP}/reinvite_stakeholder_for_toc_role`,
            method: 'post', 
            data: data
        }, (err, res) => {
            if(err) return console.log('?');
            dispatch({
                notifications: [...notifications, { status: 'success', message: 'Invite has been send again', icon: 'notify-success'  }],
                modal: false 
            });
        });
    }

    componentWillMount() {
        const { dispatch, focusTocMember, focusOrganisationMember } = this.props;
        if(!focusTocMember) dispatch({ focusTocMember: {} });
        if(!focusOrganisationMember) dispatch({ focusOrganisationMember: {} });
    }

    onChange(e) {
        const { dispatch, focusToc } = this.props;
        dispatch({ focusToc: { ...focusToc, [e.target.name]: e.target.value }});
    }

    onChangeOrganisation(e) {
        const { dispatch, focusOrganisation } = this.props;
        dispatch({ focusOrganisation: { ...focusOrganisation, [e.target.name]: e.target.value }});
    }

    setTocAvatar(e) {
        const { focusToc, dispatch } = this.props;
        const file = e.target.files[0];
        const reader = new FileReader();
      
        reader.addEventListener('load', function () {
          dispatch({ focusToc: { ...focusToc, preview_avatar: reader.result } }); 
        }, false);
      
        if (file) reader.readAsDataURL(file);
    }

    setOrganisationAvatar(e) {
        const { focusOrganisation, dispatch } = this.props;
        const file = e.target.files[0];
        const reader = new FileReader();
      
        reader.addEventListener('load', function () {
          dispatch({ focusOrganisation: { ...focusOrganisation, preview_avatar: reader.result } }); 
        }, false);
      
        if (file) reader.readAsDataURL(file);
    }

    onChangeFocusMember(e) {
        const { dispatch, focusTocMember } = this.props;
        dispatch({ focusTocMember: { ...focusTocMember, [e.target.name]: e.target.value }});
    }

    organisationMemberChange(e) {
        const { dispatch, focusOrganisationMember } = this.props;
        dispatch({ focusOrganisationMember: { ...focusOrganisationMember, [e.target.name]: e.target.value }});
    }

    inviteOrganisation(e) {
        const { 
            notifications, 
            dispatch, 
            IP,
            request, 
            focusOrganisation, 
            focusOrganisationMember 
        } = this.props;
        
        e.preventDefault();
        
        const data = {
            organisation: focusOrganisation.id,
            email: focusOrganisationMember.email,
            full_name: focusOrganisationMember.name
        };
        request({ 
            url: `${IP}/invite_stakeholder_as_admin`,
            method: 'post', 
            data: data
        }, (err, res) => {
            if(err) return console.log('?');
            dispatch({
                notifications: [...notifications, { status: 'success', message: 'User invited for organisation', icon: 'notify-success'  }],
                modal: false 
            });
        });

        dispatch({
            notifications: [...notifications, { status: 'success', message: 'User invited for organisation', icon: 'notify-success'  }],
            modal: false 
        });

    }

    inviteStakeholder(e) {
        const { IP, notifications, dispatch, request, focusToc, focusTocMember } = this.props;
        e.preventDefault();
        const data = {
            toc_id: focusToc.id,
            email: focusTocMember.email,
            role:  focusTocMember.role,
            full_name: focusTocMember.full_name
        };
        // return console.log('s', data);
        request({ 
            url: `${IP}/invite_stakeholder_for_toc_role`,
            method: 'post', 
            data: data
        }, (err, res) => {
            if(err) return console.log('?');
            dispatch({
                notifications: [...notifications, { status: 'success', message: 'User invited', icon: 'notify-success'  }],
                modal: false 
            });
        });

    }

    closeOrganisation(e) {

        const { request, IP, notifications, dispatch, focusOrganisation, history } = this.props;

        request({ 
            url: `${IP}/destroy_organisation`,
            method: 'post', 
            data: {
                id: focusOrganisation.id
            }
        }, (err, res) => {
            if(err) return console.log('?');
            dispatch({
                notifications: [...notifications, { status: 'success', message: 'Organisation closed', icon: 'notify-success'  }],
                modal: false 
            });
            history.push('/organisations');
        });

        e.preventDefault();

    }

    createOrganisation(e) {
        
        const { 
            IP, 
            request,
            notifications, 
            dispatch, 
            focusOrganisation, 
        } = this.props;
        
        e.preventDefault();
        
        if(!focusOrganisation) return console.log('no toc found');

        console.log(focusOrganisation);
        
        request({ 
            url: `${IP}/create_free_organisation`,
            method: 'post', 
            data: {
                ...focusOrganisation
            }
        }, (err, res) => {
            if(err) return console.log('?');
            dispatch({
                notifications: [...notifications, { status: 'success', message: 'Organisation created', icon: 'notify-success'  }],
                modal: false 
            });
        });

        dispatch({
            notifications: [...notifications, { status: 'success', message: 'Organisation created', icon: 'notify-success'  }],
            modal: false 
        });

    }

    createToc(e) {
        const { IP, notifications, dispatch, request, focusToc, user } = this.props;
        e.preventDefault();
        if(!focusToc) return console.log('no toc found');
        request({ 
            url: `${IP}/create_toc`,
            method: 'post', 
            data: {
                ...focusToc,
                username: user.username
            }
        }, (err, res) => {
            if(err) return console.log('?');
            dispatch({
                notifications: [...notifications, { status: 'success', message: 'ToC created', icon: 'notify-success'  }],
                modal: false 
            });
        });
    }

    saveOrganisationRole(e) {

        const { 
            IP, 
            request, 
            notifications, 
            dispatch, 
            focusOrganisationMember,
        } = this.props;
        
        e.preventDefault();

        
        let data = {};

        if(focusOrganisationMember.role === 'member') {
            data = {
                member: focusOrganisationMember.id
            };
        }

        else {
            data = {
                organisation: focusOrganisationMember.organisation_id,
                email: focusOrganisationMember.email
            }; 
        }

        if(!data) return console.log('no focus object found');

        console.log('save role', data);
        request({ 
            url: `${ IP }/${ focusOrganisationMember.role === 'member' ? 'remove_organisation_admin_role' : 'reinvite_stakeholder_as_admin' }`,
            method: 'post', 
            data: data
        }, (err, res) => {
            if(err) return console.log('?');
            dispatch({
                notifications: [...notifications, { status: 'success', message: 'Role edited', icon: 'notify-success'  }],
                modal: false 
            });
        });

    }

    saveTocRole(e) {

        const { 
            IP, 
            request, 
            notifications, 
            dispatch, 
            focusTocMember,
        } = this.props;
        
        e.preventDefault();

        let data = {
            toc_id: focusTocMember.toc_id,
            id: focusTocMember.id,
            full_name: focusTocMember.full_name,
            role: focusTocMember.role
        };

        if(!data) return console.log('no focus object found');

        console.log('save role', data);
        request({ 
            url: `${ IP }/invite_stakeholder_for_toc_role`,
            method: 'post', 
            data: data
        }, (err, res) => {
            if(err) return console.log('?');
            dispatch({
                notifications: [...notifications, { status: 'success', message: 'Role edited', icon: 'notify-success'  }],
                modal: false 
            });
        });

    }

    removeStakeholderFromOrganisation(e) {
      
        const { 
            IP, 
            request, 
            notifications, 
            dispatch, 
            focusOrganisationMember 
        } = this.props;

        e.preventDefault();
        
        const data = {
            full_name: focusOrganisationMember.full_name,
            organisation: focusOrganisationMember.organisation_id,
            id: focusOrganisationMember.stakeholder_id,
            email: focusOrganisationMember.email,
            role: focusOrganisationMember.role
        };
        console.log(data);
        request({ 
            url: `${IP}/remove_stakeholder_from_organisation`,
            method: 'post', 
            data: data
        }, (err, res) => {
            if(err) return console.log('?');
            dispatch({
                notifications: [...notifications, { status: 'success', message: 'Stakeholder removed from organisation', icon: 'notify-success'  }],
                modal: false 
            });
        });

    }

    removeStakeholderFromToc(e) {
      
        const { 
            IP, 
            request, 
            notifications, 
            dispatch, 
            focusToc, 
            focusTocMember 
        } = this.props;

        e.preventDefault();
        
        const data = {
            toc: focusToc.id,
            id: focusTocMember.stakeholder_id,
            full_name: focusTocMember.full_name,
            role: focusTocMember.role,
            email: focusTocMember.email,
        };
        console.log(data);
        request({ 
            url: `${IP}/remove_stakeholder_toc_role`,
            method: 'post', 
            data: data
        }, (err, res) => {
            if(err) return console.log('?');
            dispatch({
                notifications: [...notifications, { status: 'success', message: 'Invite removed', icon: 'notify-success'  }],
                modal: false 
            });
        });

    }

    render() {
        const { 
            tocs,
            organisations, 
            organisation_members, 
            focusToc,
            focusTocMember,
            focusOrganisationMember,
            categories,
            countries,
            dispatch, 
            connected, 
            focusOrganisation,
            modal,  
            user,
            regions,
            // isAdmin,
        } = this.props;
console.log(focusTocMember);
        if(!user) return null;

        document.body.classList[modal ? 'add' : 'remove']('modal-active');
        
        if(!connected) return null;

        let content;

        const orgs = organisation_members.reduce((memo, m, index) => {
            if(m.stakeholder_id !== user.id) return memo;
            const org = organisations.find((o) => o.id === m.organisation_id);
            memo.push({ value: org.id, label: org.name });
            return memo; 
        }, []);

        const cats = Object.keys(categories).reduce((memo, c) => {

            memo.push({ value: categories[c].id, label: categories[c].name });

            return memo;

        }, []);

        const regs = regions.reduce((memo, r) => {
            
            memo.push({ value: r, label: r });

            return memo;

        }, []);

        switch(modal) {
            case 'toc_create':

  // CREATE TOC
  content = <div>
                <h1>Create new ToC</h1>
                <a className="hide-modal" onClick={() => dispatch({ modal: false})}>X</a>
                <div className="rows" data-rows="2">
        
                    <div className="row">
        
                        <label>ToC name</label>
                        <input name="name" type="text" onChange={this.onChange} value={focusToc.name || ''} />
        
                        <label>Select an Organisation</label>
                        <div className="select-container">
                            <Select
                                closeMenuOnSelect={true}  
                                value={orgs.find(o => o.value === focusToc.organisation_id)}
                                onChange={selected => { dispatch({ focusToc: { ...focusToc, organisation_id: selected.value } } ) } }
                                options={orgs}
                            />
                        </div>
        
                        <label>Short description</label>
                        <textarea name="short_description" onChange={this.onChange}></textarea>
        
                        <label>About this ToC</label>
                        <textarea name="about" onChange={this.onChange}></textarea>
        
                        <label>Size revenue</label>
                        <select name="size_revenue" onChange={this.onChange}>
                            <option value=""></option>
                            <option value="large">Large: > €5 million total revenues</option>
                            <option value="middle">Middle: ≤ €5 million total revenues</option>
                            <option value="small">Small: ≤ €1 million total revenues</option>
                            <option value="micro">Micro: ≤ €100.000 total revenues</option>
                        </select>
        
                    </div>
                    
                    <div className="row stretch">
        
                        <label>Select up to 3 categories</label>
                        <div className="select-container">
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
                        <div className="select-container">
                            <Select 
                                className="select"
                                options={regs} 
                                closeMenuOnSelect={false}
                                isMulti
                                classNamePrefix="select"
                                onChange={selected=>dispatch({ focusToc: { ...focusToc, regions: selected.map(option => option.value).join(',') }})}
                                value={(focusToc.regions ? focusToc.regions.split(',') : []).map(option => ({ value: option, label: option.replace(/_/g, ' ') }))}
                                />
                        </div>
        
                        <div className="image-upload-container">
                        {
                            <div className="image admin" style={{backgroundImage: `url(${ (focusToc.preview_avatar || focusToc.avatar) ? focusToc.preview_avatar || focusToc.avatar : '/placeholder-avatar.svg'})`}}>
                                <input onChange={this.setTocAvatar} type="file" />
                            </div>
                        }
                        </div>
                        
                    </div>
        
                </div>
                <div className="nav-buttons">
                    <button type="button" onClick={(e) => this.createToc(e) } className="save standard warning">Create new ToC</button>    
                </div>
            </div>;
            break;

            case 'organisation_create':

  // CREATE ORGANISATION
  content = <div>
                <h1>Create new organisation</h1>

                <a className="hide-modal" onClick={() => dispatch({ modal: false})}>X</a>

                <div className="rows" data-rows="2">

                    <div className="row">

                        <label>Organisation name</label>
                        <input type="text" name="name" onChange={ this.onChangeOrganisation } value={ focusOrganisation.name || '' } />

                        <label>Address</label>
                        <input type="text" name="address" onChange={ this.onChangeOrganisation } value={ focusOrganisation.address || '' } />

                        <label>City</label>
                        <input type="text" name="city" onChange={ this.onChangeOrganisation } value={ focusOrganisation.city || '' } />

                        <label>Country</label>
                        <div className="select-container">
                            <Select
                                closeMenuOnSelect={true}  
                                value={countries.find(c => c.value === focusOrganisation.country)}
                                onChange={selected => { dispatch({ focusOrganisation: { ...focusOrganisation, country: selected.value } } ) } }
                                options={countries.reduce((memo, c) => { 
                                    memo.push({ value: c, label: c });
                                    return memo;
                                }, [])}
                            />
                        </div>

                        <label>Website</label>
                        <input type="text" name="website" onChange={ this.onChangeOrganisation } value={ focusOrganisation.website || '' }/>

                        <label>VAT</label>
                        <input type="text" name="vat" onChange={ this.onChangeOrganisation } value={ focusOrganisation.vat || '' }/>

                    </div>
                    
                    <div className="row">

                        <label>Categories</label>
                        <div className="select-container">
                            <Select 
                                className="select"
                                options={cats} 
                                closeMenuOnSelect={false}  
                                isMulti
                                classNamePrefix="select"
                                onChange={selected=>dispatch({ focusOrganisation: { ...focusOrganisation, categories: selected.map(option => option.value).join(',') }})}
                                value={(focusOrganisation.categories ? focusOrganisation.categories.split(',') : []).map(option => ({ value: option, label: option.replace(/_/g, ' ') }))}
                            />
                        </div>

                        <label>Regions</label>
                        <div className="select-container">
                            <Select 
                                className="select"
                                options={regs} 
                                isMulti
                                closeMenuOnSelect={false}
                                classNamePrefix="select"
                                onChange={selected=>dispatch({ focusOrganisation: { ...focusOrganisation, regions: selected.map(option => option.value).join(',') }})}
                                value={(focusOrganisation.regions ? focusOrganisation.regions.split(',') : []).map(option => ({ value: option, label: option.replace(/_/g, ' ') }))}
                            />
                        </div>

                        <div className="image-upload-container">
                        {
                            <div className="image admin" style={{backgroundImage: `url(${ (focusOrganisation.preview_avatar || focusOrganisation.avatar) ? focusOrganisation.preview_avatar || focusOrganisation.avatar : '/placeholder-organisation.svg'})`}}>
                                <input onChange={this.setOrganisationAvatar} type="file" />
                            </div>
                        }
                        </div>
                        
                    </div>

                </div>
                <div className="nav-buttons">
                
                    <button className="save standard warning" onClick={ this.createOrganisation }>Create new organisation</button>
    
                </div>

            </div>;

            break;

            case 'organisation_invite':

  // INVITE FOR ORGANISATION
  content = <div>
                <h1>Invite administrator for {focusOrganisation.name}</h1>
                <a className="hide-modal" onClick={() => dispatch({ modal: false})}>X</a>

                <div>

                    {/* <label>Full Name</label>
                    <input type="text" name="name" onChange={this.organisationMemberChange} value={focusOrganisationMember.name || ''} /> */}

                    <label>User E-mail Address</label>
                    <input type="text" name="email" onChange={this.organisationMemberChange} value={focusOrganisationMember.email || ''} />

                </div>
                <div className="nav-buttons">
                    <button type="button" className="standard warning save" onClick={this.inviteOrganisation}>Invite this user</button>
                </div>
            </div>;

            break;

            case 'toc_invite':

  content = <div>
                <h1>Invite user to {focusToc.name}</h1>
                <a className="hide-modal" onClick={() => dispatch({ modal: false})}>X</a>

                <div>

                    <label>Full Name</label>
                    <input type="text" name="full_name" onChange={this.onChangeFocusMember} value={focusTocMember.full_name || ''} />

                    <label>User E-mail Address</label>
                    <input type="text" name="email" onChange={this.onChangeFocusMember} value={focusTocMember.email || ''} />

                    <label className="role-message">
                        Select one or more roles for this user
                        <label className="question tip" data-click="basic.toggle_tooltip">
                            {/* <i className="tooltip">Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed porta sollicitudin velit vel porttitor. Morbi vel est arcu. Nullam eu auctor eros, a rutrum lorem. Nunc pretium eleifend diam non facilisis.</i> */}
                        </label>
                    </label>

                    <div className="roles-container">

                        <div className={classNames({ role: true, selected: focusTocMember.role === 'member' }) } 
                            onClick={() => dispatch({ focusTocMember: {...focusTocMember, role: 'member' } })}>
                            <span>member</span>
                            <i></i>
                        </div>
                        <div className={classNames({ role: true, selected: focusTocMember.role === 'moderator' }) } 
                            onClick={() => dispatch({ focusTocMember: {...focusTocMember, role: 'moderator' } })}>
                            <span>moderator</span>
                            <i></i>
                        </div>
                        <div className={classNames({ role: true, selected: focusTocMember.role === 'admin' }) } 
                            onClick={() => dispatch({ focusTocMember: {...focusTocMember, role: 'admin' } })}>
                            <span>administrator</span>
                            <i></i>
                        </div>

                    </div>

                </div>
                <div className="nav-buttons">
                    <button type="button" className="standard warning save" onClick={this.inviteStakeholder}>Invite this user</button>
                </div>
            </div>;
            break;

            case 'toc_copy':

            const toc = tocs.find((t) => { return t.id === focusToc.id });

            if(!toc) return console.log('no toc');
  content = <div>
                <h1>Copy ToC</h1>
                <a className="hide-modal" onClick={() => dispatch({ modal: false})}>X</a>

                <h4>Keep permissions for this ToC?</h4>
                <input name="keep_permissions" 
                    value={ focusToc.keep_permissions ? true : false } 
                    onClick={() => dispatch({ focusToc: {...focusToc, keep_permissions: focusToc.keep_permissions ? false : true  }})} 
                    type="checkbox"></input>
                    <div className="nav-buttons">
                        <button type="button" onClick={this.copyToc} className="save standard warning">Copy ToC</button>  
                    </div>
            </div>;
            break;

            case 'confirm_remove_invite_toc':
  content = <div>
                <h1>Remove invite</h1>
                <a className="hide-modal" onClick={() => dispatch({ modal: false})}>X</a>
                <div>
                    <p>Are you sure you want to remove the invite of { focusTocMember.full_name } ?</p>
                </div>
                <div className="nav-buttons">
                    <button type="button" onClick={ this.removeStakeholderFromToc } className="save standard warning">Remove</button>  
                </div>
            </div>;
            break;

            case 'reinvite_stakeholder_toc':
  content = <div>
                <h1>Resend invite</h1>
                <a className="hide-modal" onClick={() => dispatch({ modal: false})}>X</a>
                <div>
                    <p>Resend to { focusTocMember.full_name || focusTocMember.email } ?</p>
                </div>
                <div className="nav-buttons">
                    <button type="button" onClick={(e) => this.reSend(e) } className="save standard warning">Resend</button>  
                </div>         
            </div>;
            break;
            case 'confirm_remove_invite_organisation':
  content = <div>
                <h1>Remove invite</h1>
                <a className="hide-modal" onClick={() => dispatch({ modal: false})}>X</a>
                <div>
                    <p>Are you sure you want to remove the invite of { focusOrganisationMember.full_name } ?</p>
                </div>
                <div className="nav-buttons">
                    <button type="button" onClick={ this.removeStakeholderFromOrganisation } className="save standard warning">Remove</button>  
                </div>
            </div>;
            break;

            case 'edit_organisation_role':
  content = <div>
                <h1>Edit role of { focusOrganisationMember.full_name }</h1>
                <a className="hide-modal" onClick={() => dispatch({ modal: false})}>X</a>

                <div className="roles-container">

                    <div className={classNames({ role: true, selected: focusOrganisationMember.role === 'member' }) } 
                        onClick={() => dispatch({ focusOrganisationMember: {...focusOrganisationMember, role: 'member' } })}>
                        <span>member</span>
                        <i></i>
                    </div>
                    <div className={classNames({ role: true, selected: focusOrganisationMember.role === 'admin' }) } 
                        onClick={() => dispatch({ focusOrganisationMember: {...focusOrganisationMember, role: 'admin' } })}>
                        <span>administrator</span>
                        <i></i>
                    </div>

                </div>
                <div className="nav-buttons">
                    <button type="button" onClick={(e) => { this.saveOrganisationRole(e) } } className="save standard warning">Save</button>  
                </div>
            </div>;
            break;

            case 'edit_toc_role':
  content = <div>
                <h1>Edit role of { focusTocMember.full_name }</h1>
                <a className="hide-modal" onClick={() => dispatch({ modal: false})}>X</a>

                <div className="roles-container">

                    <div className={classNames({ role: true, selected: focusTocMember.role === 'member' }) } 
                        onClick={() => dispatch({ focusTocMember: {...focusTocMember, role: 'member' } })}>
                        <span>member</span>
                        <i></i>
                    </div>
                    <div className={classNames({ role: true, selected: focusTocMember.role === 'moderator' }) } 
                        onClick={() => dispatch({ focusTocMember: {...focusTocMember, role: 'moderator' } })}>
                        <span>moderator</span>
                        <i></i>
                    </div>
                    <div className={classNames({ role: true, selected: focusTocMember.role === 'administrator' }) } 
                        onClick={() => dispatch({ focusTocMember: {...focusTocMember, role: 'administrator' } })}>
                        <span>administrator</span>
                        <i></i>
                    </div>

                </div>
                <div className="nav-buttons">
                    <button type="button" onClick={(e) => { this.saveTocRole(e) } } className="save standard warning">Save</button>  
                </div>
            </div>;
            break;

            case 'remove_stakeholder_toc_role':
  content = <div>
                <h1>Remove { focusTocMember.full_name } as stakeholder?</h1>
                <a className="hide-modal" onClick={() => dispatch({ modal: false})}>X</a>
                <div className="nav-buttons">
                    <button type="button" onClick={(e) => { this.removeStakeholderFromToc(e) } } className="save standard warning">Remove</button>  
                </div>
            </div>;
            break;

            case 'remove_stakeholder_organisation':
  content = <div>
                <h1>Remove { focusOrganisationMember.full_name } as stakeholder?</h1>
                <a className="hide-modal" onClick={() => dispatch({ modal: false})}>X</a>
                <div className="nav-buttons">
                    <button type="button" onClick={(e) => { this.removeStakeholderFromOrganisation(e) } } className="save standard warning">Remove</button>  
                </div>
            </div>;
            break;

            case 'close_organisation':
  content = <div>
                <h1>Are you sure you want to close { focusOrganisation.name } ?</h1>
                <a className="hide-modal" onClick={() => dispatch({ modal: false})}>X</a>
                <div className="nav-buttons">
                    <button type="button" onClick={(e) => { this.closeOrganisation(e) } } className="save standard warning">Close organisation</button>  
                </div>
            </div>;
            break;

            default:
            content = '';
        }
        return (
            <div key="modal" className={classNames({ modal: true, hidden: modal ? false : true })}>
            {content}
            </div>
        );

    }

}
        
export default withRouter(withStore(Modal));