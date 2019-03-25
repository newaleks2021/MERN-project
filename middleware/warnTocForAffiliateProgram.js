const Toc = require('../models/toc');
const Plan = require('../models/plan');
const Organisation = require('../models/organisation');

/**
 * If organisation has the affiliate subscription, a flash message is shown with information about this subscription plan
 * TODO: Check if this works correctly, because that notification should only be displayed if the toc was created more than a certain number of months ago
 * @param {*} req 
 * @param {*} res 
 * @param {*} next 
 */
const warnTocForAffiliateProgram = async (req, res, next) => {
    if(!process.env.AFFILIATE_PROGRAM_PLAN_NAME)
    {
        return next();
    }
    
    const affiliateProgramPlan = await Plan.query({where: {name: process.env.AFFILIATE_PROGRAM_PLAN_NAME }}).fetch();

    if(affiliateProgramPlan)
    {
        const toc = await Toc.query({where: {uuid: req.params.id}}).fetch();
        const organisation = await Organisation.where({
            id: toc.get('organisation_id')
        }).fetch();

        if(organisation.get("plan_id") === affiliateProgramPlan.get("id"))
        {
            req.flash(
                'error',
                req.__('flashes.tocs.affiliate-program-disabled')
            );
        }
    }

    return next();
};

module.exports = {
    warnTocForAffiliateProgram, 
};
