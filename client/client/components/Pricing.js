import React, { Component } from 'react';
import { Link, withRouter } from 'react-router-dom';
import { withStore } from '../store';

class Pricing extends Component {
    componentWillMount() {
        this.props.dispatch({ show_navigation: false });
    }
    componentWillUnmount() {
        this.props.dispatch({ show_navigation: true });
    }
    render() {

        const { dispatch, mobile_menu } = this.props;

        return <div key="pricing" className="pricing">

            <header key="header" className="top">
                <Link className="logo" to="/"></Link>
                <div className="mobile-menu" onClick={() => dispatch({ mobile_menu: !mobile_menu })}></div>
                <nav className={ mobile_menu ? 'toggled' : '' }>
                    <Link page="sign-in" to="/sign-in" onClick={() => dispatch({ mobile_menu: false })}>Log in</Link>
                    <Link page="sign-up" to="/sign-up" onClick={() => dispatch({ mobile_menu: false })}><button className="small sky round" >Sign up</button></Link>
                    <Link page="academy" to="/sign-in" onClick={() => dispatch({ mobile_menu: false })}>ToC Academy</Link>
                    <Link page="pricing" to="/pricing" onClick={() => dispatch({ mobile_menu: false })}>Pricing</Link>
                </nav>
            </header>

            <section className="introduction">
                <h1>The right subscription for every outcome</h1>
                <p>Every license comes with full functionality, including</p>
                <div className="functionality rows">
                    <div className="row">
                        <label>Design of your Theory of Change</label>
                        <label>Nested ToC's</label>
                        <label>Narrative intergration in your ToC visualisation</label>
                        <label>Remote collaboration</label>
                        <label>Guilding resources</label>
                        <label>visualisation of your learning process</label>
                    </div>
                    <div className="row">
                        <label>Co-creation with stakeholders</label>
                        <label>Embed functionalities</label>
                        <label>Invite stakeholders for feedback</label>
                        <label>ToC export functionalities</label>
                        <label>ToC as a living document for adaptive learning</label>
                        <label>Central place to record updates and changes to your ToC's</label>
                    </div>
                </div>

                <button className="standard warning">Buy now for €295/year</button>
            </section>

            <section className="picker">
                <h2>The right subscription for every outcome</h2>
                <p>Choose the subscription plan that fits your need. subscription plans differ in the number of active Theories of Change you can have. Theories of Change that you have archived are excluded from this count.</p>
                <small>Prices in Euro's. VAT may apply.</small>
           
                <div className="options">
                    <div className="option trial">
                        <h3>Free Trial</h3>
                        <label>30 days</label>
                        <label>1 Theory of Change</label><br/>
                        <p>Explore the benefits of Changeroo with a trial period</p>
                        <button>Get Started</button>
                    </div>

                    <div className="option subscription">
                        <h3>Subscription</h3>
                        <p>20+ Theories of Change</p>
                        <button>Get Started</button>
                    </div>
                </div>

                <p>For any additional questions, please check out our <Link to="/support">support page</Link> or feel free to <Link to="/">contact us</Link>.</p>

            </section>

            <section className="academy">

                <div className="icon"></div>
                <div className="content">
                    <h2>Academic License</h2>
                    <p>For academic institutions that would like to incorporate Changeroo in their courses, we offer special discounts. Please <Link to="/">contact</Link> us and tell us more about your needs.</p> 
                </div>
            </section>

            <footer key="footer">

                <div className="nav">
                    <div className="logo"></div>
                    <div className="links">
                        <div>
                            <Link to="/partnership">Partnership</Link>
                            <Link to="/support">Support</Link>
                            <Link to="/contact">Contact</Link>
                            <Link to="/privacy">Privacy</Link>
                            <Link to="/pricing">Pricing</Link>
                            <Link to="/terms">Terms</Link>
                        </div>
                    </div>
                    <div className="mailing">
                        <span>Say Hello!</span>
                        <small>info@changeroo.com</small><br />
                        <button className="small rounded sky">Sign up</button>
                    </div>
                    <div className="social">
                        <a className="fb">&nbsp;</a>
                        <a className="linkedin">&nbsp;</a>
                        <a className="twitter">&nbsp;</a>
                    </div>
                </div>

                <header>
                    <span>Copyright © 2018 Changeroo, Business for Development BV</span>
                </header>

            </footer>

        </div>;
    }
}

export default withRouter(withStore(Pricing));