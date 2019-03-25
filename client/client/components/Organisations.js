import React, { Component } from 'react';
import classNames from 'classnames';
import { withRouter } from 'react-router-dom';
import { withStore } from '../store';

class Organisations extends Component {

    constructor(props) {
        super(props);
        
        this.acceptInvite = this.acceptInvite.bind(this);
        this.rejectInvite = this.rejectInvite.bind(this);
        this.findMemberOfOrganisation = this.findMemberOfOrganisation.bind(this);
        this.acceptInvite = this.acceptInvite.bind(this);
        this.rejectInvite = this.rejectInvite.bind(this);
    }

    acceptInvite() {
        
        const {
            request,
            IP,
            dispatch,
            notifications,
            focusOrganisationMember
        } = this.props;
console.log(focusOrganisationMember);
        if(!focusOrganisationMember.id) return setTimeout(() => this.acceptInvite(), 1000);

        let data = { 
            member: focusOrganisationMember.id, 
            token: focusOrganisationMember.admin_activation_hash
        };
        
        console.log('data for email response: ', data);

        return request({ 
            url: `${IP}/make_stakeholder_admin`,
            method: 'post', 
            data: data
        }, (err, res) => {
            if(err) return console.log('?');
            dispatch({
                notifications: [...notifications, { status: 'success', message: 'Success', icon: 'notify-success'  }]
            });
        });

    }

    rejectInvite() {

        const {
            request,
            IP,
            dispatch,
            notifications,
            focusOrganisationMember
        } = this.props;
console.log(focusOrganisationMember);
        if(!focusOrganisationMember.id) return setTimeout(() => this.acceptInvite(), 1000);

        let data = { 
            member: focusOrganisationMember.id, 
            token: focusOrganisationMember.admin_activation_hash
        };
        
        console.log('data for email response: ', data);

        return request({ 
            url: `${IP}/decline_stakeholder_admin`,
            method: 'post', 
            data: data
        }, (err, res) => {
            if(err) return console.log('?');
            dispatch({
                notifications: [...notifications, { status: 'success', message: 'Success', icon: 'notify-success'  }]
            });
        });

    }

    findMemberOfOrganisation(organisation_id, action) {

        const { user, organisation_members, dispatch } = this.props;

        const member = organisation_members.reduce((memo, m)=> {
            if(((organisation_id === m.organisation_id)) && (user.id === m.stakeholder_id) ) memo.push(m);
            return memo;
        }, []);

        if(member) {
            dispatch({ focusOrganisationMember: member[0] });
            if(action === 'accept') return this.acceptInvite();
            if(action === 'reject') return this.rejectInvite();
        }

        else console.log('member not found');

    }

    render() {

        const { tocs, plans, organisations, organisation_members, toggled_organisation, dispatch, history, user } = this.props;

        if(!organisation_members || !organisations) return '';

        let InvitedOrgs = [];

        const userOrgs = organisation_members.reduce((memo, m, index) => {
            // filter logged in user members
            if(m.stakeholder_id !== user.id) return memo;
            // filter organisations linked to the logged in user organisation member objects
            const org = organisations.find((o) => o.id === m.organisation_id);
            // filter invited / accepted
            if(org) {
                if(m.isAdmin) {
                    memo.push(org);
                    return memo;
                }
                if(m.admin_activation_hash && m.isAdmin) {
                    memo.push(org);
                    return memo;
                }
                if(m.member_activation_hash && !m.isAdmin) {
                    memo.push(org);
                    return memo;
                }
                InvitedOrgs.push(org);
                return memo;
            }

            return memo;

        }, []);
        
        return [
            <nav key="nav" className="top-nav">
                <h2>My Organisations</h2>
                <button data-modal="organisation-new" onClick={() => dispatch({ focusOrganisation: {}, modal: 'organisation_create'})} className="create-organisation big round sky icon add-white">Create Organisation</button>
            </nav>,
            
            <div key="body" className="organisations">

                <label className="length"><small>{userOrgs.length}</small><span>Organisation{ userOrgs.length === 1 ? '' : 's'}</span></label>
            
                <div className="invited-content">
                
                    { InvitedOrgs.map(o => o.deactivated_at ? null : 
                        <div key={o.id} className="orga invited">

                            <div className="image" style={{ backgroundImage: `url(${ o.avatar || '/placeholder-organisation.svg' })` }}></div>
                            
                            <div className="col name">{ o.name }</div>

                            <div className="col options">
                                
                                <i>You have been invited for this organisation</i>

                                <div className="invite-options">

                                    <button className="standard small round bg-silver" onClick={() => 
                                        this.findMemberOfOrganisation(o.id, 'reject')
                                    }>decline</button>  

                                    <button className="standard small round accept" onClick={() => 
                                        this.findMemberOfOrganisation(o.id, 'accept')
                                    }>accept</button>  

                                </div>

                            </div>

                        </div>
                    )}
                
                </div>

                <div className="content">
                    { userOrgs.map(o => {
                        
                        const plan = plans.find(p => p.id === o.plan_id);

                        const orgTocs = tocs.reduce((memo, toc) => {
                            if(toc.organisation_id === o.id) memo.push(toc);
                            return memo;
                        }, []);

                        return o.deactivated_at ? null : <div key={o.id} className="orga">
                            
                            <button className="dots" onClick={() => dispatch({ toggled_organisation: toggled_organisation !== o.id ? o.id : null })}></button>

                                <div className={classNames({
                                    'toggle-actions': true,
                                    toggled: toggled_organisation === o.id
                                })}>
                                    <a className="edit" onClick={()=>{
                                        dispatch({ focusOrganisation: o, active_tab: 'details', toggled_organisation: false });
                                        history.push(`/organisation/${o.id}`);
                                    }}>Edit Organisation</a>
                                </div>

                                <div className="image" style={{ backgroundImage: `url(${ o.avatar || '/placeholder-organisation.svg' })` }}></div>
                                <div className="col name">{ o.name }</div>
                                <div className="col tocs">{orgTocs.length}/{plan.max_tocs} ToCs</div>
                                <div className="col actions">
                                    <span>{plan ? plan.name : null }</span>
                                    <button onClick={() => {
                                        dispatch({ focusOrganisation: o, active_tab: 'subscription', toggled_organisation: false });
                                        history.push(`/organisation/${o.id}`);
                                    }} className="standard small round accept">upgrade plan</button>
                                </div>

                            </div>;
                    })}
                </div>
            
            </div>];
    }


}

export default withRouter(withStore(Organisations));