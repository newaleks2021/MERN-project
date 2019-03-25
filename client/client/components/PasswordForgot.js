import React, { Component } from 'react';
import { withRouter, Link } from 'react-router-dom';
import { withStore } from '../store';

class PasswordForgot extends Component {

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
        console.log(e);
        e.preventDefault();

        const { IP, request, focusUser, dispatch, notifications } = this.props;

        if(!focusUser) return console.log('user not found');

        request({ 
            url: `${IP}/send_stakeholder_reset_password`,
            method: 'post', 
            data: {
                email: focusUser.email.toLowerCase()
            }
        }, (err, res) => {
            if(err) return console.log(err);

            dispatch({
                notifications: [...notifications, { status: 'success', message: 'Check your email to reset password', icon: 'notify-success' }]
            });

        });

    }

    render(){
        const { dispatch, mobile_menu } = this.props;
        return [
            <div key="top" className="top-container">
            <header className="top">
                <Link className="logo" to="/"></Link>
                <div className="mobile-menu" onClick={() => dispatch({ mobile_menu: !mobile_menu })}></div>
                <nav className={ mobile_menu ? 'toggled' : '' }>
                    <Link page="sign-in" to="/sign-in" onClick={() => dispatch({ mobile_menu: false })}>Log in</Link>
                    <Link page="sign-up" to="/sign-up" onClick={() => dispatch({ mobile_menu: false })}><button className="small sky round" >Sign up</button></Link>
                    <Link page="academy" to="/sign-in" onClick={() => dispatch({ mobile_menu: false })}>ToC Academy</Link>
                    <Link page="pricing" to="/pricing" onClick={() => dispatch({ mobile_menu: false })}>Pricing</Link>
                </nav>
            </header>
        </div>,
        <section key="section" data-s="password-forgot">
            <form onSubmit={this.onSubmit}>
                <label>Please enter your e-mail address so you can reset your password:</label><br />
                <input type="email" onChange={ this.onChange } name="email" /><br />
                <input type="submit" value="Reset password" />
            </form><br />
            <Link to="/sign-up"><span className="create-account">No Account? Click here to create</span></Link>
        </section>
        ];
    }
}

export default withRouter(withStore(PasswordForgot));