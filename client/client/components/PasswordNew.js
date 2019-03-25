import React, { Component } from 'react';
import { withRouter } from 'react-router-dom';
import { withStore } from '../store';

class PasswordNew extends Component {

    constructor(props) {
        super(props);
        this.onSubmit = this.onSubmit.bind(this);
        this.onChange = this.onChange.bind(this);
    }

    onChange(e) {

        const { focusUser, dispatch } = this.props;
        
        dispatch({ focusUser: { ...focusUser, [e.target.name]: e.target.value }});

    }
    
    onSubmit(e) {
        e.preventDefault();

        const { IP, request, focusUser, dispatch, notifications, stakeholders, history } = this.props;

        console.log(focusUser, stakeholders);
        if(!focusUser || !stakeholders.length) return console.log('user not found');

        // find user based on focusUser id triggered from EmailResponse component
        const usr = stakeholders.find((s) => String(s.id) === focusUser.id);
console.log('USR', usr);
        if(!usr) return console.log('usr', usr);

        request({ 
            url: `${IP}/reset_stakeholder_password`,
            method: 'post', 
            data: {
                id: parseInt(focusUser.id, 10),
                password: String(focusUser.password),
                reset_hash: focusUser.reset_hash
            }
        }, (err, res) => {
            if(err) return console.log(err);

            dispatch({
                notifications: [...notifications, { status: 'success', message: 'Password reset', icon: 'notify-success' }]
            });

            history.push('/');

        });

    }

    render(){
        return <section data-s="new-password">
            <form onSubmit={this.onSubmit}>
            
                <label>Please enter your new password:</label><br />
                <input type="password" onChange={ this.onChange } name="password" /><br />

                <input type="submit" value="Reset password" />
            
            </form><br />
        </section>;
    }
}

export default withRouter(withStore(PasswordNew));