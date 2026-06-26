// controllers/dashboard/FundraiserFormController.js
const { Sequelize } = require('sequelize');
const { Op } = require('sequelize');  // ← ADD THIS
const Fundraiser = require("../../models/Fundraiser");
const FundraiserForm = require("../../models/FundraiserForm");
const FundraiserRequest = require("../../models/FundraiserRequest");
const User = require("../../models/User");
const { getLocationFromCoordinates } = require('../../utils/geolocation');
class FundraiserFormController {
  // ═════════════════════════════════════════════════════════════
  // GET /fundraiser-form/:id  →  fundraiser-create-form.ejs
  // ═════════════════════════════════════════════════════════════
  async getCreateFormPage(req, res) {
    try {
      const fundraiserId = req.params.id;
      const userId = req.user.id;

      const fundraiser = await Fundraiser.findOne({
        where: {
          [Sequelize.Op.and]: [
            {
              [Sequelize.Op.or]: [
                { public_id: fundraiserId },
                { fundraiser_id: parseInt(fundraiserId) || 0 }
              ]
            },
            { fundraiser_user_id: userId }
          ]
        },
        include: [{ model: User, as: "user", attributes: ["full_name", "user_image", "location", "phone_number","phone_international","user_type"] }]
      });

      // Verify user is charity type
      if (req.user.user_type !== 'Charity') {
        return res.redirect("/userPanelIndigent?error=Only charities can create forms");
      }

      if (!fundraiser) {
        return res.redirect("/userPanelIndigent?error=Fundraiser not found");
      }

      // Only allow if status is create_form
      if (fundraiser.fundraiser_status !== "create_form") {
        return res.redirect("/userPanelIndigent?error=Cannot add form to this campaign");
      }

      // Check if form already exists
      const existingForm = await FundraiserForm.findOne({ where: { fundraiser_id: fundraiserId } });

      const fundraiserData = {
        fundraiserId: fundraiser.fundraiser_id,
        publicId: fundraiser.public_id, 
        title: fundraiser.fundraiser_title,
        description: fundraiser.fundraiser_description,
        mainImage: fundraiser.fundraiser_main_image,
        subImages: [
          fundraiser.fundraiser_sub_image_one,
          fundraiser.fundraiser_sub_image_two,
          fundraiser.fundraiser_sub_image_three
        ].filter(Boolean),
        categories: fundraiser.fundraiser_categories,
        hashtags: fundraiser.fundraiser_hashtags || [],   // ← ADD
        collectedAmount: fundraiser.fundraiser_collected_amount,
        targetAmount: fundraiser.fundraiser_target_amount,
        status: fundraiser.fundraiser_status,
        is_urgent: fundraiser.is_urgent,
        userId: fundraiser.fundraiser_user_id,
        userName: fundraiser.user?.full_name || "Unknown",
        userImage: fundraiser.user?.user_image || "/assets/image/Fundraiser-Page/header-sec/man-profile.png",
        user: {
          user_type: fundraiser.user?.user_type,
        },
        location: fundraiser.user?.location
          ? await getLocationFromCoordinates(fundraiser.user.location)
          : "Location not specified", // You can enhance with geocoding
        phoneNumber: fundraiser.user?.phone_international || "Not provided",
        progress: fundraiser.fundraiser_target_amount > 0
          ? Math.min((fundraiser.fundraiser_collected_amount / fundraiser.fundraiser_target_amount) * 100, 100)
          : 0,
        // More campaign information fields
        fundraiser_expiry_date: fundraiser.fundraiser_expiry_date,
        fundraiser_video: fundraiser.fundraiser_video,
        donated_item_type: fundraiser.donated_item_type,
        donated_item_quantity: fundraiser.donated_item_quantity,
        donated_item_condition: fundraiser.donated_item_condition,
        fund_allocation_percentage: (() => {
          const val = fundraiser.fund_allocation_percentage;
          if (!val) return null;
          // JSONB sometimes comes back as a string depending on Sequelize config
          if (typeof val === 'string') {
              try { return JSON.parse(val); } catch(e) { return null; }
          }
          return Array.isArray(val) ? val : null;
        })()
      };

      res.render("site/fundraiser-create-form", {
        fundraiserData,
        existingForm: existingForm ? existingForm.toJSON() : null,
        title: "Create Campaign Form"
      });

    } catch (error) {
      console.error("Error loading create form page:", error);
      res.redirect("/userPanelIndigent?error=Error loading form page");
    }
  }

  // ═════════════════════════════════════════════════════════════
  // POST /fundraiser-form/:id  →  Create form schema
  // ═════════════════════════════════════════════════════════════
  async createForm(req, res) {
    try {
      const fundraiserId = req.params.id;
      const userId = req.user.id;
      const { schema, targetRequestersNumber } = req.body;

      const fundraiser = await Fundraiser.findOne({
        where: {
          [Sequelize.Op.and]: [
            {
              [Sequelize.Op.or]: [
                { public_id: fundraiserId },
                { fundraiser_id: parseInt(fundraiserId) || 0 }
              ]
            },
            { fundraiser_user_id: userId }
          ]
        }
      });

      if (!fundraiser) {
        return res.status(404).json({ success: false, error: "Fundraiser not found" });
      }

      if (fundraiser.fundraiser_status !== "create_form") {
        return res.status(400).json({ success: false, error: "Invalid campaign status" });
      }

      // Validate schema
      let parsedSchema;
      try {
        parsedSchema = typeof schema === "string" ? JSON.parse(schema) : schema;
        if (!Array.isArray(parsedSchema) || parsedSchema.length < 5 || parsedSchema.length > 20) {
          return res.status(400).json({ success: false, error: "Schema must have 5-20 fields" });
        }
      } catch (e) {
        return res.status(400).json({ success: false, error: "Invalid schema format" });
      }

      // Check if form already exists
      const existingForm = await FundraiserForm.findOne({ where: { fundraiser_id: fundraiserId } });
      if (existingForm) {
        return res.status(400).json({ success: false, error: "Form already exists for this campaign" });
      }

      // Create form
      await FundraiserForm.create({
        fundraiser_id: fundraiserId,
        user_id: userId,
        target_requesters_number: parseInt(targetRequestersNumber) || 1,
        current_requesters_number: 0,
        schema: parsedSchema
      });

      // Update fundraiser status
      fundraiser.fundraiser_status = "Waiting_requesters";
      await fundraiser.save();

      res.json({ success: true, message: "Form created successfully" });

    } catch (error) {
      console.error("Error creating form:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  // ═════════════════════════════════════════════════════════════
  // GET /fundraiser-requester-form/:id  →  fundraiser-requester-form.ejs
  // ═════════════════════════════════════════════════════════════
  async getRequesterFormPage(req, res) {
    try {
      const fundraiserId = req.params.id;
      const userId = req.user.id;

      const fundraiser = await Fundraiser.findOne({
        where: {
          [Sequelize.Op.or]: [
            { public_id: fundraiserId },
            { fundraiser_id: parseInt(fundraiserId) || 0 }
          ]
        },
        include: [
          { model: User, as: "user", attributes: ["full_name", "user_image", "location", "phone_number","phone_international","user_type"] },
          { model: FundraiserForm, as: "form" }
        ]
      });

      // Verify user is requester type
      if (req.user.user_type !== 'requester') {
        return res.redirect("/all-fundraisers?error=Only requesters can fill this form");
      }

      if (!fundraiser || !fundraiser.form) {
        return res.redirect("/all-fundraisers?error=Form not found");
      }

      if (fundraiser.fundraiser_status !== "Waiting_requesters") {
        return res.redirect("/all-fundraisers?error=This campaign is not accepting requests");
      }

      // Check if target reached
      if (fundraiser.form.current_requesters_number >= fundraiser.form.target_requesters_number) {
        return res.redirect("/all-fundraisers?error=This campaign has reached its target");
      }

      // Check if user already submitted
      const existingRequest = await FundraiserRequest.findOne({
        where: { form_id: fundraiser.form.id, user_id: userId }
      });

      const fundraiserData = {
        fundraiserId: fundraiser.fundraiser_id,
        publicId: fundraiser.public_id, 
        title: fundraiser.fundraiser_title,
        description: fundraiser.fundraiser_description,
        mainImage: fundraiser.fundraiser_main_image,
        subImages: [
          fundraiser.fundraiser_sub_image_one,
          fundraiser.fundraiser_sub_image_two,
          fundraiser.fundraiser_sub_image_three
        ].filter(Boolean),
        categories: fundraiser.fundraiser_categories,
        hashtags: fundraiser.fundraiser_hashtags || [],   // ← ADD
        collectedAmount: fundraiser.fundraiser_collected_amount,
        targetAmount: fundraiser.fundraiser_target_amount,
        status: fundraiser.fundraiser_status,
        is_urgent: fundraiser.is_urgent,
        userId: fundraiser.fundraiser_user_id,
        userName: fundraiser.user?.full_name || "Unknown",
        userImage: fundraiser.user?.user_image || "/assets/image/Fundraiser-Page/header-sec/man-profile.png",
        user: {
          user_type: fundraiser.user?.user_type,
        },
        location: fundraiser.user?.location
          ? await getLocationFromCoordinates(fundraiser.user.location)
          : "Location not specified",
        phoneNumber: fundraiser.user?.phone_international || "Not provided",
        progress: fundraiser.fundraiser_target_amount > 0
          ? Math.min((fundraiser.fundraiser_collected_amount / fundraiser.fundraiser_target_amount) * 100, 100)
          : 0,
        // More campaign information fields
        fundraiser_expiry_date: fundraiser.fundraiser_expiry_date,
        fundraiser_video: fundraiser.fundraiser_video,
        donated_item_type: fundraiser.donated_item_type,
        donated_item_quantity: fundraiser.donated_item_quantity,
        donated_item_condition: fundraiser.donated_item_condition,
        fund_allocation_percentage: (() => {
          const val = fundraiser.fund_allocation_percentage;
          if (!val) return null;
          // JSONB sometimes comes back as a string depending on Sequelize config
          if (typeof val === 'string') {
              try { return JSON.parse(val); } catch(e) { return null; }
          }
          return Array.isArray(val) ? val : null;
        })()
      };

      res.render("site/fundraiser-requester-form", {
        fundraiserData,
        formSchema: fundraiser.form.schema,
        formId: fundraiser.form.id,
        alreadySubmitted: !!existingRequest,
        title: "Fill Campaign Form"
      });

    } catch (error) {
      console.error("Error loading requester form:", error);
      res.redirect("/all-fundraisers?error=Error loading form");
    }
  }

  // ═════════════════════════════════════════════════════════════
  // POST /fundraiser-requester-form/:id  →  Submit request
  // ═════════════════════════════════════════════════════════════
    async submitRequest(req, res) {
      try {
        const fundraiserId = req.params.id;
        const userId = req.user.id;
        const { formId, responses } = req.body;
        // Server-side 20MB guard
        const MAX_FILE_SIZE = 20 * 1024 * 1024;
        if (req.files && req.files.length > 0) {
          for (const f of req.files) {
            if (f.size > MAX_FILE_SIZE) {
              return res.status(400).json({ success: false, error: `File ${f.originalname} exceeds 20MB limit` });
            }
          }
        }
        // Handle file uploads from multipart
        let parsedResponses;
        try {
          parsedResponses = typeof responses === "string" ? JSON.parse(responses) : responses;
        } catch (e) {
          parsedResponses = {};
        }

        // Merge file uploads into responses
        if (req.files && req.files.length > 0) {
          const form = await FundraiserForm.findByPk(formId); // Move outside loop
          if (form && form.schema) {
            for (const file of req.files) {
              const fieldName = file.fieldname; // e.g., "field_2"
              const fieldIndex = fieldName.split('_')[1];
              // Find the corresponding schema field
              if (form.schema[fieldIndex]) {
                parsedResponses[form.schema[fieldIndex].name] = `/uploads/requests/${file.filename}`;
              }
            }
          }
        }

        const fundraiser = await Fundraiser.findOne({
          where: {
            [Sequelize.Op.or]: [
              { public_id: fundraiserId },
              { fundraiser_id: parseInt(fundraiserId) || 0 }
            ]
          }
        });
        const resolvedFundraiserId = fundraiser ? fundraiser.fundraiser_id : parseInt(fundraiserId) || 0;

        const form = await FundraiserForm.findOne({
          where: { id: formId, fundraiser_id: resolvedFundraiserId }
        });

        if (!form) {
          return res.status(404).json({ success: false, error: "Form not found" });
        }

        if (form.current_requesters_number >= form.target_requesters_number) {
          return res.status(400).json({ success: false, error: "Target already reached" });
        }

        const existing = await FundraiserRequest.findOne({
          where: { form_id: formId, user_id: userId }
        });
        if (existing) {
          return res.status(400).json({ success: false, error: "You already submitted a request" });
        }

        await FundraiserRequest.create({
          form_id: formId,
          fundraiser_id: fundraiserId,
          user_id: userId,
          requests: parsedResponses,
          request_status: "pending" // or "accepted" based on your choice
        });

        form.current_requesters_number += 1;
        await form.save();

        res.json({ success: true, message: "Request submitted successfully" });

      } catch (error) {
        console.error("Error submitting request:", error);
        res.status(500).json({ success: false, error: error.message });
      }
  }

  // ═════════════════════════════════════════════════════════════
  // GET /fundraiser-requesters-table/:id  →  fundraiser-requesters-table.ejs
  // ═════════════════════════════════════════════════════════════
  async getRequestersTablePage(req, res) {
    try {
      const fundraiserId = req.params.id;
      const userId = req.user.id;

      const fundraiser = await Fundraiser.findOne({
        where: {
          [Sequelize.Op.and]: [
            {
              [Sequelize.Op.or]: [
                { public_id: fundraiserId },
                { fundraiser_id: parseInt(fundraiserId) || 0 }
              ]
            },
            { fundraiser_user_id: userId }
          ]
        },
        include: [
          { model: User, as: "user", attributes: ["full_name", "user_image", "location", "phone_number","phone_international","user_type"] },
          {
            model: FundraiserForm,
            as: "form",
            include: [{
              model: FundraiserRequest,
              as: "requests",
              include: [{ model: User, as: "requester", attributes: ["id", "full_name", "user_image", "email"] }]
            }]
          }
        ]
      });

      if (req.user.user_type !== 'Charity') {
        return res.redirect("/userPanelIndigent?error=Unauthorized");
      }

      if (!fundraiser || !fundraiser.form) {
        return res.redirect("/userPanelIndigent?error=Form not found");
      }

      const fundraiserData = {
        fundraiserId: fundraiser.fundraiser_id,
        publicId: fundraiser.public_id, 
        title: fundraiser.fundraiser_title,
        description: fundraiser.fundraiser_description,
        mainImage: fundraiser.fundraiser_main_image,
        subImages: [
          fundraiser.fundraiser_sub_image_one,
          fundraiser.fundraiser_sub_image_two,
          fundraiser.fundraiser_sub_image_three
        ].filter(Boolean),
        categories: fundraiser.fundraiser_categories,
        hashtags: fundraiser.fundraiser_hashtags || [],   // ← ADD
        collectedAmount: fundraiser.fundraiser_collected_amount,
        targetAmount: fundraiser.fundraiser_target_amount,
        status: fundraiser.fundraiser_status,
        is_urgent: fundraiser.is_urgent,
        userId: fundraiser.fundraiser_user_id,
        userName: fundraiser.user?.full_name || "Unknown",
        userImage: fundraiser.user?.user_image || "/assets/image/Fundraiser-Page/header-sec/man-profile.png",
        user: {
          user_type: fundraiser.user?.user_type,
        },
        location: fundraiser.user?.location
          ? await getLocationFromCoordinates(fundraiser.user.location)
          : "Location not specified",
        phoneNumber: fundraiser.user?.phone_international || "Not provided",
        progress: fundraiser.fundraiser_target_amount > 0
          ? Math.min((fundraiser.fundraiser_collected_amount / fundraiser.fundraiser_target_amount) * 100, 100)
          : 0,
        // More campaign information fields
        fundraiser_expiry_date: fundraiser.fundraiser_expiry_date,
        fundraiser_video: fundraiser.fundraiser_video,
        donated_item_type: fundraiser.donated_item_type,
        donated_item_quantity: fundraiser.donated_item_quantity,
        donated_item_condition: fundraiser.donated_item_condition,
        fund_allocation_percentage: (() => {
          const val = fundraiser.fund_allocation_percentage;
          if (!val) return null;
          // JSONB sometimes comes back as a string depending on Sequelize config
          if (typeof val === 'string') {
              try { return JSON.parse(val); } catch(e) { return null; }
          }
          return Array.isArray(val) ? val : null;
        })()
      };

      const formData = {
        id: fundraiser.form.id,
        target_requesters_number: fundraiser.form.target_requesters_number,
        current_requesters_number: fundraiser.form.current_requesters_number,
        schema: fundraiser.form.schema,
        requests: fundraiser.form.requests.map(r => ({
          id: r.id,
          requesterName: r.requester?.full_name || "Unknown",
          requesterImage: r.requester?.user_image || "/assets/image/Fundraiser-Page/header-sec/man-profile.png",
          requesterEmail: r.requester?.email || "",
          requests: r.requests,
          request_status: r.request_status,
          request_rejected_reason: r.request_rejected_reason,
          created_at: r.created_at
        }))
      };

      const targetReached = formData.current_requesters_number >= formData.target_requesters_number;

      res.render("site/fundraiser-requesters-table", {
        fundraiserData,
        formData,
        targetReached,
        title: "Campaign Requests"
      });

    } catch (error) {
      console.error("Error loading requesters table:", error);
      res.redirect("/userPanelIndigent?error=Error loading table");
    }
  }

  // ═════════════════════════════════════════════════════════════
  // POST /fundraiser-request/reject  →  Reject a request
  // ═════════════════════════════════════════════════════════════
  async rejectRequest(req, res) {
    try {
      const { requestId, reason } = req.body;
      const userId = req.user.id;

      const request = await FundraiserRequest.findOne({
        where: { id: requestId },
        include: [
          { model: FundraiserForm, as: "form" },
          { model: Fundraiser, as: "fundraiser" }
        ]
      });

      if (!request) {
        return res.status(404).json({ success: false, error: "Request not found" });
      }

      // Verify ownership
      if (request.fundraiser.fundraiser_user_id !== userId) {
        return res.status(403).json({ success: false, error: "Unauthorized" });
      }

      request.request_status = "rejected";
      request.request_rejected_reason = reason || "";
      await request.save();

      // Decrement counter since request is rejected
      request.form.current_requesters_number = Math.max(0, request.form.current_requesters_number - 1);
      await request.form.save();

      res.json({ success: true, message: "Request rejected" });

    } catch (error) {
      console.error("Error rejecting request:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  // ═════════════════════════════════════════════════════════════
  // POST /fundraiser-request/complete  →  Complete campaign
  // ═════════════════════════════════════════════════════════════
  async completeCampaign(req, res) {
    try {
      const { formId } = req.body;
      const userId = req.user.id;

      const form = await FundraiserForm.findOne({
        where: { id: formId },
        include: [
          { model: Fundraiser, as: "fundraiser" },
          { 
            model: FundraiserRequest, 
            as: "requests",
            where: { request_status: { [Op.ne]: 'rejected' } },
            required: false
          }
        ]
      });

      if (!form) {
        return res.status(404).json({ success: false, error: "Form not found" });
      }

      if (form.fundraiser.fundraiser_user_id !== userId) {
        return res.status(403).json({ success: false, error: "Unauthorized" });
      }

      // Count accepted requests (excluding rejected)
      const acceptedCount = form.requests.filter(r => r.request_status === 'accepted').length;
      
      if (acceptedCount < form.target_requesters_number) {
        return res.status(400).json({ 
          success: false, 
          error: "Not enough accepted requests. Target: " + form.target_requesters_number + ", Accepted: " + acceptedCount 
        });
      }

      // Update fundraiser status
      form.fundraiser.fundraiser_status = "completed";
      await form.fundraiser.save();

      res.json({ success: true, message: "Campaign completed successfully" });

    } catch (error) {
      console.error("Error completing campaign:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  // ═════════════════════════════════════════════════════════════
// POST /fundraiser-request/accept  →  Accept a request
// ═════════════════════════════════════════════════════════════
async acceptRequest(req, res) {
    try {
      const { requestId } = req.body;
      const userId = req.user.id;

      const request = await FundraiserRequest.findOne({
        where: { id: requestId },
        include: [
          { model: FundraiserForm, as: "form" },
          { model: Fundraiser, as: "fundraiser" }
        ]
      });

      if (!request) {
        return res.status(404).json({ success: false, error: "Request not found" });
      }

      // Verify ownership
      if (request.fundraiser.fundraiser_user_id !== userId) {
        return res.status(403).json({ success: false, error: "Unauthorized" });
      }

      request.request_status = "accepted";
      await request.save();

      res.json({ success: true, message: "Request accepted" });

    } catch (error) {
      console.error("Error accepting request:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async acceptAllRequests(req, res) {
    try {
      const { formId } = req.body;
      const userId = req.user.id;

      // Find the form and its fundraiser (to verify ownership)
      const form = await FundraiserForm.findOne({
        where: { id: formId },
        include: [{ model: Fundraiser, as: "fundraiser" }]
      });

      if (!form || form.fundraiser.fundraiser_user_id !== userId) {
        return res.status(403).json({ success: false, error: "Unauthorized" });
      }

      // Accept all pending requests that belong to this form
      const [updatedCount] = await FundraiserRequest.update(
        { request_status: "accepted" },
        {
          where: {
            form_id: formId,
            request_status: "pending"
          }
        }
      );

      res.json({
        success: true,
        message: `${updatedCount} request(s) accepted`,
        accepted: updatedCount
      });
    } catch (error) {
      console.error("Error accepting all requests:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  // ═════════════════════════════════════════════════════════════
  // POST /fundraiser-request/complete-with-message
  // Complete campaign + send message to all accepted requesters
  // ═════════════════════════════════════════════════════════════
  async completeCampaignWithMessage(req, res) {
    try {
      const { formId, message } = req.body;
      const userId = req.user.id;

      // Validate message
      if (!message || message.trim().length < 5) {
        return res.status(400).json({ 
          success: false, 
          error: "Message must be at least 5 characters" 
        });
      }

      const form = await FundraiserForm.findOne({
        where: { id: formId },
        include: [
          { model: Fundraiser, as: "fundraiser" },
          { 
            model: FundraiserRequest, 
            as: "requests",
            where: { request_status: { [Op.ne]: 'rejected' } },
            required: false,
            include: [{ model: User, as: "requester", attributes: ["id"] }]
          }
        ]
      });

      if (!form) {
        return res.status(404).json({ success: false, error: "Form not found" });
      }

      if (form.fundraiser.fundraiser_user_id !== userId) {
        return res.status(403).json({ success: false, error: "Unauthorized" });
      }

      // Count accepted requests
      const acceptedRequests = form.requests.filter(r => r.request_status === 'accepted');
      const acceptedCount = acceptedRequests.length;
      
      if (acceptedCount < form.target_requesters_number) {
        return res.status(400).json({ 
          success: false, 
          error: `Not enough accepted requests. Target: ${form.target_requesters_number}, Accepted: ${acceptedCount}` 
        });
      }

      // Get all accepted requester user IDs
      const requesterUserIds = acceptedRequests
        .map(r => r.requester?.id)
        .filter(id => id); // Remove any undefined

      // Update fundraiser status to completed
      form.fundraiser.fundraiser_status = "completed";
      await form.fundraiser.save();

      // Create notifications for all accepted requesters
      if (requesterUserIds.length > 0) {
        const Notification = require("../../models/Notification");
        const notificationsData = requesterUserIds.map(reqUserId => ({
          user_id: reqUserId,
          sender_id: userId,
          fundraiser_id: form.fundraiser_id,
          title: `Campaign Completed: ${form.fundraiser.fundraiser_title}`,
          message: message.trim(),
          type: 'campaign_complete',
          is_read: false,
          is_deleted: false
        }));

        await Notification.bulkCreate(notificationsData);
      }

      res.json({ 
        success: true, 
        message: "Campaign completed and notifications sent",
        notifiedCount: requesterUserIds.length
      });

    } catch (error) {
      console.error("Error completing campaign with message:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  }
}

module.exports = new FundraiserFormController();