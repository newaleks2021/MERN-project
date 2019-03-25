import React, { Component } from 'react';
import { withRouter } from 'react-router-dom';
import { withStore } from '../store';

class Notification extends Component {

    render() {
        const { notifications, dispatch, hard_refresh } = this.props;
        return (
            <div key="notifications" className="notification-container">
                {
                    notifications.map((notification, index) => {
                        if(notification.deleted) return null;
                        
                        if(notification.message) return (
                            <div key={`notify_${index}`} className="notification">
                                <span style={{ backgroundImage: `url(/${ notification.icon }.svg` }}></span>
                                <label>{ notification.message }</label>
                                <button onClick={() => {
                                    notifications[index].deleted = true;
                                    dispatch({ notifications, hard_refresh: !hard_refresh });
                                    setTimeout(dispatch, 0, { hard_refresh: hard_refresh });
                                }}>X</button>
                            </div>
                        );
                        
                        else return null;
                    })
                }
            </div>
            
        );
    }

}

export default withRouter(withStore(Notification, {
    stateToProps: state => ({
        notifications: state.notifications,
        hard_refresh: state.hard_refresh,
    })
}));
