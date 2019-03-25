import React, { Component } from 'react';
import { withRouter, Link } from 'react-router-dom';
import axios from 'axios';
import { withStore } from '../store';

class SignIn extends Component {
    
    constructor(props) {
        super(props);
        this.onSubmit = this.onSubmit.bind(this);
    }
    
    onSubmit(e) {
        e.preventDefault();
        const { IP, credentials, history, dispatch, api } = this.props;
        const { password, email } = credentials;

        if(!email) return dispatch({
            invalid_state: new Date(),
            error: { email: 'Vul een e-mail in' }
        });
        
        if(!password) return dispatch({
            invalid_state: new Date(),
            error: { password: 'Vul een wachtwoord in' }
        });

        axios({
            // @TODO DO NOT SEND CREDENTIALS IN A GET REQUEST!! This should be done w/ POST
            url: `${IP}/signin/${email.toLowerCase()}/${password}/session`,
            method: 'get',
            withCredentials: true,
        }).then(function (response) {
            dispatch({ password: '' });
            if(!response.data) return;
            api(response.data);
            if(!response.data.error) history.push('/landing');
        }).catch(function (error) {
            dispatch({ password: '' });
            console.log(error);
        });
    }

    render(){
        const { mobile_menu, dispatch, credentials, error, invalid_state } = this.props;
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
        <section key="section" data-s="sign-in">
            <form onSubmit={this.onSubmit}>
                <label className="email"><i></i> E-mail Address</label><br />
                <input onChange={e=>dispatch({
                    credentials: { ...credentials, email: e.target.value }
                })} type="email" value={credentials.email} /><br />
                { invalid_state && error.email ? <small className="error">{error.email}</small> : null }
                <label className="password"><i></i> Password</label><br />
                <input onChange={e=>dispatch({
                    credentials: { ...credentials, password: e.target.value }
                })} type="password" value={credentials.password}/><br />
                { invalid_state && error.password ? <small className="error">{error.password}</small> : null }
                <input type="submit" value="Log in" />
            </form><br />
            <Link to="/password-forgot"><span className="password-forgot">Forgot password?</span></Link>
            <Link to="/sign-up"><span className="create-account">Create account</span></Link>
            
        </section>
        ];
    }
}

export default withRouter(withStore(SignIn));