import React from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

const Navigation = ({
    user,
    dispatch,
    IP,
    minimize_navigation,
    history,
    api,
}) => (
    <nav key="nav">
        <div>
            <div className="toggle-nav" onClick={() => dispatch({ minimize_navigation: !minimize_navigation })}></div>
            <Link to="/landing"><div className="logo" data-id="" data-t=""></div></Link>
            { user ? <div className="user-profile">
                <Link className="profile-toggle" to={'/expert/' + user.id }></Link>
                <div className="image" style={{backgroundImage: `url(${user.avatar || '/placeholder-avatar.svg'})`}}></div>
                <h4>{user.full_name}</h4><br/><small className="email-label side">{user.email}</small>
                <span>{user.function || ''}</span>
            </div> : null }
            <div className="links primary">
                <Link to="/landing">My ToCs</Link>
                <Link to="/organisations">My Organisations</Link>
                <Link to="/toc-academy">ToC Academy</Link>
                <Link to="/public-tocs">Public ToCs</Link>
                <Link to="/experts">Experts</Link>
                <Link to="/support">Support organisations</Link>
            </div>
            <div className="links secondary">
                <Link to="/partnerships">Partnerships</Link>
                <Link to="/contact">Contact</Link>
                <Link to="/plans">Plans</Link>
                <Link to="/support-form">Support</Link>
                <Link to="/privacy">Privacy</Link>
                <Link to="/terms">Terms</Link>
            </div>
            <div className="sign-out-container">
                <button type="button" onClick={
                    () => axios({
                        url: `${IP}/signout`,
                        method: 'get',
                        withCredentials: true,
                    })
                        .then(function (response) {
                            if(response.data) api(response.data);
                            history.push('/');
                        })
                        .catch(function (error) { console.log(error); })
                } className="standard neutral icon sign-out">Sign out</button>
            </div>
        </div>
    </nav>
);

export default Navigation;
