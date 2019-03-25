import React, { Component } from 'react';
import { withRouter } from 'react-router-dom';
import { withStore } from '../store';

class Done extends Component {
    
    render() {

        const { history } = this.props;

        return <p className="success-message-mailing">Done! <button className="standard small rounded warning" onClick={() => history.push('/') }>Return to home.</button></p>;

    }

}



export default withRouter(withStore(Done));