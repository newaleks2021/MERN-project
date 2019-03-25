import React from 'react';

export default () => [

<bb className="message">Invite user to <span className="booger" data-load="toc.load_toc_name"></span></bb>,

<a className="hide-modal" data-click="basic.close_modal">X</a>,

<div>

    <label>User E-mail Address</label>
    <input type="text" value="" />

    <label className="role-message">
        Select one or more roles for this user
        <label className="question tip" data-click="basic.toggle_tooltip">
            <i className="tooltip">Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed porta sollicitudin velit vel porttitor. Morbi vel est arcu. Nullam eu auctor eros, a rutrum lorem. Nunc pretium eleifend diam non facilisis.</i>
        </label>
    </label>

    <div className="roles">

        <div className="role" data-role="member" data-click="toc.toggle_role_option">
            <span>member</span>
            <i></i>
        </div>
        <div className="role" data-role="moderator" data-click="toc.toggle_role_option">
            <span>moderator</span>
            <i></i>
        </div>
        <div className="role" data-role="admin" data-click="toc.toggle_role_option">
            <span>administrator</span>
            <i></i>
        </div>

    </div>

</div>,

<button className="standard warning save" data-click="basic.close_modal,toc.invite">Invite this user</button>
];