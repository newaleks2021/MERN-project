import React, { Component } from 'react';
// import classNames from 'classnames';
import { withRouter } from 'react-router-dom';
import { withStore } from '../store';
import Select from 'react-select';
import classNames from 'classnames';
import moment from 'moment';
import InputRange from 'react-input-range';

class Organisation extends Component {

    constructor(props) {
        super(props);
        this.state = {
            plan: null,
            expired: '',
            coupon: '',
            value: 0,
        };
        this.onChange = this.onChange.bind(this);
        this.setAvatar = this.setAvatar.bind(this);
        this.save = this.save.bind(this);
        this.reInvite = this.reInvite.bind(this);
        this.findStakeholder = this.findStakeholder.bind(this);
        this.checkout = this.checkout.bind(this);
    }

    componentWillMount() {

        const { dispatch, match, organisation_members, user } = this.props;

        // find out if member is admin
        let admin = organisation_members.reduce((memo, m) => {
            if((String(m.organisation_id) === String(match.params.id)) && (String(m.stakeholder_id) === String(user.id))) {
                memo = m;
                return memo;
            }
            return memo;
        }, {});

        if(admin && admin.isAdmin) dispatch({ isAdmin: true });

    }

    componentDidMount() {

        const { 
            match, 
            organisations, 
            history, 
            dispatch, 
            active_tab, 
            plans,
            focusOrganisation, 
            organisation_members, 
            user 
        } = this.props;

        if(!organisations || !match.params.id || !organisation_members.length) return history.push('/organisations');

        const member = organisation_members.find(m => m.organisation_id === focusOrganisation.id && m.stakeholder_id === user.id);
    
        dispatch({ isAdmin: member && member.isAdmin === 1 }); // rework later

        const org = organisations.find(o=>String(o.id)===String(match.params.id));
        if(org) {
            if(!active_tab) dispatch({ active_tab: 'details' });
            return dispatch({ focusOrganisation: org });
        }
        if(!org) {
            history.push('/organisations');
            return null;
        }

    }

    reInvite(email, organisation) {

        const {  IP, dispatch, request, notifications } = this.props;

        request({ 
            url: `${IP}/reinvite_stakeholder_as_admin`,
            method: 'post', 
            data: {
                email,
                organisation
            }
        }, (err, res) => {
            if(err) return console.log('?');
            dispatch({
                notifications: [...notifications, { status: 'success', message: 'Invite has been send again', icon: 'notify-success'  }]
            });
        });

    }

    onChange(e) {

        const { focusOrganisation, dispatch } = this.props;
        
        dispatch({ focusOrganisation: { ...focusOrganisation, [e.target.name]: e.target.value }});

    }

    save() {

        const { 
            IP, 
            request, 
            focusOrganisation, 
            dispatch, 
            notifications, 
            history 
        } = this.props;

        if(!focusOrganisation) return console.log('no toc found');

        delete focusOrganisation.activated_at;
        delete focusOrganisation.created_at;
        delete focusOrganisation.extend_trial;
        delete focusOrganisation.subs_exp_date;

        request({ 
            url: `${IP}/edit_organisation`,
            method: 'post', 
            data: focusOrganisation
        }, (err, res) => {
            if(err) return console.log('?');
            dispatch({
                notifications: [...notifications, { status: 'success', message: `${ focusOrganisation.name ? `Organisation ${ focusOrganisation.name} saved` : 'Organisation saved'}`, icon: 'notify-success'  }]
            });
        });

        history.push('/organisations');

    }

    setAvatar(e) {
        const { focusOrganisation, dispatch } = this.props;
        const file = e.target.files[0];
        const reader = new FileReader();
      
        reader.addEventListener('load', function () {
          dispatch({ focusOrganisation: { ...focusOrganisation, preview_avatar: reader.result } }); 
        }, false);
      
        if (file) reader.readAsDataURL(file);
    }

    findStakeholder(id, property) {
        const { stakeholders } = this.props;
        const s = stakeholders.find((s) => { return s.id === id; });
        if(s) return s[property];
        return false;
    }

    checkout() {
        if(!this.state.plan) return;
        const { match, request, IP, dispatch } = this.props;
        const organisation = match.params.id;
        const plan = parseInt(this.state.plan.value.id, 10);
        request({
            url: `${IP}/checkout_payment`,
            method: 'post',
            data: { plan, organisation, couponCode: this.state.coupon }
        }, (err, res) => {
            if(err) return console.log('?');
            console.log(res);
            dispatch({
                checkout: res
            });
        });
    }

    render() { 
        
        const { 
            active_tab, 
            focusOrganisation, 
            history, 
            countries, 
            dispatch, 
            isAdmin, 
            toggled_toc,
            categories,
            tocs,
            checkout,
            organisation_members,
            toggled_organisation_member,
            plans,
            IP,
            // focusOrganisationMember,
        } = this.props;

        if(!focusOrganisation) return null;

        const pricedPlans = plans.reduce((memo, plan) => {
            if(plan.price) memo.push(plan);
            return memo;
        }, []);

        const subscriptionOptions = pricedPlans.reduce((memo, plan) => {
            if((this.state.subscription || pricedPlans[0]).max_tocs === plan.max_tocs) memo.push(plan);
            return memo;
        }, []);

        const pending_list = organisation_members.reduce((memo, m) => {
            if(m.organisation_id !== focusOrganisation.id) return memo;
            if(m.member_activation_sent_at || m.admin_activation_sent_at) {
                memo.push(m);
                return memo;
            }
            return memo;
        }, []);

        const registered_list = organisation_members.reduce((memo, m) => {
            if(m.organisation_id !== focusOrganisation.id) return memo;
            if(!m.member_activation_sent_at && !m.admin_activation_sent_at) {
                memo.push(m);
                return memo;
            }
            return memo;
        }, []);

        const orgsTocs = tocs.reduce((memo, t) => {
            if(t.organisation_id !== focusOrganisation.id) return memo;
            memo.push(t);
            return memo;
        }, []);

        return [
            <nav key="nav" className="top-nav organisation">
                <a className="main" onClick={() => history.push('/organisations')}>Organisations</a>
                <span>> organisation</span>
                <span className="current">&nbsp;{ focusOrganisation.name }</span>
            </nav>,
            <div key="body" className="organisation-viewer" data-active={ active_tab }>
                <div className="content">
                    <nav className="tab-nav organisation" data-load="organisation.$nav,organisation.load_nav">
                        <a onClick={() => this.props.dispatch({ active_tab: 'details' }) }>
                            <i style={{backgroundImage: 'url(/icon-edit.svg)' }}></i>
                            <span>Details</span>
                        </a>
                        <a onClick={() => this.props.dispatch({ active_tab: 'administrators' }) }>
                            <i style={{backgroundImage: 'url(/icon-user.svg)' }}></i>
                            <span>Administrators</span>
                        </a>
                        <a onClick={() => this.props.dispatch({ active_tab: 'tocs' }) }>
                            <i style={{backgroundImage: 'url(/icon-paper-clip.svg)' }}></i>
                            <span>ToCs</span>
                        </a>
                        <a onClick={() => this.props.dispatch({ active_tab: 'payment' }) }>
                            <i style={{backgroundImage: 'url(/icon-creditcard.svg)' }}></i>
                            <span>Payment info</span>
                        </a>
                        <a onClick={() => this.props.dispatch({ active_tab: 'subscription' }) }>
                            <i style={{backgroundImage: 'url(/icon-subscription.svg)' }}></i>
                            <span>Subscription</span>
                        </a>
                        <div className="active-line"></div>
                    </nav>

                    <section data-tab="details">
                            
                        <h1>Details</h1>
                        
                        <div className="rows" data-rows="2">

                            <div className="row">

                                <label>Organisation Name</label>
                                <input type="text" name="name" onChange={ this.onChange } value={ focusOrganisation.name || '' } />

                                <label>City</label>
                                <input type="text" name="city" onChange={ this.onChange } value={ focusOrganisation.city || '' } />

                                <label>Address</label>
                                <input type="text"  name="address" onChange={ this.onChange } value={ focusOrganisation.address || '' } />

                                <label>Website</label>
                                <input type="text"  name="website" onChange={ this.onChange } value={ focusOrganisation.website || '' } />

                                <label>Country</label>
                                <div className="select-container">
                                    <Select
                                        placeholder={ focusOrganisation.country ? focusOrganisation.country : 'Select a country...' }
                                        closeMenuOnSelect={true}  
                                        value={countries.find(c => String(c.value) === String(focusOrganisation.country)) }
                                        onChange={selected => { dispatch({ focusOrganisation: { ...focusOrganisation, country: selected.value } } ) } }
                                        options={countries.reduce((memo, c) => { 
                                            memo.push({ value: c, label: c });
                                            return memo;
                                        }, [])}
                                    />
                                </div>


                            </div><div className="row">
                                <div className="image-upload-container">
                                {
                                    isAdmin ? (
                                        <div className="image admin" style={{backgroundImage: `url(${ (focusOrganisation.preview_avatar || focusOrganisation.avatar) ? focusOrganisation.preview_avatar || focusOrganisation.avatar : '/placeholder-organisation.svg'})`}}>
                                            <input onChange={this.setAvatar} type="file" />
                                        </div>
                                    ) : (
                                        <div className="image" style={{backgroundImage: `url(${focusOrganisation.avatar || '/placeholder-organisation.svg'})`}}></div>
                                    )
                                }
                                </div>
                                <a className="close-organisation" onClick={() => dispatch({ modal: 'close_organisation' }) }>Close this organisation?</a>

                            </div>

                        </div>

                        <div className="nav-buttons">

                            <button className="back standard icon" onClick={() => history.push('/organisations') }>Return to My Organisations</button>

                            <button className="save standard warning" onClick={ this.save }>Save changes</button>

                        </div>

                    </section>

                    <section data-tab="administrators">
                            
                        <h1>Administrators</h1>
                        
                        <button onClick={ () => dispatch({ modal: 'organisation_invite' }) } className="add-administrator small standard icon silver add mobile-remove-text"><a>Add administrator</a></button>
                        
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
                                            { pending_list[key].admin_activation_hash ? <small data-role="administrator">Administrator</small> : '' }
                                            { pending_list[key].admin_activation_hash && pending_list[key].member_activation_hash ? <span>/</span> : ''}
                                            { pending_list[key].member_activation_hash ? <small data-role="member">Member</small> : '' }
                                        </div>
                                        <div className="pending-actions">
                                            <button className="small standard silver icon resend" onClick={() => this.reInvite(this.findStakeholder(pending_list[key].stakeholder_id, 'email'), pending_list[key].organisation_id) } data-modal="toc-invite" data-id={ pending_list[key].toc_id }><span>Resend invitation</span></button>
                                            <button className="small standard silver icon remove" onClick={() => dispatch({ 
                                                focusOrganisationMember: {
                                                    organisation_id: pending_list[key].organisation_id,
                                                    email: this.findStakeholder(pending_list[key].stakeholder_id, 'email'), 
                                                    full_name: this.findStakeholder(pending_list[key].stakeholder_id, 'full_name'),
                                                    stakeholder_id: pending_list[key].stakeholder_id,
                                                    role: pending_list[key].admin_activation_hash ? 'admin' : 'member' },
                                                modal: 'confirm_remove_invite_organisation' }) }>
                                                <span>remove</span>
                                            </button>
                                        </div>
                                    </div>) : ''
                                }


                            </div>

                            <h4>Users of this Organisation</h4>
                        
                            <div className="registered-container">{
                                Object.keys(registered_list).map((key) =>
                                <div className="member" key={key}>
                                    <button className="dots" onClick={() => dispatch({ toggled_organisation_member: toggled_organisation_member !== key ? key : null })}></button>

                                    <div className={classNames({
                                        'toggle-actions': true,
                                        toggled: toggled_organisation_member === key
                                    })}>
                                        <a className="edit" onClick={()=>{
                                            dispatch({
                                                modal: 'edit_organisation_role',
                                                toggled_organisation_member: false,
                                                focusOrganisationMember: {
                                                    organisation_id: registered_list[key].organisation_id,
                                                    full_name: this.findStakeholder(registered_list[key].stakeholder_id, 'full_name'),
                                                    email: this.findStakeholder(registered_list[key].stakeholder_id, 'email'),
                                                    id: registered_list[key].id,
                                                    role: registered_list[key].isAdmin ? 'admin' : 'member'
                                                }
                                            });
                                        }}>Edit role</a>
                                        <a data-action="delete_member" onClick={()=>{
                                            dispatch({
                                                modal: 'remove_stakeholder_organisation',
                                                toggled_organisation_member: false,
                                                focusOrganisationMember: {
                                                    full_name: this.findStakeholder(registered_list[key].stakeholder_id, 'full_name'),
                                                    stakeholder_id: registered_list[key].stakeholder_id,
                                                    organisation_id: registered_list[key].organisation_id,
                                                    email: this.findStakeholder(registered_list[key].stakeholder_id, 'email'),
                                                    role: registered_list[key].isAdmin ? 'admin' : 'member'
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
                                            { registered_list[key].isAdmin ? <small data-role="administrator">Administrator</small> : <small data-role="member">Member</small> }
                                    </div>
                                    <div className="pending-actions">
                                        <button className="small standard silver icon resend" data-modal="toc-confirm"><span>Resend invitation</span></button>
                                        <button className="small standard silver icon remove" data-modal="toc-confirm"><span>remove</span></button>
                                    </div>
                                </div>)
                            }</div>
                        
                        </div>

                        <div className="nav-buttons">

                            <button className="back standard icon" onClick={() => history.push('/organisations') }>Return to My Organisations</button>

                        </div>

                    </section>

                    <section data-tab="tocs">
                            
                        <h1>ToCs of this organisation</h1>

                        <div className="tocs-container">
                        {
                            orgsTocs.map(toc => toc.deactivated_at ? null : <div className="toc" key={ toc.key || Math.random() }>
                        
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
                            <p>{ toc.about || 'Short description here or about? I would say short description.' }</p>
                            <div className="actions">
                                <button className="small regular bend view" onClick={() => { history.push(`/toc/${toc.id}/users`); dispatch({ active_tab: 'users' })}}>View users</button>
                                <button className="small regular bend invite icon add" onClick={() => dispatch({ modal: 'toc_invite', focusToc: { ...toc }})} data-modal="toc-invite" data-id={ toc.id }>Invite user</button>
                                <br />
                                <a className="uuid" target="_blank" href={`https://app.changeroo.com/project/${ toc.uuid }`}>Open ToC</a>
                            </div>
    
                        </div>)
                        }
                        </div>

                        <div className="nav-buttons">

                            <button className="back standard icon" onClick={() => history.push('/organisations') }>Return to My Organisations</button>

                        </div>

                    </section>

                    <section data-tab="payment">
                            
                        <h1>Payment information</h1>
                        
                        <div className="rows tablet-break" data-rows="1">
                            
                            <div style={{ minWidth: '300px' }} className="row stretch">

                                <div className="content">

                                    <label>Full name</label>
                                    <input disabled type="text" value="Creemers Foundation" />

                                    <label>Address</label>
                                    <input disabled type="text" value="913 Magali Parkways" />

                                    <label>Country</label>
                                    <select disabled>
                                        <option value="Belarus">Belarus</option>
                                        <option>Netherlands</option>
                                        <option>Belgium</option>
                                    </select>

                                    <label>Website</label>
                                    <input disabled type="text" value="https://luna.biz" />

                                    <label>VAT</label>
                                    <input disabled type="text" value="" />

                                </div>

                            </div>
                            
                            <div className="row payment-history">
                                
                                <h2>Transaction history</h2>

                                <div className=" rows column">

                                    <div className="row">
                                        <span>
                                            <small>Invoice number</small>
                                            <small>Amount ex VAT</small>
                                            <small>Amount inc VAT</small>
                                            <small>Plan Name</small>
                                            <small>Coupon code</small>
                                            <small>Created at</small>
                                        </span>
                                    </div>
                                    <div className="row">
                                        <span>
                                            <small>23823904</small>
                                            <small>49,50</small>
                                            <small>55,00</small>
                                            <small>Plan.doc</small>
                                            <small>0293492340</small>
                                            <small>7 July 2019</small>
                                        </span>
                                    </div>
                            
                                </div>

                            </div>

                        </div>

                        <div className="nav-buttons">

                            <button className="back standard icon" onClick={() => history.push('/organisations') }>Return to My Organisations</button>

                            <button className="save standard warning" onClick={ this.save }>Save changes</button>

                        </div>
                    
                    </section>

                    { checkout && checkout.payment ? (
                        <section data-tab="subscription">
                        {
                            checkout.payment.raw.total === 0 ?
                                <form
                                    action={`${IP}/complete_changeroo?_csrf=${checkout.payment.csrfToken}`}
                                    method="post"
                                >
                                    <input type="hidden" name="amount" value={checkout.payment.raw.total} />
                                    <input type="hidden" name="currency" value={checkout.payment.currencyCode} />
                                    <input type="hidden" name="description" value={`plan-${checkout.plan.id}`} />
                                    <input type="hidden" name="transaction_description" value={`Changeroo plan ${checkout.plan.name}`} />
                                    <input type="hidden" name="language" value="en" />
                                    <input type="hidden" name="hash" value={checkout.hash} />
                                    <input type="submit" />
                                </form>
                            :
                                <form
                                    action="https://secure.paylane.com/order/cart.html"
                                    method="post"
                                >
                                    <input type="hidden" name="amount" value={checkout.payment.raw.total} />
                                    <input type="hidden" name="currency" value={checkout.payment.currencyCode} />
                                    <input type="hidden" name="merchant_id" value={checkout.merchant_id} />
                                    <input type="hidden" name="description" value={`plan-${checkout.plan.id}`} />
                                    <input type="hidden" name="transaction_description" value={`Changeroo plan ${checkout.plan.name}`} />
                                    <input type="hidden" name="transaction_type" value="S" />
                                    <input type="hidden" name="back_url" value={`${IP}/paylane_success`} />
                                    <input type="hidden" name="language" value="en" />
                                    <input type="hidden" name="hash" value={checkout.hash} />
                                    <input type="hidden" name="customer_name" value={checkout.stakeholder.full_name} />
                                    <input type="hidden" name="customer_email" value={checkout.stakeholder.email} />
                                    <input type="hidden" name="customer_country" value={checkout.payment.countryCode} />
                                    <input type="submit" />
                                </form>
                        }
                            <pre>{JSON.stringify(checkout, null, 2)}</pre>
                        </section>
                    ) : (
                        <section data-tab="subscription">

                            <div className="content">

                                <div className="options">
                                    { focusOrganisation.plan_id === plans[0].id ? (
                                    <div className="option trial">
                                        <h3>Free Trial</h3>
                                        <label>{moment(focusOrganisation.subs_exp_date).diff(moment(), 'days')} days left</label>
                                        <label>1 Theory of Change</label><br/>
                                        <p>Explore the benefits of Changeroo with a trial period</p>
                                    </div>
                                    ) : null }

                                    <div className="option subscription">
                                        <h3>Subscription</h3>
                                        { <p>{(this.state.subscription || pricedPlans[0]).max_tocs} Theories of Change</p> }
                                        { <div className="toc-amount">
                                            <InputRange
                                                maxValue={pricedPlans.reduce((memo, plan) => {
                                                    return memo > plan.max_tocs ? memo : plan.max_tocs;
                                                }, 0)}
                                                minValue={0}
                                                value={(this.state.subscription || pricedPlans[0]).max_tocs || 0}
                                                onChange={value => {
                                                    this.setState({
                                                        subscription: pricedPlans.find((plan) => {
                                                            return value <= plan.max_tocs;
                                                        }, 0)
                                                    });
                                                }} />
                                        </div> }
                                        {
                                           subscriptionOptions.length > 1 ? <label><input type="checkbox" /> Quarterly / Yearly</label> : null
                                        }
                                        <p>&euro;{ (this.state.subscription || pricedPlans[0]).price },-</p>
                                        <button>Get Started</button>
                                    </div>
                                </div>
                                
                                <div>
                                    <label>Coupon <i>(optional)</i></label>
                                    <input value={this.state.coupon} onChange={e => this.setState({ coupon: e.target.value })} />
                                    <button
                                        onClick={this.checkout}
                                        className="big bend sky"
                                    >
                                        Upgrade / Extend subscription
                                    </button>
                                </div>

                            </div>

                        </section>
                    )}

                </div>

            </div>
        ];
    }
}

export default withRouter(withStore(Organisation));