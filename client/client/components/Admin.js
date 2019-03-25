import React from 'react';
import { withRouter } from 'react-router-dom';
import { withStore } from '../store';

class Admin extends React.Component {
    constructor(props) {
        super(props);
        this.renderRow = this.renderRow.bind(this);
    }

    renderRow() {
        return <div>
            <input />
        </div>;
    }

    render(){
        return (
            <div>
                {this.renderRow()}
            </div>
        );
    }
}

export default withRouter(withStore(Admin));
