import React, { Component } from 'react';
// import classNames from 'classnames'
import { withRouter } from 'react-router-dom';
import { withStore } from '../store';
// import Select from 'react-select';
// import classNames from 'classnames';

class EmailResponse extends Component {
    
    componentDidMount() {
        console.log(this.props.match);

        const {
            request,
            IP,
            match,
            dispatch,
            notifications,
            endpoint,
            focusUser,
            focusToc,
            update,
            history
        } = this.props;

        let data = {};

        if(!endpoint) return;

        switch(endpoint) {
            case 'activate_stakeholder':
            data = { id: match.params.id, token: match.params.token, update: update === "false" ? false : true };
            break;

            case 'decline_stakeholder_for_toc_role':
            data = { token: match.params.token, member: match.params.member, role: match.params.role, invitor: match.params.invitor };
            break;

            case 'decline_stakeholder_admin':
            data = { token: match.params.token, invitor: match.params.invitor, member: match.params.member };
            break;

            case 'reset_stakeholder_password':
            data = { reset_hash: match.params.hash, stakeholder: match.params.id };
            break;

            case 'move_toc':
            data = { token: match.params.token, invitor: match.params.invitor, toc: match.params.toc };
            break;

            case 'make_stakeholder_admin':
            data = { member: match.params.member, token: match.params.token };
            break;

            default:
            data = { member: match.params.member, token: match.params.token, role: match.params.role };
            break;
        }

        console.log('data for email response: ', endpoint, data);

        if(endpoint === 'reset_stakeholder_password') {
            dispatch({
                focusUser: {
                    ...focusUser,
                    id: match.params.id,
                    reset_hash: match.params.token
                }
            });
            return history.push('/new-password');
        }

        if(endpoint === 'move_toc') {
            dispatch({
                focusToc: {
                    ...focusToc,
                    id: match.params.id,
                    reset_hash: match.params.token
                }
            });
            return history.push('/move-toc');
        }

        if(endpoint !== 'reset_stakeholder_password' || endpoint !== 'move_toc') return request({ 
            url: `${IP}/${endpoint}`,
            method: 'post', 
            data: data
        }, (err, res) => {
            if(err) return console.log('?');
            dispatch({
                notifications: [...notifications, { status: 'success', message: 'Success', icon: 'notify-success'  }]
            });
        });

    }

    render() {

        const { history } = this.props;

        return <p className="success-message-mailing">Success! <button className="standard small rounded warning" onClick={() => history.push('/') }>Return to home.</button></p>;

    }

}



export default withRouter(withStore(EmailResponse));