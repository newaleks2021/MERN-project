import React, { Component } from 'react';
import { withRouter } from 'react-router-dom';
import { withStore } from '../store';
// import Select from 'react-select';
import "../styles/toggle.css"; // for ES6 modules

class Expert extends Component {

    constructor(props) {
        super(props);
        this.save = this.save.bind(this);
        this.onChange = this.onChange.bind(this);
        this.setAvatar = this.setAvatar.bind(this);
        this.favourite_stakeholder = this.favourite_stakeholder.bind(this);
    }

    favourite_stakeholder(e, id) {

        e.stopPropagation();

        const { IP, request, dispatch, notifications, user, toggleString } = this.props;

        const newUser = {
            ...user,
            favourite_experts: toggleString(user.favourite_experts || '', id)
        };

        let status = (user.favourite_experts || '').indexOf(id);

        request({ 
            url: `${IP}/edit_stakeholder`,
            method: 'post', 
            data: newUser
        }, (err, res) => {
            if(err) return console.log('?');

            dispatch({
                notifications: [...notifications, { status: 'success', message: status > -1 ? 'Expert unfavourited' : 'Expert favourited', icon: 'notify-success' }]
            });

        });

    }

    save() {

        const { IP, request, focusUser, dispatch, notifications } = this.props;

        if(!focusUser) return console.log('user not found');

        delete focusUser.reset_sent_at;
        
        delete focusUser.isActivated_at;

        delete focusUser.activated_at;

        delete focusUser.activation_sent_at;

        delete focusUser.created_at;

        delete focusUser.hasUsedFreeTrial;

        request({ 
            url: `${IP}/edit_stakeholder`,
            method: 'post', 
            data: focusUser
        }, (err, res) => {
            if(err) return console.log(err);

            dispatch({
                notifications: [...notifications, { status: 'success', message: 'Profile saved', icon: 'notify-success' }]
            });

        });

    }

    setAvatar(e) {
        const { focusUser, dispatch } = this.props;
        const file = e.target.files[0];
        const reader = new FileReader();
      
        reader.addEventListener('load', function () {
          dispatch({ focusUser: { ...focusUser, preview_avatar: reader.result } }); 
        }, false);
      
        if (file) reader.readAsDataURL(file);
    }

    componentWillMount() {

        const { match, dispatch, history, stakeholders, focusUser } = this.props;

        if(!match.params.id) return history.push('/landing');

        if(!focusUser) {

            dispatch({ focusUser: {
                full_name: '',
                function: '',
                website: '',
                location: '',
                bio: '',
                linkedin: '',
                about: ''
            }});
            
        }

        const user = stakeholders.find(u=>String(u.id)===match.params.id);
    
        if(user) dispatch({ focusUser: user });

    }
    
    onChange(e) {

        const { focusUser, dispatch } = this.props;
        
        dispatch({ focusUser: { ...focusUser, [e.target.name]: e.target.value }});

    }

    render() {

        const { focusUser, user, history } = this.props;

        if(!focusUser || !user) return null;

        return (
            <div key="expert" className="expert editable">

                <nav key="nav" className="top-nav">

                    <a className="main" onClick={() => history.push('/experts')}>Experts</a>
                    <span> > expert&nbsp;</span>
                    <span className="current" data-load="expert.load_expert_name">{focusUser.full_name}</span>
                </nav>

                <div className="content">

                    <button className="favorite" style={{
                        backgroundImage: (user.favourite_experts || '').split(',').indexOf(String(focusUser.id)) > -1 ? `url(/icon-starfilled.svg)` : `url(/icon-star.svg`
                    }} onClick={e => this.favourite_stakeholder(e, focusUser.id) }></button>

                    <div className="image-upload-container">
                        {
                            user.id === focusUser.id ? (
                                <div className="image admin circle" style={{backgroundImage: `url(${focusUser.preview_avatar || focusUser.avatar || '/placeholder-avatar.svg'})`}}>
                                    <input onChange={this.setAvatar} type="file" />
                                </div>
                            ) : (
                                <div className="image" style={{backgroundImage: `url(${focusUser.avatar || '/placeholder-avatar.svg'})`}}></div>
                            )
                        }
                    </div>

                    <form className="inputs">

                        <input type="text" name="full_name" placeholder="Full name" value={focusUser.full_name || ''} onChange={this.onChange} />
                        
                        <div>
                            <label className="position-short"></label>
                            <input name="function"  placeholder="Position" value={focusUser.function || ''} onChange={this.onChange} />
                        </div>
        
                        <div>
                            <label className="position-long"></label>
                            <input name="website" placeholder="Website" value={focusUser.website || ''} onChange={this.onChange} />
                        </div>

                        <div>
                            <label className="location"></label>
                            <input name="location"  placeholder="Location"  value={focusUser.location || ''} onChange={this.onChange} />
                        </div>

                        <div>
                            <label className="linkedin"></label> 
                            <input name="linkedin" value={ focusUser.linkedin || '' }  placeholder="Linkedin"  onChange={this.onChange} />
                        </div>

                        <span className="text">About me</span> 
                        <textarea name="bio" defaultValue={ focusUser.bio || '' } placeholder="About me"  onChange={this.onChange}></textarea>

                    </form>

                    <div className="nav-buttons">

                        <button onClick={() => history.push('/experts')}>Return to Experts</button>
                        <button className="save standard warning" onClick={this.save}>Save changes</button>

                    </div>

                </div>

            </div>
        );
    }
}

export default withRouter(withStore(Expert));