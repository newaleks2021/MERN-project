import React from 'react';

export default () => [

<bb className="message">
    Edit <span className="booger" data-load="toc.load_stakeholder_name"></span> roles from ToC <span className="booger" data-load="toc.load_toc_name"></span>
</bb>,

<a className="hide-modal" data-click="basic.close_modal">X</a>,

<div>

    <label className="role-message">
        Select one or more roles for this user
        <label className="question tip" data-click="basic.toggle_tooltip">
            <i className="tooltip">Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed porta sollicitudin velit vel porttitor. Morbi vel est arcu. Nullam eu auctor eros, a rutrum lorem. Nunc pretium eleifend diam non facilisis.</i>
        </label>
    </label>

    <div className="roles" data-load="toc.load_toc_stakeholder_roles">

    </div>

</div>,

<button className="standard warning save" data-click="basic.close_modal,toc.save_roles">Save user role(s)</button>
];