// routers/dashboard/fundraiserFormRoute.js
const express = require("express");
const router = express.Router();
const FundraiserFormController = require("../../controller/dashbored/FundraiserFormController");
const { requireAuth } = require("../../middelware/requireAuth");
const upload = require("../../utils/uploadMiddleware"); // Add at top if not present
const { checkCampaignAccess } = require("../../middelware/checkCampaignAccess");

router.use(requireAuth);

// Create Form Page (fundraiser-create-form.ejs)
router.get("/fundraiser-form/:id", FundraiserFormController.getCreateFormPage);

// Create Form API
router.post("/fundraiser-form/:id", FundraiserFormController.createForm);

// Requester Form Page (fundraiser-requester-form.ejs)
router.get("/fundraiser-requester-form/:id", FundraiserFormController.getRequesterFormPage);

// Submit Request API
router.post("/fundraiser-requester-form/:id", upload.any(), FundraiserFormController.submitRequest);

// Requester Form Page - PROTECTED
router.get("/fundraiser-requester-form/:id", 
    checkCampaignAccess, 
    FundraiserFormController.getRequesterFormPage
);

// Submit Request - PROTECTED (double protection)
router.post("/fundraiser-requester-form/:id", 
    checkCampaignAccess,  // Optional: remove if POST should be independent
    upload.any(), 
    FundraiserFormController.submitRequest
);

// Requesters Table Page (fundraiser-requester-tables.ejs)
router.get("/fundraiser-requesters/:id", FundraiserFormController.getRequestersTablePage);

// Reject Request API
router.post("/fundraiser-request/reject", FundraiserFormController.rejectRequest);

// Accept Request API
router.post("/fundraiser-request/accept", FundraiserFormController.acceptRequest);

// Complete Campaign API
router.post("/fundraiser-request/complete", FundraiserFormController.completeCampaign);

// Accept All Request API
router.post("/fundraiser-request/accept-all", FundraiserFormController.acceptAllRequests);

// Complete Campaign with Message API
router.post("/fundraiser-request/complete-with-message", FundraiserFormController.completeCampaignWithMessage);


module.exports = router;