import React, { Component } from 'react';
import classNames from 'classnames';
import { withRouter } from 'react-router-dom';
import { withStore } from '../store';

class Invited extends Component { render(){ const { index, notifications, user, history } = this.props;
    return <div>Tooltip!</div>;
}}

export const InvitedTooltip = withRouter(withStore(Invited));

export const TOOLTIPS = {
    invited: InvitedTooltip,
};
