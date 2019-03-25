const OrganisationMember = require('../models/organisationMember');
const sendOrganisationMemberInvitationEmail = require('../mailers/sendOrganisationMemberInvitationEmail');
const sendTocRoleInvitationEmail = require('../mailers/sendTocRoleInvitationEmail');
const sendMoveTocInvitationEmail = require('../mailers/sendMoveTocInvitationEmail');
const TocMember = require('../models/tocMember');
const Stakeholder = require('../models/stakeholder');
const {
    generateOrganisationAdminInvitationToken, 
    generateTocRoleInvitationToken,
    generateMoveTocInvitationToken
} = require('./tokenService');


/**
 * 
 * @param {*} stakeholder 
 * @param {*} organisation 
 * @param {*} mailHost 
 * Creates a new role as admin of organisation and sends email to accept the role
 */
const inviteStakeholderAsOrganisationAdmin = async (stakeholder, organisation, mailHost, invitor) => {
    // Create new organisation member
    const organisationMemberId = await OrganisationMember.forge({
        isAdmin: 0,
        stakeholder_id: stakeholder.get('id'),
        organisation_id: organisation.get('id')
    }).save().get('id');

    await emailStakeholderAsOrganisationAdmin(stakeholder, organisation, mailHost, invitor, organisationMemberId);
};

// Re-sends the invitation to a user to become an admin of an organisation
const reinviteStakeholderAsOrganisationAdmin = async (stakeholder, organisation, mailHost, invitor) => {
    // Fetches organisation member
    const organisationMemberId = await OrganisationMember.where({
        stakeholder_id: stakeholder.get('id'),
        organisation_id: organisation.get('id')
    }).fetch().get('id');

    await emailStakeholderAsOrganisationAdmin(stakeholder, organisation, mailHost, invitor, organisationMemberId);
};

// Sends the email with the invitation to become an admin of an organisation, and generates the token for this invitation
const emailStakeholderAsOrganisationAdmin = async (stakeholder, organisation, mailHost, invitor, organisationMemberId) => {
    // Generate invitation token..
    const token = await generateOrganisationAdminInvitationToken(organisationMemberId);

    // ..and send invitation email with token
    await sendOrganisationMemberInvitationEmail(
        stakeholder.get('email'),
        organisationMemberId,
        organisation.get('name'),
        stakeholder.get('full_name'),
        token,
        mailHost,
        invitor,
        {role:'administrator'}
    );
};


/**
 * 
 * @param {*} stakeholder 
 * @param {*} toc 
 * @param {*} host 
 * Creates a new role in a ToC and sends out an email to accept that role
 */
const inviteStakeholderAsTocRole = async (
    stakeholder, 
    toc, 
    mailHost, 
    role, 
    tocMember, 
    invitor
) => {
    let tocMemberId = tocMember ? tocMember.id : await TocMember.forge({
        stakeholder_id: stakeholder.get('id'),
        toc_id: toc.get('id')
    }).save().get('id');

    await emailStakeholderAsTocRole(stakeholder, toc, mailHost, role, tocMember, invitor, tocMemberId);
};

// Resends the invitation email for a role in a ToC
const reinviteStakeholderAsTocRole = async (
    stakeholder, 
    toc, 
    mailHost, 
    role, 
    tocMember, 
    invitor
) => {
    let tocMemberId = tocMember ? tocMember.id : await TocMember.where({
        stakeholder_id: stakeholder.get('id'),
        toc_id: toc.get('id')
    }).fetch().get('id');

    await emailStakeholderAsTocRole(stakeholder, toc, mailHost, role, tocMember, invitor, tocMemberId);
};

// Sends the email with the invitation for a specific role in a ToC, and generates the token for this invitation
const emailStakeholderAsTocRole = async (
    stakeholder, 
    toc, 
    mailHost, 
    role, 
    tocMember, 
    invitor,
    tocMemberId
) => {
    // Generate invitation token..
    const token = await generateTocRoleInvitationToken(tocMemberId, role);
    // ..and send invitation email with token

    await sendTocRoleInvitationEmail(
        stakeholder.get('email'),
        tocMemberId,
        toc.get('name'),
        token,
        mailHost,
        stakeholder.get('full_name'),
        invitor,
        {role}
    );
};

/**
 * 
 * @param {*} toc 
 * @param {*} stakeholder 
 * @param {*} organisation 
 * @param {*} mailHost 
 * Create and send an invitation to another user to migrate a ToC to one of their organisation accounts
 */
const inviteStakeholderToMoveToC = async (stakeholder, toc, mailHost, invitor) => {
      // Generate invitation token..
    const token = await generateMoveTocInvitationToken(toc.get('uuid'), stakeholder.get("username"));
    const invitorObject = await Stakeholder.where({ username: invitor }).fetch();

    // ..and send invitation email with token
    await sendMoveTocInvitationEmail(
        stakeholder.get('email'),
        stakeholder.get('full_name'),
        toc.get('name'),
        toc.get('uuid'),
        token,
        mailHost,
        invitor,
        invitorObject.get("full_name")
    );
};

module.exports = {
    inviteStakeholderAsOrganisationAdmin,
    inviteStakeholderAsTocRole,
    reinviteStakeholderAsOrganisationAdmin,
    reinviteStakeholderAsTocRole,
    inviteStakeholderToMoveToC
};