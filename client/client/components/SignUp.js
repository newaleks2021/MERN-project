import React, { Component } from 'react';
import { withRouter, Link } from 'react-router-dom';
import { withStore } from '../store';

class SignIn extends Component {

    constructor(props) {
        super(props);
        this.onSubmit = this.onSubmit.bind(this);
        this.onChange = this.onChange.bind(this);
    }
    
    onSubmit(e) {
        e.preventDefault();

        const { IP, request, focusUser, dispatch, notifications, history } = this.props;

        if(!focusUser) return console.log('user not found');

        request({ 
            url: `${IP}/register_stakeholder`,
            method: 'post', 
            data: {
                email: focusUser.email.toLowerCase(),
                username: focusUser.username,
                full_name: focusUser.full_name,
                password: focusUser.password
            }
        }, (err, res) => {
            if(err) return console.log(err);

            dispatch({
                notifications: [...notifications, { status: 'success', message: 'Thanks for registering, check your email.', icon: 'notify-success' }]
            });

            return history.push('/done');

        });

    }

    onChange(e) {

        const { focusUser, dispatch } = this.props;
        
        dispatch({ focusUser: { ...focusUser, [e.target.name]: e.target.value }});

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
                        <Link page="academy" to="/sign-in" onClick={() => dispatch({ mobile_menu: false })}>ToC Academy</Link>
                        <Link page="pricing" to="/pricing" onClick={() => dispatch({ mobile_menu: false })}>Pricing</Link>
                    </nav>
                </header>
            </div>,
            <section key="section" data-s="sign-up">
                <form onSubmit={this.onSubmit}>
                    <label className="name"><i></i> Full name</label><br />
                    <input type="text" name="full_name" onChange={this.onChange} /><br />
            
                    <label className="email"><i></i> Email</label><br />
                    <input type="email" name="email" onChange={this.onChange} /><br />
            
                    <label className="password"><i></i> Password</label><br />
                    <input type="password" name="password" onChange={this.onChange} /><br />
            
                    <label className="username"><i></i> Username</label><br />
                    <input type="text" name="username" onChange={this.onChange} /><br />
                    
                    <input type="submit" />
                </form><br />
                <Link to="/sign-in"><span className="create-account">Already have an account? Sign in here.</span></Link>
            </section>
        ];
    }
}

export default withRouter(withStore(SignIn));