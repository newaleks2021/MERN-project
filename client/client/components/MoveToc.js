import React, { Component } from 'react';
import { withRouter } from 'react-router-dom';
import { withStore } from '../store';
import Select from 'react-select';

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

    }

    render(){

        const { orgSelector, focusToc, organisations, organisation_members, dispatch, user } = this.props;

        if(!focusToc) return null;

        let orgs = organisation_members.reduce((memo, m) => {
            if(m.stakeholder_id !== user.id) return memo;
            if(focusToc.organisation_id === m.organisation_id) return memo;
            memo.push({ value: m.organisation_id, label: organisations.find(obj => obj.id === m.organisation_id).name });
            return memo;
        }, []);

        return <section data-s="new-password">
            <form onSubmit={this.onSubmit}>
            
                <Select
                    value={{
                        value: orgSelector.id,
                        label: orgSelector.name
                    }}
                    onChange={selected => { dispatch({ focusToc: { ...focusToc, organisation_id: selected.value } } ) } }
                    options={orgs}
                />

                <input type="submit" value="Reset password" />
            
            </form><br />
        </section>;
    }
}

export default withRouter(withStore(PasswordNew));