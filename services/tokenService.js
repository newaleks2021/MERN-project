const differenceInSeconds = require('date-fns/difference_in_seconds');
const {encrypt, isHashMatching} = require('../helpers/hashing');
const {newDateNow} = require('../helpers/dateHelper');
const Stakeholder = require('../models/stakeholder');
const OrganisationMember = require('../models/organisationMember');
const TocMember = require('../models/tocMember');
const Toc = require('../models/toc');
const crypto = require('crypto');
const capitalize = require('lodash/capitalize');

/**
 * @private
 * Generates URL safe base64 token
 * @returns {String} Generated token
 */
const generateURLSafeToken = async () => {
    const buffer = await crypto.randomBytes(48);
    return buffer.toString('hex').trim();
};

/**
 * @public
 * Hashes generated token, and inserts relevant activation
 * data for stakeholder
 * @param {Int} [id] Stakeholder ID 
 * @returns {String} Generated activation token
 */
const generateActivationToken = async (id) => {
    const activation_sent_at = newDateNow();
    const token = await generateURLSafeToken();
    const activation_hash = await encrypt(token);
    await Stakeholder.where({id}).save({activation_hash, activation_sent_at}, {patch: true});
    return token;
};

/**
 * @public
 * Hashes generated token, and inserts relevant activation
 * data for toc
 * @param {Int} [id] Toc UUID 
 * @returns {String} Generated activation token
 */
const generateMoveTocInvitationToken = async (uuid, stakeholderUsername) => {
    const movement_sent_at = newDateNow();
    const token = await generateURLSafeToken();
    const movement_hash = await encrypt(token);
    await Toc.where({uuid}).save({movement_username: stakeholderUsername, movement_hash, movement_sent_at}, {patch: true});
    return token;
};

/**
 * Generates token to invite stakeholder
 * as organisation admin and inserts relevant activation
 * data inside organisationMember
 * @param {Integer} Existing organisation member id
 * @returns {String} Generated token
 */
const generateOrganisationAdminInvitationToken = async (id) => {
    const admin_activation_sent_at = newDateNow();
    const token = await generateURLSafeToken();
    const admin_activation_hash = await encrypt(token);   
    await OrganisationMember.where({id}).save({
        admin_activation_hash, 
        admin_activation_sent_at
    }, {patch: true});
    return token;
};

/**
 * 
 * @param {*} id 
 * @param {*} role 
 */
const generateTocRoleInvitationToken = async (id, role) => {
    const token = await generateURLSafeToken();
    const hash = await encrypt(token);
    const sent_at = newDateNow();

    await TocMember.where({id}).save({
        [`${role}_activation_hash`]: hash,
        [`${role}_activation_sent_at`]: sent_at
    }, {patch: true});

    return token;
};

/**
 * @public
 * Generates token to reset password and inserts relevant
 * data to reset password.
 * @param {Int} [id] Stakeholder ID 
 * @returns {String} Generated password reset token
 */
const generatePasswordResetToken = async (id) => {
    const reset_sent_at = newDateNow();
    const token = await generateURLSafeToken();
    const reset_hash = await encrypt(token);
    await Stakeholder.where({id}).save({reset_hash, reset_sent_at}, {patch: true});
    return token;
};

/**
 * @private
 * Checks if token is expired 
 * @param {DateTime} [signed_at] Timestamp token was signed
 * @param {Integer} [lifetime] Maximum token lifetime
 * @returns {Boolean}
 */
const isTokenExpired = (signed_at, lifetime) => {
    const currentLifeTime = differenceInSeconds(newDateNow(), signed_at);
    return (parseInt(lifetime) > currentLifeTime);
};

/**
 * @public
 * Checks if activation token is legit or expired
 * @param {String} [token] Unhashed token
 * @param {String} [activation_hash] Hashed token
 * @param {String} [activation_sent_at] Timestamp when token was sent
 * @param {Integer} [lifetime] Maximum token lifetime
 * @returns {Boolean} 
 */
const isTokenLegitAndNotExpired = async (token, activation_hash, activation_sent_at, lifetime) => {
    const isTokenLegit = await isHashMatching(token, activation_hash);
    return isTokenExpired(activation_sent_at, lifetime) && isTokenLegit;
};

module.exports = {
    generateActivationToken,
    generatePasswordResetToken,
    generateOrganisationAdminInvitationToken,
    generateTocRoleInvitationToken,
    generateMoveTocInvitationToken,
    isTokenLegitAndNotExpired,
    isTokenExpired
};
